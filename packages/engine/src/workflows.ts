import { randomUUID } from "node:crypto";
import { createLogger } from "@social-media-plugin/observability";
import type { DatabaseClient, SqlRow } from "@social-media-plugin/db/runtime";
import { SOCIAL_MEDIA_PLUGIN_ORGANIZATION_ID } from "@social-media-plugin/db/runtime";
import { canonicalSha256, computePostProductionApprovalBinding } from "./evidence";
import { EngineError, normalizeEngineError } from "./errors";

export const WORKFLOW_STEPS = {
  MONTHLY_PLAN: ["monthly-retrospective", "research", "strategy", "strategy-critique", "revision", "owner-review", "approved", "batch-production"],
  POST_PRODUCTION: [
    "brief",
    "research",
    "copy",
    "editorial-qa",
    "design-intelligence-retrieval",
    "concept-tournament",
    "art-direction-selection",
    "asset-production",
    "render-original-and-mobile",
    "technical-preflight",
    "independent-pixel-critics",
    "professional-anchor-comparison",
    "originality-review",
    "feed-coherence",
    "policy-check",
    "owner-review",
    "schedule",
  ],
  PUBLISH: ["preflight", "publish", "verify", "record-provider-id", "analytics-watch"],
  ANALYTICS: ["collect", "normalize", "snapshot", "enrich-features", "interpret"],
  RETROSPECTIVE: ["freeze-window", "aggregate", "analyze", "update-playbook", "propose-next-month"],
} as const;

export type WorkflowType = keyof typeof WORKFLOW_STEPS;

const SHA256_PATTERN = /^[a-f0-9]{64}$/u;

export interface ResumeWorkflowAfterApprovalInput {
  workflowId: string;
  actorId: string;
  approvalRef: string;
  renderedAssetSha256?: string;
  pixelEvidenceSha256?: string;
  policyEvidenceSha256?: string;
}

interface VerifiedPostProductionApprovalEvidence {
  renderedAssetSha256: string;
  pixelEvidenceSha256: string;
  policyEvidenceSha256: string;
  approvalBindingSha256: string;
}

function approvalRequired(message: string, details: Record<string, unknown> = {}): EngineError {
  return new EngineError({
    code: "APPROVAL_REQUIRED",
    message,
    ownerActionRequired: true,
    details,
  });
}

function evidenceRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw approvalRequired(`${label} is missing or malformed.`);
  }
  return value as Record<string, unknown>;
}

function storedOutputRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "string") return evidenceRecord(value, "Workflow evidence");
  try {
    return evidenceRecord(JSON.parse(value) as unknown, "Workflow evidence");
  } catch (error) {
    if (error instanceof EngineError) throw error;
    throw approvalRequired("Workflow evidence is not valid JSON.");
  }
}

function pixelManifestArtifact(value: unknown, expectedScale: "original" | "mobile"): Record<string, unknown> {
  const artifact = evidenceRecord(value, `${expectedScale} pixel evidence`);
  if (
    artifact["scale"] !== expectedScale
    || typeof artifact["mimeType"] !== "string"
    || !Number.isInteger(artifact["width"])
    || !Number.isInteger(artifact["height"])
    || typeof artifact["sha256"] !== "string"
    || !SHA256_PATTERN.test(artifact["sha256"])
    || typeof artifact["sourceAssetSha256"] !== "string"
    || !SHA256_PATTERN.test(artifact["sourceAssetSha256"])
  ) {
    throw approvalRequired(`${expectedScale} pixel evidence is incomplete or invalid.`);
  }
  return {
    scale: artifact["scale"],
    mimeType: artifact["mimeType"],
    width: artifact["width"],
    height: artifact["height"],
    sha256: artifact["sha256"],
    sourceAssetSha256: artifact["sourceAssetSha256"],
  };
}

