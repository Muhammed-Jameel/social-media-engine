import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { AURENDOR_ORGANIZATION_ID, createDatabase, migrateDatabase, projectRoot } from "@aurendor/db";
import { isCreativeProductionPaused, isEnginePaused } from "../packages/db/src/ids";
import { advanceProduction, CampaignSlotSchema, canonicalSha256, importCampaignPlan, listProductionJobs, loadProductionJob, saveProductionJob, StageSubmissionSchema, verifyProductionBytes } from "@aurendor/engine";

const [command = "status", argument, artifactPath] = process.argv.slice(2);
const db = await createDatabase();
try {
  await migrateDatabase(db);
  if (command !== "status" && command !== "show") {
    const settings = await db.query<{ paused: boolean }>("SELECT paused FROM engine_settings WHERE organization_id=$1", [AURENDOR_ORGANIZATION_ID]);
    if (settings.rows[0]?.paused || isEnginePaused(process.env) || isCreativeProductionPaused(process.env)) throw new Error("Production is paused. Respect the owner's controls.");
  }
  if (command === "status") {
    console.log(JSON.stringify((await listProductionJobs(db)).map(j => ({ id: j.id, month: j.month, stage: j.stage, revision: j.revision, feedback: j.feedback, latestInputHash: j.history.length ? canonicalSha256(j.history.at(-1)) : null })), null, 2));
  } else if (command === "show" && argument) {
    console.log(JSON.stringify(await loadProductionJob(db, argument), null, 2));
  } else if (command === "retime" && argument && artifactPath) {
    const job = await loadProductionJob(db, argument);
    if (!job) throw new Error("Job not found.");
    const slot = CampaignSlotSchema.parse({ ...job.slot, scheduledAt: artifactPath });
    if (Date.parse(slot.scheduledAt) <= Date.now()) throw new Error("Choose a future time with enough production and review lead time.");
    const after = { ...job, slot, stage: "IDEA" as const, approval: null, revision: job.revision + 1, attempts: { idea: 0, copy: 0, design: 0 }, feedback: [...job.feedback, `Proposed shared time changed from ${job.slot.scheduledAt} to ${slot.scheduledAt}; fresh owner approval required.`] };
    await saveProductionJob(db, job, after);
    console.log({ id: after.id, stage: after.stage, proposedTime: slot.scheduledAt });
  } else if (command === "import-plan" && argument) {
    console.log(await importCampaignPlan(db, JSON.parse(await readFile(resolve(argument), "utf8"))));
  } else if (command === "import-current-plan") {
    const { septemberCreativePosts } = await import("../apps/web/src/lib/september-creative-plan");
    const tracks = { brand_intro: "announcement", ai_automation_service: "service", bunyan_pro: "product", value_first: "useful_tip" };
    console.log(await importCampaignPlan(db, {
      version: "campaign-production-v1", month: "2026-09", timezone: "Asia/Baghdad", launchMonth: true,
      rationale: "Preserve the owner's September plan, then independently evaluate and adapt each unfinished post for all five platforms.",
      sourceRefs: ["apps/web/src/lib/september-creative-plan.ts", "Owner direction 2026-09-08"],
      slots: septemberCreativePosts.map(p => ({ id: `active-plan-${p.key.toLowerCase()}`, title: p.title, audience: p.audience, objective: p.hook, track: tracks[p.contentTrack], format: p.format === "reel" ? "video" : "carousel", scheduledAt: p.publishAt, tension: p.hook, evidenceNeeded: p.sourceRefs })),
    }));
  } else if (command === "submit" && argument && artifactPath) {
    const job = await loadProductionJob(db, argument);
    if (!job) throw new Error("Production job not found.");
    const submission = StageSubmissionSchema.parse(JSON.parse(await readFile(resolve(artifactPath), "utf8")));
    if (submission.stage === "ASSETS") await verifyProductionBytes(projectRoot(), submission.body);
    const next = advanceProduction(job, submission);
    await saveProductionJob(db, job, next);
    console.log(JSON.stringify({ id: next.id, stage: next.stage, revision: next.revision }));
  } else {
    throw new Error("Usage: campaign:production status | show ID | import-current-plan | import-plan FILE | submit ID FILE | retime ID ISO_TIME. Owner approval is dashboard-only.");
  }
} finally { await db.close(); }
