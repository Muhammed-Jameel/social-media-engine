import { randomUUID } from "node:crypto";
import type { DatabaseClient } from "./client";
import {
  ACTIVE_BRAND_VERSION_ID,
  SOCIAL_MEDIA_PLUGIN_ORGANIZATION_ID,
  SOCIAL_MEDIA_PLUGIN_OWNER_ID,
  SEPTEMBER_CAMPAIGN_ID,
  SEPTEMBER_STRATEGY_ID,
} from "./ids";

function json(value: unknown): string {
  return JSON.stringify(value);
}

const providerSeed = [
  ["openai", "structured_generation", "NOT_CONFIGURED", "No project API key has been verified.", "https://developers.openai.com/api/docs/guides/latest-model"],
  ["canva", "design_generation", "NOT_CONFIGURED", "OAuth and Canva plan entitlement are not verified.", "https://www.canva.dev/docs/connect/authentication/"],
  ["canva", "social_publishing", "MANUAL_HANDOFF_REQUIRED", "Canva Connect is used for design/export, not social publishing.", "https://www.canva.dev/docs/connect/api-reference/designs/"],
  ["instagram", "publishing", "NOT_CONFIGURED", "Professional account OAuth and publishing scopes are required.", "https://developers.facebook.com/docs/instagram-platform/content-publishing/"],
  ["instagram", "scheduling", "AVAILABLE", "The engine can invoke publishing at the due time after account verification.", "https://developers.facebook.com/docs/instagram-platform/content-publishing/"],
  ["facebook", "publishing", "NOT_CONFIGURED", "Page access token and required Page scopes are not verified.", "https://developers.facebook.com/docs/pages-api/posts/"],
  ["higgsfield", "video_generation", "NOT_CONFIGURED", "The local Higgsfield CLI is installed, but device authentication has not been completed.", null],
  ["linkedin", "organization_publishing", "UNAVAILABLE_PERMISSION", "Community Management access and organization scopes require approval.", "https://learn.microsoft.com/en-us/linkedin/marketing/increasing-access?view=li-lms-2026-07"],
  ["linkedin", "organic_carousel", "UNAVAILABLE_POLICY", "Organic carousel media type is not supported; use MultiImage or document posts.", "https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api?view=li-lms-2026-06"],
  ["tiktok", "public_direct_post", "UNAVAILABLE_POLICY", "TikTok excludes internal/private account-management upload utilities from acceptable Direct Post clients.", "https://developers.tiktok.com/doc/content-sharing-guidelines/"],
  ["tiktok", "draft_upload", "MANUAL_HANDOFF_REQUIRED", "Upload a creator draft, then notify the owner to complete publication in TikTok.", "https://developers.tiktok.com/docs/en/content-posting-api-get-started-upload-content"],
  ["youtube", "publishing", "UNAVAILABLE_PERMISSION", "Unaudited projects produce private uploads; account need and audit readiness are unverified.", "https://developers.google.com/youtube/v3/docs/videos/insert"],
] as const;

