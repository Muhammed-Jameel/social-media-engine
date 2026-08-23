CREATE TABLE IF NOT EXISTS organizations (
  id text PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  timezone text NOT NULL DEFAULT 'Asia/Baghdad',
  default_language text NOT NULL DEFAULT 'ar',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  role text NOT NULL CHECK (role IN ('OWNER', 'ADMIN', 'REVIEWER', 'VIEWER')),
  password_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);

CREATE TABLE IF NOT EXISTS engine_settings (
  organization_id text PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  dry_run boolean NOT NULL DEFAULT true,
  production_publishing_enabled boolean NOT NULL DEFAULT false,
  paused boolean NOT NULL DEFAULT false,
  autonomy_stage text NOT NULL DEFAULT 'OFFLINE' CHECK (autonomy_stage IN ('OFFLINE', 'SHADOW', 'SUPERVISED', 'LIMITED', 'BROAD')),
  planning_lead_days integer NOT NULL DEFAULT 5 CHECK (planning_lead_days BETWEEN 1 AND 15),
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS brand_versions (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  version text NOT NULL,
  effective_at timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('DRAFT', 'ACTIVE', 'SUPERSEDED')),
  canonical_data jsonb NOT NULL,
  provenance jsonb NOT NULL DEFAULT '[]'::jsonb,
  approved_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, version)
);

CREATE TABLE IF NOT EXISTS source_documents (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source_path text NOT NULL,
  title text NOT NULL,
  sha256 text NOT NULL,
  authority text NOT NULL CHECK (authority IN ('canonical', 'high', 'medium', 'historical', 'reference')),
  lifecycle text NOT NULL,
  topics jsonb NOT NULL DEFAULT '[]'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_modified timestamptz,
  indexed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, source_path, sha256)
);

CREATE TABLE IF NOT EXISTS source_assets (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source_path text NOT NULL,
  storage_path text,
  media_type text NOT NULL,
  sha256 text NOT NULL,
  width integer,
  height integer,
  size_bytes bigint NOT NULL,
  license_status text NOT NULL DEFAULT 'UNKNOWN',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, sha256)
);

CREATE TABLE IF NOT EXISTS audiences (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  key text NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  tensions jsonb NOT NULL DEFAULT '[]'::jsonb,
  desired_outcomes jsonb NOT NULL DEFAULT '[]'::jsonb,
  provenance jsonb NOT NULL DEFAULT '[]'::jsonb,
  UNIQUE (organization_id, key)
);

CREATE TABLE IF NOT EXISTS content_pillars (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  key text NOT NULL,
  name text NOT NULL,
  purpose text NOT NULL,
  target_mix numeric(5,4) NOT NULL CHECK (target_mix BETWEEN 0 AND 1),
  provenance jsonb NOT NULL DEFAULT '[]'::jsonb,
  UNIQUE (organization_id, key)
);

CREATE TABLE IF NOT EXISTS campaigns (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  objective text NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETE', 'ARCHIVED')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS monthly_strategies (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  campaign_id text REFERENCES campaigns(id) ON DELETE SET NULL,
  month text NOT NULL,
  objective text NOT NULL,
  business_priorities jsonb NOT NULL,
  narrative_arc jsonb NOT NULL,
  target_audiences jsonb NOT NULL,
  pillar_mix jsonb NOT NULL,
  cadence jsonb NOT NULL,
  primary_kpis jsonb NOT NULL,
  experiment_allocation numeric(5,4) NOT NULL,
  status text NOT NULL CHECK (status IN ('DRAFT', 'IN_REVIEW', 'APPROVED', 'REVISION_REQUESTED', 'ARCHIVED')),
  analysis_window jsonb NOT NULL,
  artifact_envelope jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, month)
);

CREATE TABLE IF NOT EXISTS content_items (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  strategy_id text NOT NULL REFERENCES monthly_strategies(id) ON DELETE CASCADE,
  external_key text NOT NULL,
  month text NOT NULL,
  title text NOT NULL,
  strategic_objective text NOT NULL,
  audience text NOT NULL,
  funnel_stage text NOT NULL,
  content_pillar text NOT NULL,
  tension text NOT NULL,
  key_message text NOT NULL,
  perception_shift text NOT NULL,
  format text NOT NULL,
  platforms jsonb NOT NULL,
  language text NOT NULL,
  hook_hypothesis text NOT NULL,
  creative_hypothesis text NOT NULL,
  proof_requirements jsonb NOT NULL,
  cta text NOT NULL,
  kpi_hierarchy jsonb NOT NULL,
  scheduled_at timestamptz NOT NULL,
  timezone text NOT NULL,
  status text NOT NULL,
  approval_class text NOT NULL,
  risk_level text NOT NULL,
  risk_reasons jsonb NOT NULL,
  experiment_id text,
  related_prior_post_ids jsonb NOT NULL,
  anti_repetition_score numeric(5,2) NOT NULL,
  is_demo boolean NOT NULL DEFAULT false,
  qa_flags jsonb NOT NULL DEFAULT '[]'::jsonb,
  source_path text,
  artifact_envelope jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, external_key)
);

