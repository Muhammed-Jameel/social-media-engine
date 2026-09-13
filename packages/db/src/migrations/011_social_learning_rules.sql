CREATE TABLE IF NOT EXISTS social_learning_rules (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  rule_id text NOT NULL,
  brand_version text NOT NULL,
  category text NOT NULL CHECK (category IN ('fact', 'brandRule', 'preference', 'campaign', 'performance')),
  scope jsonb NOT NULL DEFAULT '{}'::jsonb,
  key text NOT NULL,
  precedence integer NOT NULL DEFAULT 50 CHECK (precedence BETWEEN 0 AND 100),
  strength text NOT NULL CHECK (strength IN ('WEAK', 'MEDIUM', 'STRONG', 'HARD')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  active_from timestamptz,
  expires_at timestamptz,
  rule_data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, rule_id)
);

CREATE INDEX IF NOT EXISTS social_learning_rules_org_idx
  ON social_learning_rules (organization_id, category, precedence DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS social_learning_rules_scope_idx
  ON social_learning_rules ((scope->>'scopeLevel'), organization_id, precedence DESC);

CREATE INDEX IF NOT EXISTS social_learning_rules_active_idx
  ON social_learning_rules (organization_id, active_from, expires_at)
  WHERE active_from IS NOT NULL OR expires_at IS NOT NULL;
