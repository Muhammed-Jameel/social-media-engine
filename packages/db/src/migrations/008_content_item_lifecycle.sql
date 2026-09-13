ALTER TABLE content_items
  ADD COLUMN IF NOT EXISTS plan_version text,
  ADD COLUMN IF NOT EXISTS superseded_at timestamptz,
  ADD COLUMN IF NOT EXISTS superseded_reason text;

CREATE INDEX IF NOT EXISTS content_items_active_plan_idx
  ON content_items (organization_id, month, plan_version, scheduled_at)
  WHERE superseded_at IS NULL;

CREATE INDEX IF NOT EXISTS content_items_superseded_idx
  ON content_items (organization_id, superseded_at)
  WHERE superseded_at IS NOT NULL;
