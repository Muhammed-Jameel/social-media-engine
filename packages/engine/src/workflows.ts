import { randomUUID } from "node:crypto";
import { createLogger } from "@aurendor/observability";
import type { DatabaseClient, SqlRow } from "@aurendor/db/runtime";
import { AURENDOR_ORGANIZATION_ID } from "@aurendor/db/runtime";
import { EngineError, normalizeEngineError } from "./errors";

export const WORKFLOW_STEPS = {
  MONTHLY_PLAN: ["monthly-retrospective", "research", "strategy", "strategy-critique", "revision", "owner-review", "approved", "batch-production"],
  POST_PRODUCTION: ["brief", "research", "copy", "editorial-qa", "art-direction", "design", "render", "dual-critique", "policy-check", "schedule"],
  PUBLISH: ["preflight", "publish", "verify", "record-provider-id", "analytics-watch"],
  ANALYTICS: ["collect", "normalize", "snapshot", "enrich-features", "interpret"],
  RETROSPECTIVE: ["freeze-window", "aggregate", "analyze", "update-playbook", "propose-next-month"],
} as const;

export type WorkflowType = keyof typeof WORKFLOW_STEPS;

function workflowSteps(type: WorkflowType): Array<Record<string, unknown>> {
  return WORKFLOW_STEPS[type].map((name) => ({
    name,
    status: "PENDING",
    attempt: 0,
    maxAttempts: 3,
    startedAt: null,
    completedAt: null,
    nextAttemptAt: null,
    errorCode: null,
  }));
}

export async function enqueueWorkflow(
  database: DatabaseClient,
  input: { type: WorkflowType; idempotencyKey: string; payload: Record<string, unknown>; traceId?: string },
): Promise<string> {
  const id = randomUUID();
  const steps = workflowSteps(input.type);
  await database.query(
    `INSERT INTO workflow_runs (
       id, organization_id, type, status, idempotency_key, current_step, steps, input, output, trace_id, next_attempt_at
     ) VALUES ($1, $2, $3, 'PENDING', $4, $5, $6::jsonb, $7::jsonb, NULL, $8, now())
     ON CONFLICT (idempotency_key) DO NOTHING`,
    [id, AURENDOR_ORGANIZATION_ID, input.type, input.idempotencyKey, steps[0]?.name, JSON.stringify(steps), JSON.stringify(input.payload), input.traceId ?? randomUUID()],
  );
  const result = await database.query<SqlRow & { id: string }>("SELECT id FROM workflow_runs WHERE idempotency_key = $1", [input.idempotencyKey]);
  const stored = result.rows[0];
  if (!stored) throw new Error("Workflow enqueue failed.");
  return stored.id;
}

export interface ClaimedWorkflow {
  id: string;
  type: WorkflowType;
  currentStep: string;
  steps: Array<Record<string, unknown>>;
  input: Record<string, unknown>;
  traceId: string;
}

export interface WorkflowStepResult {
  output: Record<string, unknown>;
}

export type WorkflowStepExecutor = (input: {
  workflow: ClaimedWorkflow;
  step: string;
  database: DatabaseClient;
}) => Promise<WorkflowStepResult>;

export function retryDelayMs(attempt: number, seed = 0.5): number {
  const boundedAttempt = Math.max(1, Math.min(attempt, 8));
  const base = Math.min(15 * 60_000, 2 ** (boundedAttempt - 1) * 5_000);
  const jitter = Math.round(base * 0.25 * Math.max(0, Math.min(seed, 1)));
  return base + jitter;
}

const offlineExecutor: WorkflowStepExecutor = async ({ step }) => ({
  output: {
    step,
    mode: "offline-safe",
    externalMutation: false,
    note: "The durable step executed without a live provider. Provider-specific work requires an installed, verified adapter.",
  },
});

