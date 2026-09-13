CREATE TABLE IF NOT EXISTS campaign_production_plans (
  organization_id text NOT NULL REFERENCES organizations(id),
  month text NOT NULL,
  plan_hash text NOT NULL,
  body jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, month)
);
CREATE TABLE IF NOT EXISTS campaign_production_jobs (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id),
  month text NOT NULL,
  revision integer NOT NULL DEFAULT 0,
  stage text NOT NULL,
  body jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS campaign_production_stage_idx ON campaign_production_jobs (organization_id, stage, month);