function verifyPostProductionApprovalEvidence(
  workflowOutput: Record<string, unknown>,
  supplied: Pick<ResumeWorkflowAfterApprovalInput, "renderedAssetSha256" | "pixelEvidenceSha256" | "policyEvidenceSha256">,
): VerifiedPostProductionApprovalEvidence {
  const pixelStage = evidenceRecord(workflowOutput["render-original-and-mobile"], "Rendered-pixel stage evidence");
  const renderPackage = evidenceRecord(pixelStage["renderPackage"], "Rendered-pixel package");
  const renderedAssetId = renderPackage["renderedAssetId"];
  const renderedAssetSha256 = renderPackage["renderedAssetSha256"];
  const storedPixelEvidenceSha256 = renderPackage["pixelEvidenceSha256"];
  if (
    typeof renderedAssetId !== "string"
    || typeof renderedAssetSha256 !== "string"
    || !SHA256_PATTERN.test(renderedAssetSha256)
    || typeof storedPixelEvidenceSha256 !== "string"
    || !SHA256_PATTERN.test(storedPixelEvidenceSha256)
    || renderPackage["actualBytesVerified"] !== true
    || pixelStage["renderedAssetSha256"] !== renderedAssetSha256
    || pixelStage["pixelEvidenceSha256"] !== storedPixelEvidenceSha256
  ) {
    throw approvalRequired("Rendered-pixel evidence is not internally bound to verified bytes.");
  }

  const pixelEvidenceSha256 = canonicalSha256({
    schemaVersion: "1.0.0",
    kind: "POST_PRODUCTION_PIXEL_EVIDENCE",
    renderedAssetId,
    renderedAssetSha256,
    original: pixelManifestArtifact(renderPackage["original"], "original"),
    mobile: pixelManifestArtifact(renderPackage["mobile"], "mobile"),
  });
  if (pixelEvidenceSha256 !== storedPixelEvidenceSha256) {
    throw approvalRequired("Rendered-pixel evidence failed canonical hash verification.", {
      expectedPixelEvidenceSha256: pixelEvidenceSha256,
      storedPixelEvidenceSha256,
    });
  }

  const policyStage = evidenceRecord(workflowOutput["policy-check"], "Professional policy evidence");
  const storedPolicyEvidenceSha256 = policyStage["policyEvidenceSha256"];
  const policyPreimage = { ...policyStage };
  delete policyPreimage["completedAt"];
  delete policyPreimage["policyEvidenceSha256"];
  if (
    policyStage["schemaVersion"] !== "1.0.0"
    || policyStage["policyVersion"] !== "professional-creative-v3"
    || policyStage["status"] !== "READY_FOR_OWNER_REVIEW"
    || policyStage["eligibleForOwnerReview"] !== true
    || policyStage["externalMutation"] !== false
    || policyStage["renderedAssetSha256"] !== renderedAssetSha256
    || policyStage["pixelEvidenceSha256"] !== pixelEvidenceSha256
    || typeof storedPolicyEvidenceSha256 !== "string"
    || !SHA256_PATTERN.test(storedPolicyEvidenceSha256)
  ) {
    throw approvalRequired("Professional policy evidence is not eligible for exact-asset owner approval.");
  }
  const policyEvidenceSha256 = canonicalSha256(policyPreimage);
  if (policyEvidenceSha256 !== storedPolicyEvidenceSha256) {
    throw approvalRequired("Professional policy evidence failed canonical self-hash verification.", {
      expectedPolicyEvidenceSha256: policyEvidenceSha256,
      storedPolicyEvidenceSha256,
    });
  }

  if (
    supplied.renderedAssetSha256 !== renderedAssetSha256
    || supplied.pixelEvidenceSha256 !== pixelEvidenceSha256
    || supplied.policyEvidenceSha256 !== policyEvidenceSha256
  ) {
    throw approvalRequired("Owner approval is stale or does not bind the exact current professional evidence.", {
      supplied,
      expected: { renderedAssetSha256, pixelEvidenceSha256, policyEvidenceSha256 },
    });
  }

  return {
    renderedAssetSha256,
    pixelEvidenceSha256,
    policyEvidenceSha256,
    approvalBindingSha256: computePostProductionApprovalBinding({
      renderedAssetSha256,
      pixelEvidenceSha256,
      policyEvidenceSha256,
    }),
  };
}

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
    [id, SOCIAL_MEDIA_PLUGIN_ORGANIZATION_ID, input.type, input.idempotencyKey, steps[0]?.name, JSON.stringify(steps), JSON.stringify(input.payload), input.traceId ?? randomUUID()],
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
  output: Record<string, unknown>;
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

