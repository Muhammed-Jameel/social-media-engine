CREATE TABLE IF NOT EXISTS webhook_replay_keys (
  key_hash text PRIMARY KEY,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS webhook_replay_expiry_idx ON webhook_replay_keys (expires_at);

CREATE TABLE IF NOT EXISTS provider_webhook_events (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider text NOT NULL,
  provider_event_id text,
  event_type text NOT NULL,
  signature_fingerprint text NOT NULL,
  payload_hash text NOT NULL,
  raw_payload_ref text,
  schema_version text NOT NULL,
  status text NOT NULL CHECK (status IN ('RECEIVED', 'VALIDATED', 'PROCESSED', 'REJECTED', 'FAILED')),
  trace_id text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS provider_webhook_event_dedupe_idx
  ON provider_webhook_events (provider, provider_event_id)
  WHERE provider_event_id IS NOT NULL;
