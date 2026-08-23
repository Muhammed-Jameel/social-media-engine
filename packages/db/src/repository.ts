import { randomUUID } from "node:crypto";
import type { ApprovalDecision, OwnerCommand } from "@aurendor/schemas";
import type { DatabaseClient, SqlRow } from "./client";
import { getDatabase } from "./client";
import { AURENDOR_ORGANIZATION_ID, AURENDOR_OWNER_ID } from "./ids";

export interface EngineSettingsView {
  dryRun: boolean;
  productionPublishingEnabled: boolean;
  paused: boolean;
  environmentPauseRequested: boolean;
  autonomyStage: string;
  planningLeadDays: number;
}

export interface ContentSummaryView {
  id: string;
  externalKey: string;
  title: string;
  scheduledAt: string;
  platforms: string[];
  format: string;
  status: string;
  riskLevel: string;
  approvalClass: string;
  qaFlags: string[];
  thumbnailUrl: string | null;
}

export interface DashboardView {
  settings: EngineSettingsView;
  strategy: {
    id: string;
    month: string;
    objective: string;
    status: string;
    itemCount: number;
    approvedCount: number;
    needsReviewCount: number;
  };
  counts: {
    content: number;
    approved: number;
    highRisk: number;
    providerActions: number;
  };
  upcoming: ContentSummaryView[];
  providers: ProviderCapabilityView[];
  insights: InsightView[];
  notifications: NotificationView[];
}

export interface ProviderCapabilityView {
  id: string;
  provider: string;
  capability: string;
  state: string;
  reason: string;
  sourceUrl: string | null;
  verifiedAt: string | null;
}

export interface InsightView {
  id: string;
  kind: string;
  statement: string;
  confidenceNote: string;
  nextAction: string;
}

export interface NotificationView {
  id: string;
  kind: string;
  title: string;
  body: string;
  actionUrl: string | null;
  status: string;
}

export interface ContentDetailView extends ContentSummaryView {
  audience: string;
  funnelStage: string;
  contentPillar: string;
  strategicObjective: string;
  tension: string;
  keyMessage: string;
  creativeHypothesis: string;
  cta: string;
  kpiHierarchy: string[];
  sourcePath: string | null;
  assets: Array<{
    id: string;
    publicUrl: string | null;
    mimeType: string;
    width: number;
    height: number;
    sha256: string;
    sequence: number;
    sourcePath: string | null;
  }>;
  copyVariants: Array<{
    id: string;
    platform: string;
    language: string;
    caption: string;
    altText: string;
    hashtags: string[];
    editorialScore: number;
  }>;
  critiques: Array<{
    id: string;
    critic: string;
    total: number;
    hardFails: string[];
    strengths: string[];
    weaknesses: string[];
    decision: string;
  }>;
  approvals: Array<{
    id: string;
    actorId: string;
    decision: string;
    reasonCodes: string[];
    feedback: string;
    decidedAt: string;
  }>;
}

export interface AnalyticsView {
  isDemo: boolean;
  window: string;
  primaryMetrics: Array<{ label: string; value: number; delta: number | null; unit: string }>;
  series: Array<{ date: string; qualifiedReach: number; saves: number; shares: number; profileVisits: number }>;
  cohorts: Array<{ label: string; posts: number; saveRate: number; shareRate: number; confidence: string }>;
  insights: InsightView[];
}

function parseJson<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

function iso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return new Date(String(value)).toISOString();
}

interface SettingsRow extends SqlRow {
  dry_run: boolean;
  production_publishing_enabled: boolean;
  paused: boolean;
  autonomy_stage: string;
  planning_lead_days: number;
}

export class ContentOsRepository {
  constructor(private readonly database: DatabaseClient) {}

  async getSettings(): Promise<EngineSettingsView> {
    const result = await this.database.query<SettingsRow>(
      `SELECT dry_run, production_publishing_enabled, paused, autonomy_stage, planning_lead_days
       FROM engine_settings WHERE organization_id = $1`,
      [AURENDOR_ORGANIZATION_ID],
    );
    const row = result.rows[0];
    if (!row) throw new Error("AURENDOR engine settings have not been seeded.");
    const environmentPauseRequested = process.env.AURENDOR_ENGINE_PAUSED === "true";
    return {
      dryRun: row.dry_run,
      productionPublishingEnabled: row.production_publishing_enabled,
      paused: row.paused || environmentPauseRequested,
      environmentPauseRequested,
      autonomyStage: row.autonomy_stage,
      planningLeadDays: row.planning_lead_days,
    };
  }

