import { z } from "zod";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { resolveWithinRoot } from "./security";
import { ProfessionalCritiqueSetSchema } from "@aurendor/schemas";
import { canonicalSha256 } from "./evidence";
import { readVerifiedAsset } from "./postiz";

export const CAMPAIGN_PLATFORMS = ["instagram", "facebook", "tiktok", "x", "linkedin"] as const;
export const CampaignPlatformSchema = z.enum(CAMPAIGN_PLATFORMS);
const text = z.string().trim().min(1);
const hash = z.string().regex(/^[a-f0-9]{64}$/);
const iso = z.string().datetime({ offset: true });

// These are creative targets, not claims about maximum provider capabilities.
export const PLATFORM_PRODUCTION_TARGETS = {
  instagram: { carousel: "1080×1350, ordered 4:5 slides", video: "1080×1920, 9:16 Reel" },
  facebook: { carousel: "1080×1350, images that also read in a feed collage", video: "9:16 Reel or a deliberately composed feed video" },
  tiktok: { carousel: "1080×1920, 9:16 photo sequence", video: "1080×1920, 9:16; current delivery is inbox upload" },
  x: { carousel: "Up to four purpose-designed images per authored thread entry", video: "9:16 or 16:9 according to the content; no blind crop" },
  linkedin: { carousel: "Ordered document carousel via Postiz image-to-document mode", video: "4:5 or 16:9 when UI/demo detail benefits; deliberate re-layout" },
} as const;

export const CampaignSlotSchema = z.object({
  id: text, title: text, audience: text, objective: text,
  track: z.enum(["announcement", "service", "product", "useful_tip"]),
  format: z.enum(["carousel", "video"]), scheduledAt: iso,
  tension: text, evidenceNeeded: z.array(text),
});
export const CampaignPlanSchema = z.object({
  version: z.literal("campaign-production-v1"), month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  timezone: z.literal("Asia/Baghdad"), launchMonth: z.boolean(),
  rationale: text, sourceRefs: z.array(text).min(1), slots: z.array(CampaignSlotSchema).min(12).max(31),
}).superRefine((plan, ctx) => {
  const issue = (message: string) => ctx.addIssue({ code: "custom", message });
  if (new Set(plan.slots.map(s => s.id)).size !== plan.slots.length) issue("Duplicate slot IDs.");
  const opening = plan.launchMonth ? 3 : 0;
  plan.slots.forEach((slot, i) => {
    const expected = i < opening ? "announcement" : ["service", "product", "useful_tip"][(i - opening) % 3];
    if (slot.track !== expected) issue(`Slot ${i + 1} must be ${expected}; preserve the 2:1 cycle.`);
    if (i < opening && slot.format !== "carousel") issue("Opening three announcements must be carousels.");
    const localMonth = new Date(Date.parse(slot.scheduledAt) + 3 * 3600_000).toISOString().slice(0, 7);
    if (localMonth !== plan.month) issue("Every slot must fall within the Baghdad calendar month.");
    if (i > 0 && Date.parse(slot.scheduledAt) <= Date.parse(plan.slots[i - 1]!.scheduledAt)) issue("Slots must have ascending publication times.");
  });
});

