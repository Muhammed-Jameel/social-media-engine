CREATE TABLE IF NOT EXISTS postiz_media_uploads (
  instance_key text NOT NULL,
  asset_sha256 text NOT NULL,
  postiz_media_id text NOT NULL,
  postiz_path text NOT NULL,
  mime_type text NOT NULL,
  filename text NOT NULL,
  verified_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (instance_key, asset_sha256)
);

CREATE TABLE IF NOT EXISTS postiz_publication_batches (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  content_item_id text NOT NULL REFERENCES content_items(id) ON DELETE RESTRICT,
  idempotency_key text NOT NULL UNIQUE,
  request_hash text NOT NULL,
  mode text NOT NULL CHECK (mode IN ('draft', 'schedule', 'now')),
  scheduled_at timestamptz NOT NULL,
  integration_ids jsonb NOT NULL,
  platforms jsonb NOT NULL,
  asset_hashes jsonb NOT NULL,
  copy_hashes jsonb NOT NULL,
  exact_payload jsonb NOT NULL,
  state text NOT NULL CHECK (state IN ('INTENT_PERSISTED', 'UPLOADING', 'DISPATCHING', 'ACKNOWLEDGED', 'AMBIGUOUS', 'FAILED')),
  provider_response jsonb,
  last_error text,
  actor_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS postiz_publication_batches_content_idx
  ON postiz_publication_batches (content_item_id, created_at DESC);

CREATE INDEX IF NOT EXISTS postiz_publication_batches_state_idx
  ON postiz_publication_batches (state, created_at DESC);
