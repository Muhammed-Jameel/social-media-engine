import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  AURENDOR_OWNER_ID,
  createDatabase,
  migrateDatabase,
  seedCoreData,
  type DatabaseClient,
  type SqlRow,
} from "@aurendor/db";
import { canonicalSha256, computePostProductionApprovalBinding } from "./evidence";
import { EngineError } from "./errors";
import { ensureScheduledWork } from "./scheduler";
import { claimNextWorkflow, enqueueWorkflow, resumeWorkflowAfterApproval, runWorkerOnce } from "./workflows";

const RENDERED_ASSET_SHA256 = "a".repeat(64);
const MOBILE_ASSET_SHA256 = "b".repeat(64);

function postProductionApprovalFixture() {
  const renderPackage = {
    renderedAssetId: "approval-fixture-render-01",
    renderedAssetSha256: RENDERED_ASSET_SHA256,
    pixelEvidenceSha256: "",
    actualBytesVerified: true,
    original: {
      scale: "original",
      mimeType: "image/png",
      width: 1080,
      height: 1350,
      sha256: RENDERED_ASSET_SHA256,
      sourceAssetSha256: RENDERED_ASSET_SHA256,
    },
    mobile: {
      scale: "mobile",
      mimeType: "image/png",
      width: 324,
      height: 405,
      sha256: MOBILE_ASSET_SHA256,
      sourceAssetSha256: RENDERED_ASSET_SHA256,
    },
  };
  const pixelEvidenceSha256 = canonicalSha256({
    schemaVersion: "1.0.0",
    kind: "POST_PRODUCTION_PIXEL_EVIDENCE",
    renderedAssetId: renderPackage.renderedAssetId,
    renderedAssetSha256: renderPackage.renderedAssetSha256,
    original: renderPackage.original,
    mobile: renderPackage.mobile,
  });
  renderPackage.pixelEvidenceSha256 = pixelEvidenceSha256;

  const policyPreimage = {
    schemaVersion: "1.0.0",
    policyVersion: "professional-creative-v3",
    status: "READY_FOR_OWNER_REVIEW",
    renderedAssetId: renderPackage.renderedAssetId,
    renderedAssetSha256: RENDERED_ASSET_SHA256,
    pixelEvidenceSha256,
    stageEvidenceSha256: {
      technicalPreflight: "1".repeat(64),
      independentPixelCritics: "2".repeat(64),
      professionalAnchorComparison: "3".repeat(64),
      originalityReview: "4".repeat(64),
      feedCoherence: "5".repeat(64),
    },
    eligibleForOwnerReview: true,
    externalMutation: false,
  };
  const policyEvidenceSha256 = canonicalSha256(policyPreimage);
  return {
    binding: {
      renderedAssetSha256: RENDERED_ASSET_SHA256,
      pixelEvidenceSha256,
      policyEvidenceSha256,
    },
    output: {
      "render-original-and-mobile": {
        completedAt: "2026-08-25T07:00:00.000Z",
        renderedAssetSha256: RENDERED_ASSET_SHA256,
        pixelEvidenceSha256,
        renderPackage,
      },
      "policy-check": {
        completedAt: "2026-08-25T07:05:00.000Z",
        ...policyPreimage,
        policyEvidenceSha256,
      },
    },
  };
}

async function movePostProductionToOwnerReview(
  database: DatabaseClient,
  workflowId: string,
  output: Record<string, unknown>,
): Promise<void> {
  const stored = await database.query<SqlRow & { steps: unknown }>("SELECT steps FROM workflow_runs WHERE id = $1", [workflowId]);
  const rawSteps = stored.rows[0]?.steps;
  const steps = typeof rawSteps === "string"
    ? JSON.parse(rawSteps) as Array<Record<string, unknown>>
    : rawSteps as Array<Record<string, unknown>>;
  const ownerReviewIndex = steps.findIndex((step) => step.name === "owner-review");
  const waitingSteps = steps.map((step, index) => ({
    ...step,
    status: index < ownerReviewIndex ? "SUCCEEDED" : index === ownerReviewIndex ? "WAITING_FOR_APPROVAL" : "PENDING",
  }));
  await database.query(
    `UPDATE workflow_runs
     SET status = 'WAITING_FOR_APPROVAL', current_step = 'owner-review', steps = $2::jsonb,
         output = $3::jsonb, locked_at = NULL, locked_by = NULL, next_attempt_at = NULL
     WHERE id = $1`,
    [workflowId, JSON.stringify(waitingSteps), JSON.stringify(output)],
  );
}