  async listContent(filters: { status?: string; platform?: string; month?: string } = {}): Promise<ContentSummaryView[]> {
    const parameters: unknown[] = [AURENDOR_ORGANIZATION_ID];
    const predicates = ["c.organization_id = $1"];
    if (filters.status) {
      parameters.push(filters.status);
      predicates.push(`c.status = $${parameters.length}`);
    }
    if (filters.month) {
      parameters.push(filters.month);
      predicates.push(`c.month = $${parameters.length}`);
    }
    if (filters.platform) {
      parameters.push(JSON.stringify([filters.platform]));
      predicates.push(`c.platforms @> $${parameters.length}::jsonb`);
    }
    const result = await this.database.query<SqlRow & {
      id: string;
      external_key: string;
      title: string;
      scheduled_at: unknown;
      platforms: unknown;
      format: string;
      status: string;
      risk_level: string;
      approval_class: string;
      qa_flags: unknown;
      thumbnail_url: string | null;
    }>(
      `SELECT c.id, c.external_key, c.title, c.scheduled_at, c.platforms, c.format, c.status,
              c.risk_level, c.approval_class, c.qa_flags,
              (SELECT ra.public_url FROM rendered_assets ra WHERE ra.content_item_id = c.id ORDER BY ra.sequence LIMIT 1) AS thumbnail_url
       FROM content_items c
       WHERE ${predicates.join(" AND ")}
       ORDER BY c.scheduled_at, c.external_key`,
      parameters,
    );
    return result.rows.map((row) => ({
      id: row.id,
      externalKey: row.external_key,
      title: row.title,
      scheduledAt: iso(row.scheduled_at),
      platforms: parseJson<string[]>(row.platforms, []),
      format: row.format,
      status: row.status,
      riskLevel: row.risk_level,
      approvalClass: row.approval_class,
      qaFlags: parseJson<string[]>(row.qa_flags, []),
      thumbnailUrl: row.thumbnail_url,
    }));
  }

  async getDashboard(): Promise<DashboardView> {
    const [settings, content, capabilities, insights, notifications, strategyResult] = await Promise.all([
      this.getSettings(),
      this.listContent({ month: "2026-09" }),
      this.listProviderCapabilities(),
      this.listInsights(),
      this.listNotifications(),
      this.database.query<SqlRow & { id: string; month: string; objective: string; status: string }>(
        `SELECT id, month, objective, status FROM monthly_strategies
         WHERE organization_id = $1 ORDER BY month DESC LIMIT 1`,
        [AURENDOR_ORGANIZATION_ID],
      ),
    ]);
    const strategy = strategyResult.rows[0];
    if (!strategy) throw new Error("No monthly strategy is available.");
    const approvedCount = content.filter((item) => ["APPROVED", "SCHEDULED", "PUBLISHED"].includes(item.status)).length;
    const needsReviewCount = content.filter((item) => ["NEEDS_REVIEW", "REVISION_REQUESTED"].includes(item.status)).length;
    return {
      settings,
      strategy: {
        id: strategy.id,
        month: strategy.month,
        objective: strategy.objective,
        status: strategy.status,
        itemCount: content.length,
        approvedCount,
        needsReviewCount,
      },
      counts: {
        content: content.length,
        approved: approvedCount,
        highRisk: content.filter((item) => ["high", "critical"].includes(item.riskLevel)).length,
        providerActions: capabilities.filter((item) => item.state !== "AVAILABLE").length,
      },
      upcoming: content.slice(0, 8),
      providers: capabilities,
      insights,
      notifications,
    };
  }

