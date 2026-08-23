import { randomUUID } from "node:crypto";
import type { DatabaseClient } from "./client";
import {
  ACTIVE_BRAND_VERSION_ID,
  AURENDOR_ORGANIZATION_ID,
  AURENDOR_OWNER_ID,
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
  ["linkedin", "organization_publishing", "UNAVAILABLE_PERMISSION", "Community Management access and organization scopes require approval.", "https://learn.microsoft.com/en-us/linkedin/marketing/increasing-access?view=li-lms-2026-07"],
  ["linkedin", "organic_carousel", "UNAVAILABLE_POLICY", "Organic carousel media type is not supported; use MultiImage or document posts.", "https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api?view=li-lms-2026-06"],
  ["tiktok", "public_direct_post", "UNAVAILABLE_POLICY", "TikTok excludes internal/private account-management upload utilities from acceptable Direct Post clients.", "https://developers.tiktok.com/doc/content-sharing-guidelines/"],
  ["tiktok", "draft_upload", "MANUAL_HANDOFF_REQUIRED", "Upload a creator draft, then notify the owner to complete publication in TikTok.", "https://developers.tiktok.com/docs/en/content-posting-api-get-started-upload-content"],
  ["youtube", "publishing", "UNAVAILABLE_PERMISSION", "Unaudited projects produce private uploads; account need and audit readiness are unverified.", "https://developers.google.com/youtube/v3/docs/videos/insert"],
] as const;

export async function seedCoreData(database: DatabaseClient): Promise<void> {
  const traceId = randomUUID();
  await database.query(
    `INSERT INTO organizations (id, slug, name, timezone, default_language)
     VALUES ($1, 'aurendor', 'AURENDOR', 'Asia/Baghdad', 'ar')
     ON CONFLICT (id) DO UPDATE SET updated_at = now()`,
    [AURENDOR_ORGANIZATION_ID],
  );
  await database.query(
    `INSERT INTO users (id, organization_id, email, role)
     VALUES ($1, $2, 'owner@aurendor.local', 'OWNER')
     ON CONFLICT (id) DO NOTHING`,
    [AURENDOR_OWNER_ID, AURENDOR_ORGANIZATION_ID],
  );
  await database.query(
    `INSERT INTO engine_settings (organization_id, dry_run, production_publishing_enabled, paused, autonomy_stage, config)
     VALUES ($1, true, false, false, 'OFFLINE', $2::jsonb)
     ON CONFLICT (organization_id) DO NOTHING`,
    [
      AURENDOR_ORGANIZATION_ID,
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
      AURENDOR_ORGANIZATION_ID,
      json({
        category: "Operational Intelligence Infrastructure",
        bigIdea: "Digital Civilization",
        colors: ["#003F35", "#0EDB23", "#77FF70", "#F4F8F5"],
        latinFont: "Dh Ranclo Bold",
        arabicFont: "Ghroob Arabic ITF",
      }),
      json([
        "marketing/_context/AURENDOR_Brand_Identity_FINAL_2026.md",
        "marketing/_context/AURENDOR_Social_Design_System_2026.md",
      ]),
      AURENDOR_OWNER_ID,
    ],
  );
  await database.query(
    `INSERT INTO campaigns (id, organization_id, name, objective, starts_at, ends_at, status, metadata)
     VALUES ($1, $2, 'September 2026 — Structured Intelligence', 'Build qualified awareness and operational trust before conversion.', '2026-09-01T00:00:00+03:00', '2026-10-01T23:59:59+03:00', 'DRAFT', $3::jsonb)
     ON CONFLICT (id) DO NOTHING`,
    [SEPTEMBER_CAMPAIGN_ID, AURENDOR_ORGANIZATION_ID, json({ importedFrom: "content-engine", isDemo: true })],
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
      AURENDOR_ORGANIZATION_ID,
      SEPTEMBER_CAMPAIGN_ID,
      "Show Iraqi businesses what structured AI and automation look like in practical operations.",
      json(["AI automation", "operational clarity", "Aurendor Build proof", "brand authority"]),
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
        skillVersions: ["aurendor-content-strategy@1.0.0"],
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
      [`cap-${provider}-${capability}`, AURENDOR_ORGANIZATION_ID, provider, capability, state, reason, sourceUrl],
    );
  }

  await database.query(
    `INSERT INTO insights (id, organization_id, kind, statement, supporting_post_ids, window_start, window_end, sample_size, confidence_note, next_action)
     VALUES ('insight-seed-1', $1, 'OBSERVATION', $2, '[]'::jsonb, '2026-08-01T00:00:00Z', '2026-08-23T00:00:00Z', 1, $3, $4)
     ON CONFLICT (id) DO NOTHING`,
    [
      AURENDOR_ORGANIZATION_ID,
      "The September library is production-shaped but has not been published, so performance claims are unavailable.",
      "Operational evidence only; not a content-performance conclusion.",
      "Complete review, publish under supervision, then establish 30/60/90-day baselines.",
    ],
  );
  await database.query(
    `INSERT INTO notifications (id, organization_id, kind, title, body, action_url, status)
     VALUES ('notification-plan-ready', $1, 'PLAN_REVIEW', 'September plan ready for review', 'Thirty-three imported items need owner review before scheduling.', '/plans/2026-09', 'UNREAD')
     ON CONFLICT (id) DO NOTHING`,
    [AURENDOR_ORGANIZATION_ID],
  );
}
