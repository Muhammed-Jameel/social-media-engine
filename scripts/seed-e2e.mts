import { createDatabase } from "@aurendor/db/runtime";
import { e2eContentFixtures } from "../tests/fixtures/e2e-content";

const ORGANIZATION_ID = "org-aurendor";
const STRATEGY_ID = "strategy-2026-09";
const EXPECTED_CONTENT_COUNT = 33;
const HIGH_RISK_KEY = "W3-P5";
const HIGH_RISK_QA_FLAGS = [
  "Imported visual requires owner confirmation before approval.",
  "High-risk claim treatment needs evidence review.",
  "Bulk month approval is intentionally disabled for this item.",
] as const;

function json(value: unknown): string {
  return JSON.stringify(value);
}

function assertSafeE2EEnvironment(): void {
  const configuredDataDir = process.env.PGLITE_DATA_DIR?.trim() ?? "";
  const normalizedDataDir = configuredDataDir.toLowerCase();
  const hasE2EPathSegment = normalizedDataDir
    .split(/[\\/]/u)
    .some((segment) => /^e2e(?:[-_.]|$)/u.test(segment));
  const productionPublishingEnabled = process.env.PRODUCTION_PUBLISHING_ENABLED?.trim().toLowerCase();

  if (
    process.env.E2E_FIXTURE_MODE !== "true" ||
    process.env.DEMO_MODE !== "true" ||
    process.env.DRY_RUN !== "true" ||
    productionPublishingEnabled !== "false" ||
    Boolean(process.env.DATABASE_URL?.trim()) ||
    !hasE2EPathSegment
  ) {
    throw new Error(
      "Refusing to seed Playwright fixtures outside an isolated E2E PGlite database. " +
      "Set E2E_FIXTURE_MODE=true, DEMO_MODE=true, DRY_RUN=true, " +
      "PRODUCTION_PUBLISHING_ENABLED=false, and an E2E-specific PGLITE_DATA_DIR; DATABASE_URL must be unset.",
    );
  }
}

function scheduledAt(index: number): string {
  const day = 1 + Math.floor((index * 29) / (EXPECTED_CONTENT_COUNT - 1));
  const hour = 6 + (index % 4) * 3;
  return new Date(Date.UTC(2026, 8, day, hour)).toISOString();
}

assertSafeE2EEnvironment();

if (e2eContentFixtures.length !== EXPECTED_CONTENT_COUNT) {
  throw new Error(`Expected ${EXPECTED_CONTENT_COUNT} E2E content fixtures, found ${e2eContentFixtures.length}.`);
}

const database = await createDatabase();
let transactionStarted = false;