  async getContentDetail(id: string): Promise<ContentDetailView | null> {
    const itemResult = await this.database.query<SqlRow & {
      id: string;
      external_key: string;
      title: string;
      scheduled_at: unknown;
      platforms: unknown;
      format: string;
      status: string;
      risk_level: string;
      approval_class: string;
      qa_flags: unknown;
      audience: string;
      funnel_stage: string;
      content_pillar: string;
      strategic_objective: string;
      tension: string;
      key_message: string;
      creative_hypothesis: string;
      cta: string;
      kpi_hierarchy: unknown;
      source_path: string | null;
    }>("SELECT * FROM content_items WHERE id = $1 AND organization_id = $2", [id, AURENDOR_ORGANIZATION_ID]);
    const row = itemResult.rows[0];
    if (!row) return null;
    const [assetResult, copyResult, critiqueResult, approvalResult] = await Promise.all([
      this.database.query<SqlRow & { id: string; public_url: string | null; mime_type: string; width: number; height: number; sha256: string; sequence: number; source_path: string | null }>(
        "SELECT id, public_url, mime_type, width, height, sha256, sequence, source_path FROM rendered_assets WHERE content_item_id = $1 ORDER BY sequence",
        [id],
      ),
      this.database.query<SqlRow & { id: string; platform: string; language: string; caption: string; alt_text: string; hashtags: unknown; editorial_score: number }>(
        "SELECT id, platform, language, caption, alt_text, hashtags, editorial_score FROM copy_variants WHERE content_item_id = $1 ORDER BY platform",
        [id],
      ),
      this.database.query<SqlRow & { id: string; critic: string; total: number; hard_fails: unknown; strengths: unknown; weaknesses: unknown; decision: string }>(
        `SELECT cr.id, cr.critic, cr.total, cr.hard_fails, cr.strengths, cr.weaknesses, cr.decision
         FROM critiques cr JOIN rendered_assets ra ON ra.id = cr.rendered_asset_id
         WHERE ra.content_item_id = $1 ORDER BY cr.created_at DESC`,
        [id],
      ),
      this.database.query<SqlRow & { id: string; actor_id: string; decision: string; reason_codes: unknown; feedback: string; decided_at: unknown }>(
        "SELECT id, actor_id, decision, reason_codes, feedback, decided_at FROM approvals WHERE content_item_id = $1 ORDER BY decided_at DESC",
        [id],
      ),
    ]);

    return {
      id: row.id,
      externalKey: row.external_key,
      title: row.title,
      scheduledAt: iso(row.scheduled_at),
      platforms: parseJson<string[]>(row.platforms, []),
      format: row.format,
      status: row.status,
      riskLevel: row.risk_level,
      approvalClass: row.approval_class,
      qaFlags: parseJson<string[]>(row.qa_flags, []),
      thumbnailUrl: assetResult.rows[0]?.public_url ?? null,
      audience: row.audience,
      funnelStage: row.funnel_stage,
      contentPillar: row.content_pillar,
      strategicObjective: row.strategic_objective,
      tension: row.tension,
      keyMessage: row.key_message,
      creativeHypothesis: row.creative_hypothesis,
      cta: row.cta,
      kpiHierarchy: parseJson<string[]>(row.kpi_hierarchy, []),
      sourcePath: row.source_path,
      assets: assetResult.rows.map((asset) => ({
        id: asset.id,
        publicUrl: asset.public_url,
        mimeType: asset.mime_type,
        width: asset.width,
        height: asset.height,
        sha256: asset.sha256,
        sequence: asset.sequence,
        sourcePath: asset.source_path,
      })),
      copyVariants: copyResult.rows.map((copy) => ({
        id: copy.id,
        platform: copy.platform,
        language: copy.language,
        caption: copy.caption,
        altText: copy.alt_text,
        hashtags: parseJson<string[]>(copy.hashtags, []),
        editorialScore: Number(copy.editorial_score),
      })),
      critiques: critiqueResult.rows.map((critique) => ({
        id: critique.id,
        critic: critique.critic,
        total: Number(critique.total),
        hardFails: parseJson<string[]>(critique.hard_fails, []),
        strengths: parseJson<string[]>(critique.strengths, []),
        weaknesses: parseJson<string[]>(critique.weaknesses, []),
        decision: critique.decision,
      })),
      approvals: approvalResult.rows.map((approval) => ({
        id: approval.id,
        actorId: approval.actor_id,
        decision: approval.decision,
        reasonCodes: parseJson<string[]>(approval.reason_codes, []),
        feedback: approval.feedback,
        decidedAt: iso(approval.decided_at),
      })),
    };
  }