describe("durable workflow integration", () => {
  let database: DatabaseClient;

  beforeEach(async () => {
    database = await createDatabase({ memory: true });
    await migrateDatabase(database);
    await seedCoreData(database);
  });

  afterEach(async () => {
    await database.close();
  });

  it("persists retry state and error taxonomy after a transient provider failure", async () => {
    const workflowId = await enqueueWorkflow(database, {
      type: "PUBLISH",
      idempotencyKey: "integration-publish-workflow-1",
      payload: { contentItemId: "fixture" },
    });
    const outcome = await runWorkerOnce(database, "test-worker", async () => {
      throw new EngineError({ code: "PROVIDER_RATE_LIMIT", message: "Try later", retryable: true });
    });
    expect(outcome.status).toBe("WAITING_FOR_RETRY");
    const stored = await database.query<SqlRow & { status: string; output: unknown }>(
      "SELECT status, output FROM workflow_runs WHERE id = $1",
      [workflowId],
    );
    expect(stored.rows[0]?.status).toBe("WAITING_FOR_RETRY");
    expect(stored.rows[0]?.output).toMatchObject({
      preflight: { errorCode: "PROVIDER_RATE_LIMIT", retryable: true },
    });
  });

  it("carries durable step evidence into the next executor invocation", async () => {
    const workflowId = await enqueueWorkflow(database, {
      type: "ANALYTICS",
      idempotencyKey: "integration-step-evidence-workflow-1",
      payload: { localDate: "2026-08-23" },
    });
    await runWorkerOnce(database, "test-worker", async ({ workflow, step }) => {
      expect(workflow.output).toEqual({});
      return { output: { evidenceHash: `hash-for-${step}` } };
    });
    await runWorkerOnce(database, "test-worker", async ({ workflow, step }) => {
      expect(workflow.output).toMatchObject({
        collect: { evidenceHash: "hash-for-collect" },
      });
      return { output: { evidenceHash: `hash-for-${step}` } };
    });
    const stored = await database.query<SqlRow & { output: unknown }>(
      "SELECT output FROM workflow_runs WHERE id = $1",
      [workflowId],
    );
    expect(stored.rows[0]?.output).toMatchObject({
      collect: { evidenceHash: "hash-for-collect" },
      normalize: { evidenceHash: "hash-for-normalize" },
    });
  });

  it("pauses at owner review and resumes only through an explicit audited approval", async () => {
    const workflowId = await enqueueWorkflow(database, {
      type: "MONTHLY_PLAN",
      idempotencyKey: "integration-monthly-workflow-1",
      payload: { month: "2026-10" },
    });
    for (let index = 0; index < 6; index += 1) {
      await runWorkerOnce(database, "test-worker");
    }
    const waiting = await database.query<SqlRow & { status: string; current_step: string }>(
      "SELECT status, current_step FROM workflow_runs WHERE id = $1",
      [workflowId],
    );
    expect(waiting.rows[0]).toMatchObject({ status: "WAITING_FOR_APPROVAL", current_step: "owner-review" });
    await resumeWorkflowAfterApproval(database, {
      workflowId,
      actorId: AURENDOR_OWNER_ID,
      approvalRef: "integration-owner-approval",
    });
    const resumed = await database.query<SqlRow & { status: string; current_step: string }>(
      "SELECT status, current_step FROM workflow_runs WHERE id = $1",
      [workflowId],
    );
    expect(resumed.rows[0]).toMatchObject({ status: "PENDING", current_step: "approved" });
    const audit = await database.query<SqlRow & { action: string }>(
      "SELECT action FROM audit_logs WHERE entity_id = $1",
      [workflowId],
    );
    expect(audit.rows.map((row) => row.action)).toContain("RESUME_AFTER_APPROVAL");
    const approvalEvidence = await database.query<SqlRow & { output: unknown }>(
      "SELECT output FROM workflow_runs WHERE id = $1",
      [workflowId],
    );
    expect(approvalEvidence.rows[0]?.output).toMatchObject({
      "owner-review": { approved: true, actorId: AURENDOR_OWNER_ID, approvalRef: "integration-owner-approval" },
    });
  });

  it("rejects an approval actor who is not a same-organization owner and rolls back atomically", async () => {
    const fixture = postProductionApprovalFixture();
    const workflowId = await enqueueWorkflow(database, {
      type: "POST_PRODUCTION",
      idempotencyKey: "integration-unauthorized-owner-approval-1",
      payload: { contentItemId: "fixture" },
    });
    await movePostProductionToOwnerReview(database, workflowId, fixture.output);

    await expect(resumeWorkflowAfterApproval(database, {
      workflowId,
      actorId: "not-an-owner",
      approvalRef: "unauthorized-approval",
      ...fixture.binding,
    })).rejects.toMatchObject({ code: "APPROVAL_REQUIRED" });

    const stored = await database.query<SqlRow & { status: string; current_step: string; output: unknown }>(
      "SELECT status, current_step, output FROM workflow_runs WHERE id = $1",
      [workflowId],
    );
    expect(stored.rows[0]).toMatchObject({ status: "WAITING_FOR_APPROVAL", current_step: "owner-review" });
    expect(stored.rows[0]?.output).not.toHaveProperty("owner-review");
    const audit = await database.query("SELECT id FROM audit_logs WHERE entity_id = $1", [workflowId]);
    expect(audit.rowCount).toBe(0);
  });

  it("rejects stale caller hashes even when the actor is the owner", async () => {
    const fixture = postProductionApprovalFixture();
    const workflowId = await enqueueWorkflow(database, {
      type: "POST_PRODUCTION",
      idempotencyKey: "integration-stale-owner-approval-1",
      payload: { contentItemId: "fixture" },
    });
    await movePostProductionToOwnerReview(database, workflowId, fixture.output);

    await expect(resumeWorkflowAfterApproval(database, {
      workflowId,
      actorId: AURENDOR_OWNER_ID,
      approvalRef: "stale-evidence-approval",
      ...fixture.binding,
      pixelEvidenceSha256: "f".repeat(64),
    })).rejects.toMatchObject({ code: "APPROVAL_REQUIRED" });

    const stored = await database.query<SqlRow & { status: string; output: unknown }>(
      "SELECT status, output FROM workflow_runs WHERE id = $1",
      [workflowId],
    );
    expect(stored.rows[0]?.status).toBe("WAITING_FOR_APPROVAL");
    expect(stored.rows[0]?.output).not.toHaveProperty("owner-review");
  });

  it("atomically records an exact-evidence POST_PRODUCTION owner approval", async () => {
    const fixture = postProductionApprovalFixture();
    const workflowId = await enqueueWorkflow(database, {
      type: "POST_PRODUCTION",
      idempotencyKey: "integration-exact-owner-approval-1",
      payload: { contentItemId: "fixture" },
    });
    await movePostProductionToOwnerReview(database, workflowId, fixture.output);

    await resumeWorkflowAfterApproval(database, {
      workflowId,
      actorId: AURENDOR_OWNER_ID,
      approvalRef: "exact-evidence-approval",
      ...fixture.binding,
    });

    const stored = await database.query<SqlRow & { status: string; current_step: string; output: unknown }>(
      "SELECT status, current_step, output FROM workflow_runs WHERE id = $1",
      [workflowId],
    );
    expect(stored.rows[0]).toMatchObject({ status: "PENDING", current_step: "schedule" });
    expect(stored.rows[0]?.output).toMatchObject({
      "owner-review": {
        approved: true,
        actorId: AURENDOR_OWNER_ID,
        approvalRef: "exact-evidence-approval",
        ...fixture.binding,
        approvalBindingSha256: computePostProductionApprovalBinding(fixture.binding),
      },
    });
    const audit = await database.query<SqlRow & { actor_id: string; new_state: unknown }>(
      "SELECT actor_id, new_state FROM audit_logs WHERE entity_id = $1",
      [workflowId],
    );
    expect(audit.rows).toHaveLength(1);
    expect(audit.rows[0]).toMatchObject({ actor_id: AURENDOR_OWNER_ID });
    expect(audit.rows[0]?.new_state).toMatchObject({
      approvalEvidence: {
        ...fixture.binding,
        approvalBindingSha256: computePostProductionApprovalBinding(fixture.binding),
      },
    });
  });

  it("reclaims an abandoned RUNNING lease after the lease timeout", async () => {
    const workflowId = await enqueueWorkflow(database, {
      type: "ANALYTICS",
      idempotencyKey: "integration-stale-running-lease-1",
      payload: { localDate: "2026-08-23" },
    });
    await database.query(
      `UPDATE workflow_runs
       SET status = 'RUNNING', locked_by = 'abandoned-worker', locked_at = now() - interval '11 minutes'
       WHERE id = $1`,
      [workflowId],
    );

    await expect(runWorkerOnce(database, "recovery-worker", async ({ step }) => ({
      output: { recoveredLeaseAtStep: step },
    }))).resolves.toMatchObject({ worked: true, workflowId, status: "PENDING" });

    const stored = await database.query<SqlRow & { status: string; current_step: string; locked_by: string | null; output: unknown }>(
      "SELECT status, current_step, locked_by, output FROM workflow_runs WHERE id = $1",
      [workflowId],
    );
    expect(stored.rows[0]).toMatchObject({ status: "PENDING", current_step: "normalize", locked_by: null });
    expect(stored.rows[0]?.output).toMatchObject({ collect: { recoveredLeaseAtStep: "collect" } });
  });

  it("does not persist a stale worker result after its lease is stolen", async () => {
    const workflowId = await enqueueWorkflow(database, {
      type: "ANALYTICS",
      idempotencyKey: "integration-stolen-running-lease-1",
      payload: { localDate: "2026-08-23" },
    });

    await expect(runWorkerOnce(database, "original-worker", async ({ workflow, database: workerDatabase }) => {
      await workerDatabase.query(
        "UPDATE workflow_runs SET locked_by = 'replacement-worker', locked_at = now() WHERE id = $1",
        [workflow.id],
      );
      return { output: { mustNotPersist: true } };
    })).resolves.toEqual({ worked: false });

    const stored = await database.query<SqlRow & { status: string; current_step: string; locked_by: string; output: unknown }>(
      "SELECT status, current_step, locked_by, output FROM workflow_runs WHERE id = $1",
      [workflowId],
    );
    expect(stored.rows[0]).toMatchObject({ status: "RUNNING", current_step: "collect", locked_by: "replacement-worker" });
    expect(stored.rows[0]?.output).toBeNull();
  });

  it("holds queued work and new scheduled workflows while the persisted pause is active", async () => {
    const workflowId = await enqueueWorkflow(database, {
      type: "ANALYTICS",
      idempotencyKey: "integration-paused-workflow-1",
      payload: { localDate: "2026-08-23" },
    });
    await database.query(
      "UPDATE engine_settings SET paused = true WHERE organization_id = (SELECT organization_id FROM workflow_runs WHERE id = $1)",
      [workflowId],
    );

    await expect(runWorkerOnce(database, "test-worker")).resolves.toEqual({ worked: false });
    await expect(ensureScheduledWork(database, new Date("2026-08-23T09:00:00.000Z"))).resolves.toEqual({
      monthlyWorkflowId: null,
      analyticsWorkflowId: null,
    });
    const stored = await database.query<SqlRow & { status: string }>("SELECT status FROM workflow_runs WHERE id = $1", [workflowId]);
    expect(stored.rows[0]?.status).toBe("PENDING");
  });

  it("holds only POST_PRODUCTION while the creative release gate is closed", async () => {
    const postProductionId = await enqueueWorkflow(database, {
      type: "POST_PRODUCTION",
      idempotencyKey: "integration-creative-gate-post-1",
      payload: { contentItemId: "fixture" },
    });

    await expect(runWorkerOnce(database, "test-worker")).resolves.toEqual({ worked: false });

    const analyticsId = await enqueueWorkflow(database, {
      type: "ANALYTICS",
      idempotencyKey: "integration-creative-gate-analytics-1",
      payload: { localDate: "2026-08-23" },
    });
    const claimedTypes: string[] = [];
    const analyticsOutcome = await runWorkerOnce(database, "test-worker", async ({ workflow, step }) => {
      claimedTypes.push(workflow.type);
      return { output: { step } };
    });

    expect(analyticsOutcome).toMatchObject({ worked: true, workflowId: analyticsId });
    expect(claimedTypes).toEqual(["ANALYTICS"]);
    const stored = await database.query<SqlRow & { id: string; status: string }>(
      "SELECT id, status FROM workflow_runs WHERE id = ANY($1::text[]) ORDER BY id",
      [[postProductionId, analyticsId]],
    );
    expect(stored.rows.find((row) => row.id === postProductionId)?.status).toBe("PENDING");
    expect(stored.rows.find((row) => row.id === analyticsId)?.status).toBe("PENDING");
  });

  it("fails closed when the required engine settings row is missing", async () => {
    const workflowId = await enqueueWorkflow(database, {
      type: "POST_PRODUCTION",
      idempotencyKey: "integration-missing-settings-gate-1",
      payload: { contentItemId: "fixture" },
    });
    await database.query("DELETE FROM engine_settings");

    await expect(claimNextWorkflow(database, "direct-claim-worker")).resolves.toBeNull();
    await expect(runWorkerOnce(database, "worker-without-settings", async () => ({ output: { admitted: true } })))
      .resolves.toEqual({ worked: false });

    const stored = await database.query<SqlRow & { status: string; locked_by: string | null }>(
      "SELECT status, locked_by FROM workflow_runs WHERE id = $1",
      [workflowId],
    );
    expect(stored.rows[0]).toMatchObject({ status: "PENDING", locked_by: null });
  });

  it("requires RELEASED state before the durable gate can admit POST_PRODUCTION", async () => {
    const workflowId = await enqueueWorkflow(database, {
      type: "POST_PRODUCTION",
      idempotencyKey: "integration-creative-gate-release-1",
      payload: { contentItemId: "fixture" },
    });
    await expect(
      database.query(
        "UPDATE engine_settings SET creative_production_paused = false WHERE organization_id = (SELECT organization_id FROM workflow_runs WHERE id = $1)",
        [workflowId],
      ),
    ).rejects.toThrow();

    await database.query(
      `UPDATE engine_settings
       SET creative_production_paused = false,
           creative_gate_state = 'RELEASED',
           creative_gate_evidence = $2::jsonb
       WHERE organization_id = (SELECT organization_id FROM workflow_runs WHERE id = $1)`,
      [workflowId, JSON.stringify({ decision: "fixture-release", currentHashCritiques: true })],
    );
    await expect(runWorkerOnce(database, "test-worker", async ({ step }) => ({ output: { admittedStep: step } })))
      .resolves.toMatchObject({ worked: true, workflowId, status: "PENDING" });
  });

  it("fails closed when released POST_PRODUCTION is invoked without its professional executor", async () => {
    const workflowId = await enqueueWorkflow(database, {
      type: "POST_PRODUCTION",
      idempotencyKey: "integration-creative-gate-no-executor-1",
      payload: { contentItemId: "fixture" },
    });
    await database.query(
      `UPDATE engine_settings
       SET creative_production_paused = false,
           creative_gate_state = 'RELEASED',
           creative_gate_evidence = '{"decision":"fixture-release"}'::jsonb
       WHERE organization_id = (SELECT organization_id FROM workflow_runs WHERE id = $1)`,
      [workflowId],
    );

    await expect(runWorkerOnce(database, "test-worker")).resolves.toMatchObject({
      worked: true,
      workflowId,
      status: "DEAD_LETTER",
    });
    const stored = await database.query<SqlRow & { status: string; current_step: string; output: unknown }>(
      "SELECT status, current_step, output FROM workflow_runs WHERE id = $1",
      [workflowId],
    );
    expect(stored.rows[0]).toMatchObject({ status: "DEAD_LETTER", current_step: "brief" });
    expect(stored.rows[0]?.output).toMatchObject({
      brief: { errorCode: "CAPABILITY_UNAVAILABLE", ownerActionRequired: true },
    });
  });

  it("honors the deployment creative fail-safe without holding unrelated workflow types", async () => {
    const postProductionId = await enqueueWorkflow(database, {
      type: "POST_PRODUCTION",
      idempotencyKey: "integration-creative-env-post-1",
      payload: { contentItemId: "fixture" },
    });
    await database.query(
      `UPDATE engine_settings
       SET creative_production_paused = false,
           creative_gate_state = 'RELEASED',
           creative_gate_evidence = '{"decision":"fixture-release"}'::jsonb
       WHERE organization_id = (SELECT organization_id FROM workflow_runs WHERE id = $1)`,
      [postProductionId],
    );
    const retrospectiveId = await enqueueWorkflow(database, {
      type: "RETROSPECTIVE",
      idempotencyKey: "integration-creative-env-retrospective-1",
      payload: { month: "2026-08" },
    });

    const result = await runWorkerOnce(database, "test-worker", undefined, {
      environmentCreativeProductionPauseRequested: true,
    });
    expect(result).toMatchObject({ worked: true, workflowId: retrospectiveId });
    const held = await database.query<SqlRow & { status: string }>("SELECT status FROM workflow_runs WHERE id = $1", [postProductionId]);
    expect(held.rows[0]?.status).toBe("PENDING");
  });
});