export const offlineWorkflowExecutor: WorkflowStepExecutor = async ({ workflow, step }) => {
  if (workflow.type === "POST_PRODUCTION") {
    throw new EngineError({
      code: "CAPABILITY_UNAVAILABLE",
      message: "Professional post-production cannot run through the offline placeholder executor.",
      ownerActionRequired: true,
      details: {
        workflowType: workflow.type,
        step,
        requiredAction: "Install and verify the professional post-production executor or keep creative production paused.",
      },
    });
  }
  return {
    output: {
      step,
      mode: "offline-safe",
      externalMutation: false,
      note: "The durable step executed without a live provider. Provider-specific work requires an installed, verified adapter.",
    },
  };
};

export async function claimNextWorkflow(
  database: DatabaseClient,
  workerId: string,
  options: { environmentCreativeProductionPauseRequested?: boolean } = {},
): Promise<ClaimedWorkflow | null> {
  const result = await database.query<SqlRow & {
    id: string;
    type: WorkflowType;
    current_step: string;
    steps: unknown;
    input: unknown;
    output: unknown;
    trace_id: string;
  }>(
    `UPDATE workflow_runs SET status = 'RUNNING', locked_at = now(), locked_by = $1, updated_at = now()
     WHERE id = (
       SELECT candidate.id FROM workflow_runs candidate
       WHERE (
           candidate.status IN ('PENDING', 'WAITING_FOR_RETRY')
           OR (candidate.status = 'RUNNING' AND candidate.locked_at < now() - interval '10 minutes')
         )
         AND (candidate.next_attempt_at IS NULL OR candidate.next_attempt_at <= now())
         AND (candidate.locked_at IS NULL OR candidate.locked_at < now() - interval '10 minutes')
         AND (
           candidate.type <> 'POST_PRODUCTION'
           OR (
             $2::boolean = false
             AND EXISTS (
               SELECT 1 FROM engine_settings settings
               WHERE settings.organization_id = candidate.organization_id
                 AND settings.creative_production_paused = false
                 AND settings.creative_gate_state = 'RELEASED'
             )
           )
         )
       ORDER BY candidate.created_at
       FOR UPDATE SKIP LOCKED
       LIMIT 1
     )
     RETURNING id, type, current_step, steps, input, output, trace_id`,
    [workerId, options.environmentCreativeProductionPauseRequested ?? false],
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    id: row.id,
    type: row.type,
    currentStep: row.current_step,
    steps: typeof row.steps === "string" ? JSON.parse(row.steps) as Array<Record<string, unknown>> : row.steps as Array<Record<string, unknown>>,
    input: typeof row.input === "string" ? JSON.parse(row.input) as Record<string, unknown> : row.input as Record<string, unknown>,
    output: row.output === null || row.output === undefined
      ? {}
      : typeof row.output === "string"
        ? JSON.parse(row.output) as Record<string, unknown>
        : row.output as Record<string, unknown>,
    traceId: row.trace_id,
  };
}