export const ProductionAssetSchema = z.object({
  id: text, sourcePath: z.string().regex(/^apps\/web\/public\/production\/[a-zA-Z0-9_./-]+$/).refine(p => !p.split("/").some(s => s === ".." || s === "."), "No traversal segments."),
  sha256: hash, mimeType: z.enum(["image/png", "image/jpeg", "video/mp4"]),
  width: z.number().int().positive(), height: z.number().int().positive(),
  altText: text, visualSubject: text, licenseEvidence: text,
  durationSeconds: z.number().positive().optional(),
});
const VariantSchema = z.object({
  platform: CampaignPlatformSchema,
  accountId: text,
  format: z.enum(["image", "carousel", "video", "thread"]),
  title: text, adaptationRationale: text,
  entries: z.array(z.object({ caption: text, assets: z.array(ProductionAssetSchema).min(1) })).min(1),
});
const ShotSchema = z.object({
  id: text, purpose: text, referenceRefs: z.array(text).min(1),
  exactPrompt: z.string().min(80), cameraAndMotion: text, timing: text,
  exactOnScreenCopy: z.array(text), audioPlan: text,
  sourceClip: ProductionAssetSchema,
  review: z.object({ reviewerRunId: text, watchedFullClip: z.literal(true), passed: z.literal(true), observations: z.array(text).min(3) }),
});
export const ProductionPackageSchema = z.object({
  contentItemId: text, scheduledAt: iso,
  variants: z.array(VariantSchema).length(5),
  stories: z.array(z.object({
    parentPostId: text, platform: z.enum(["instagram", "facebook"]), asset: ProductionAssetSchema,
    engagementPrompt: text, returnToPostCTA: text, nativeStickerHandoff: text,
  })).min(2),
  video: z.object({
    directorModel: text, renderer: text, editableProjectPath: text,
    referencePrinciples: z.array(text).min(3), shots: z.array(ShotSchema).min(2),
    exportNotes: text,
  }).optional(),
}).superRefine((pkg, ctx) => {
  const issue = (message: string) => ctx.addIssue({ code: "custom", message });
  if (new Set(pkg.variants.map(v => v.platform)).size !== 5) issue("Exactly one variant for each of the five platforms is required.");
  for (const v of pkg.variants) {
    const captionBudget = v.platform === "x" ? 280 : v.platform === "linkedin" ? 3000 : v.platform === "facebook" ? 5000 : 2200;
    if (v.entries.some(e => Array.from(e.caption).length > captionBudget)) issue(`${v.platform} caption exceeds the engine's conservative editorial budget (${captionBudget}).`);
    if (v.platform !== "x" && v.entries.length !== 1) issue("Only X supports authored thread entries in this bridge.");
    const assets = v.entries.flatMap(e => e.assets);
    if (v.format === "video") {
      if (assets.length !== 1 || assets[0]?.mimeType !== "video/mp4" || !assets[0]?.durationSeconds || !pkg.video) issue("Video needs one measured MP4 and a reviewed shot plan.");
    } else if (assets.some(a => a.mimeType === "video/mp4")) issue("Image formats cannot conceal video assets.");
    if (v.format === "carousel" && assets.length < 2) issue("A carousel needs multiple slides.");
    if (new Set(assets.map(a => a.sha256)).size !== assets.length) issue("Do not repeat a slide/image within a platform post.");
    if (new Set(assets.map(a => a.visualSubject.trim().toLowerCase())).size !== assets.length) issue("Carousel slides need distinct, related visual subjects.");
    if (v.platform === "x" && v.entries.some(e => e.assets.length > 4)) issue("Author X entries explicitly, with at most four images each.");
    if (v.platform === "tiktok" || (v.platform === "instagram" && v.format === "video")) {
      if (assets.some(a => Math.abs(a.width / a.height - 9 / 16) > 0.01)) issue(`${v.platform} needs a composed 9:16 export.`);
    }
    if (assets.some(a => a.width < 720 || a.height < 720)) issue("Production exports must be at least 720px on each axis.");
    if (v.format === "carousel" && assets.some(a => a.width !== assets[0]!.width || a.height !== assets[0]!.height)) issue("Carousel dimensions must be consistent.");
  }
  for (const s of pkg.stories) {
    if (s.parentPostId !== pkg.contentItemId) issue("Stories must support their parent post.");
    if (Math.abs(s.asset.width / s.asset.height - 9 / 16) > 0.01) issue("Stories require 9:16 exports.");
  }
});
export type ProductionPackage = z.infer<typeof ProductionPackageSchema>;

