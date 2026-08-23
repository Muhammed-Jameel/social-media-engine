import { createHash, randomUUID } from "node:crypto";
import type { DatabaseClient, SqlRow } from "@aurendor/db/runtime";
import { PublicationPlanSchema, type PublicationPlan } from "@aurendor/schemas";
import { publisherFor, type PublicationResult, type SocialPublisher } from "./integrations";

export interface ExactOutboundPublication {
  contentItemId: string;
  accountId: string;
  platform: PublicationPlan["platform"];
  operation: PublicationPlan["operation"];
  scheduledAt: string;
  timezone: string;
  caption: string;
  copyHash: string;
  assets: Array<{ assetId: string; url: string; hash: string }>;
}

export interface PersistedPublicationIntent {
  scheduledPublicationId: string;
  outboxId: string;
  intentRef: string;
  payloadHash: string;
  state: "INTENT_PERSISTED" | "DISPATCHING" | "ACKNOWLEDGED" | "AMBIGUOUS" | "VERIFIED" | "FAILED" | "CANCELLED";
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, canonicalize(nested)]),
    );
  }
  return value;
}

export function canonicalPayloadHash(payload: ExactOutboundPublication): string {
  return createHash("sha256").update(JSON.stringify(canonicalize(payload))).digest("hex");
}

function exactHashSet(left: string[], right: string[]): boolean {
  return left.length === right.length && [...left].sort().every((hash, index) => hash === [...right].sort()[index]);
}

export async function persistPublicationIntent(
  database: DatabaseClient,
  untrustedPlan: unknown,
  payload: ExactOutboundPublication,
): Promise<PersistedPublicationIntent> {
  const plan = PublicationPlanSchema.parse(untrustedPlan);
  const payloadHash = canonicalPayloadHash(payload);
  const payloadAssetHashes = payload.assets.map((asset) => asset.hash);
  if (plan.payloadHash !== payloadHash) throw new Error("Outbound payload hash differs from the publication plan.");
  if (payload.copyHash !== plan.copyHash) throw new Error("Outbound copy hash differs from the publication plan.");
  if (!exactHashSet(payloadAssetHashes, plan.assetHashes)) throw new Error("Outbound asset hashes differ from the publication plan.");
  if (
    payload.contentItemId !== plan.contentItemId ||
    payload.accountId !== plan.accountId ||
    payload.platform !== plan.platform ||
    payload.operation !== plan.operation ||
    payload.scheduledAt !== plan.scheduledAt ||
    payload.timezone !== plan.timezone
  ) {
    throw new Error("Outbound publication target or schedule differs from the approved plan.");
  }

  const scheduledPublicationId = randomUUID();
  const outboxId = randomUUID();
  const result = await database.query<SqlRow & { id: string; scheduled_publication_id: string; state: PersistedPublicationIntent["state"] }>(
    `WITH publication AS (
       INSERT INTO scheduled_publications (
         id, content_item_id, platform, account_id, scheduled_at, status, idempotency_key,
         approved_asset_hashes, provider_publication_id, attempt_count, max_attempts,
         last_error_code, dry_run, trace_id, idempotency_key_version, payload_hash,
         intent_ref, operation, environment, production_enabled, emergency_paused,
         material_deviation, approved_copy_hash, approved_brand_version,
         approval_evidence_hash, compliance_evidence_hash, actor_id,
         authorization_scope, authorization_signature, authorization_expires_at,
         authorization_revoked_at, account_verified_at, account_auth_proof,
         validation, attempt_state, reconciliation_state
       ) VALUES (
         $1, $2, $3, $4, $5, 'READY', $6, $7::jsonb, NULL, 0, 3, NULL, $8, $9,
         $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22,
         $23::jsonb, $24, $25, $26, $27, $28::jsonb, $29::jsonb, 'INTENT_PERSISTED', 'NOT_REQUIRED'
       ) ON CONFLICT (idempotency_key) DO UPDATE SET updated_at = now()
       RETURNING id
     )
     INSERT INTO publication_outbox (
       id, scheduled_publication_id, intent_ref, idempotency_key_version, idempotency_key,
       operation, account_id, platform, exact_payload, payload_hash, approval_binding,
       state, available_at
     )
     SELECT $30, publication.id, $12, $10, $6, $13, $4, $3, $31::jsonb, $11,
            $32::jsonb, 'INTENT_PERSISTED', now()
     FROM publication
     ON CONFLICT (idempotency_key) DO UPDATE SET updated_at = now()
     RETURNING id, scheduled_publication_id, state`,
    [
      scheduledPublicationId,
      plan.contentItemId,
      plan.platform,
      plan.accountId,
      plan.scheduledAt,
      plan.idempotencyKey,
      JSON.stringify(plan.assetHashes),
      plan.environment !== "production",
      plan.traceId,
      plan.idempotencyKeyVersion,
      payloadHash,
      plan.intentRef,
      plan.operation.toUpperCase(),
      plan.environment.toUpperCase(),
      plan.productionEnabled,
      plan.validation.emergencyPaused,
      plan.validation.materialDeviation,
      plan.copyHash,
      plan.brandVersion,
      plan.approvalEvidence.signature ? createHash("sha256").update(JSON.stringify(plan.approvalEvidence)).digest("hex") : null,
      plan.complianceEvidence.artifactHash,
      plan.approvalEvidence.actorId,
      JSON.stringify(plan.approvalEvidence.scope),
      plan.approvalEvidence.signature,
      plan.approvalEvidence.expiresAt,
      plan.approvalEvidence.revokedAt,
      plan.authProof.verifiedAt,
      JSON.stringify(plan.authProof),
      JSON.stringify(plan.validation),
      outboxId,
      JSON.stringify(payload),
      JSON.stringify({
        approvalId: plan.approvalEvidence.approvalId,
        approvalSignature: plan.approvalEvidence.signature,
        complianceArtifactId: plan.complianceEvidence.artifactId,
        complianceHash: plan.complianceEvidence.artifactHash,
        brandVersion: plan.brandVersion,
        copyHash: plan.copyHash,
        assetHashes: plan.assetHashes,
      }),
    ],
  );
  const row = result.rows[0];
  if (!row) throw new Error("Publication intent was not durably persisted.");
  return { scheduledPublicationId: row.scheduled_publication_id, outboxId: row.id, intentRef: plan.intentRef, payloadHash, state: row.state };
}