CREATE INDEX IF NOT EXISTS content_items_schedule_idx ON content_items (organization_id, scheduled_at);
CREATE INDEX IF NOT EXISTS content_items_status_idx ON content_items (organization_id, status);

CREATE TABLE IF NOT EXISTS research_packets (
  id text PRIMARY KEY,
  content_item_id text NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  findings jsonb NOT NULL,
  source_references jsonb NOT NULL,
  conflicts jsonb NOT NULL DEFAULT '[]'::jsonb,
  fact_check_status text NOT NULL,
  artifact_envelope jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS copy_variants (
  id text PRIMARY KEY,
  content_item_id text NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  platform text NOT NULL,
  language text NOT NULL,
  angle text NOT NULL,
  on_design_copy jsonb NOT NULL,
  caption text NOT NULL,
  alt_text text NOT NULL,
  hashtags jsonb NOT NULL,
  factual_claims jsonb NOT NULL,
  editorial_score numeric(5,2) NOT NULL,
  selected boolean NOT NULL DEFAULT false,
  artifact_envelope jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS design_briefs (
  id text PRIMARY KEY,
  content_item_id text NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  brief jsonb NOT NULL,
  artifact_envelope jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS design_drafts (
  id text PRIMARY KEY,
  design_brief_id text NOT NULL REFERENCES design_briefs(id) ON DELETE CASCADE,
  provider text NOT NULL,
  provider_draft_id text,
  editable_url text,
  revision integer NOT NULL DEFAULT 0,
  status text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rendered_assets (
  id text PRIMARY KEY,
  content_item_id text NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  design_brief_id text REFERENCES design_briefs(id) ON DELETE SET NULL,
  provider text NOT NULL,
  provider_draft_id text,
  editable_url text,
  storage_path text NOT NULL,
  public_url text,
  mime_type text NOT NULL,
  width integer NOT NULL,
  height integer NOT NULL,
  sha256 text NOT NULL,
  sequence integer NOT NULL,
  source_path text,
  license_status text NOT NULL,
  artifact_envelope jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (content_item_id, sha256, sequence)
);

CREATE TABLE IF NOT EXISTS critiques (
  id text PRIMARY KEY,
  rendered_asset_id text NOT NULL REFERENCES rendered_assets(id) ON DELETE CASCADE,
  critic text NOT NULL,
  scores jsonb NOT NULL,
  total numeric(5,2) NOT NULL,
  hard_fails jsonb NOT NULL,
  strengths jsonb NOT NULL,
  weaknesses jsonb NOT NULL,
  revision_instructions jsonb NOT NULL,
  decision text NOT NULL,
  artifact_envelope jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS approvals (
  id text PRIMARY KEY,
  content_item_id text NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  actor_id text NOT NULL,
  decision text NOT NULL,
  reason_codes jsonb NOT NULL,
  feedback text NOT NULL,
  trace_id text NOT NULL,
  decided_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS social_accounts (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  platform text NOT NULL,
  handle text,
  provider_account_id text,
  status text NOT NULL CHECK (status IN ('NOT_CONFIGURED', 'CONNECTED', 'EXPIRED', 'REVOKED', 'ERROR')),
  token_ciphertext text,
  token_expires_at timestamptz,
  scopes jsonb NOT NULL DEFAULT '[]'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  verified_at timestamptz,
  UNIQUE (organization_id, platform, provider_account_id)
);

CREATE TABLE IF NOT EXISTS provider_capabilities (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider text NOT NULL,
  account_id text,
  capability text NOT NULL,
  state text NOT NULL,
  reason text NOT NULL,
  source_url text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  verified_at timestamptz,
  UNIQUE (organization_id, provider, account_id, capability)
);

CREATE TABLE IF NOT EXISTS scheduled_publications (
  id text PRIMARY KEY,
  content_item_id text NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  platform text NOT NULL,
  account_id text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  status text NOT NULL,
  idempotency_key text NOT NULL UNIQUE,
  approved_asset_hashes jsonb NOT NULL,
  provider_publication_id text,
  attempt_count integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 3,
  last_error_code text,
  dry_run boolean NOT NULL DEFAULT true,
  trace_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS scheduled_publications_due_idx ON scheduled_publications (status, scheduled_at);

CREATE TABLE IF NOT EXISTS provider_publications (
  id text PRIMARY KEY,
  scheduled_publication_id text NOT NULL REFERENCES scheduled_publications(id) ON DELETE CASCADE,
  provider_id text,
  request_fingerprint text NOT NULL,
  response_payload jsonb NOT NULL,
  status text NOT NULL,
  published_at timestamptz,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS metric_snapshots (
  id text PRIMARY KEY,
  provider_publication_id text NOT NULL,
  platform text NOT NULL,
  captured_at timestamptz NOT NULL,
  post_age_hours numeric(12,2) NOT NULL,
  metrics jsonb NOT NULL,
  raw_payload jsonb NOT NULL,
  raw_schema_version text NOT NULL,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider_publication_id, captured_at)
);

CREATE TABLE IF NOT EXISTS creative_features (
  content_item_id text PRIMARY KEY REFERENCES content_items(id) ON DELETE CASCADE,
  features jsonb NOT NULL,
  feature_schema_version text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audience_themes (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  platform text NOT NULL,
  theme_type text NOT NULL,
  summary text NOT NULL,
  supporting_comment_ids jsonb NOT NULL,
  sample_size integer NOT NULL,
  window_start timestamptz NOT NULL,
  window_end timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS experiments (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  hypothesis text NOT NULL,
  variable text NOT NULL,
  variants jsonb NOT NULL,
  primary_kpi text NOT NULL,
  guardrail_kpis jsonb NOT NULL,
  expected_direction text NOT NULL,
  result text,
  confidence numeric(5,4),
  decision text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS insights (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  kind text NOT NULL,
  statement text NOT NULL,
  supporting_post_ids jsonb NOT NULL,
  window_start timestamptz NOT NULL,
  window_end timestamptz NOT NULL,
  sample_size integer NOT NULL,
  confidence_note text NOT NULL,
  next_action text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS prompts (
  id text PRIMARY KEY,
  key text NOT NULL,
  version text NOT NULL,
  rollout_state text NOT NULL CHECK (rollout_state IN ('DRAFT', 'BENCHMARK', 'SHADOW', 'PRODUCTION', 'DEPRECATED')),
  content text NOT NULL,
  sha256 text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (key, version)
);

CREATE TABLE IF NOT EXISTS skills (
  id text PRIMARY KEY,
  key text NOT NULL,
  version text NOT NULL,
  rollout_state text NOT NULL,
  source_path text NOT NULL,
  sha256 text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (key, version)
);

CREATE TABLE IF NOT EXISTS model_configurations (
  id text PRIMARY KEY,
  task_key text NOT NULL,
  model text NOT NULL,
  reasoning_effort text NOT NULL,
  rollout_state text NOT NULL,
  config jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (task_key, rollout_state)
);

CREATE TABLE IF NOT EXISTS workflow_runs (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type text NOT NULL,
  status text NOT NULL,
  idempotency_key text NOT NULL UNIQUE,
  current_step text NOT NULL,
  steps jsonb NOT NULL,
  input jsonb NOT NULL,
  output jsonb,
  trace_id text NOT NULL,
  locked_at timestamptz,
  locked_by text,
  next_attempt_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS workflow_runs_due_idx ON workflow_runs (status, next_attempt_at, created_at);

CREATE TABLE IF NOT EXISTS owner_commands (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  actor_id text NOT NULL,
  command text NOT NULL,
  scope text NOT NULL,
  classification text NOT NULL,
  proposed_change jsonb NOT NULL,
  requires_confirmation boolean NOT NULL,
  confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  kind text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  action_url text,
  status text NOT NULL CHECK (status IN ('UNREAD', 'READ', 'DISMISSED', 'SENT', 'FAILED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  actor_id text NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  previous_state jsonb,
  new_state jsonb,
  reason text NOT NULL,
  trace_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON audit_logs (entity_type, entity_id, created_at DESC);

CREATE TABLE IF NOT EXISTS idempotency_keys (
  key text PRIMARY KEY,
  operation text NOT NULL,
  status text NOT NULL CHECK (status IN ('RESERVED', 'COMPLETED', 'FAILED')),
  request_hash text NOT NULL,
  response jsonb,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