const RunSchema = z.object({ runId: text, model: text, skillRefs: z.array(text).min(1), promptVersion: text });
const EvaluationSchema = RunSchema.extend({
  inputHash: hash, producerRunId: text,
  scores: z.object({ relevance: z.number().min(0).max(100), originality: z.number().min(0).max(100), clarity: z.number().min(0).max(100), credibility: z.number().min(0).max(100), platformFit: z.number().min(0).max(100) }),
  hardFails: z.array(text), observations: z.array(text).min(3), revisionInstructions: z.array(text),
}).refine(v => v.runId !== v.producerRunId, "Critique must use a separate agent invocation.");
export const StageSubmissionSchema = z.discriminatedUnion("stage", [
  RunSchema.extend({ stage: z.literal("IDEA"), body: z.object({ hook: text, scenario: text, payoff: text, evidence: z.array(text), noveltyAgainstRecentFeed: text, cta: text }) }),
  EvaluationSchema.extend({ stage: z.literal("IDEA_REVIEW") }),
  RunSchema.extend({ stage: z.literal("COPY"), body: z.object({ copyAndArtDirection: text, sourceRefs: z.array(text).min(1), platformWriting: z.array(z.object({ platform: CampaignPlatformSchema, entries: z.array(z.object({ caption: text, onDesignCopy: z.array(text).min(1) })).min(1) })).length(5) }) }),
  EvaluationSchema.extend({ stage: z.literal("COPY_REVIEW") }),
  RunSchema.extend({ stage: z.literal("ASSETS"), body: ProductionPackageSchema }),
  RunSchema.extend({ stage: z.literal("DESIGN_REVIEW"), inputHash: hash, producerRunId: text,
    critiques: z.array(ProfessionalCritiqueSetSchema).min(1),
    technicalChecks: z.array(z.object({ assetSha256: hash, decoded: z.literal(true), dimensionsVerified: z.literal(true), safeZonesPass: z.literal(true), textAndRTLPass: z.literal(true) })).min(1),
    videoChecks: z.array(z.object({ assetSha256: hash, watchedEntireExport: z.literal(true), listenedEntireExport: z.literal(true), captionsPass: z.literal(true), pacingPass: z.literal(true), noClippingOrArtifacts: z.literal(true) })),
    policy: z.object({ unsupportedClaims: z.literal(0), rightsVerified: z.literal(true), noObjectifyingCasting: z.literal(true), providerCapabilitiesCheckedAt: iso, sources: z.array(text).min(1) }),
    feedReview: z.object({ recentPostIds: z.array(text), referencePrincipleIds: z.array(text).min(3), originalityPass: z.literal(true), distinctSlideImageryPass: z.literal(true), observations: z.array(text).min(3) }),
  }),
]);
export type StageSubmission = z.infer<typeof StageSubmissionSchema>;
export const ProductionJobSchema = z.object({
  id: text, month: text, slot: CampaignSlotSchema, revision: z.number().int().nonnegative(),
  stage: z.enum(["IDEA", "IDEA_REVIEW", "COPY", "COPY_REVIEW", "ASSETS", "DESIGN_REVIEW", "OWNER_REVIEW", "APPROVED", "BLOCKED"]),
  attempts: z.object({ idea: z.number().int(), copy: z.number().int(), design: z.number().int() }),
  history: z.array(StageSubmissionSchema), feedback: z.array(text),
  approval: z.object({ actor: text, packageHash: hash, decidedAt: iso }).nullable(),
});
export type ProductionJob = z.infer<typeof ProductionJobSchema>;
export function newProductionJob(month: string, slot: z.infer<typeof CampaignSlotSchema>): ProductionJob {
  return { id: slot.id, month, slot, revision: 0, stage: "IDEA", attempts: { idea: 0, copy: 0, design: 0 }, history: [], feedback: [], approval: null };
}
export function currentPackage(job: ProductionJob): ProductionPackage | null {
  const entry = job.history.findLast(s => s.stage === "ASSETS");
  return entry?.stage === "ASSETS" ? entry.body : null;
}
export function packageAssets(pkg: ProductionPackage) {
  return [...pkg.variants.flatMap(v => v.entries.flatMap(e => e.assets)), ...pkg.stories.map(s => s.asset), ...(pkg.video?.shots.map(s => s.sourceClip) ?? [])];
}
export async function verifyProductionBytes(root: string, pkg: ProductionPackage): Promise<void> {
  const seen = new Set<string>();
  for (const asset of packageAssets(pkg)) {
    await readVerifiedAsset({ root, sourcePath: asset.sourcePath, sha256: asset.sha256 });
    // Verify each declared dimension even when the same bytes appear in two variants.
    const { stdout } = await promisify(execFile)("ffprobe", ["-v", "error", "-protocol_whitelist", "file,pipe", "-show_entries", "stream=width,height,codec_name,codec_type:format=duration", "-of", "json", resolveWithinRoot(root, asset.sourcePath)], { timeout: 30_000 });
    const probe = z.object({ streams: z.array(z.object({ codec_type: z.string(), codec_name: z.string(), width: z.number().optional(), height: z.number().optional() })), format: z.object({ duration: z.string().optional() }) }).parse(JSON.parse(stdout));
    const visual = probe.streams.find(s => s.codec_type === "video");
    if (visual?.width !== asset.width || visual?.height !== asset.height) throw new Error(`Measured dimensions differ: ${asset.id}.`);
    const codec = asset.mimeType === "image/png" ? "png" : asset.mimeType === "image/jpeg" ? "mjpeg" : "h264";
    if (visual.codec_name !== codec) throw new Error(`Unexpected media codec: ${asset.id}.`);
    if (asset.mimeType === "video/mp4" && (!asset.durationSeconds || !probe.format.duration || Math.abs(Number(probe.format.duration) - asset.durationSeconds) > 0.25)) throw new Error(`Measured video duration differs: ${asset.id}.`);
    if (!seen.has(asset.sha256)) {
      await promisify(execFile)("ffmpeg", ["-v", "error", "-xerror", "-protocol_whitelist", "file,pipe", "-i", resolveWithinRoot(root, asset.sourcePath), "-f", "null", "-"], { timeout: 120_000 });
      seen.add(asset.sha256);
    }
  }
}
export function advanceProduction(jobInput: ProductionJob, raw: unknown): ProductionJob {
  const job = structuredClone(ProductionJobSchema.parse(jobInput));
  const submission = StageSubmissionSchema.parse(raw);
  if (submission.stage !== job.stage) throw new Error(`Expected ${job.stage}, not ${submission.stage}.`);
  const last = job.history.at(-1);
  if (job.history.some(s => s.runId === submission.runId)) throw new Error("Agent run IDs must be unique; do not replay outputs.");
  if ("inputHash" in submission) {
    if (!last || submission.inputHash !== canonicalSha256(last) || submission.producerRunId !== last.runId || submission.runId === last.runId) throw new Error("Review must bind the exact latest producer output from an independent run.");
  }
  if (submission.stage === "IDEA") { job.attempts.idea++; job.stage = "IDEA_REVIEW"; }
  if (submission.stage === "COPY") {
    if (new Set(submission.body.platformWriting.map(v => v.platform)).size !== 5) throw new Error("Write for every platform.");
    job.attempts.copy++; job.stage = "COPY_REVIEW";
  }
  if (submission.stage === "IDEA_REVIEW" || submission.stage === "COPY_REVIEW") {
    const pass = !submission.hardFails.length && Object.values(submission.scores).every(n => n >= 85);
    if (pass) job.stage = submission.stage === "IDEA_REVIEW" ? "COPY" : "ASSETS";
    else {
      const idea = submission.stage === "IDEA_REVIEW";
      job.feedback.push(...submission.hardFails, ...submission.revisionInstructions);
      job.stage = (idea ? job.attempts.idea >= 3 : job.attempts.copy >= 3) ? "BLOCKED" : idea ? "IDEA" : "COPY";
    }
  }
  if (submission.stage === "ASSETS") {
    if (submission.body.contentItemId !== job.id || submission.body.scheduledAt !== job.slot.scheduledAt) throw new Error("Package must bind the planned post and shared timestamp.");
    const copy = job.history.findLast(s => s.stage === "COPY");
    if (!copy || copy.stage !== "COPY") throw new Error("Missing reviewed writing.");
    for (const variant of submission.body.variants) {
      const written = copy.body.platformWriting.find(v => v.platform === variant.platform);
      if (canonicalSha256(written?.entries.map(e => e.caption)) !== canonicalSha256(variant.entries.map(e => e.caption))) throw new Error("Asset package captions differ from the reviewed writing. Return to editorial review.");
    }
    const previousPackage = currentPackage(job);
    const priorReview = job.history.findLast(s => s.stage === "DESIGN_REVIEW");
    const pixelsRejected = priorReview?.stage === "DESIGN_REVIEW" && priorReview.critiques.some(c => !["PROFESSIONAL_CANDIDATE", "EXCELLENT"].includes(c.finalDecision));
    if (pixelsRejected && previousPackage && canonicalSha256(packageAssets(previousPackage).map(a => a.sha256)) === canonicalSha256(packageAssets(submission.body).map(a => a.sha256))) throw new Error("A design revision must change actual rendered bytes, not only metadata.");
    job.attempts.design++; job.stage = "DESIGN_REVIEW";
  }
  if (submission.stage === "DESIGN_REVIEW") {
    const pkg = currentPackage(job);
    if (!pkg) throw new Error("No assets to review.");
    const assets = packageAssets(pkg);
    if (pkg.video?.shots.some(s => s.review.reviewerRunId === submission.producerRunId)) throw new Error("Clip reviews must be independent of asset production.");
    for (const a of assets) {
      const panel = submission.critiques.find(c => c.renderedAssetSha256 === a.sha256);
      if (!panel || !submission.technicalChecks.some(c => c.assetSha256 === a.sha256)) throw new Error("Every image, Story, clip and export needs hash-bound visual and technical evidence.");
      if (panel.critiques.some(c => c.viewingScales.includes("original") === false || c.viewingScales.includes("mobile") === false)) throw new Error("Review original and mobile scale.");
      if (a.mimeType === "video/mp4" && !submission.videoChecks.some(c => c.assetSha256 === a.sha256)) throw new Error("Full video playback, audio and caption QA is required.");
    }
    const pass = submission.critiques.every(c => ["PROFESSIONAL_CANDIDATE", "EXCELLENT"].includes(c.finalDecision) && c.critiques.every(r => ["PROFESSIONAL_CANDIDATE", "EXCELLENT"].includes(r.decision)));
    job.stage = pass ? "OWNER_REVIEW" : job.attempts.design >= 3 ? "BLOCKED" : "ASSETS";
    if (!pass) job.feedback.push(...submission.critiques.flatMap(c => c.critiques.flatMap(r => r.revisionInstructions)));
  }
  job.history.push(submission); job.revision++; job.approval = null;
  return job;
}
/** Called only by the authenticated owner action, never by the production CLI. */
export function decideProduction(jobInput: ProductionJob, input: { decision: "APPROVE" | "REVISE"; actor: string; packageHash: string; feedback: string }): ProductionJob {
  const job = structuredClone(ProductionJobSchema.parse(jobInput));
  if (!["OWNER_REVIEW", "APPROVED"].includes(job.stage)) throw new Error("Only a complete reviewed package can receive an owner decision.");
  const pkg = currentPackage(job);
  if (!pkg || canonicalSha256(pkg) !== input.packageHash) throw new Error("This review is stale. Reload the current package.");
  if (input.decision === "APPROVE") {
    job.stage = "APPROVED";
    job.approval = { actor: input.actor, packageHash: input.packageHash, decidedAt: new Date().toISOString() };
  } else {
    if (!input.feedback.trim()) throw new Error("Please provide a reason so the agents know what to fix.");
    // Re-evaluate the idea too: owner feedback may invalidate the premise itself.
    job.stage = "IDEA"; job.approval = null; job.feedback.push(input.feedback.trim());
    job.attempts = { idea: 0, copy: 0, design: 0 };
  }
  job.revision++;
  return job;
}
export function assertSynchronizedSelection(platforms: string[]): void {
  if (platforms.length !== 5 || new Set(platforms).size !== 5 || CAMPAIGN_PLATFORMS.some(p => !platforms.includes(p))) throw new Error("Select exactly one account for each of Instagram, Facebook, TikTok, X and LinkedIn. Partial scheduling is disabled.");
}
export function assertApprovedPackage(job: ProductionJob): ProductionPackage {
  const pkg = currentPackage(job);
  if (!pkg || job.stage !== "APPROVED" || !job.approval || job.approval.packageHash !== canonicalSha256(pkg)) throw new Error("A current owner-approved five-platform package is required. Review it in Production first.");
  return pkg;
}