async function readPersistedDryRunResult(
  database: DatabaseClient,
  intent: PersistedPublicationIntent,
  platform: PublicationPlan["platform"],
): Promise<PublicationResult> {
  const existing = await database.query<SqlRow & { provider_id: string | null; response_payload: unknown }>(
    `SELECT provider_id, response_payload FROM provider_publications
     WHERE scheduled_publication_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [intent.scheduledPublicationId],
  );
  const row = existing.rows[0];
  if (!row) throw new Error("Verified publication intent is missing its provider receipt.");
  const raw = typeof row.response_payload === "string" ? JSON.parse(row.response_payload) as Record<string, unknown> : row.response_payload as Record<string, unknown>;
  const storedStatus = raw.status;
  const storedReceipt = raw.receipt && typeof raw.receipt === "object" ? raw.receipt as Record<string, unknown> : raw;
  return {
    status: storedStatus === "MANUAL_HANDOFF" || storedStatus === "SCHEDULED" || storedStatus === "PUBLISHED"
      ? storedStatus
      : platform === "tiktok" ? "MANUAL_HANDOFF" : "DRY_RUN",
    providerPublicationId: row.provider_id,
    receipt: { ...storedReceipt, deduplicated: true },
  };
}

export async function dispatchDryRunPublication(
  database: DatabaseClient,
  untrustedPlan: unknown,
  payload: ExactOutboundPublication,
  publisher?: SocialPublisher,
): Promise<{ intent: PersistedPublicationIntent; result: PublicationResult }> {
  const plan = PublicationPlanSchema.parse(untrustedPlan);
  if (plan.environment === "production" || plan.decision !== "dry_run_only") {
    throw new Error("This runtime adapter can dispatch only an explicitly classified dry-run plan.");
  }
  const intent = await persistPublicationIntent(database, plan, payload);
  const adapter = publisher ?? publisherFor(plan.platform);
  if (intent.state === "VERIFIED") {
    return { intent, result: await readPersistedDryRunResult(database, intent, plan.platform) };
  }
  if (intent.state !== "INTENT_PERSISTED") {
    throw new Error(`Publication intent requires reconciliation before dispatch (state: ${intent.state}).`);
  }
  try {
    const lock = await database.query(
      "UPDATE publication_outbox SET state = 'DISPATCHING', locked_at = now(), locked_by = 'dry-run-worker', updated_at = now() WHERE id = $1 AND state = 'INTENT_PERSISTED'",
      [intent.outboxId],
    );
    if (lock.rowCount !== 1) throw new Error("Publication intent was claimed by another worker; reconcile before retry.");
    const result = await adapter.publish({
      contentItemId: payload.contentItemId,
      platform: payload.platform,
      accountId: payload.accountId,
      caption: payload.caption,
      assetUrls: payload.assets.map((asset) => asset.url),
      assetHashes: payload.assets.map((asset) => asset.hash),
      scheduledAt: payload.scheduledAt,
      idempotencyKey: plan.idempotencyKey,
      dryRun: true,
    });
    await database.query(
      `WITH outbox AS (
         UPDATE publication_outbox SET state = 'VERIFIED', acknowledged_at = now(), locked_at = NULL,
           locked_by = NULL, updated_at = now() WHERE id = $1 RETURNING scheduled_publication_id
       ), publication AS (
         UPDATE scheduled_publications SET status = $2, attempt_state = 'VERIFIED',
           provider_publication_id = $3, updated_at = now()
         WHERE id = (SELECT scheduled_publication_id FROM outbox) RETURNING id
       )
       INSERT INTO provider_publications (
         id, scheduled_publication_id, provider_id, request_fingerprint, response_payload,
         status, published_at, verified_at
       ) SELECT $4, publication.id, $3, $5, $6::jsonb, $2, NULL, now() FROM publication`,
      [
        intent.outboxId,
        result.status === "MANUAL_HANDOFF" ? "MANUAL_HANDOFF" : "READY",
        result.providerPublicationId,
        randomUUID(),
        intent.payloadHash,
        JSON.stringify({ status: result.status, receipt: result.receipt }),
      ],
    );
    return { intent, result };
  } catch (error) {
    await database.query(
      `WITH outbox AS (
         UPDATE publication_outbox SET state = 'FAILED', locked_at = NULL, locked_by = NULL,
           updated_at = now() WHERE id = $1 RETURNING scheduled_publication_id
       )
       UPDATE scheduled_publications SET status = 'FAILED', attempt_state = 'FAILED',
         attempt_count = attempt_count + 1, last_error_code = 'DRY_RUN_ADAPTER_ERROR', updated_at = now()
       WHERE id = (SELECT scheduled_publication_id FROM outbox)`,
      [intent.outboxId],
    );
    throw error;
  }
}
