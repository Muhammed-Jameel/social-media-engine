import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createDatabase, migrateDatabase, type DatabaseClient } from "./client";
import { SOCIAL_MEDIA_PLUGIN_ORGANIZATION_ID, SEPTEMBER_STRATEGY_ID } from "./ids";
import { syncActivePlan, type ActivePlanSyncInput } from "./plan-sync";
import { ContentOsRepository } from "./repository";
import { seedCoreData } from "./seed";

function planInput(contentHash = "content-hash-a", planHash = "plan-hash-a"): ActivePlanSyncInput {
  return {
    planVersion: "test-plan-v1",
    planHash,
    month: "2026-09",
    campaignName: "Test active plan",
    objective: "Use the active plan as the review source of truth.",
    positioning: "Plan and Content agree.",
    primaryAudience: "Operations leaders",
    secondaryAudience: "Project teams",
    cadence: "Intro then repeating service, product, and value cycle.",
    creativeBalance: "Carousel and reel led.",
    primaryKpis: ["saves"],
    storyPolicy: "Interaction then open-post CTA.",
    peoplePolicy: "Narrative-only people.",
    reelPolicy: "Validate every clip.",
    publishingBoundary: "Planning cover only.",
    posts: [
      {
        key: "SEP-01",
        sequence: 1,
        publishAt: "2026-09-01T10:00:00+03:00",
        title: "Current plan item",
        format: "carousel",
        creativeMode: "workflow_diagram",
        contentTrack: "brand_intro",
        platforms: ["instagram", "linkedin"],
        pillar: "Brand introduction",
        audience: "Operations leaders",
        funnel: "awareness",
        hook: "Current hook",
        caption: "Body\n\nCTA",
        cta: "CTA",
        ctaPlacements: ["caption_end", "carousel_last_frame"],
        storyArc: { setup: "Setup", friction: "Friction", intervention: "Intervention", resolution: "Resolution" },
        visualDirection: "Use a truthful workflow diagram.",
        altText: "Planning cover",
        frames: [{ sequence: 1, role: "cta", title: "CTA" }],
        supportingStories: [{ sequence: 1, role: "interaction" }, { sequence: 2, role: "post_cta" }],
        proofBoundary: "No result claim.",
        sourceRefs: ["source.md"],
        kpis: ["saves"],
        castingPlan: { humansPresent: false },
        productionStatus: "PLAN_COVER_ONLY",
        pinCandidate: true,
        contentHash,
        qaFlags: ["PLAN_COVER_ONLY"],
        riskLevel: "low",
        riskReasons: [],
        approvalClass: "MONTHLY_APPROVAL",
        cover: {
          storagePath: "apps/web/public/monthly-plan/2026-09/SEP-01.png",
          publicUrl: "/monthly-plan/2026-09/SEP-01.png",
          sourcePath: "artifacts/monthly-plans/covers/SEP-01.png",
          mimeType: "image/png",
          width: 1080,
          height: 1350,
          sha256: "a".repeat(64),
          byteLength: 100,
        },
      },
    ],
  };
}

async function insertLegacyItem(database: DatabaseClient): Promise<void> {
  await database.query(
    `INSERT INTO content_items (
       id, organization_id, strategy_id, external_key, month, title, strategic_objective, audience,
       funnel_stage, content_pillar, tension, key_message, perception_shift, format, platforms, language,
       hook_hypothesis, creative_hypothesis, proof_requirements, cta, kpi_hierarchy, scheduled_at, timezone,
       status, approval_class, risk_level, risk_reasons, experiment_id, related_prior_post_ids,
       anti_repetition_score, is_demo, qa_flags, source_path, artifact_envelope
     ) VALUES (
       'legacy-test', $1, $2, 'W1-P1', '2026-09', 'Old design', 'Historical evidence', 'Legacy audience',
       'awareness', 'legacy', 'Old tension', 'Old message', 'Old shift', 'single_image', '["instagram"]'::jsonb, 'ar',
       'Old hook', 'Old creative', '[]'::jsonb, 'Old CTA', '["saves"]'::jsonb, '2026-09-01T08:00:00+03:00', 'Asia/Baghdad',
       'NEEDS_REVIEW', 'MONTHLY_APPROVAL', 'low', '[]'::jsonb, NULL, '[]'::jsonb,
       80, true, '[]'::jsonb, 'legacy/post.json', '{"promptVersion":"legacy-import-v1"}'::jsonb
     )`,
    [SOCIAL_MEDIA_PLUGIN_ORGANIZATION_ID, SEPTEMBER_STRATEGY_ID],
  );
}