const creativeGateEvidence = {
  reason: "Round-three candidate 01 decisively beats its matched legacy output in one controlled neutral-label identical-brief comparison, and four candidates form a critic-only professional upper tier. This is not suite-wide proof, and the complete suite has not cleared the release contract.",
  releasePolicy: "Keep POST_PRODUCTION claims held until revised current hashes clear every required critic, originality, feed, rights, technical, and owner gate.",
  benchmarkManifest: {
    path: "artifacts/creative-rebuild/benchmarks-v2-round3/manifest.json",
    sha256: "d30681670a5f3ac6703896e55fe5fe700c97b6ab5bce15838cc99bf196941b36",
    archiveState: "HASH_ANCHORED_TAMPER_EVIDENT_NOT_FILESYSTEM_IMMUTABLE",
  },
  independentReviews: [
    {
      role: "SENIOR_ART_DIRECTOR",
      path: "artifacts/creative-rebuild/reviews/senior-art-director-round3.json",
      sha256: "db1e37dadbacaff1f2e0a90c99e375dabe04636f87f63b5bd032de610591d3cb",
    },
    {
      role: "SENIOR_GRAPHIC_DESIGNER",
      path: "artifacts/creative-rebuild/reviews/senior-graphic-designer-round3.json",
      sha256: "284259515335e399f7549b36ef1c30f584f9489ae050668de13ed179ca48a7f1",
    },
    {
      role: "SOCIAL_PERFORMANCE_STRATEGIST",
      path: "artifacts/creative-rebuild/reviews/social-performance-strategist-round3.json",
      sha256: "fcb9a70ff09ddbf46c79aeaa344a18851945f35fb23cc1ac45ec6d9a98a04aa3",
    },
    {
      role: "ARABIC_DESIGN_REVIEWER",
      path: "artifacts/creative-rebuild/reviews/arabic-design-reviewer-round3.json",
      sha256: "076f1dad0af979e61df93373ea39263a5478dc983d201ce8f003c0bb13542dea",
    },
    {
      role: "ORIGINALITY_REVIEWER",
      path: "artifacts/creative-rebuild/originality/round3-originality-review.json",
      sha256: "1475707a4c555b387118f8b513b2d85c330f0718e0c4dd1f18bc04afed28186f",
    },
    {
      role: "INDEPENDENT_BLIND_ADJUDICATOR",
      path: "artifacts/creative-rebuild/blind-pairwise/round3-old-vs-new/blind-review.json",
      sha256: "49b5623b8e0f84ebef8698d5a97e2fc931da618303deab0d5c8e643f8c05de15",
    },
  ],
  integratedCritiqueSets: {
    path: "artifacts/creative-rebuild/reviews/round3-critique-sets.json",
    sha256: "849cec4cb238afedd4ec533d92a7fb8a38d9e5cc63c359802d8def612753a4ca",
  },
  integratedCritiqueReport: {
    path: "artifacts/creative-rebuild/reviews/ROUND3_INTEGRATED_CRITIQUE_REPORT.md",
    sha256: "5bf504df550902f0d55d4df94a9c9feb059b24f8fbef5895944e96f2883fae7c",
  },
  evidenceCaveats: [
    {
      code: "HISTORICAL_GOLDEN_SET_BYTES_NOT_RETAINED_AT_MUTABLE_PATH",
      path: "design-intelligence/reports/GOLDEN_SET.md",
      reviewedSha256: "9f5c1bf70d9d491e2c0ca4a25cddf653bda48375d77c6c570f9dfb5e66bbc36e",
      currentDocumentSha256: "8d9914a0f51dc6050b25ae9ac134a84c7528da5c67cc8b35790dea6542fb4398",
      affectedReviewRoles: ["SENIOR_ART_DIRECTOR", "SENIOR_GRAPHIC_DESIGNER", "SOCIAL_PERFORMANCE_STRATEGIST"],
      note: "The independent reviews remain unchanged to preserve their exact hashes. The historical governance bytes are not reproducible from the later mutable GOLDEN_SET.md path.",
    },
  ],
  round3Outcome: {
    professionalCritiqueCandidates: [
      "01-ar-context-handoff",
      "02-ar-rag-evidence",
      "07-en-evidence-ledger",
      "12-en-complexity-answerable",
    ],
    criticAndCandidateOriginalityClear: ["01-ar-context-handoff", "02-ar-rag-evidence"],
    originalityBlockedByFeedRepetition: ["07-en-evidence-ledger", "12-en-complexity-answerable"],
    belowUnanimousProfessionalBarCount: 8,
    hardFailAssets: ["03-ar-automation-relay"],
    blindOldVsNew: {
      comparisonScope: "ONE_CONTROLLED_NEUTRAL_LABEL_IDENTICAL_BRIEF",
      round3CandidateId: "01-ar-context-handoff",
      winner: "round-three professional rebuild output",
      decisive: true,
      supportsSuiteWideOldVsNewConclusion: false,
    },
    approvedGoldenSetCount: 0,
  },
  releaseBlockers: [
    "Eight exact-current-hash critique sets remain below the unanimous professional bar.",
    "The 07/12 dark English conceptual-object shell fails the recent-feed self-repetition gate.",
    "Candidate 03 has a current Arabic typography hard fail and must be rerendered and fully re-reviewed.",
    "The only controlled neutral-label identical-brief comparison covers candidate 01 and does not establish suite-wide old-versus-new superiority.",
    "No exact-hash owner release approval has been recorded.",
    "Live asset-production, originality, feed-review, scheduling, and provider adapters remain unverified.",
  ],
} as const;

