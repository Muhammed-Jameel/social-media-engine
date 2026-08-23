import type { DatabaseClient, SqlRow } from "@aurendor/db/runtime";
import { AURENDOR_ORGANIZATION_ID } from "@aurendor/db/runtime";
import { enqueueWorkflow } from "./workflows";
import { nextMonth, planningDateForMonth } from "./state-machine";

export interface MonthlyTriggerDecision {
  localDate: string;
  currentMonth: string;
  targetMonth: string;
  planningDate: string;
  due: boolean;
  late: boolean;
}

function localDateParts(now: Date, timezone: string): { date: string; month: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value;
  const year = value("year");
  const month = value("month");
  const day = value("day");
  if (!year || !month || !day) throw new Error(`Unable to resolve local date for ${timezone}`);
  return { date: `${year}-${month}-${day}`, month: `${year}-${month}` };
}

export function monthlyTriggerDecision(input: {
  now: Date;
  timezone: string;
  leadDays?: number;
  targetMonth?: string;
}): MonthlyTriggerDecision {
  const local = localDateParts(input.now, input.timezone);
  const targetMonth = input.targetMonth ?? nextMonth(local.month);
  const planningDate = planningDateForMonth(targetMonth, input.leadDays ?? 5);
  return {
    localDate: local.date,
    currentMonth: local.month,
    targetMonth,
    planningDate,
    due: local.date >= planningDate,
    late: local.date >= `${targetMonth}-01`,
  };
}

function analysisWindows(now: Date): Record<string, { start: string; end: string }> {
  const end = now.toISOString();
  return Object.fromEntries(
    [30, 60, 90].map((days) => [
      `days${days}`,
      { start: new Date(now.getTime() - days * 86_400_000).toISOString(), end },
    ]),
  );
}

export async function ensureScheduledWork(
  database: DatabaseClient,
  now = new Date(),
): Promise<{ monthlyWorkflowId: string | null; analyticsWorkflowId: string | null }> {
  const settings = await database.query<SqlRow & { timezone: string; planning_lead_days: number; paused: boolean }>(
    `SELECT o.timezone, e.planning_lead_days, e.paused
     FROM organizations o JOIN engine_settings e ON e.organization_id = o.id
     WHERE o.id = $1`,
    [AURENDOR_ORGANIZATION_ID],
  );
  const row = settings.rows[0];
  if (!row) throw new Error("AURENDOR scheduling settings are not seeded.");
  if (row.paused) return { monthlyWorkflowId: null, analyticsWorkflowId: null };
  const decision = monthlyTriggerDecision({ now, timezone: row.timezone, leadDays: row.planning_lead_days });
  let monthlyWorkflowId: string | null = null;
  if (decision.due) {
    const existing = await database.query<SqlRow & { id: string }>(
      "SELECT id FROM monthly_strategies WHERE organization_id = $1 AND month = $2 LIMIT 1",
      [AURENDOR_ORGANIZATION_ID, decision.targetMonth],
    );
    if (!existing.rows[0]) {
      monthlyWorkflowId = await enqueueWorkflow(database, {
        type: "MONTHLY_PLAN",
        idempotencyKey: `monthly-plan:${AURENDOR_ORGANIZATION_ID}:${decision.targetMonth}`,
        payload: {
          targetMonth: decision.targetMonth,
          timezone: row.timezone,
          planningDate: decision.planningDate,
          triggeredAt: now.toISOString(),
          late: decision.late,
          analysisWindows: analysisWindows(now),
        },
      });
    }
  }
  const analyticsWorkflowId = await enqueueWorkflow(database, {
    type: "ANALYTICS",
    idempotencyKey: `analytics-daily:${AURENDOR_ORGANIZATION_ID}:${decision.localDate}`,
    payload: {
      localDate: decision.localDate,
      timezone: row.timezone,
      collectedAt: now.toISOString(),
      expectedMode: "capability-aware",
    },
  });
  return { monthlyWorkflowId, analyticsWorkflowId };
}