export async function runWorkerOnce(
  database: DatabaseClient,
  workerId: string,
  executor: WorkflowStepExecutor = offlineWorkflowExecutor,
  options: { environmentCreativeProductionPauseRequested?: boolean } = {},
): Promise<{ worked: boolean; workflowId?: string; status?: string }> {
  const settings = await database.query<SqlRow & { paused: boolean }>(
    "SELECT paused FROM engine_settings WHERE organization_id = $1",
    [SOCIAL_MEDIA_PLUGIN_ORGANIZATION_ID],
  );
  if (settings.rows[0]?.paused !== false) return { worked: false };
  const workflow = await claimNextWorkflow(database, workerId, options);
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
    const updated = await database.query(
      `UPDATE workflow_runs SET status = 'WAITING_FOR_APPROVAL', steps = $2::jsonb,
      locked_at = NULL, locked_by = NULL, next_attempt_at = NULL, updated_at = now()
      WHERE id = $1 AND status = 'RUNNING' AND locked_by = $3`,
      [workflow.id, JSON.stringify(waitingSteps), workerId],
    );
    if (updated.rowCount !== 1) {
      logger.info("Workflow lease was lost before owner-review transition", { step: workflow.currentStep });
      return { worked: false };
    }
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
    const stored = await database.query(
      `UPDATE workflow_runs SET status = $2, current_step = $3, steps = $4::jsonb,
       output = COALESCE(output, '{}'::jsonb) || $5::jsonb,
       locked_at = NULL, locked_by = NULL, next_attempt_at = CASE WHEN $2 = 'PENDING' THEN now() ELSE NULL END,
       updated_at = now() WHERE id = $1 AND status = 'RUNNING' AND locked_by = $6`,
      [
        workflow.id,
        complete ? "SUCCEEDED" : "PENDING",
        next ?? workflow.currentStep,
        JSON.stringify(updatedSteps),
        JSON.stringify({
          [workflow.currentStep]: {
            completedAt,
            ...stepResult.output,
          },
          ...(complete ? { workflowCompletedAt: completedAt, lastStep: workflow.currentStep } : {}),
        }),
        workerId,
      ],
    );
    if (stored.rowCount !== 1) {
      logger.info("Workflow lease was lost before step completion was persisted", { step: workflow.currentStep });
      return { worked: false };
    }
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
    const failureStored = await database.query<SqlRow & { stored: boolean }>(
      `WITH failed AS (
         UPDATE workflow_runs SET status = $2, steps = $3::jsonb, locked_at = NULL, locked_by = NULL,
           next_attempt_at = CASE WHEN $2 = 'WAITING_FOR_RETRY' THEN now() + ($4 * interval '1 millisecond') ELSE NULL END,
           output = COALESCE(output, '{}'::jsonb) || $5::jsonb, updated_at = now()
         WHERE id = $1 AND status = 'RUNNING' AND locked_by = $10 RETURNING organization_id
       ), notified AS (
       INSERT INTO notifications (id, organization_id, kind, title, body, action_url, status)
       SELECT $6, organization_id, 'WORKFLOW_FAILURE', $7, $8, '/runs', 'UNREAD' FROM failed
       WHERE $2 = 'DEAD_LETTER' OR $9 = true
       RETURNING id
       )
       SELECT EXISTS (SELECT 1 FROM failed) AS stored,
              (SELECT count(*) FROM notified) AS notifications_created`,
      [
        workflow.id,
        status,
        JSON.stringify(failedSteps),
        delay,
        JSON.stringify({
          [workflow.currentStep]: {
            failedAt: new Date().toISOString(),
            errorCode: error.code,
            retryable: error.retryable,
            ownerActionRequired: error.ownerActionRequired,
            details: error.details,
          },
        }),
        randomUUID(),
        status === "DEAD_LETTER" ? "Workflow requires attention" : "Provider action required",
        `${workflow.type}/${workflow.currentStep}: ${error.message}`,
        error.ownerActionRequired,
        workerId,
      ],
    );
    if (failureStored.rows[0]?.stored !== true) {
      logger.info("Workflow lease was lost before step failure was persisted", { step: workflow.currentStep });
      return { worked: false };
    }
    logger.error("Workflow step failed", { step: workflow.currentStep, errorCode: error.code, retrying, attempt, maxAttempts });
    return { worked: true, workflowId: workflow.id, status };
  }
}

