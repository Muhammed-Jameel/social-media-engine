import { createHash, randomUUID } from "node:crypto";
import { createDatabase, migrateDatabase, type SqlRow } from "@social-media-plugin/db";
import {
  canonicalPayloadHash,
  dispatchDryRunPublication,
  publicationIdempotencyKey,
  type ExactOutboundPublication,
} from "@social-media-plugin/engine";

const database = await createDatabase();
await migrateDatabase(database);

const itemResult = await database.query<SqlRow & {
  id: string;
  external_key: string;
  scheduled_at: unknown;
  timezone: string;
  caption: string;
}>(
  `SELECT c.id, c.external_key, c.scheduled_at, c.timezone, cv.caption
   FROM content_items c
   JOIN copy_variants cv ON cv.content_item_id = c.id AND cv.platform = 'instagram'
   WHERE c.external_key = 'W1-P4'
   LIMIT 1`,
);
const item = itemResult.rows[0];
if (!item) throw new Error("Run `pnpm seed:import` before the dry-run simulation.");

const assetsResult = await database.query<SqlRow & { id: string; public_url: string; sha256: string }>(
  "SELECT id, public_url, sha256 FROM rendered_assets WHERE content_item_id = $1 ORDER BY sequence",
  [item.id],
);
if (assetsResult.rows.length === 0) throw new Error("The fixture content item has no rendered assets.");

const scheduledAt = new Date(item.scheduled_at as string).toISOString();
const copyHash = createHash("sha256").update(item.caption).digest("hex");
const assetHashes = assetsResult.rows.map((asset) => asset.sha256);
const approvalScopeHash = createHash("sha256")
  .update(JSON.stringify({ contentItemId: item.id, platform: "instagram", assets: [...assetHashes].sort(), copyHash }))
  .digest("hex");
const idempotencyKey = publicationIdempotencyKey({
  version: "v1",
  organizationId: "00000000-0000-4000-8000-000000000001",
  contentItemId: item.id,
  brandVersion: "final-2026.1",
  copyHash,
  artifactHashes: assetHashes,
  platform: "instagram",
  accountId: "demo-instagram-account",
  operation: "schedule",
  scheduledAt,
  timezone: item.timezone,
  approvalScopeHash,
});

const payload: ExactOutboundPublication = {
  contentItemId: item.id,
  accountId: "demo-instagram-account",
  platform: "instagram",
  operation: "schedule",
  scheduledAt,
  timezone: item.timezone,
  caption: item.caption,
  copyHash,
  assets: assetsResult.rows.map((asset) => ({ assetId: asset.id, url: asset.public_url, hash: asset.sha256 })),
};

const traceId = randomUUID();
const plan = {
  schemaVersion: "1.0.0" as const,
  artifactId: `dry-run-${item.external_key}`,
  artifactType: "publication_plan" as const,
  skill: "social-publishing",
  skillVersion: "1.0.0",
  modelVersion: "none",
  promptVersion: "dry-run-fixture-v1",
  traceId,
  createdAt: new Date().toISOString(),
  inputRefs: [],
  evidence: [],
  warnings: ["Offline integration fixture: no provider credential or remote mutation is used."],
  status: "needs_approval" as const,
  contentItemId: item.id,
  accountId: "demo-instagram-account",
  platform: "instagram" as const,
  capabilities: [
    {
      capability: "publishing",
      state: "unknown" as const,
      verifiedAt: new Date().toISOString(),
      sourceUrl: "https://developers.facebook.com/docs/instagram-platform/content-publishing/",
    },
  ],
  validation: {
    accountMapped: true,
    authHealthy: false,
    captionValid: true,
    assetsExist: true,
    hashesMatch: true,
    licensesApproved: true,
    compliancePassed: true,
    scheduleValid: true,
    emergencyPaused: false,
    materialDeviation: false,
  },
  approvalEvidence: {
    approvalId: "fixture-approval-dry-run-only",
    actorId: "system-fixture",
    actorRole: "ADMIN" as const,
    signature: `fixture-only-${approvalScopeHash}`,
    signedAt: "2026-08-23T00:00:00+03:00",
    expiresAt: "2026-10-31T23:59:59+03:00",
    revokedAt: null,
    scope: {
      contentItemId: item.id,
      accountId: "demo-instagram-account",
      platform: "instagram" as const,
      operation: "schedule" as const,
      brandVersion: "final-2026.1",
      copyHash,
      assetHashes,
    },
  },
  complianceEvidence: {
    artifactId: "fixture-compliance-dry-run-only",
    artifactHash: createHash("sha256").update(`fixture-compliance:${item.id}`).digest("hex"),
    decision: "pass" as const,
    brandVersion: "final-2026.1",
  },
  authProof: {
    accountId: "demo-instagram-account",
    verifiedAt: new Date().toISOString(),
    scopes: ["fixture:none"],
    expiresAt: null,
    revokedAt: null,
  },
  brandVersion: "final-2026.1",
  copyHash,
  assets: assetsResult.rows.map((asset) => ({ assetId: asset.id, hash: asset.sha256, licenseStatus: "OWNED" as const })),
  assetHashes,
  scheduledAt,
  timezone: item.timezone,
  idempotencyKeyVersion: "v1",
  idempotencyKey,
  payloadHash: canonicalPayloadHash(payload),
  intentRef: `dry-run-intent-${idempotencyKey}`,
  attemptState: "not_started" as const,
  reconciliationState: "not_required" as const,
  environment: "dry_run" as const,
  productionEnabled: false,
  operation: "schedule" as const,
  decision: "dry_run_only" as const,
};

const simulation = await dispatchDryRunPublication(database, plan, payload);
console.log(
  JSON.stringify(
    {
      content: item.external_key,
      mode: simulation.result.status,
      intentRef: simulation.intent.intentRef,
      payloadHash: simulation.intent.payloadHash,
      remoteMutation: false,
      receiptId: simulation.result.receipt.receiptId,
    },
    null,
    2,
  ),
);
await database.close();