try {
  await database.exec("BEGIN");
  transactionStarted = true;

  // This database is guarded as E2E-only above. Reset state so retries and
  // local reruns always begin with the same review posture.
  await database.query(
    "DELETE FROM content_items WHERE organization_id = $1 AND month = '2026-09'",
    [ORGANIZATION_ID],
  );
  await database.query(
    `UPDATE monthly_strategies
     SET status = 'IN_REVIEW', updated_at = '2026-08-23T00:00:00Z'
     WHERE id = $1 AND organization_id = $2`,
    [STRATEGY_ID, ORGANIZATION_ID],
  );
  await database.query(
    `UPDATE engine_settings
     SET dry_run = true, production_publishing_enabled = false, paused = false,
         creative_production_paused = true, creative_gate_state = 'BENCHMARKING',
         creative_gate_evidence = $2::jsonb,
         autonomy_stage = 'OFFLINE', updated_at = '2026-08-23T00:00:00Z'
     WHERE organization_id = $1`,
    [
      ORGANIZATION_ID,
      json({
        reason: "Corpus intelligence is built; hash-locked round-three benchmark pixels are under independent review.",
        releasePolicy: "Current-hash benchmark evidence and an audited release decision are required.",
        benchmarkManifest: "artifacts/creative-rebuild/benchmarks-v2-round3/manifest.json",
        benchmarkManifestSha256: "d30681670a5f3ac6703896e55fe5fe700c97b6ab5bce15838cc99bf196941b36",
      }),
    ],
  );

  for (const [index, fixture] of e2eContentFixtures.entries()) {
    const isHighRisk = fixture.externalKey === HIGH_RISK_KEY;
    const qaFlags = isHighRisk ? HIGH_RISK_QA_FLAGS : [];
    const itemId = `e2e-${fixture.externalKey.toLowerCase()}`;

    await database.query(
      `INSERT INTO content_items (
         id, organization_id, strategy_id, external_key, month, title,
         strategic_objective, audience, funnel_stage, content_pillar, tension,
         key_message, perception_shift, format, platforms, language,
         hook_hypothesis, creative_hypothesis, proof_requirements, cta,
         kpi_hierarchy, scheduled_at, timezone, status, approval_class,
         risk_level, risk_reasons, experiment_id, related_prior_post_ids,
         anti_repetition_score, is_demo, qa_flags, source_path, artifact_envelope,
         created_at, updated_at
       ) VALUES (
         $1, $2, $3, $4, '2026-09', $5,
         $6, $7, $8, $9, $10,
         $11, $12, $13, $14::jsonb, 'ar-en',
         $15, $16, '[]'::jsonb, $17,
         $18::jsonb, $19, 'Asia/Baghdad', 'NEEDS_REVIEW', $20,
         $21, $22::jsonb, NULL, '[]'::jsonb,
         $23, true, $24::jsonb, NULL, $25::jsonb,
         '2026-08-23T00:00:00Z', '2026-08-23T00:00:00Z'
       )`,
      [
        itemId,
        ORGANIZATION_ID,
        STRATEGY_ID,
        fixture.externalKey,
        fixture.title,
        "Build qualified awareness and operational trust through practical systems education.",
        index % 3 === 0 ? "Iraqi business owners" : "Operations and transformation leaders",
        index % 4 === 0 ? "consideration" : "awareness",
        index % 3 === 0 ? "Applied AI" : index % 3 === 1 ? "Operational education" : "Proof and systems",
        "Teams need useful automation without surrendering decision authority.",
        fixture.title,
        "From tool-first activity to an evidence-led operating system.",
        fixture.format,
        json(fixture.platforms),
        "Lead with one concrete operating tension.",
        "Use structured hierarchy and the active AURENDOR identity; visual production remains intentionally absent from this fixture.",
        "Open the owner review surface.",
        json(["qualified_reach", "saves", "shares"]),
        scheduledAt(index),
        isHighRisk ? "ITEM_APPROVAL" : "MONTHLY_APPROVAL",
        isHighRisk ? "high" : "low",
        json(qaFlags),
        96 - (index % 7),
        json(qaFlags),
        json({
          schemaVersion: "1.0.0",
          modelVersion: null,
          promptVersion: "e2e-fixture-v1",
          skillVersions: [],
          templateVersion: null,
          traceId: `e2e-fixture-${fixture.externalKey.toLowerCase()}`,
          createdAt: "2026-08-23T00:00:00.000Z",
          sources: [],
          metadataOnly: true,
        }),
      ],
    );
  }

  const countResult = await database.query<{ count: string }>(
    "SELECT count(*)::text AS count FROM content_items WHERE organization_id = $1 AND month = '2026-09'",
    [ORGANIZATION_ID],
  );
  const metadataOnlyResult = await database.query<{ count: string }>(
    `SELECT count(*)::text AS count
     FROM content_items
     WHERE organization_id = $1 AND month = '2026-09' AND is_demo = true AND source_path IS NULL`,
    [ORGANIZATION_ID],
  );
  const attachedProductionDataResult = await database.query<{ count: string }>(
    `SELECT count(*)::text AS count
     FROM content_items c
     WHERE c.organization_id = $1 AND c.month = '2026-09'
       AND (
         EXISTS (SELECT 1 FROM rendered_assets ra WHERE ra.content_item_id = c.id)
         OR EXISTS (SELECT 1 FROM copy_variants cv WHERE cv.content_item_id = c.id)
       )`,
    [ORGANIZATION_ID],
  );
  const highRiskResult = await database.query<{ external_key: string; risk_level: string; approval_class: string; qa_count: number }>(
    `SELECT external_key, risk_level, approval_class, jsonb_array_length(qa_flags) AS qa_count
     FROM content_items WHERE organization_id = $1 AND external_key = $2`,
    [ORGANIZATION_ID, HIGH_RISK_KEY],
  );
  const highRisk = highRiskResult.rows[0];

  if (Number(countResult.rows[0]?.count) !== EXPECTED_CONTENT_COUNT) {
    throw new Error("E2E seed verification failed: September content count is not 33.");
  }
  if (
    Number(metadataOnlyResult.rows[0]?.count) !== EXPECTED_CONTENT_COUNT ||
    Number(attachedProductionDataResult.rows[0]?.count) !== 0
  ) {
    throw new Error("E2E seed verification failed: every item must remain demo-only metadata without copy or media.");
  }
  if (
    !highRisk ||
    highRisk.risk_level !== "high" ||
    highRisk.approval_class !== "ITEM_APPROVAL" ||
    Number(highRisk.qa_count) !== HIGH_RISK_QA_FLAGS.length
  ) {
    throw new Error("E2E seed verification failed: W3-P5 does not preserve its exact high-risk review boundary.");
  }

  await database.exec("COMMIT");
  transactionStarted = false;
  console.log("Playwright fixture applied: 33 metadata-only demo items; W3-P5 has exactly 3 QA flags.");
} catch (error) {
  if (transactionStarted) await database.exec("ROLLBACK");
  throw error;
} finally {
  await database.close();
}
