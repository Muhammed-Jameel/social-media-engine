import { randomUUID } from "node:crypto";
import type { DatabaseClient, SqlRow } from "./client";
import { AURENDOR_ORGANIZATION_ID, SEPTEMBER_CAMPAIGN_ID, SEPTEMBER_STRATEGY_ID } from "./ids";

export interface ActivePlanAssetInput {
  storagePath: string;
  publicUrl: string;
  sourcePath: string;
  mimeType: string;
  width: number;
  height: number;
  sha256: string;
  byteLength: number;
  sequence?: number;
  assetRole?: "planning_cover" | "carousel_slide" | "story_frame";
  publicationEligible?: boolean;
}

export type ActivePlanCoverInput = ActivePlanAssetInput;

export interface ActivePlanPostInput {
  key: string;
  sequence: number;
  publishAt: string;
  title: string;
  format: string;
  creativeMode: string;
  contentTrack: string;
  platforms: string[];
  pillar: string;
  audience: string;
  funnel: string;
  hook: string;
  caption: string;
  cta: string;
  ctaPlacements: string[];
  storyArc: Record<string, string>;
  visualDirection: string;
  altText: string;
  frames: unknown[];
  supportingStories: unknown[];
  reelProduction?: unknown;
  proofBoundary: string;
  sourceRefs: string[];
  kpis: string[];
  castingPlan: unknown;
  productionStatus: string;
  pinCandidate: boolean;
  contentHash: string;
  qaFlags: string[];
  riskLevel: "low" | "medium" | "high" | "critical";
  riskReasons: string[];
  approvalClass: "MONTHLY_APPROVAL" | "ITEM_APPROVAL";
  cover: ActivePlanCoverInput;
  additionalAssets?: ActivePlanAssetInput[];
}

export interface ActivePlanSyncInput {
  planVersion: string;
  planHash: string;
  month: string;
  campaignName: string;
  objective: string;
  positioning: string;
  primaryAudience: string;
  secondaryAudience: string;
  cadence: string;
  creativeBalance: string;
  primaryKpis: string[];
  storyPolicy: string;
  peoplePolicy: string;
  reelPolicy: string;
  publishingBoundary: string;
  posts: ActivePlanPostInput[];
}

export interface ActivePlanSyncSummary {
  syncedItems: number;
  supersededItems: number;
  resetForReview: number;
  planVersion: string;
  planHash: string;
}

function json(value: unknown): string {
  return JSON.stringify(value);
}

function contentId(key: string): string {
  return "active-plan-" + key.toLowerCase();
}

function briefId(key: string): string {
  return "active-brief-" + key.toLowerCase();
}

function copyId(key: string, platform: string): string {
  return "active-copy-" + key.toLowerCase() + "-" + platform.toLowerCase();
}

function coverId(key: string): string {
  return "active-cover-" + key.toLowerCase();
}

function assetId(key: string, role: string, sequence: number): string {
  return ["active-asset", key.toLowerCase(), role.replaceAll("_", "-"), String(sequence).padStart(3, "0")].join("-");
}

function artifactEnvelope(input: ActivePlanSyncInput, post: ActivePlanPostInput) {
  return {
    schemaVersion: "2.0.0",
    modelVersion: null,
    promptVersion: "active-plan-sync-v2",
    skillVersions: [
      "aurendor-marketing-team-lead@current",
      "aurendor-campaign-brief@current",
      "aurendor-social-copy@current",
      "aurendor-social-creative@current",
      "higgsfield-generate@planning-only",
    ],
    templateVersion: input.planVersion,
    traceId: randomUUID(),
    createdAt: new Date().toISOString(),
    planVersion: input.planVersion,
    planHash: input.planHash,
    contentHash: post.contentHash,
    sourceKind: "active_plan",
    sources: post.sourceRefs.map((path) => ({ path, authority: "owner-approved-plan-source" })),
  };
}

/**
 * Makes the reviewed September plan the database source of truth while retaining
 * imported rows as read-only history. Re-running the same plan is idempotent and
 * preserves decisions; changing a post resets only that post to NEEDS_REVIEW.
 */
