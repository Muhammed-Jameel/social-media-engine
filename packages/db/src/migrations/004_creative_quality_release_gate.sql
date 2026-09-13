ALTER TABLE engine_settings
  ADD COLUMN creative_production_paused boolean NOT NULL DEFAULT true;

ALTER TABLE engine_settings
  ADD COLUMN creative_gate_state text NOT NULL DEFAULT 'CORPUS_REBUILD'
  CHECK (creative_gate_state IN ('CORPUS_REBUILD', 'BENCHMARKING', 'RELEASE_REVIEW', 'RELEASED'));

ALTER TABLE engine_settings
  ADD COLUMN creative_gate_evidence jsonb NOT NULL DEFAULT '{
    "reason": "Creative quality rebuild in progress.",
    "releasePolicy": "Current-hash benchmark evidence and an audited release decision are required."
  }'::jsonb
  CHECK (jsonb_typeof(creative_gate_evidence) = 'object');

ALTER TABLE engine_settings
  ADD CONSTRAINT engine_settings_creative_release_consistency
  CHECK (creative_production_paused OR creative_gate_state = 'RELEASED');
