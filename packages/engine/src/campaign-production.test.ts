import { describe, it, expect } from "vitest";
import { createDatabase, migrateDatabase, seedCoreData } from "@social-media-plugin/db";
import { advanceProduction, assertApprovedPackage, assertSynchronizedSelection, CAMPAIGN_PLATFORMS, CampaignPlanSchema, currentPackage, decideProduction, newProductionJob, packageAssets, ProductionPackageSchema, type ProductionJob } from "./campaign-production";
import { canonicalSha256 } from "./evidence";
import { importCampaignPlan, loadProductionJob, saveProductionJob } from "./campaign-store";
import { postizSettings } from "./postiz";

const slot = { id: "test-slot", title: "Evidence handoff", audience: "Operations teams", objective: "Useful workflow education", track: "service" as const, format: "carousel" as const, scheduledAt: "2026-10-01T09:30:00.000Z", tension: "Lost context", evidenceNeeded: ["Owned service definition"] };
const run = (id: string) => ({ runId: id, model: "test-model", skillRefs: ["test-skill@1"], promptVersion: "test-v1" });
const idea = (id: string) => ({ ...run(id), stage: "IDEA", body: { hook: "Where did that decision go?", scenario: "A handoff between two project managers", payoff: "Keep the source with the action", evidence: ["Owned workflow"], noveltyAgainstRecentFeed: "New scenario and framing", cta: "Map one handoff" } });
function review(job: ProductionJob, pass = true) {
  const last = job.history.at(-1)!;
  return { ...run(`review-${last.runId}`), stage: job.stage, inputHash: canonicalSha256(last), producerRunId: last.runId, scores: { relevance: 90, originality: pass ? 90 : 30, clarity: 90, credibility: 90, platformFit: 90 }, hardFails: [], observations: ["Specific scenario", "Clear user need", "Evidence visible"], revisionInstructions: pass ? [] : ["Replace with a substantially different idea"] };
}
function asset(n: number) {
  return { id: `asset-${n}`, sourcePath: `apps/web/public/production/test/${n}.png`, sha256: canonicalSha256(n), mimeType: "image/png" as const, width: 1080, height: 1920, altText: `Meaningful alternative text ${n}`, visualSubject: `Distinct scene ${n}`, licenseEvidence: "Owned original asset" };
}
function pkg() {
  return ProductionPackageSchema.parse({ contentItemId: slot.id, scheduledAt: slot.scheduledAt, variants: CAMPAIGN_PLATFORMS.map((p, i) => ({ platform: p, accountId: `${p}-account`, format: "carousel", title: "SOCIAL_MEDIA_PLUGIN workflow", adaptationRationale: `Native ${p} layout`, entries: [{ caption: `${p} native caption`, assets: [asset(i * 2), asset(i * 2 + 1)] }] })), stories: [10, 11].map(n => ({ parentPostId: slot.id, platform: "instagram", asset: asset(n), engagementPrompt: "Where do your handoffs lose context?", returnToPostCTA: "Read the new workflow post", nativeStickerHandoff: "Add question sticker in app" })) });
}
function throughAssets(): ProductionJob {
  let j = advanceProduction(newProductionJob("2026-10", slot), idea("idea-1"));
  j = advanceProduction(j, review(j));
  j = advanceProduction(j, { ...run("copy-1"), stage: "COPY", body: { copyAndArtDirection: "Reviewed native writing and exact art direction", sourceRefs: ["Owned source"], platformWriting: CAMPAIGN_PLATFORMS.map(p => ({ platform: p, entries: [{ caption: `${p} native caption`, onDesignCopy: ["Clear headline"] }] })) } });
  j = advanceProduction(j, review(j));
  return advanceProduction(j, { ...run("assets-1"), stage: "ASSETS", body: pkg() });
}
function designReview(j: ProductionJob) {
  const last = j.history.at(-1)!;
  const assets = packageAssets(currentPackage(j)!);
  return { ...run("design-review-1"), stage: "DESIGN_REVIEW", inputHash: canonicalSha256(last), producerRunId: last.runId,
    critiques: assets.map(a => ({ setId: `set-${a.id}`, renderedAssetId: a.id, renderedAssetSha256: a.sha256, language: "ar", pairwiseComparisons: [], finalDecision: "EXCELLENT", disagreementReasons: [], nextAction: "Present complete package to owner",
      critiques: ["SENIOR_ART_DIRECTOR", "SENIOR_GRAPHIC_DESIGNER", "SOCIAL_PERFORMANCE_STRATEGIST", "ARABIC_DESIGN_REVIEWER"].map(r => ({ critiqueId: `${a.id}-${r}`, renderedAssetId: a.id, renderedAssetSha256: a.sha256, criticRole: r, actualPixelsInspected: true, viewingScales: ["original", "mobile"], scores: { concept: 19, composition: 19, typography: 19, visualCraft: 19, brand: 19, communication: 19, professionalPolish: 19, distinctiveness: 19 }, total: 152, evidenceObservations: ["concept", "composition", "typography", "visualCraft"].map(d => ({ dimension: d, region: "main content", observation: "Test fixture observation, never production evidence", impact: "positive" })), hardFails: [], professionalAnchorComparison: { referenceIds: ["reference-one", "reference-two"], verdict: "comparable", observableDifferences: ["Fixture comparison one", "Fixture comparison two"] }, strengths: ["Test strength"], weaknesses: [], revisionInstructions: [], restartConcept: false, decision: "EXCELLENT" })) })),
    technicalChecks: assets.map(a => ({ assetSha256: a.sha256, decoded: true, dimensionsVerified: true, safeZonesPass: true, textAndRTLPass: true })), videoChecks: [], policy: { unsupportedClaims: 0, rightsVerified: true, noObjectifyingCasting: true, providerCapabilitiesCheckedAt: "2026-09-08T00:00:00Z", sources: ["Official provider docs"] }, feedReview: { recentPostIds: [], referencePrincipleIds: ["one", "two", "three"], originalityPass: true, distinctSlideImageryPass: true, observations: ["Fixture composition", "Fixture originality", "Fixture rhythm"] } };
}

