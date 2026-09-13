import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { basename } from "node:path";
import {
  SOCIAL_MEDIA_PLUGIN_ORGANIZATION_ID,
  cachePostizMedia,
  getCachedPostizMedia,
  getDatabase,
  getRepository,
  projectRoot,
  reservePostizBatch,
  updatePostizBatch,
} from "@social-media-plugin/db/runtime";
import {
  PostizApiError,
  getPostizClient,
  platformForPostizProvider,
  postizFrontendUrl,
  postizSettings,
  publicationRequestHash,
  readVerifiedAsset,
  resolveWithinRoot,
  type PostizCreateRequest,
  type PostizIntegration,
  type PostizUpload,
  loadProductionJob,
  assertApprovedPackage,
  assertSynchronizedSelection,
  canonicalSha256,
  verifyProductionBytes,
} from "@social-media-plugin/engine";

const activePlatforms = ["instagram", "facebook", "linkedin", "tiktok", "x"] as const;
type ActivePlatform = typeof activePlatforms[number];

export interface PostizRuntimeState {
  configured: boolean;
  connected: boolean;
  frontendUrl: string;
  integrations: Array<PostizIntegration & { platform: ActivePlatform }>;
  error: string | null;
}

export interface PostizPublishInput {
  contentItemId: string;
  integrationIds: string[];
  mode: "draft" | "schedule" | "now";
  scheduledAt: string;
  nonce: string;
  captions: Partial<Record<ActivePlatform, string>>;
  xContinuation?: string;
  actorId: string;
  allowProduction: boolean;
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function instanceKey(): string {
  return sha256(process.env.POSTIZ_API_URL?.trim() || "postiz-unconfigured");
}

function publicError(error: unknown): string {
  if (error instanceof PostizApiError) return error.message;
  if (error instanceof Error) return error.message.slice(0, 500);
  return "The Postiz operation failed.";
}

export async function getPostizRuntimeState(): Promise<PostizRuntimeState> {
  const frontendUrl = postizFrontendUrl();
  const client = getPostizClient();
  if (!client) return { configured: false, connected: false, frontendUrl, integrations: [], error: null };
  try {
    const [connected, integrations] = await Promise.all([client.isConnected(), client.listIntegrations()]);
    return {
      configured: true,
      connected,
      frontendUrl,
      integrations: integrations.flatMap((integration) => {
        const platform = platformForPostizProvider(integration.providerIdentifier);
        return platform && activePlatforms.includes(platform) && !integration.disabled ? [{ ...integration, platform }] : [];
      }),
      error: null,
    };
  } catch (error) {
    return { configured: true, connected: false, frontendUrl, integrations: [], error: publicError(error) };
  }
}

async function uploadAssets(assets: Array<{ sourcePath: string | null; mimeType: string; sha256: string }>): Promise<PostizUpload[]> {
  const client = getPostizClient();
  if (!client) throw new Error("Postiz is not configured.");
  const database = await getDatabase();
  const root = projectRoot();
  const key = instanceKey();
  const uploaded: PostizUpload[] = [];

  for (const asset of assets) {
    if (!asset.sourcePath) throw new Error("A selected publishing asset has no local source path.");
    const cached = await getCachedPostizMedia(database, key, asset.sha256);
    if (cached) {
      uploaded.push(cached);
      continue;
    }
    const absolute = resolveWithinRoot(root, asset.sourcePath);
    const bytes = await readVerifiedAsset({ root, sourcePath: asset.sourcePath, sha256: asset.sha256 });
    const media = await client.uploadFile({ bytes, filename: basename(absolute), mimeType: asset.mimeType });
    await cachePostizMedia(database, {
      instanceKey: key,
      assetSha256: asset.sha256,
      mediaId: media.id,
      path: media.path,
      mimeType: asset.mimeType,
      filename: basename(absolute),
    });
    uploaded.push(media);
  }
  return uploaded;
}

export async function publishContentViaPostiz(input: PostizPublishInput): Promise<{ batchId: string; state: string; postIds: string[] }> {
  const client = getPostizClient();
  if (!client) throw new Error("Postiz is not configured. Add POSTIZ_API_URL and POSTIZ_API_KEY first.");
  if (!input.allowProduction && input.mode !== "draft") throw new Error("Live publishing is disabled in the demonstration environment.");
  if (input.integrationIds.length === 0) throw new Error("Select at least one connected social channel.");

  const repository = await getRepository();
  const [item, settings, runtime] = await Promise.all([
    repository.getContentDetail(input.contentItemId),
    repository.getSettings(),
    getPostizRuntimeState(),
  ]);
  if (!item || item.supersededAt) throw new Error("The selected content item is unavailable or historical.");
  if (!["APPROVED", "SCHEDULED"].includes(item.status)) throw new Error("The content item must be approved before it can be sent to Postiz.");
  if (settings.paused) throw new Error("The global publishing pause is active.");
  if (input.mode !== "draft" && (settings.dryRun || !settings.productionPublishingEnabled)) {
    throw new Error("Live publishing requires DRY_RUN=false and PRODUCTION_PUBLISHING_ENABLED=true.");
  }
  if (!runtime.connected) throw new Error(runtime.error || "Postiz is not connected.");

  const integrations = input.integrationIds.map((id) => runtime.integrations.find((integration) => integration.id === id));
  if (integrations.some((integration) => !integration)) throw new Error("A selected Postiz integration is missing or no longer connected.");
  const selected = integrations as Array<PostizIntegration & { platform: ActivePlatform }>;
  selected.sort((a, b) => a.platform.localeCompare(b.platform));
  assertSynchronizedSelection(selected.map(integration => integration.platform));
  for (const integration of selected) {
    if (!item.platforms.includes(integration.platform)) throw new Error(`${integration.platform} is not approved for this content item.`);
  }

  const database = await getDatabase();
  const job = await loadProductionJob(database, item.id);
  if (!job) throw new Error("This legacy item has no reviewed five-platform package. Complete its Production workflow first.");
  const pkg = assertApprovedPackage(job);
  for (const integration of selected) {
    if (pkg.variants.find(v => v.platform === integration.platform)?.accountId !== integration.id) throw new Error("The selected account differs from the owner-approved package.");
  }
  await verifyProductionBytes(projectRoot(), pkg);
  for (const variant of pkg.variants) {
    const override = input.captions[variant.platform];
    if (override && override.trim() !== variant.entries[0]!.caption.trim()) throw new Error("Caption changes require a new package revision and owner approval.");
  }
  if (input.xContinuation) throw new Error("X thread entries must be authored and approved individually in Production.");
  if (input.mode === "now") throw new Error("Use the shared approved schedule; immediate dispatch requires a new timed package.");
  const scheduledAt = input.mode === "draft" ? new Date(pkg.scheduledAt).toISOString() : new Date(input.scheduledAt).toISOString();
  if (input.mode === "schedule" && (scheduledAt !== new Date(pkg.scheduledAt).toISOString() || Date.parse(scheduledAt) <= Date.now())) throw new Error("Schedule must match the approved future timestamp. Revise expired timing before scheduling.");
  const assets = pkg.variants.flatMap(v => v.entries.flatMap(e => e.assets));
  const copyHashes: Record<string, string> = {};

  const posts = await Promise.all(selected.map(async (integration) => {
    const variant = pkg.variants.find(v => v.platform === integration.platform)!;
    copyHashes[integration.platform] = canonicalSha256(variant.entries.map(e => e.caption));
    return {
      integration: { id: integration.id },
      value: await Promise.all(variant.entries.map(async entry => ({ content: entry.caption, image: await uploadAssets(entry.assets) }))),
      settings: postizSettings(integration.providerIdentifier, {
        tiktokDirectPostVerified: false,
        linkedinDocumentCarousel: variant.format === "carousel",
        carouselName: variant.title,
      }),
    };
  }));

  const payload: PostizCreateRequest = { type: input.mode, date: scheduledAt, shortLink: false, tags: [], posts };
  const requestHash = publicationRequestHash(payload);
  // Package identity, not a fresh browser nonce, prevents duplicate schedules.
  const idempotencyKey = sha256(`postiz-v2:${input.contentItemId}:${canonicalSha256(pkg)}:${input.mode}`);
  const reservation = await database.transaction(async tx => {
    await tx.query("SELECT id FROM campaign_production_jobs WHERE id=$1 AND organization_id=$2 FOR UPDATE", [item.id, SOCIAL_MEDIA_PLUGIN_ORGANIZATION_ID]);
    const current = await loadProductionJob(tx, item.id);
    if (!current || canonicalSha256(assertApprovedPackage(current)) !== canonicalSha256(pkg)) throw new Error("Owner approval changed during upload. Nothing was scheduled.");
    return reservePostizBatch(tx, {
    id: randomUUID(),
    contentItemId: item.id,
    idempotencyKey,
    requestHash,
    mode: input.mode,
    scheduledAt,
    integrationIds: selected.map((integration) => integration.id),
    platforms: selected.map((integration) => integration.platform),
    assetHashes: assets.map((asset) => asset.sha256),
    copyHashes,
    exactPayload: payload,
    actorId: input.actorId,
    });
  });
  if (!reservation.inserted) {
    if (reservation.requestHash !== requestHash) throw new Error("This publication action was already reserved with a different payload; reload before trying again.");
    if (reservation.state === "ACKNOWLEDGED") return { batchId: reservation.id, state: reservation.state, postIds: [] };
    throw new Error(`This exact request already exists with state ${reservation.state}; it was not sent again.`);
  }

  const claimed = await updatePostizBatch(database, { id: reservation.id, fromStates: ["INTENT_PERSISTED"], state: "DISPATCHING" });
  if (!claimed) throw new Error("The publication intent could not be claimed safely.");
  try {
    const response = await client.createPosts(payload);
    if (response.length !== selected.length || new Set(response.map(r => r.integration)).size !== selected.length || selected.some(i => !response.some(r => r.integration === i.id))) throw new PostizApiError("Postiz returned an incomplete batch acknowledgement. Reconcile every channel before retrying.", null, false);
    await updatePostizBatch(database, { id: reservation.id, fromStates: ["DISPATCHING"], state: "ACKNOWLEDGED", response });
    await database.query(
      `WITH prior AS (
         SELECT status FROM content_items WHERE id = $1 AND organization_id = $2
       ), changed AS (
         UPDATE content_items SET status = $3, updated_at = now()
         WHERE id = $1 AND organization_id = $2 RETURNING status
       )
       INSERT INTO audit_logs (
         id, organization_id, actor_id, action, entity_type, entity_id,
         previous_state, new_state, reason, trace_id
       ) VALUES ($4, $2, $5, 'POSTIZ_DISPATCH', 'content_item', $1,
         jsonb_build_object('status', (SELECT status FROM prior)),
         jsonb_build_object('status', (SELECT status FROM changed), 'batchId', $6, 'requestHash', $7),
         $8, $9)`,
      [
        item.id,
        SOCIAL_MEDIA_PLUGIN_ORGANIZATION_ID,
        input.mode === "schedule" ? "SCHEDULED" : item.status,
        randomUUID(),
        input.actorId,
        reservation.id,
        requestHash,
        `Owner dispatched an exact ${input.mode} request to Postiz for ${selected.length} channel(s).`,
        randomUUID(),
      ],
    );
    return { batchId: reservation.id, state: "ACKNOWLEDGED", postIds: response.map((entry) => entry.postId) };
  } catch (error) {
    const ambiguous = !(error instanceof PostizApiError) || error.status === null || error.status === 408 || error.status >= 500;
    await updatePostizBatch(database, {
      id: reservation.id,
      fromStates: ["DISPATCHING"],
      state: ambiguous ? "AMBIGUOUS" : "FAILED",
      lastError: publicError(error),
    });
    throw error;
  }
}
