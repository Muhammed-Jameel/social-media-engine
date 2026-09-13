import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createDatabase,
  migrateDatabase,
  syncActivePlan,
  type ActivePlanAssetInput,
  type ActivePlanPostInput,
} from "@aurendor/db";
import {
  finalCaption,
  septemberCampaign,
  septemberCreativePosts,
  type SeptemberContentTrack,
} from "../apps/web/src/lib/september-creative-plan";

const root = fileURLToPath(new URL("../", import.meta.url));
const planVersion = "2026-09-launch-day-v5-multiplatform";
const publicRoot = join(root, "apps", "web", "public", "monthly-plan", "2026-09");
const artifactRoot = join(root, "artifacts", "monthly-plans", "2026-09-structured-intelligence");
const coverRoot = join(artifactRoot, "covers");
const launchArtifactRoot = join(artifactRoot, "launch-day");
const publicLaunchRoot = join(publicRoot, "launch-day");

function sha256(bytes: Uint8Array | string): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function pngDimensions(bytes: Buffer): { width: number; height: number } {
  const signature = bytes.subarray(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a") throw new Error("Planning cover is not a valid PNG.");
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

function assertPlan(): void {
  if (septemberCreativePosts.length !== 20) throw new Error("September must contain exactly 20 posts.");
  const keys = new Set<string>();
  const expectedCycle: SeptemberContentTrack[] = ["ai_automation_service", "bunyan_pro", "value_first"];
  for (const [index, post] of septemberCreativePosts.entries()) {
    if (post.sequence !== index + 1) throw new Error("Post sequence is not contiguous at " + post.key + ".");
    if (keys.has(post.key)) throw new Error("Duplicate post key: " + post.key);
    keys.add(post.key);
    if (index < 3 && post.contentTrack !== "brand_intro") {
      throw new Error("The first three posts must introduce AURENDOR.");
    }
    if (index >= 3) {
      const expected = expectedCycle[(index - 3) % 3];
      if (post.contentTrack !== expected) {
        throw new Error(post.key + " breaks the AI service → Bunyan Pro → useful tip cadence.");
      }
    }
    if (post.supportingStories.length < 2) throw new Error(post.key + " needs at least two supporting story frames.");
    if (!post.supportingStories.some((story) => story.role === "interaction")) {
      throw new Error(post.key + " needs an interactive supporting story.");
    }
    if (!post.supportingStories.some((story) => story.role === "post_cta" && story.interaction.type === "open_post")) {
      throw new Error(post.key + " needs a supporting story that drives back to the post.");
    }
    if (!post.ctaPlacements.includes("caption_end")) throw new Error(post.key + " must place its CTA at the caption end.");
    if (!finalCaption(post).endsWith(post.cta)) throw new Error(post.key + " final caption does not end with its CTA.");
    if (post.format === "carousel") {
      if (!post.ctaPlacements.includes("carousel_last_frame")) throw new Error(post.key + " lacks last-frame CTA placement.");
      if (post.slides.at(-1)?.role !== "cta") throw new Error(post.key + " carousel does not end on a CTA frame.");
    }
    if (post.format === "reel") {
      if (!post.ctaPlacements.includes("reel_end_card")) throw new Error(post.key + " lacks a reel end card.");
      if (!post.reelProduction) throw new Error(post.key + " lacks a reel production plan.");
      if (post.reelProduction.connectionState !== "AUTH_REQUIRED") {
        throw new Error(post.key + " must remain auth-gated until Higgsfield is connected.");
      }
      if (!post.reelProduction.clips.at(-1)?.narrativeBeat.includes("CTA")) {
        throw new Error(post.key + " reel does not end on a CTA clip.");
      }
    }
    if (post.castingPlan.humansPresent && post.castingPlan.justification.trim().length < 12) {
      throw new Error(post.key + " has people without a sufficient narrative justification.");
    }
    if (post.castingPlan.policy.womenAsAttentionDevice !== "FORBIDDEN") {
      throw new Error(post.key + " does not enforce the owner casting policy.");
    }
    const requiredPlatforms = ["Instagram", "Facebook", "TikTok", "X", "LinkedIn"];
    if (requiredPlatforms.some((platform) => !post.platforms.includes(platform))) {
      throw new Error(post.key + " does not target every active publishing platform.");
    }
  }
  const carouselCount = septemberCreativePosts.filter((post) => post.format === "carousel").length;
  const reelCount = septemberCreativePosts.filter((post) => post.format === "reel").length;
  if (carouselCount !== 14 || reelCount !== 6) throw new Error("September must contain 14 carousels and 6 reels.");
  const opening = septemberCreativePosts.slice(0, 3);
  if (opening.some((post) => post.format !== "carousel" || post.slides.length !== 6)) {
    throw new Error("The first day must contain three complete six-slide announcement carousels.");
  }
  if (opening.some((post) => post.productionStatus !== "READY_FOR_OWNER_REVIEW")) {
    throw new Error("Every first-day carousel must be ready for owner review.");
  }
}

assertPlan();
await Promise.all([
  mkdir(publicRoot, { recursive: true }),
  mkdir(artifactRoot, { recursive: true }),
  mkdir(publicLaunchRoot, { recursive: true }),
]);

const planHash = sha256(JSON.stringify({ planVersion, campaign: septemberCampaign, posts: septemberCreativePosts }));
const assets: Array<{
  key: string;
  source: string;
  publicFile: string;
  publicUrl: string;
  sha256: string;
  byteLength: number;
  width: number;
  height: number;
  sequence: number;
  role: "planning_cover" | "carousel_slide" | "story_frame";
  publicationEligible: false;
}> = [];
const dbPosts: ActivePlanPostInput[] = [];

for (const post of septemberCreativePosts) {
  const isProducedLaunchPost = post.sequence <= 3 && post.productionStatus === "READY_FOR_OWNER_REVIEW";
  const postAssets: ActivePlanAssetInput[] = [];
  if (isProducedLaunchPost) {
    const destinationRoot = join(publicLaunchRoot, post.key);
    await mkdir(destinationRoot, { recursive: true });
    const producedSpecs = [
      ...post.slides.map((slide) => ({
        sourcePath: join(launchArtifactRoot, post.key, `slide-${String(slide.sequence).padStart(2, "0")}.png`),
        destinationPath: join(destinationRoot, `slide-${String(slide.sequence).padStart(2, "0")}.png`),
        publicUrl: slide.assetUrl,
        role: "carousel_slide" as const,
        sequence: slide.sequence,
        width: 1080,
        height: 1350,
      })),
      ...post.supportingStories.map((story) => ({
        sourcePath: join(launchArtifactRoot, post.key, `story-${String(story.sequence).padStart(2, "0")}.png`),
        destinationPath: join(destinationRoot, `story-${String(story.sequence).padStart(2, "0")}.png`),
        publicUrl: story.assetUrl,
        role: "story_frame" as const,
        sequence: 100 + story.sequence,
        width: 1080,
        height: 1920,
      })),
    ];
    for (const spec of producedSpecs) {
      if (!spec.publicUrl) throw new Error(`${post.key} produced asset is missing its public URL.`);
      let bytes: Buffer;
      try {
        bytes = await readFile(spec.sourcePath);
      } catch {
        throw new Error(`Missing produced launch asset for ${post.key}. Run pnpm plan:launch-day:render first.`);
      }
      const dimensions = pngDimensions(bytes);
      if (dimensions.width !== spec.width || dimensions.height !== spec.height) {
        throw new Error(`${post.key} ${spec.role} must be ${spec.width}×${spec.height}; received ${dimensions.width}×${dimensions.height}.`);
      }
      await copyFile(spec.sourcePath, spec.destinationPath);
      const digest = sha256(bytes);
      const publicFile = relative(publicRoot, spec.destinationPath);
      assets.push({
        key: post.key,
        source: relative(root, spec.sourcePath),
        publicFile,
        publicUrl: spec.publicUrl,
        sha256: digest,
        byteLength: bytes.byteLength,
        width: dimensions.width,
        height: dimensions.height,
        sequence: spec.sequence,
        role: spec.role,
        publicationEligible: false,
      });
      postAssets.push({
        storagePath: relative(root, spec.destinationPath),
        publicUrl: spec.publicUrl,
        sourcePath: relative(root, spec.sourcePath),
        mimeType: "image/png",
        width: dimensions.width,
        height: dimensions.height,
        sha256: digest,
        byteLength: bytes.byteLength,
        sequence: spec.sequence,
        assetRole: spec.role,
        publicationEligible: false,
      });
    }
  } else {
    const sourcePath = join(coverRoot, post.key + ".png");
    const publicFile = post.key + ".png";
    const destinationPath = join(publicRoot, publicFile);
    let bytes: Buffer;
    try {
      bytes = await readFile(sourcePath);
    } catch {
      throw new Error("Missing planning cover for " + post.key + ". Run pnpm plan:september:render first.");
    }
    const dimensions = pngDimensions(bytes);
    if (dimensions.width !== 1080 || dimensions.height !== 1350) {
      throw new Error(post.key + " cover must be 1080×1350; received " + dimensions.width + "×" + dimensions.height + ".");
    }
    await copyFile(sourcePath, destinationPath);
    const digest = sha256(bytes);
    const publicUrl = "/monthly-plan/2026-09/" + publicFile;
    assets.push({
      key: post.key,
      source: relative(root, sourcePath),
      publicFile,
      publicUrl,
      sha256: digest,
      byteLength: bytes.byteLength,
      width: dimensions.width,
      height: dimensions.height,
      sequence: 0,
      role: "planning_cover",
      publicationEligible: false,
    });
    postAssets.push({
      storagePath: relative(root, destinationPath),
      publicUrl,
      sourcePath: relative(root, sourcePath),
      mimeType: "image/png",
      width: dimensions.width,
      height: dimensions.height,
      sha256: digest,
      byteLength: bytes.byteLength,
      sequence: 0,
      assetRole: "planning_cover",
      publicationEligible: false,
    });
  }

  const qaFlags = isProducedLaunchPost
    ? []
    : post.format === "carousel"
      ? ["PLAN_COVER_ONLY: Produce and validate the complete carousel frame set before approval."]
      : [
          "PLAN_COVER_ONLY: The visible image is a planning cover, not the final reel.",
          "HIGGSFIELD_AUTH_REQUIRED: Authenticate Higgsfield before generating any clip.",
          "REEL_ASSEMBLY_BLOCKED: Every clip and the final video require technical and creative validation.",
        ];
  if (post.key === "SEP-17") {
    qaFlags.push("CLAIM_REVERIFY_REQUIRED: Recheck the Bunyan Pro privacy policy immediately before publication.");
  }
  dbPosts.push({
    key: post.key,
    sequence: post.sequence,
    publishAt: post.publishAt,
    title: post.title,
    format: post.format,
    creativeMode: post.creativeMode,
    contentTrack: post.contentTrack,
    platforms: post.platforms.map((platform) => platform.toLowerCase()),
    pillar: post.pillar,
    audience: post.audience,
    funnel: post.funnel,
    hook: post.hook,
    caption: finalCaption(post),
    cta: post.cta,
    ctaPlacements: post.ctaPlacements,
    storyArc: post.storyArc,
    visualDirection: post.visualDirection,
    altText: post.altText,
    frames: post.slides,
    supportingStories: post.supportingStories,
    ...(post.reelProduction ? { reelProduction: post.reelProduction } : {}),
    proofBoundary: post.proofBoundary,
    sourceRefs: post.sourceRefs,
    kpis: post.kpis,
    castingPlan: post.castingPlan,
    productionStatus: post.productionStatus,
    pinCandidate: post.pinCandidate,
    contentHash: sha256(JSON.stringify({ post, assetHashes: postAssets.map((asset) => asset.sha256) })),
    qaFlags,
    riskLevel: post.key === "SEP-17" ? "high" : "low",
    riskReasons: post.key === "SEP-17" ? ["Public privacy claim requires point-in-time re-verification."] : [],
    approvalClass: post.key === "SEP-17" ? "ITEM_APPROVAL" : "MONTHLY_APPROVAL",
    cover: postAssets[0]!,
    ...(postAssets.length > 1 ? { additionalAssets: postAssets.slice(1) } : {}),
  });
}

const dateFormatter = new Intl.DateTimeFormat("ar-IQ", {
  day: "numeric",
  month: "long",
  timeZone: "Asia/Baghdad",
});
const calendarRows = septemberCreativePosts.map((post) => {
  const readiness = post.productionStatus === "READY_FOR_OWNER_REVIEW"
    ? "Complete asset set ready for owner review"
    : post.format === "reel"
      ? "Higgsfield auth required"
      : "Full carousel required";
  return [
    "| ", String(post.sequence).padStart(2, "0"),
    " | ", dateFormatter.format(new Date(post.publishAt)),
    " | ", post.title,
    " | ", post.contentTrack,
    " | ", post.format,
    " | ", String(post.supportingStories.length),
    " | ", readiness,
    " |",
  ].join("");
});
const markdown = [
  "# ", septemberCampaign.name,
  "\n\n## Objective\n\n", septemberCampaign.objective,
  "\n\n## Audience\n\n- Primary: ", septemberCampaign.primaryAudience,
  "\n- Secondary: ", septemberCampaign.secondaryAudience,
  "\n\n## Positioning\n\n", septemberCampaign.positioning,
  "\n\n## Cadence\n\n", septemberCampaign.cadence,
  "\n\n## Creative and story policy\n\n- ", septemberCampaign.creativeBalance,
  "\n- ", septemberCampaign.storyPolicy,
  "\n- ", septemberCampaign.peoplePolicy,
  "\n- ", septemberCampaign.reelPolicy,
  "\n\n## Release boundary\n\n", septemberCampaign.publishingBoundary,
  "\n\n## Calendar\n\n| # | Date | Post | Track | Format | Story frames | Production gate |\n",
  "|---:|---|---|---|---|---:|---|\n",
  calendarRows.join("\n"),
  "\n",
].join("");

const assetPlan = [
  "# September asset-production plan",
  "",
  "The first-day announcement package is produced for owner review. Remaining items retain planning covers until their full media sets are made.",
  "",
  "- SEP-01 through SEP-03: 18 finished carousel slides and 6 supporting Story frames, ready for owner review.",
  "- The remaining 11 carousels require the complete ordered frame set and mobile/RTL QA.",
  "- 6 reels require Higgsfield authentication, source-media privacy review, clip-by-clip validation, deterministic assembly, and final-video QA.",
  "- The remaining 34 supporting Story frames require 9:16 production and interaction-sticker verification.",
  "- Bunyan Pro product posts must use owned, sanitized UI. Synthetic product UI is forbidden.",
  "- People are narrative-only. Objectifying or ornamental casting, including women used as attention devices, is a hard fail.",
  "",
  "## Reel gates",
  "",
  ...septemberCreativePosts.filter((post) => post.format === "reel").map((post) =>
    "- " + post.key + " — " + post.title + ": " + String(post.reelProduction?.clips.length ?? 0) + " planned clips; AUTH_REQUIRED."
  ),
  "",
].join("\n");

const publicManifest = {
  schemaVersion: "2.0.0",
  planVersion,
  planHash,
  count: assets.length,
  assets,
  publicationEligible: false,
  reason: "The launch-day package is ready for owner review; later carousel, Story, and reel assets are still incomplete.",
};
await Promise.all([
  writeFile(join(artifactRoot, "MONTHLY-CALENDAR.md"), markdown, "utf8"),
  writeFile(join(artifactRoot, "DESIGN-ASSET-PLAN.md"), assetPlan, "utf8"),
  writeFile(
    join(artifactRoot, "month-plan.json"),
    JSON.stringify({
      schemaVersion: "2.0.0",
      planVersion,
      planHash,
      campaign: septemberCampaign,
      posts: septemberCreativePosts,
      assets,
      publicationEligible: false,
    }, null, 2) + "\n",
    "utf8",
  ),
  writeFile(join(publicRoot, "manifest.json"), JSON.stringify(publicManifest, null, 2) + "\n", "utf8"),
]);

const database = await createDatabase();
let databaseSummary;
try {
  await migrateDatabase(database);
  databaseSummary = await syncActivePlan(database, {
    planVersion,
    planHash,
    month: "2026-09",
    campaignName: septemberCampaign.name,
    objective: septemberCampaign.objective,
    positioning: septemberCampaign.positioning,
    primaryAudience: septemberCampaign.primaryAudience,
    secondaryAudience: septemberCampaign.secondaryAudience,
    cadence: septemberCampaign.cadence,
    creativeBalance: septemberCampaign.creativeBalance,
    primaryKpis: [...septemberCampaign.primaryKpis],
    storyPolicy: septemberCampaign.storyPolicy,
    peoplePolicy: septemberCampaign.peoplePolicy,
    reelPolicy: septemberCampaign.reelPolicy,
    publishingBoundary: septemberCampaign.publishingBoundary,
    posts: dbPosts,
  });
} finally {
  await database.close();
}

console.log(JSON.stringify({
  planningCovers: assets.filter((asset) => asset.role === "planning_cover").length,
  producedCarouselSlides: assets.filter((asset) => asset.role === "carousel_slide").length,
  producedStoryFrames: assets.filter((asset) => asset.role === "story_frame").length,
  carousels: septemberCreativePosts.filter((post) => post.format === "carousel").length,
  reels: septemberCreativePosts.filter((post) => post.format === "reel").length,
  storyFrames: septemberCreativePosts.reduce((total, post) => total + post.supportingStories.length, 0),
  publicationEligible: false,
  database: databaseSummary,
}, null, 2));
