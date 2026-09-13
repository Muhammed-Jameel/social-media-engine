import { randomUUID } from "node:crypto";
import { SOCIAL_MEDIA_PLUGIN_ORGANIZATION_ID, type DatabaseClient } from "@social-media-plugin/db/runtime";
import { CampaignPlanSchema, ProductionJobSchema, newProductionJob, type ProductionJob } from "./campaign-production";
import { canonicalSha256 } from "./evidence";

async function audit(db: DatabaseClient, id: string, actor: string, before: unknown, after: unknown): Promise<void> {
  await db.query(`INSERT INTO audit_logs (id,organization_id,actor_id,action,entity_type,entity_id,previous_state,new_state,reason,trace_id)
    VALUES ($1,$2,$3,'CAMPAIGN_PRODUCTION','content_item',$4,$5::jsonb,$6::jsonb,'Versioned production transition',$7)`,
  [randomUUID(), SOCIAL_MEDIA_PLUGIN_ORGANIZATION_ID, actor, id, JSON.stringify(before), JSON.stringify(after), randomUUID()]);
}

export async function loadProductionJob(db: DatabaseClient, id: string): Promise<ProductionJob | null> {
  const { rows } = await db.query<{ body: unknown }>("SELECT body FROM campaign_production_jobs WHERE id=$1 AND organization_id=$2", [id, SOCIAL_MEDIA_PLUGIN_ORGANIZATION_ID]);
  return rows[0] ? ProductionJobSchema.parse(rows[0].body) : null;
}
export async function listProductionJobs(db: DatabaseClient): Promise<ProductionJob[]> {
  const { rows } = await db.query<{ body: unknown }>("SELECT body FROM campaign_production_jobs WHERE organization_id=$1 ORDER BY month,id", [SOCIAL_MEDIA_PLUGIN_ORGANIZATION_ID]);
  return rows.map(row => ProductionJobSchema.parse(row.body));
}
export async function saveProductionJob(db: DatabaseClient, before: ProductionJob, after: ProductionJob, actor = "codex-production"): Promise<void> {
  ProductionJobSchema.parse(after);
  if (after.id !== before.id || after.revision !== before.revision + 1) throw new Error("Invalid production revision.");
  await db.transaction(async tx => {
    await tx.query("SELECT id FROM campaign_production_jobs WHERE id=$1 AND organization_id=$2 FOR UPDATE", [before.id, SOCIAL_MEDIA_PLUGIN_ORGANIZATION_ID]);
    // Never change an already dispatched package behind the scheduler's back.
    const dispatched = await tx.query("SELECT id FROM postiz_publication_batches WHERE content_item_id=$1 AND mode<>'draft' LIMIT 1", [before.id]);
    if (dispatched.rows.length) throw new Error("A publication intent exists. Reconcile/cancel it before changing the package; do not duplicate it.");
    const result = await tx.query(`UPDATE campaign_production_jobs SET body=$1::jsonb, revision=$2,stage=$3,updated_at=now()
      WHERE id=$4 AND organization_id=$5 AND revision=$6`, [JSON.stringify(after), after.revision, after.stage, after.id, SOCIAL_MEDIA_PLUGIN_ORGANIZATION_ID, before.revision]);
    if (result.rowCount !== 1) throw new Error("Production changed concurrently. Reload before retrying.");
    await tx.query("UPDATE content_items SET status=$1,scheduled_at=$4,updated_at=now() WHERE id=$2 AND organization_id=$3", [after.stage === "APPROVED" ? "APPROVED" : after.stage === "OWNER_REVIEW" ? "NEEDS_REVIEW" : "DRAFT", after.id, SOCIAL_MEDIA_PLUGIN_ORGANIZATION_ID, after.slot.scheduledAt]);
    await audit(tx, after.id, actor, { revision: before.revision, stage: before.stage }, { revision: after.revision, stage: after.stage, approval: after.approval, feedback: after.feedback });
  });
}

