ALTER TABLE scheduled_publications
  ADD COLUMN IF NOT EXISTS idempotency_key_version text NOT NULL DEFAULT 'v1',
  ADD COLUMN IF NOT EXISTS payload_hash text,
  ADD COLUMN IF NOT EXISTS intent_ref text,
  ADD COLUMN IF NOT EXISTS operation text NOT NULL DEFAULT 'PUBLISH',
  ADD COLUMN IF NOT EXISTS environment text NOT NULL DEFAULT 'DRY_RUN',
  ADD COLUMN IF NOT EXISTS production_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS emergency_paused boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS material_deviation boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS approved_copy_hash text,
  ADD COLUMN IF NOT EXISTS approved_brand_version text,
  ADD COLUMN IF NOT EXISTS approval_evidence_hash text,
  ADD COLUMN IF NOT EXISTS compliance_evidence_hash text,
  ADD COLUMN IF NOT EXISTS actor_id text,
  ADD COLUMN IF NOT EXISTS authorization_scope jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS authorization_signature text,
  ADD COLUMN IF NOT EXISTS authorization_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS authorization_revoked_at timestamptz,
  ADD COLUMN IF NOT EXISTS account_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS account_auth_proof jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS validation jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS attempt_state text NOT NULL DEFAULT 'NOT_STARTED',
  ADD COLUMN IF NOT EXISTS reconciliation_state text NOT NULL DEFAULT 'NOT_REQUIRED';

CREATE UNIQUE INDEX IF NOT EXISTS scheduled_publications_intent_ref_idx
  ON scheduled_publications (intent_ref)
  WHERE intent_ref IS NOT NULL;

CREATE TABLE IF NOT EXISTS publication_outbox (
  id text PRIMARY KEY,
  scheduled_publication_id text NOT NULL REFERENCES scheduled_publications(id) ON DELETE CASCADE,
  intent_ref text NOT NULL UNIQUE,
  idempotency_key_version text NOT NULL,
  idempotency_key text NOT NULL UNIQUE,
  operation text NOT NULL,
  account_id text NOT NULL,
  platform text NOT NULL,
  exact_payload jsonb NOT NULL,
  payload_hash text NOT NULL,
  approval_binding jsonb NOT NULL,
  state text NOT NULL CHECK (state IN (
    'INTENT_PERSISTED',
    'DISPATCHING',
    'ACKNOWLEDGED',
    'AMBIGUOUS',
    'VERIFIED',
    'FAILED',
    'CANCELLED'
  )),
  available_at timestamptz NOT NULL,
  locked_at timestamptz,
  locked_by text,
  dispatched_at timestamptz,
  acknowledged_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS publication_outbox_due_idx
  ON publication_outbox (state, available_at, created_at);

CREATE TABLE IF NOT EXISTS publication_reconciliations (
  id text PRIMARY KEY,
  scheduled_publication_id text NOT NULL REFERENCES scheduled_publications(id) ON DELETE CASCADE,
  outbox_id text NOT NULL REFERENCES publication_outbox(id) ON DELETE CASCADE,
  adapter_version text NOT NULL,
  lookup_fingerprint text NOT NULL,
  state text NOT NULL CHECK (state IN ('PENDING', 'MATCHED', 'NOT_FOUND', 'CONFLICT', 'UNKNOWN')),
  provider_publication_id text,
  evidence_ref text,
  notes text NOT NULL,
  checked_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS publication_reconciliations_job_idx
  ON publication_reconciliations (scheduled_publication_id, checked_at DESC);