export async function resumeWorkflowAfterApproval(
  database: DatabaseClient,
  input: ResumeWorkflowAfterApprovalInput,
): Promise<void> {
  if (!input.approvalRef.trim()) throw approvalRequired("Owner approval requires a non-empty approval reference.");

  await database.transaction(async (transaction) => {
    const result = await transaction.query<SqlRow & {
      steps: unknown;
      current_step: string;
      organization_id: string;
      trace_id: string;
      type: WorkflowType;
      output: unknown;
    }>(
      `SELECT steps, current_step, organization_id, trace_id, type, output FROM workflow_runs
       WHERE id = $1 AND status = 'WAITING_FOR_APPROVAL' FOR UPDATE`,
      [input.workflowId],
    );
    const row = result.rows[0];
    if (!row) throw approvalRequired("Workflow is not waiting for approval.");

    const actor = await transaction.query<SqlRow & { role: string }>(
      `SELECT role FROM users
       WHERE id = $1 AND organization_id = $2`,
      [input.actorId, row.organization_id],
    );
    if (actor.rows[0]?.role !== "OWNER") {
      throw approvalRequired("Only an authenticated owner from the workflow organization can approve this workflow.", {
        actorId: input.actorId,
        organizationId: row.organization_id,
      });
    }

    const steps = typeof row.steps === "string"
      ? JSON.parse(row.steps) as Array<Record<string, unknown>>
      : row.steps as Array<Record<string, unknown>>;
    const currentIndex = steps.findIndex((step) => step.name === row.current_step);
    if (currentIndex < 0 || row.current_step !== "owner-review") {
      throw approvalRequired("Approval workflow state is inconsistent.");
    }

    const postProductionEvidence = row.type === "POST_PRODUCTION"
      ? verifyPostProductionApprovalEvidence(storedOutputRecord(row.output), input)
      : undefined;

    const completedAt = new Date().toISOString();
    const updated = steps.map((step, index) => index === currentIndex
      ? { ...step, status: "SUCCEEDED", completedAt }
      : step);
    const next = updated[currentIndex + 1]?.name;
    if (!next || (row.type === "POST_PRODUCTION" && next !== "schedule")) {
      throw approvalRequired("Approval workflow has no valid continuation step.", {
        workflowType: row.type,
        nextStep: next ?? null,
      });
    }

    const approvalEvidence = {
      completedAt,
      actorId: input.actorId,
      approvalRef: input.approvalRef,
      approved: true,
      ...(postProductionEvidence ?? {}),
    };
    const resumed = await transaction.query<SqlRow & { organization_id: string }>(
      `UPDATE workflow_runs SET status = 'PENDING', current_step = $2, steps = $3::jsonb,
         output = COALESCE(output, '{}'::jsonb) || $4::jsonb,
         locked_at = NULL, locked_by = NULL, next_attempt_at = now(), updated_at = now()
       WHERE id = $1 AND status = 'WAITING_FOR_APPROVAL' AND current_step = 'owner-review'
       RETURNING organization_id`,
      [
        input.workflowId,
        next,
        JSON.stringify(updated),
        JSON.stringify({ "owner-review": approvalEvidence }),
      ],
    );
    if (resumed.rowCount !== 1) throw approvalRequired("Workflow approval state changed before approval could be recorded.");

    await transaction.query(
      `INSERT INTO audit_logs (
         id, organization_id, actor_id, action, entity_type, entity_id, previous_state,
         new_state, reason, trace_id
       ) VALUES ($1, $2, $3, 'RESUME_AFTER_APPROVAL', 'workflow_run', $4, $5::jsonb, $6::jsonb, $7, $8)`,
      [
        randomUUID(),
        row.organization_id,
        input.actorId,
        input.workflowId,
        JSON.stringify({ status: "WAITING_FOR_APPROVAL", currentStep: "owner-review" }),
        JSON.stringify({ status: "PENDING", nextStep: next, approvalEvidence }),
        input.approvalRef,
        row.trace_id,
      ],
    );
  });
}