/** Idempotent, insert-only import. Never supersedes the owner's existing monthly plan. */
export async function importCampaignPlan(db: DatabaseClient, raw: unknown): Promise<{ created: boolean; count: number }> {
  const plan = CampaignPlanSchema.parse(raw);
  const planHash = canonicalSha256(plan);
  return db.transaction(async tx => {
    const inserted = await tx.query(`INSERT INTO campaign_production_plans (organization_id,month,plan_hash,body)
      VALUES ($1,$2,$3,$4::jsonb) ON CONFLICT DO NOTHING RETURNING month`, [SOCIAL_MEDIA_PLUGIN_ORGANIZATION_ID, plan.month, planHash, JSON.stringify(plan)]);
    if (!inserted.rowCount) {
      const existing = await tx.query<{ plan_hash: string }>("SELECT plan_hash FROM campaign_production_plans WHERE organization_id=$1 AND month=$2", [SOCIAL_MEDIA_PLUGIN_ORGANIZATION_ID, plan.month]);
      if (existing.rows[0]?.plan_hash !== planHash) throw new Error("A different monthly production plan already exists. Do not overwrite it.");
      return { created: false, count: plan.slots.length };
    }
    await tx.query(`INSERT INTO monthly_strategies (id,organization_id,month,objective,business_priorities,narrative_arc,target_audiences,pillar_mix,cadence,primary_kpis,experiment_allocation,status,analysis_window,artifact_envelope)
      VALUES ($1,$2,$3,$4,'[]','[]','[]','{}','{}','[]',0,'DRAFT','{}',$5::jsonb) ON CONFLICT (organization_id,month) DO NOTHING`,
    [`campaign-${plan.month}`, SOCIAL_MEDIA_PLUGIN_ORGANIZATION_ID, plan.month, plan.rationale, JSON.stringify({ source: "campaign-production-v1", planHash })]);
    const strategy = await tx.query<{ id: string }>("SELECT id FROM monthly_strategies WHERE organization_id=$1 AND month=$2", [SOCIAL_MEDIA_PLUGIN_ORGANIZATION_ID, plan.month]);
    for (const slot of plan.slots) {
      const prior = await tx.query<{ month: string; scheduled_at: Date | string }>("SELECT month,scheduled_at FROM content_items WHERE id=$1 AND organization_id=$2", [slot.id, SOCIAL_MEDIA_PLUGIN_ORGANIZATION_ID]);
      if (prior.rows[0] && (prior.rows[0].month !== plan.month || new Date(prior.rows[0].scheduled_at).getTime() !== Date.parse(slot.scheduledAt))) throw new Error("Existing item does not match this plan's month and time.");
      await tx.query(`INSERT INTO content_items (id,organization_id,strategy_id,external_key,month,title,strategic_objective,audience,funnel_stage,content_pillar,tension,key_message,perception_shift,format,platforms,language,hook_hypothesis,creative_hypothesis,proof_requirements,cta,kpi_hierarchy,scheduled_at,timezone,status,approval_class,risk_level,risk_reasons,related_prior_post_ids,anti_repetition_score,artifact_envelope)
        VALUES ($1,$2,$3,$1,$4,$5,$6,$7,'awareness',$8,$9,'Pending idea review','Pending idea review',$10,$11::jsonb,'ar','Pending idea review','Pending art direction',$12::jsonb,'Pending editorial review','[]',$13,'Asia/Baghdad','DRAFT','ITEM_APPROVAL','low','[]','[]',0,$14::jsonb) ON CONFLICT (id) DO NOTHING`,
      [slot.id, SOCIAL_MEDIA_PLUGIN_ORGANIZATION_ID, strategy.rows[0]!.id, plan.month, slot.title, slot.objective, slot.audience, slot.track, slot.tension, slot.format === "video" ? "reel" : "carousel", JSON.stringify(["instagram", "facebook", "tiktok", "x", "linkedin"]), JSON.stringify(slot.evidenceNeeded), slot.scheduledAt, JSON.stringify({ source: "campaign-production-v1", planHash })]);
      const job = newProductionJob(plan.month, slot);
      await tx.query("INSERT INTO campaign_production_jobs (id,organization_id,month,revision,stage,body) VALUES ($1,$2,$3,0,'IDEA',$4::jsonb)", [job.id, SOCIAL_MEDIA_PLUGIN_ORGANIZATION_ID, plan.month, JSON.stringify(job)]);
      await audit(tx, job.id, "codex-production", null, { stage: "IDEA", planHash });
    }
    return { created: true, count: plan.slots.length };
  });
}