describe("campaign production release contracts", () => {
  it("requires exactly the five platforms, never a partial batch or duplicate account", () => {
    expect(() => assertSynchronizedSelection([...CAMPAIGN_PLATFORMS])).not.toThrow();
    expect(() => assertSynchronizedSelection(["instagram", "facebook"])).toThrow(/Partial scheduling/);
    expect(() => assertSynchronizedSelection(["instagram", "facebook", "tiktok", "x", "x"])).toThrow();
  });
  it("uses LinkedIn document carousel settings rather than collage", () => {
    expect(postizSettings("linkedin-page", { linkedinDocumentCarousel: true, carouselName: "My story" })).toMatchObject({ post_as_images_carousel: true, carousel_name: "My story" });
  });
  it("rejects duplicate slide pixels and incomplete platform coverage", () => {
    const p = pkg(); p.variants[0]!.entries[0]!.assets[1] = p.variants[0]!.entries[0]!.assets[0]!;
    expect(() => ProductionPackageSchema.parse(p)).toThrow();
    expect(() => ProductionPackageSchema.parse({ ...pkg(), variants: pkg().variants.slice(1) })).toThrow();
  });
  it("rejects landscape TikTok and videos without a shot plan", () => {
    const p = pkg(); p.variants[2]!.entries[0]!.assets[0]!.height = 1080;
    expect(() => ProductionPackageSchema.parse(p)).toThrow(/9:16/);
    const v = pkg(); v.variants[0]!.format = "video";
    expect(() => ProductionPackageSchema.parse(v)).toThrow(/MP4/);
  });
  it("replaces weak ideas, stopping after three attempts", () => {
    let j = newProductionJob("2026-10", slot);
    for (let n = 1; n <= 3; n++) { j = advanceProduction(j, idea(`idea-${n}`)); j = advanceProduction(j, review(j, false)); }
    expect(j.stage).toBe("BLOCKED"); expect(j.attempts.idea).toBe(3);
    expect(() => advanceProduction(j, idea("idea-4"))).toThrow(/Expected BLOCKED/);
  });
  it("rejects stale and self-authored reviews", () => {
    const j = advanceProduction(newProductionJob("2026-10", slot), idea("idea-1"));
    expect(() => advanceProduction(j, { ...review(j), inputHash: "0".repeat(64) })).toThrow(/exact latest/);
    expect(() => advanceProduction(j, { ...review(j), runId: "idea-1" })).toThrow();
  });
  it("requires every Story and slide's pixel evidence before owner review", () => {
    const j = throughAssets(); const r = designReview(j); r.critiques.pop();
    expect(() => advanceProduction(j, r)).toThrow(/Every image/);
    expect(() => assertApprovedPackage(j)).toThrow();
  });
  it("completes the whole sequence and invalidates approval on owner rejection", () => {
    const j = throughAssets(); const ready = advanceProduction(j, designReview(j));
    expect(ready.stage).toBe("OWNER_REVIEW");
    const approved = decideProduction(ready, { decision: "APPROVE", actor: "owner", packageHash: canonicalSha256(pkg()), feedback: "" });
    expect(assertApprovedPackage(approved)).toEqual(pkg());
    expect(() => decideProduction(approved, { decision: "REVISE", actor: "owner", packageHash: canonicalSha256(pkg()), feedback: "" })).toThrow(/reason/);
    const revised = decideProduction(approved, { decision: "REVISE", actor: "owner", packageHash: canonicalSha256(pkg()), feedback: "Make Arabic more natural" });
    expect(revised.stage).toBe("IDEA"); expect(revised.approval).toBeNull(); expect(revised.feedback).toContain("Make Arabic more natural");
    expect(() => assertApprovedPackage(revised)).toThrow();
  });
  it("rejects a new caption sneaked into asset production", () => {
    const j = throughAssets(); j.history.pop(); j.stage = "ASSETS";
    const p = pkg(); p.variants[0]!.entries[0]!.caption = "Unreviewed claim";
    expect(() => advanceProduction(j, { ...run("different-assets"), stage: "ASSETS", body: p })).toThrow(/reviewed writing/);
  });
  it("persists an insert-only monthly plan and uses optimistic concurrency", async () => {
    const db = await createDatabase({ memory: true });
    try {
      await migrateDatabase(db); await seedCoreData(db);
      const plan = CampaignPlanSchema.parse({ version: "campaign-production-v1", month: "2026-10", timezone: "Asia/Baghdad", launchMonth: false, rationale: "Two useful service stories then an independent tip", sourceRefs: ["Owner-approved strategy"], slots: Array.from({ length: 12 }, (_, i) => ({ ...slot, id: `test-${i}`, track: ["service", "product", "useful_tip"][i % 3], scheduledAt: `2026-10-${String(i + 1).padStart(2, "0")}T09:30:00.000Z` })) });
      expect((await importCampaignPlan(db, plan)).created).toBe(true);
      expect((await importCampaignPlan(db, plan)).created).toBe(false);
      const j = (await loadProductionJob(db, "test-0"))!;
      const next = advanceProduction(j, idea("stored-idea"));
      await saveProductionJob(db, j, next);
      await expect(saveProductionJob(db, j, next)).rejects.toThrow(/concurrently/);
      expect((await loadProductionJob(db, "test-0"))!.stage).toBe("IDEA_REVIEW");
    } finally { await db.close(); }
  }, 30000);
});
