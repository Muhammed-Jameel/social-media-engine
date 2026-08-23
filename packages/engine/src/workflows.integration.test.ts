import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  AURENDOR_OWNER_ID,
  createDatabase,
  migrateDatabase,
  seedCoreData,
  type DatabaseClient,
  type SqlRow,
} from "@aurendor/db";
import { EngineError } from "./errors";
import { ensureScheduledWork } from "./scheduler";
import { enqueueWorkflow, resumeWorkflowAfterApproval, runWorkerOnce } from "./workflows";

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
    expect(stored.rows[0]?.output).toMatchObject({ errorCode: "PROVIDER_RATE_LIMIT", retryable: true });
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
});