export async function seedCoreData(database: DatabaseClient): Promise<void> {
  const traceId = randomUUID();
  await database.query(
    `INSERT INTO organizations (id, slug, name, timezone, default_language)
     VALUES ($1, 'social-media-plugin', 'SOCIAL_MEDIA_PLUGIN', 'Asia/Baghdad', 'ar')
     ON CONFLICT (id) DO UPDATE SET updated_at = now()`,
    [SOCIAL_MEDIA_PLUGIN_ORGANIZATION_ID],
  );
  await database.query(
    `INSERT INTO users (id, organization_id, email, role)
     VALUES ($1, $2, 'owner@social-media-plugin.local', 'OWNER')
     ON CONFLICT (id) DO NOTHING`,
    [SOCIAL_MEDIA_PLUGIN_OWNER_ID, SOCIAL_MEDIA_PLUGIN_ORGANIZATION_ID],
  );
  await database.query(
    `INSERT INTO engine_settings (
       organization_id, dry_run, production_publishing_enabled, paused,
       creative_production_paused, creative_gate_state, creative_gate_evidence,
       autonomy_stage, config
     )
     VALUES ($1, true, false, false, true, 'BENCHMARKING', $2::jsonb, 'OFFLINE', $3::jsonb)
     ON CONFLICT (organization_id) DO NOTHING`,
    [
      SOCIAL_MEDIA_PLUGIN_ORGANIZATION_ID,
      json(creativeGateEvidence),
      json({
        timezone: "Asia/Baghdad",
        languages: ["ar", "en"],
        socialArabicRegister: "professional-iraqi-relevant",
        creativePublishThreshold: 93,
        criticDisagreementMargin: 8,
      }),
    ],
  );
  await database.query(
    `INSERT INTO brand_versions (id, organization_id, version, effective_at, status, canonical_data, provenance, approved_by)
     VALUES ($1, $2, 'final-2026.1', '2026-08-19T00:00:00+03:00', 'ACTIVE', $3::jsonb, $4::jsonb, $5)
     ON CONFLICT (id) DO NOTHING`,
    [
      ACTIVE_BRAND_VERSION_ID,
      SOCIAL_MEDIA_PLUGIN_ORGANIZATION_ID,
      json({
        category: "Operational Intelligence Infrastructure",
        bigIdea: "Digital Civilization",
        colors: ["#003F35", "#0EDB23", "#77FF70", "#F4F8F5"],
        latinFont: "Dh Ranclo Bold",
        arabicFont: "Ghroob Arabic ITF",
      }),
      json([
        "marketing/_context/SOCIAL_MEDIA_PLUGIN_Brand_Identity_FINAL_2026.md",
        "marketing/_context/SOCIAL_MEDIA_PLUGIN_Social_Design_System_2026.md",
      ]),
      SOCIAL_MEDIA_PLUGIN_OWNER_ID,
    ],
  );
  await database.query(
    `INSERT INTO campaigns (id, organization_id, name, objective, starts_at, ends_at, status, metadata)
     VALUES ($1, $2, 'September 2026 — Structured Intelligence', 'Build qualified awareness and operational trust before conversion.', '2026-09-01T00:00:00+03:00', '2026-10-01T23:59:59+03:00', 'DRAFT', $3::jsonb)
     ON CONFLICT (id) DO NOTHING`,
    [SEPTEMBER_CAMPAIGN_ID, SOCIAL_MEDIA_PLUGIN_ORGANIZATION_ID, json({ importedFrom: "content-engine", isDemo: true })],
  );
  await database.query(
    `INSERT INTO monthly_strategies (
       id, organization_id, campaign_id, month, objective, business_priorities, narrative_arc,
       target_audiences, pillar_mix, cadence, primary_kpis, experiment_allocation, status,
       analysis_window, artifact_envelope
     ) VALUES ($1, $2, $3, '2026-09', $4, $5::jsonb, $6::jsonb, $7::jsonb, $8::jsonb, $9::jsonb, $10::jsonb, 0.15, 'IN_REVIEW', $11::jsonb, $12::jsonb)
     ON CONFLICT (id) DO NOTHING`,
    [
      SEPTEMBER_STRATEGY_ID,
      SOCIAL_MEDIA_PLUGIN_ORGANIZATION_ID,
      SEPTEMBER_CAMPAIGN_ID,
      "Show Iraqi businesses what structured AI and automation look like in practical operations.",
      json(["AI automation", "operational clarity", "Social Media Plugin Build proof", "brand authority"]),
      json(["Problem recognition", "Practical systems", "Product proof", "Trusted next step"]),
      json(["Iraqi business owners", "construction and engineering leaders", "operations leaders"]),
      json({ operationalEducation: 0.3, appliedAi: 0.25, proofAndSystems: 0.2, product: 0.15, brand: 0.1 }),
      json({ feedPerWeek: 5, storiesPerWeek: 2, videosPerMonth: 4 }),
      json(["qualified_reach", "saves", "shares", "profile_visits", "qualified_messages"]),
      json({ start: "2026-05-27T00:00:00.000Z", end: "2026-08-26T20:59:59.000Z", timezone: "Asia/Baghdad" }),
      json({
        schemaVersion: "1.0.0",
        modelVersion: null,
        promptVersion: "import-v1",
        skillVersions: ["social-content-strategy@1.0.0"],
        templateVersion: null,
        traceId,
        createdAt: new Date().toISOString(),
        sources: [],
      }),
    ],
  );

  for (const [provider, capability, state, reason, sourceUrl] of providerSeed) {
    await database.query(
      `INSERT INTO provider_capabilities (id, organization_id, provider, account_id, capability, state, reason, source_url, metadata, verified_at)
       VALUES ($1, $2, $3, NULL, $4, $5, $6, $7, '{}'::jsonb, '2026-08-23T00:00:00Z')
       ON CONFLICT (id) DO UPDATE
       SET state = EXCLUDED.state, reason = EXCLUDED.reason, source_url = EXCLUDED.source_url, verified_at = EXCLUDED.verified_at`,
      [`cap-${provider}-${capability}`, SOCIAL_MEDIA_PLUGIN_ORGANIZATION_ID, provider, capability, state, reason, sourceUrl],
    );
  }

  await database.query(
    `INSERT INTO insights (id, organization_id, kind, statement, supporting_post_ids, window_start, window_end, sample_size, confidence_note, next_action)
     VALUES ('insight-seed-1', $1, 'OBSERVATION', $2, '[]'::jsonb, '2026-08-01T00:00:00Z', '2026-08-23T00:00:00Z', 1, $3, $4)
     ON CONFLICT (id) DO NOTHING`,
    [
      SOCIAL_MEDIA_PLUGIN_ORGANIZATION_ID,
      "The September library is production-shaped but has not been published, so performance claims are unavailable.",
      "Operational evidence only; not a content-performance conclusion.",
      "Complete review, publish under supervision, then establish 30/60/90-day baselines.",
    ],
  );
  await database.query(
    `INSERT INTO notifications (id, organization_id, kind, title, body, action_url, status)
     VALUES ('notification-plan-ready', $1, 'PLAN_REVIEW', 'September plan ready for review', 'Thirty-three imported items need owner review before scheduling.', '/plans/2026-09', 'UNREAD')
     ON CONFLICT (id) DO NOTHING`,
    [SOCIAL_MEDIA_PLUGIN_ORGANIZATION_ID],
  );
}