  async recordApproval(decision: ApprovalDecision): Promise<void> {
    const nextStatus = {
      APPROVE: "APPROVED",
      REQUEST_REVISION: "REVISION_REQUESTED",
      REJECT: "BLOCKED",
      DISABLE: "CANCELLED",
    }[decision.decision];
    const auditId = randomUUID();
    await this.database.query(
      `WITH prior AS (
         SELECT status FROM content_items WHERE id = $1 AND organization_id = $2
       ), updated AS (
         UPDATE content_items SET status = $3, updated_at = now()
         WHERE id = $1 AND organization_id = $2 RETURNING id, status
       ), approval AS (
         INSERT INTO approvals (id, content_item_id, actor_id, decision, reason_codes, feedback, trace_id, decided_at)
         VALUES ($4, $1, $5, $6, $7::jsonb, $8, $9, $10) RETURNING id
       )
       INSERT INTO audit_logs (
         id, organization_id, actor_id, action, entity_type, entity_id, previous_state, new_state, reason, trace_id
       ) VALUES ($11, $2, $5, 'REVIEW_CONTENT', 'content_item', $1,
         jsonb_build_object('status', (SELECT status FROM prior)),
         jsonb_build_object('status', (SELECT status FROM updated)), $8, $9)`,
      [
        decision.contentItemId,
        AURENDOR_ORGANIZATION_ID,
        nextStatus,
        decision.id,
        decision.actorId,
        decision.decision,
        JSON.stringify(decision.reasonCodes),
        decision.feedback,
        decision.traceId,
        decision.decidedAt,
        auditId,
      ],
    );
  }

  async approveMonth(strategyId: string, feedback: string): Promise<void> {
    const traceId = randomUUID();
    await this.database.query(
      `WITH strategy AS (
         UPDATE monthly_strategies SET status = 'APPROVED', updated_at = now()
         WHERE id = $1 AND organization_id = $2 RETURNING id
       ), items AS (
         UPDATE content_items SET status = 'APPROVED', updated_at = now()
         WHERE strategy_id = $1 AND approval_class = 'MONTHLY_APPROVAL'
           AND status = 'NEEDS_REVIEW' AND risk_level NOT IN ('high', 'critical')
         RETURNING id
       )
       INSERT INTO audit_logs (id, organization_id, actor_id, action, entity_type, entity_id, previous_state, new_state, reason, trace_id)
       VALUES ($3, $2, $4, 'APPROVE_MONTH', 'monthly_strategy', $1, jsonb_build_object('status', 'IN_REVIEW'),
               jsonb_build_object('status', 'APPROVED', 'approvedItems', (SELECT count(*) FROM items)), $5, $6)`,
      [strategyId, AURENDOR_ORGANIZATION_ID, randomUUID(), AURENDOR_OWNER_ID, feedback || "Owner approved the monthly strategy.", traceId],
    );
  }

  async setPaused(paused: boolean, reason: string): Promise<void> {
    const traceId = randomUUID();
    await this.database.query(
      `WITH prior AS (
         SELECT paused FROM engine_settings WHERE organization_id = $1
       ), changed AS (
         UPDATE engine_settings SET paused = $2, updated_at = now() WHERE organization_id = $1 RETURNING paused
       )
       INSERT INTO audit_logs (id, organization_id, actor_id, action, entity_type, entity_id, previous_state, new_state, reason, trace_id)
       VALUES ($3, $1, $4, $5, 'engine_settings', $1,
         jsonb_build_object('paused', (SELECT paused FROM prior)),
         jsonb_build_object('paused', (SELECT paused FROM changed)), $6, $7)`,
      [AURENDOR_ORGANIZATION_ID, paused, randomUUID(), AURENDOR_OWNER_ID, paused ? "PAUSE_ENGINE" : "RESUME_ENGINE", reason, traceId],
    );
  }

  async recordOwnerCommand(
    command: OwnerCommand,
    options: { actorId?: string; confirmed?: boolean } = {},
  ): Promise<string> {
    const id = randomUUID();
    const actorId = options.actorId ?? AURENDOR_OWNER_ID;
    const confirmed = !command.requiresConfirmation || options.confirmed === true;
    await this.database.query(
      `INSERT INTO owner_commands (
         id, organization_id, actor_id, command, scope, classification,
         proposed_change, requires_confirmation, confirmed_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, CASE WHEN $9 THEN now() ELSE NULL END)`,
      [
        id,
        AURENDOR_ORGANIZATION_ID,
        actorId,
        command.command,
        command.scope,
        command.classification,
        JSON.stringify(command.proposedChange),
        command.requiresConfirmation,
        confirmed,
      ],
    );
    await this.database.query(
      `INSERT INTO audit_logs (
         id, organization_id, actor_id, action, entity_type, entity_id,
         previous_state, new_state, reason, trace_id
       ) VALUES ($1, $2, $3, 'RECORD_OWNER_COMMAND', 'owner_command', $4, NULL,
         $5::jsonb, $6, $7)`,
      [
        randomUUID(),
        AURENDOR_ORGANIZATION_ID,
        actorId,
        id,
        JSON.stringify({ scope: command.scope, classification: command.classification, confirmed }),
        command.command,
        randomUUID(),
      ],
    );
    if (confirmed && command.classification === "PAUSE_PUBLISHING") {
      await this.setPaused(true, command.command);
    }
    if (confirmed && command.classification === "RESUME_PUBLISHING") {
      await this.setPaused(false, command.command);
    }
    return id;
  }

