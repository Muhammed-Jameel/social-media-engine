import type { DatabaseClient, SqlRow } from "./client";
import { AURENDOR_ORGANIZATION_ID } from "./ids";

export interface CachedPostizMedia {
  id: string;
  path: string;
}

export interface PostizBatchView {
  id: string;
  contentItemId: string;
  externalKey: string;
  title: string;
  mode: string;
  scheduledAt: string;
  platforms: string[];
  state: string;
  response: unknown;
  lastError: string | null;
  createdAt: string;
}

function parseJson<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") {
    try { return JSON.parse(value) as T; } catch { return fallback; }
  }
  return value as T;
}

function iso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return new Date(String(value)).toISOString();
}

export async function getCachedPostizMedia(database: DatabaseClient, instanceKey: string, assetSha256: string): Promise<CachedPostizMedia | null> {
  const result = await database.query<SqlRow & { postiz_media_id: string; postiz_path: string }>(
    "SELECT postiz_media_id, postiz_path FROM postiz_media_uploads WHERE instance_key = $1 AND asset_sha256 = $2",
    [instanceKey, assetSha256],
  );
  const row = result.rows[0];
  return row ? { id: row.postiz_media_id, path: row.postiz_path } : null;
}

export async function cachePostizMedia(database: DatabaseClient, input: {
  instanceKey: string;
  assetSha256: string;
  mediaId: string;
  path: string;
  mimeType: string;
  filename: string;
}): Promise<void> {
  await database.query(
    `INSERT INTO postiz_media_uploads (
       instance_key, asset_sha256, postiz_media_id, postiz_path, mime_type, filename
     ) VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (instance_key, asset_sha256) DO UPDATE SET
       postiz_media_id = EXCLUDED.postiz_media_id,
       postiz_path = EXCLUDED.postiz_path,
       mime_type = EXCLUDED.mime_type,
       filename = EXCLUDED.filename,
       verified_at = now(),
       updated_at = now()`,
    [input.instanceKey, input.assetSha256, input.mediaId, input.path, input.mimeType, input.filename],
  );
}

export async function reservePostizBatch(database: DatabaseClient, input: {
  id: string;
  contentItemId: string;
  idempotencyKey: string;
  requestHash: string;
  mode: "draft" | "schedule" | "now";
  scheduledAt: string;
  integrationIds: string[];
  platforms: string[];
  assetHashes: string[];
  copyHashes: Record<string, string>;
  exactPayload: unknown;
  actorId: string;
}): Promise<{ id: string; state: string; requestHash: string; inserted: boolean }> {
  const inserted = await database.query<SqlRow & { id: string; state: string; request_hash: string }>(
    `INSERT INTO postiz_publication_batches (
       id, organization_id, content_item_id, idempotency_key, request_hash, mode,
       scheduled_at, integration_ids, platforms, asset_hashes, copy_hashes,
       exact_payload, state, actor_id
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10::jsonb, $11::jsonb, $12::jsonb, 'INTENT_PERSISTED', $13)
     ON CONFLICT (idempotency_key) DO NOTHING
     RETURNING id, state, request_hash`,
    [
      input.id,
      AURENDOR_ORGANIZATION_ID,
      input.contentItemId,
      input.idempotencyKey,
      input.requestHash,
      input.mode,
      input.scheduledAt,
      JSON.stringify(input.integrationIds),
      JSON.stringify(input.platforms),
      JSON.stringify(input.assetHashes),
      JSON.stringify(input.copyHashes),
      JSON.stringify(input.exactPayload),
      input.actorId,
    ],
  );
  const row = inserted.rows[0];
  if (row) return { id: row.id, state: row.state, requestHash: row.request_hash, inserted: true };
  const existing = await database.query<SqlRow & { id: string; state: string; request_hash: string }>(
    "SELECT id, state, request_hash FROM postiz_publication_batches WHERE idempotency_key = $1",
    [input.idempotencyKey],
  );
  const stored = existing.rows[0];
  if (!stored) throw new Error("Postiz publication intent could not be reserved.");
  return { id: stored.id, state: stored.state, requestHash: stored.request_hash, inserted: false };
}

export async function updatePostizBatch(database: DatabaseClient, input: {
  id: string;
  fromStates: string[];
  state: "UPLOADING" | "DISPATCHING" | "ACKNOWLEDGED" | "AMBIGUOUS" | "FAILED";
  response?: unknown;
  lastError?: string | null;
}): Promise<boolean> {
  const result = await database.query(
    `UPDATE postiz_publication_batches
     SET state = $2, provider_response = COALESCE($3::jsonb, provider_response), last_error = $4, updated_at = now()
     WHERE id = $1 AND state = ANY($5::text[])`,
    [input.id, input.state, input.response === undefined ? null : JSON.stringify(input.response), input.lastError ?? null, input.fromStates],
  );
  return result.rowCount === 1;
}

export async function listPostizBatches(database: DatabaseClient, limit = 12): Promise<PostizBatchView[]> {
  const result = await database.query<SqlRow & {
    id: string;
    content_item_id: string;
    external_key: string;
    title: string;
    mode: string;
    scheduled_at: unknown;
    platforms: unknown;
    state: string;
    provider_response: unknown;
    last_error: string | null;
    created_at: unknown;
  }>(
    `SELECT batch.id, batch.content_item_id, item.external_key, item.title, batch.mode,
            batch.scheduled_at, batch.platforms, batch.state, batch.provider_response,
            batch.last_error, batch.created_at
     FROM postiz_publication_batches batch
     JOIN content_items item ON item.id = batch.content_item_id
     WHERE batch.organization_id = $1
     ORDER BY batch.created_at DESC LIMIT $2`,
    [AURENDOR_ORGANIZATION_ID, limit],
  );
  return result.rows.map((row) => ({
    id: row.id,
    contentItemId: row.content_item_id,
    externalKey: row.external_key,
    title: row.title,
    mode: row.mode,
    scheduledAt: iso(row.scheduled_at),
    platforms: parseJson<string[]>(row.platforms, []),
    state: row.state,
    response: parseJson(row.provider_response, null),
    lastError: row.last_error,
    createdAt: iso(row.created_at),
  }));
}