export async function claimNextWorkflow(database: DatabaseClient, workerId: string): Promise<ClaimedWorkflow | null> {
  const result = await database.query<SqlRow & {
    id: string;
    type: WorkflowType;
    current_step: string;
    steps: unknown;
    input: unknown;
    trace_id: string;
  }>(
    `UPDATE workflow_runs SET status = 'RUNNING', locked_at = now(), locked_by = $1, updated_at = now()
     WHERE id = (
       SELECT id FROM workflow_runs
       WHERE status IN ('PENDING', 'WAITING_FOR_RETRY')
         AND (next_attempt_at IS NULL OR next_attempt_at <= now())
         AND (locked_at IS NULL OR locked_at < now() - interval '10 minutes')
       ORDER BY created_at
       FOR UPDATE SKIP LOCKED
       LIMIT 1
     )
     RETURNING id, type, current_step, steps, input, trace_id`,
    [workerId],
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    id: row.id,
    type: row.type,
    currentStep: row.current_step,
    steps: typeof row.steps === "string" ? JSON.parse(row.steps) as Array<Record<string, unknown>> : row.steps as Array<Record<string, unknown>>,
    input: typeof row.input === "string" ? JSON.parse(row.input) as Record<string, unknown> : row.input as Record<string, unknown>,
    traceId: row.trace_id,
  };
}

export async function runWorkerOnce(
  database: DatabaseClient,
  workerId: string,
  executor: WorkflowStepExecutor = offlineExecutor,
): Promise<{ worked: boolean; workflowId?: string; status?: string }> {
  const settings = await database.query<SqlRow & { paused: boolean }>(
    "SELECT paused FROM engine_settings WHERE organization_id = $1",
    [AURENDOR_ORGANIZATION_ID],
  );
  if (settings.rows[0]?.paused) return { worked: false };
  const workflow = await claimNextWorkflow(database, workerId);
  if (!workflow) return { worked: false };
  const logger = createLogger({ subsystem: "workflow-worker", workflowId: workflow.id, traceId: workflow.traceId, workerId });
  const currentIndex = workflow.steps.findIndex((step) => step.name === workflow.currentStep);
  if (currentIndex < 0) throw new Error(`Current workflow step not found: ${workflow.currentStep}`);
  const startedAt = new Date().toISOString();
  const attempt = Number(workflow.steps[currentIndex]?.attempt ?? 0) + 1;
  if (workflow.currentStep === "owner-review") {
    const waitingSteps = workflow.steps.map((step, index) =>
      index === currentIndex ? { ...step, status: "WAITING_FOR_APPROVAL", attempt, startedAt, completedAt: null } : step,
    );
    await database.query(
      `UPDATE workflow_runs SET status = 'WAITING_FOR_APPROVAL', steps = $2::jsonb,
       locked_at = NULL, locked_by = NULL, next_attempt_at = NULL, updated_at = now() WHERE id = $1`,
      [workflow.id, JSON.stringify(waitingSteps)],
    );
    logger.info("Workflow is waiting for owner approval", { step: workflow.currentStep });
    return { worked: true, workflowId: workflow.id, status: "WAITING_FOR_APPROVAL" };
  }

  try {
    const stepResult = await executor({ workflow, step: workflow.currentStep, database });
    const completedAt = new Date().toISOString();
    const updatedSteps = workflow.steps.map((step, index) =>
      index === currentIndex ? { ...step, status: "SUCCEEDED", attempt, startedAt, completedAt, errorCode: null } : step,
    );
    const next = updatedSteps[currentIndex + 1]?.name;
    const complete = !next;
    await database.query(
      `UPDATE workflow_runs SET status = $2, current_step = $3, steps = $4::jsonb,
       output = CASE WHEN $2 = 'SUCCEEDED' THEN $5::jsonb ELSE output END,
       locked_at = NULL, locked_by = NULL, next_attempt_at = CASE WHEN $2 = 'PENDING' THEN now() ELSE NULL END,
       updated_at = now() WHERE id = $1`,
      [
        workflow.id,
        complete ? "SUCCEEDED" : "PENDING",
        next ?? workflow.currentStep,
        JSON.stringify(updatedSteps),
        JSON.stringify({ completedAt, lastStep: workflow.currentStep, ...stepResult.output }),
      ],
    );
    logger.info("Workflow step completed", { step: workflow.currentStep, nextStep: next ?? null, status: complete ? "SUCCEEDED" : "PENDING" });
    return { worked: true, workflowId: workflow.id, status: complete ? "SUCCEEDED" : "PENDING" };
  } catch (unknownError) {
    const error = normalizeEngineError(unknownError);
    const maxAttempts = Number(workflow.steps[currentIndex]?.maxAttempts ?? 3);
    const retrying = error.retryable && attempt < maxAttempts;
    const status = retrying ? "WAITING_FOR_RETRY" : "DEAD_LETTER";
    const delay = retryDelayMs(attempt, 0.5);
    const failedSteps = workflow.steps.map((step, index) =>
      index === currentIndex
        ? {
            ...step,
            status,
            attempt,
            startedAt,
            completedAt: retrying ? null : new Date().toISOString(),
            nextAttemptAt: retrying ? new Date(Date.now() + delay).toISOString() : null,
            errorCode: error.code,
          }
        : step,
    );
    await database.query(
      `WITH failed AS (
         UPDATE workflow_runs SET status = $2, steps = $3::jsonb, locked_at = NULL, locked_by = NULL,
           next_attempt_at = CASE WHEN $2 = 'WAITING_FOR_RETRY' THEN now() + ($4 * interval '1 millisecond') ELSE NULL END,
           output = $5::jsonb, updated_at = now() WHERE id = $1 RETURNING organization_id
       )
       INSERT INTO notifications (id, organization_id, kind, title, body, action_url, status)
       SELECT $6, organization_id, 'WORKFLOW_FAILURE', $7, $8, '/runs', 'UNREAD' FROM failed
       WHERE $2 = 'DEAD_LETTER' OR $9 = true`,
      [
        workflow.id,
        status,
        JSON.stringify(failedSteps),
        delay,
        JSON.stringify({ errorCode: error.code, retryable: error.retryable, ownerActionRequired: error.ownerActionRequired }),
        randomUUID(),
        status === "DEAD_LETTER" ? "Workflow requires attention" : "Provider action required",
        `${workflow.type}/${workflow.currentStep}: ${error.message}`,
        error.ownerActionRequired,
      ],
    );
    logger.error("Workflow step failed", { step: workflow.currentStep, errorCode: error.code, retrying, attempt, maxAttempts });
    return { worked: true, workflowId: workflow.id, status };
  }
}