  async listProviderCapabilities(): Promise<ProviderCapabilityView[]> {
    const result = await this.database.query<SqlRow & { id: string; provider: string; capability: string; state: string; reason: string; source_url: string | null; verified_at: unknown | null }>(
      `SELECT id, provider, capability, state, reason, source_url, verified_at
       FROM provider_capabilities WHERE organization_id = $1 ORDER BY provider, capability`,
      [AURENDOR_ORGANIZATION_ID],
    );
    return result.rows.map((row) => ({
      id: row.id,
      provider: row.provider,
      capability: row.capability,
      state: row.state,
      reason: row.reason,
      sourceUrl: row.source_url,
      verifiedAt: row.verified_at ? iso(row.verified_at) : null,
    }));
  }

  async listInsights(): Promise<InsightView[]> {
    const result = await this.database.query<SqlRow & { id: string; kind: string; statement: string; confidence_note: string; next_action: string }>(
      `SELECT id, kind, statement, confidence_note, next_action FROM insights
       WHERE organization_id = $1 ORDER BY created_at DESC LIMIT 8`,
      [AURENDOR_ORGANIZATION_ID],
    );
    return result.rows.map((row) => ({
      id: row.id,
      kind: row.kind,
      statement: row.statement,
      confidenceNote: row.confidence_note,
      nextAction: row.next_action,
    }));
  }

  async listNotifications(): Promise<NotificationView[]> {
    const result = await this.database.query<SqlRow & { id: string; kind: string; title: string; body: string; action_url: string | null; status: string }>(
      `SELECT id, kind, title, body, action_url, status FROM notifications
       WHERE organization_id = $1 AND status IN ('UNREAD', 'SENT') ORDER BY created_at DESC LIMIT 8`,
      [AURENDOR_ORGANIZATION_ID],
    );
    return result.rows.map((row) => ({ id: row.id, kind: row.kind, title: row.title, body: row.body, actionUrl: row.action_url, status: row.status }));
  }

  async getAnalytics(): Promise<AnalyticsView> {
    const insights = await this.listInsights();
    return {
      isDemo: true,
      window: "Synthetic 8-week demonstration — no production posts published",
      primaryMetrics: [
        { label: "Qualified reach", value: 18_420, delta: 0.18, unit: "people" },
        { label: "Save rate", value: 0.041, delta: 0.007, unit: "rate" },
        { label: "Share rate", value: 0.026, delta: 0.004, unit: "rate" },
        { label: "Qualified messages", value: 37, delta: null, unit: "messages" },
      ],
      series: [
        { date: "2026-07-06", qualifiedReach: 1320, saves: 42, shares: 21, profileVisits: 79 },
        { date: "2026-07-13", qualifiedReach: 1780, saves: 55, shares: 33, profileVisits: 102 },
        { date: "2026-07-20", qualifiedReach: 2010, saves: 81, shares: 49, profileVisits: 121 },
        { date: "2026-07-27", qualifiedReach: 2240, saves: 93, shares: 55, profileVisits: 135 },
        { date: "2026-08-03", qualifiedReach: 2490, saves: 104, shares: 61, profileVisits: 148 },
        { date: "2026-08-10", qualifiedReach: 2670, saves: 119, shares: 72, profileVisits: 159 },
        { date: "2026-08-17", qualifiedReach: 2910, saves: 132, shares: 81, profileVisits: 177 },
        { date: "2026-08-24", qualifiedReach: 3000, saves: 143, shares: 93, profileVisits: 188 },
      ],
      cohorts: [
        { label: "Arabic technical carousels", posts: 8, saveRate: 0.052, shareRate: 0.034, confidence: "Directional demo only" },
        { label: "Single product posts", posts: 6, saveRate: 0.019, shareRate: 0.012, confidence: "Directional demo only" },
        { label: "Brand authority posts", posts: 4, saveRate: 0.033, shareRate: 0.027, confidence: "Directional demo only" },
      ],
      insights,
    };
  }
}

export async function getRepository(): Promise<ContentOsRepository> {
  return new ContentOsRepository(await getDatabase());
}