describe("active plan database sync", () => {
  let database: DatabaseClient;

  beforeEach(async () => {
    database = await createDatabase({ memory: true });
    await migrateDatabase(database);
    await seedCoreData(database);
    await insertLegacyItem(database);
  });

  afterEach(async () => {
    await database.close();
  });

  it("shows the current plan by default and retains legacy work as read-only history", async () => {
    const input = planInput();
    input.posts[0]!.additionalAssets = [{
      storagePath: "apps/web/public/monthly-plan/2026-09/launch-day/SEP-01/story-01.png",
      publicUrl: "/monthly-plan/2026-09/launch-day/SEP-01/story-01.png",
      sourcePath: "artifacts/monthly-plans/launch-day/SEP-01/story-01.png",
      mimeType: "image/png",
      width: 1080,
      height: 1920,
      sha256: "b".repeat(64),
      byteLength: 120,
      sequence: 101,
      assetRole: "story_frame",
      publicationEligible: false,
    }];
    const summary = await syncActivePlan(database, input);
    expect(summary.syncedItems).toBe(1);
    expect(summary.supersededItems).toBe(1);

    const repository = new ContentOsRepository(database);
    const active = await repository.listContent({ month: "2026-09" });
    const historical = await repository.listContent({ month: "2026-09", lifecycle: "superseded" });
    expect(active.map((item) => item.externalKey)).toEqual(["SEP-01"]);
    expect(active[0]?.planVersion).toBe("test-plan-v1");
    expect(historical.map((item) => item.externalKey)).toEqual(["W1-P1"]);
    expect(historical[0]?.supersededAt).not.toBeNull();
    const detail = await repository.getContentDetail("active-plan-sep-01");
    expect(detail?.assets.map((asset) => asset.role)).toEqual(["planning_cover", "story_frame"]);

    await expect(repository.recordApproval({
      id: "approval-legacy-test",
      contentItemId: "legacy-test",
      actorId: "user-owner",
      decision: "APPROVE",
      reasonCodes: [],
      feedback: "Should stay read only.",
      decidedAt: "2026-08-31T12:00:00.000Z",
      traceId: "trace-legacy-test",
    })).rejects.toThrow("read-only");
  });

  it("preserves decisions on an identical sync and resets a materially changed item", async () => {
    await syncActivePlan(database, planInput());
    await database.query("UPDATE content_items SET status = 'APPROVED' WHERE external_key = 'SEP-01'");
    await syncActivePlan(database, planInput());
    let status = await database.query<{ status: string }>("SELECT status FROM content_items WHERE external_key = 'SEP-01'");
    expect(status.rows[0]?.status).toBe("APPROVED");

    const changed = await syncActivePlan(database, planInput("content-hash-b", "plan-hash-b"));
    expect(changed.resetForReview).toBe(1);
    status = await database.query<{ status: string }>("SELECT status FROM content_items WHERE external_key = 'SEP-01'");
    expect(status.rows[0]?.status).toBe("NEEDS_REVIEW");
  });

  it("never bulk-approves an item with unresolved QA flags", async () => {
    await syncActivePlan(database, planInput());
    const repository = new ContentOsRepository(database);
    await repository.approveMonth(SEPTEMBER_STRATEGY_ID, "Approve the strategy only.");
    const status = await database.query<{ status: string }>("SELECT status FROM content_items WHERE external_key = 'SEP-01'");
    expect(status.rows[0]?.status).toBe("NEEDS_REVIEW");
  });
});