export async function resumeWorkflowAfterApproval(
  database: DatabaseClient,
  input: { workflowId: string; actorId: string; approvalRef: string },
): Promise<void> {
  const result = await database.query<SqlRow & { steps: unknown; current_step: string; organization_id: string; trace_id: string }>(
    `SELECT steps, current_step, organization_id, trace_id FROM workflow_runs
     WHERE id = $1 AND status = 'WAITING_FOR_APPROVAL' FOR UPDATE`,
    [input.workflowId],
  );
  const row = result.rows[0];
  if (!row) throw new EngineError({ code: "APPROVAL_REQUIRED", message: "Workflow is not waiting for approval.", ownerActionRequired: true });
  const steps = typeof row.steps === "string" ? JSON.parse(row.steps) as Array<Record<string, unknown>> : row.steps as Array<Record<string, unknown>>;
  const currentIndex = steps.findIndex((step) => step.name === row.current_step);
  if (currentIndex < 0 || row.current_step !== "owner-review") throw new Error("Approval workflow state is inconsistent.");
  const completedAt = new Date().toISOString();
  const updated = steps.map((step, index) => index === currentIndex ? { ...step, status: "SUCCEEDED", completedAt } : step);
  const next = updated[currentIndex + 1]?.name;
  if (!next) throw new Error("Approval workflow has no continuation step.");
  await database.query(
    `WITH resumed AS (
       UPDATE workflow_runs SET status = 'PENDING', current_step = $2, steps = $3::jsonb,
         next_attempt_at = now(), updated_at = now() WHERE id = $1 RETURNING organization_id
     )
     INSERT INTO audit_logs (
       id, organization_id, actor_id, action, entity_type, entity_id, previous_state,
       new_state, reason, trace_id
     ) SELECT $4, organization_id, $5, 'RESUME_AFTER_APPROVAL', 'workflow_run', $1,
       jsonb_build_object('status', 'WAITING_FOR_APPROVAL'),
       jsonb_build_object('status', 'PENDING', 'nextStep', $2), $6, $7 FROM resumed`,
    [input.workflowId, next, JSON.stringify(updated), randomUUID(), input.actorId, input.approvalRef, row.trace_id],
  );
}