export async function syncActivePlan(database: DatabaseClient, input: ActivePlanSyncInput): Promise<ActivePlanSyncSummary> {
  if (input.posts.length === 0) throw new Error("An active plan must contain at least one post.");
  const keys = input.posts.map((post) => post.key);
  if (new Set(keys).size !== keys.length) throw new Error("Active plan post keys must be unique.");

  return database.transaction(async (transaction) => {
    const strategyBefore = await transaction.query<SqlRow & { plan_hash: string | null }>(
      "SELECT artifact_envelope->>'planHash' AS plan_hash FROM monthly_strategies WHERE id = $1 AND organization_id = $2",
      [SEPTEMBER_STRATEGY_ID, AURENDOR_ORGANIZATION_ID],
    );
    if (!strategyBefore.rows[0]) throw new Error("The September strategy must be seeded before syncing the active plan.");

    await transaction.query(
      `UPDATE campaigns
       SET name = $3, objective = $4,
           metadata = metadata || $5::jsonb
       WHERE id = $1 AND organization_id = $2`,
      [
        SEPTEMBER_CAMPAIGN_ID,
        AURENDOR_ORGANIZATION_ID,
        input.campaignName,
        input.objective,
        json({ activePlanVersion: input.planVersion, activePlanHash: input.planHash, isDemo: false }),
      ],
    );

    const strategyEnvelope = {
      schemaVersion: "2.0.0",
      promptVersion: "active-plan-sync-v2",
      planVersion: input.planVersion,
      planHash: input.planHash,
      sourceKind: "active_plan",
      createdAt: new Date().toISOString(),
    };
    await transaction.query(
      `UPDATE monthly_strategies
       SET objective = $3,
           business_priorities = $4::jsonb,
           narrative_arc = $5::jsonb,
           target_audiences = $6::jsonb,
           pillar_mix = $7::jsonb,
           cadence = $8::jsonb,
           primary_kpis = $9::jsonb,
           status = CASE WHEN artifact_envelope->>'planHash' = $10 THEN status ELSE 'IN_REVIEW' END,
           artifact_envelope = $11::jsonb,
           updated_at = now()
       WHERE id = $1 AND organization_id = $2`,
      [
        SEPTEMBER_STRATEGY_ID,
        AURENDOR_ORGANIZATION_ID,
        input.objective,
        json([input.positioning, input.publishingBoundary]),
        json(["brand_intro", "ai_automation_service", "bunyan_pro", "value_first"]),
        json([input.primaryAudience, input.secondaryAudience]),
        json({ brandIntro: 0.15, aiAutomationService: 0.3, bunyanPro: 0.3, valueFirst: 0.25 }),
        json({ description: input.cadence, storyPolicy: input.storyPolicy, reelPolicy: input.reelPolicy }),
        json(input.primaryKpis),
        input.planHash,
        json(strategyEnvelope),
      ],
    );

    const superseded = await transaction.query(
      `UPDATE content_items
       SET superseded_at = COALESCE(superseded_at, now()),
           superseded_reason = COALESCE(superseded_reason, 'Replaced by active September plan ' || $3),
           updated_at = now()
       WHERE organization_id = $1 AND month = $2
         AND superseded_at IS NULL
         AND external_key NOT IN (SELECT jsonb_array_elements_text($4::jsonb))
         AND (
           artifact_envelope->>'promptVersion' = 'legacy-import-v1'
           OR artifact_envelope->>'promptVersion' = 'active-plan-sync-v2'
         )
       RETURNING id`,
      [AURENDOR_ORGANIZATION_ID, input.month, input.planVersion, json(keys)],
    );

    let resetForReview = 0;
    for (const post of input.posts) {
      let id = contentId(post.key);
      const previous = await transaction.query<SqlRow & { content_hash: string | null }>(
        "SELECT artifact_envelope->>'contentHash' AS content_hash FROM content_items WHERE organization_id = $1 AND external_key = $2",
        [AURENDOR_ORGANIZATION_ID, post.key],
      );
      if (previous.rows[0] && previous.rows[0].content_hash !== post.contentHash) resetForReview += 1;
      const envelope = artifactEnvelope(input, post);
      const upserted = await transaction.query<SqlRow & { id: string }>(
        `INSERT INTO content_items (
           id, organization_id, strategy_id, external_key, month, title, strategic_objective, audience,
           funnel_stage, content_pillar, tension, key_message, perception_shift, format, platforms, language,
           hook_hypothesis, creative_hypothesis, proof_requirements, cta, kpi_hierarchy, scheduled_at, timezone,
           status, approval_class, risk_level, risk_reasons, experiment_id, related_prior_post_ids,
           anti_repetition_score, is_demo, qa_flags, source_path, artifact_envelope, plan_version,
           superseded_at, superseded_reason
         ) VALUES (
           $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15::jsonb, 'ar',
           $16, $17, $18::jsonb, $19, $20::jsonb, $21, 'Asia/Baghdad', 'NEEDS_REVIEW', $22, $23,
           $24::jsonb, NULL, '[]'::jsonb, 100, false, $25::jsonb, $26, $27::jsonb, $28, NULL, NULL
         )
         ON CONFLICT (organization_id, external_key) DO UPDATE SET
           strategy_id = EXCLUDED.strategy_id,
           month = EXCLUDED.month,
           title = EXCLUDED.title,
           strategic_objective = EXCLUDED.strategic_objective,
           audience = EXCLUDED.audience,
           funnel_stage = EXCLUDED.funnel_stage,
           content_pillar = EXCLUDED.content_pillar,
           tension = EXCLUDED.tension,
           key_message = EXCLUDED.key_message,
           perception_shift = EXCLUDED.perception_shift,
           format = EXCLUDED.format,
           platforms = EXCLUDED.platforms,
           language = EXCLUDED.language,
           hook_hypothesis = EXCLUDED.hook_hypothesis,
           creative_hypothesis = EXCLUDED.creative_hypothesis,
           proof_requirements = EXCLUDED.proof_requirements,
           cta = EXCLUDED.cta,
           kpi_hierarchy = EXCLUDED.kpi_hierarchy,
           scheduled_at = EXCLUDED.scheduled_at,
           approval_class = EXCLUDED.approval_class,
           risk_level = EXCLUDED.risk_level,
           risk_reasons = EXCLUDED.risk_reasons,
           qa_flags = EXCLUDED.qa_flags,
           source_path = EXCLUDED.source_path,
           plan_version = EXCLUDED.plan_version,
           status = CASE
             WHEN content_items.artifact_envelope->>'contentHash' = EXCLUDED.artifact_envelope->>'contentHash'
               THEN content_items.status
             ELSE 'NEEDS_REVIEW'
           END,
           artifact_envelope = EXCLUDED.artifact_envelope,
           superseded_at = NULL,
           superseded_reason = NULL,
           updated_at = now()
         RETURNING id`,
        [
          id,
          AURENDOR_ORGANIZATION_ID,
          SEPTEMBER_STRATEGY_ID,
          post.key,
          input.month,
          post.title,
          post.storyArc.resolution,
          post.audience,
          post.funnel,
          post.pillar,
          post.storyArc.friction,
          post.hook,
          post.storyArc.resolution,
          post.format,
          json(post.platforms),
          post.hook,
          post.visualDirection,
          json({ boundary: post.proofBoundary, sources: post.sourceRefs }),
          post.cta,
          json(post.kpis),
          post.publishAt,
          post.approvalClass,
          post.riskLevel,
          json(post.riskReasons),
          json(post.qaFlags),
          "apps/web/src/lib/september-creative-plan.ts#" + post.key,
          json(envelope),
          input.planVersion,
        ],
      );
      id = upserted.rows[0]?.id ?? id;

      const brief = {
        communicationGoal: post.storyArc.resolution,
        contentTrack: post.contentTrack,
        creativeMode: post.creativeMode,
        visualDirection: post.visualDirection,
        storyArc: post.storyArc,
        frames: post.frames,
        supportingStories: post.supportingStories,
        reelProduction: post.reelProduction ?? null,
        castingPlan: post.castingPlan,
        ctaPlacements: post.ctaPlacements,
        productionStatus: post.productionStatus,
        pinCandidate: post.pinCandidate,
        publicationEligible: false,
      };
      await transaction.query(
        `INSERT INTO design_briefs (id, content_item_id, brief, artifact_envelope)
         VALUES ($1, $2, $3::jsonb, $4::jsonb)
         ON CONFLICT (id) DO UPDATE SET brief = EXCLUDED.brief, artifact_envelope = EXCLUDED.artifact_envelope`,
        [briefId(post.key), id, json(brief), json(envelope)],
      );

      const normalizedPlatforms = [...new Set(post.platforms.map((platform) => platform.toLowerCase()))];
      const copyIds = normalizedPlatforms.map((platform) => copyId(post.key, platform));
      await transaction.query(
        `DELETE FROM copy_variants
         WHERE content_item_id = $1
           AND id NOT IN (SELECT jsonb_array_elements_text($2::jsonb))`,
        [id, json(copyIds)],
      );
      for (const platform of normalizedPlatforms) {
        await transaction.query(
          `INSERT INTO copy_variants (
             id, content_item_id, platform, language, angle, on_design_copy, caption, alt_text,
             hashtags, factual_claims, editorial_score, selected, artifact_envelope
           ) VALUES ($1, $2, $3, 'ar', $4, $5::jsonb, $6, $7, '[]'::jsonb, $8::jsonb, 0, true, $9::jsonb)
           ON CONFLICT (id) DO UPDATE SET
             angle = EXCLUDED.angle,
             on_design_copy = EXCLUDED.on_design_copy,
             caption = EXCLUDED.caption,
             alt_text = EXCLUDED.alt_text,
             factual_claims = EXCLUDED.factual_claims,
             editorial_score = EXCLUDED.editorial_score,
             selected = EXCLUDED.selected,
             artifact_envelope = EXCLUDED.artifact_envelope`,
          [
            copyId(post.key, platform),
            id,
            platform,
            post.contentTrack,
            json(post.frames),
            post.caption,
            post.altText,
            json([{ boundary: post.proofBoundary, sources: post.sourceRefs }]),
            json(envelope),
          ],
        );
      }

      await transaction.query(
        "DELETE FROM rendered_assets WHERE content_item_id = $1 AND provider IN ('monthly-plan-cover', 'monthly-plan-produced')",
        [id],
      );
      const assets = [post.cover, ...(post.additionalAssets ?? [])];
      for (const [assetIndex, asset] of assets.entries()) {
        const role = asset.assetRole ?? "planning_cover";
        const sequence = asset.sequence ?? assetIndex;
        const provider = role === "planning_cover" ? "monthly-plan-cover" : "monthly-plan-produced";
        await transaction.query(
          `INSERT INTO rendered_assets (
             id, content_item_id, design_brief_id, provider, provider_draft_id, editable_url,
             storage_path, public_url, mime_type, width, height, sha256, sequence, source_path,
             license_status, artifact_envelope
           ) VALUES ($1, $2, $3, $4, NULL, NULL, $5, $6, $7, $8, $9, $10, $11, $12, 'OWNED', $13::jsonb)`,
          [
            role === "planning_cover" && assets.length === 1 ? coverId(post.key) : assetId(post.key, role, sequence),
            id,
            briefId(post.key),
            provider,
            asset.storagePath,
            asset.publicUrl,
            asset.mimeType,
            asset.width,
            asset.height,
            asset.sha256,
            sequence,
            asset.sourcePath,
            json({
              ...envelope,
              byteLength: asset.byteLength,
              assetRole: role,
              publicationEligible: asset.publicationEligible ?? false,
            }),
          ],
        );
      }
    }

    await transaction.query(
      `INSERT INTO audit_logs (
         id, organization_id, actor_id, action, entity_type, entity_id,
         previous_state, new_state, reason, trace_id
       ) VALUES ($1, $2, 'system-plan-sync', 'SYNC_ACTIVE_PLAN', 'monthly_strategy', $3,
         $4::jsonb, $5::jsonb, $6, $7)`,
      [
        randomUUID(),
        AURENDOR_ORGANIZATION_ID,
        SEPTEMBER_STRATEGY_ID,
        json({ planHash: strategyBefore.rows[0]?.plan_hash ?? null }),
        json({ planHash: input.planHash, planVersion: input.planVersion, items: input.posts.length, superseded: superseded.rowCount }),
        "Synced the owner-reviewed active plan and retained replaced imports as read-only history.",
        randomUUID(),
      ],
    );

    return {
      syncedItems: input.posts.length,
      supersededItems: superseded.rowCount,
      resetForReview,
      planVersion: input.planVersion,
      planHash: input.planHash,
    };
  });
}
