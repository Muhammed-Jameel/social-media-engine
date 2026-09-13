import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { getDatabase, projectRoot } from "@social-media-plugin/db/runtime";
import {
  createProfessionalPostProductionExecutor,
  DesignKnowledgeRetriever,
  ensureScheduledWork,
  getEngineConfig,
  offlineWorkflowExecutor,
  runWorkerOnce,
  type WorkflowStepExecutor,
} from "@social-media-plugin/engine";
import { createLogger } from "@social-media-plugin/observability";

const logger = createLogger({ service: "social-worker" });
const workerId = `worker-${randomUUID()}`;
const database = await getDatabase();
const runtimeConfig = getEngineConfig();
let stopping = false;
let lastScheduleCheck = 0;
let professionalExecutorPromise: Promise<WorkflowStepExecutor> | undefined;

const workflowExecutor: WorkflowStepExecutor = async (context) => {
  if (context.workflow.type !== "POST_PRODUCTION") return offlineWorkflowExecutor(context);
  professionalExecutorPromise ??= DesignKnowledgeRetriever
    .fromDirectory(join(projectRoot(), "design-intelligence"))
    .then((retriever) => createProfessionalPostProductionExecutor({ retriever }));
  const professionalExecutor = await professionalExecutorPromise;
  return professionalExecutor(context);
};

process.on("SIGINT", () => {
  stopping = true;
});
process.on("SIGTERM", () => {
  stopping = true;
});

logger.info("Worker started", { workerId });

while (!stopping) {
  try {
    // The environment pause is the fail-safe deployment kill switch. It takes
    // precedence over persisted settings and is re-read on process restart.
    if (runtimeConfig.paused) {
      await new Promise((resolve) => setTimeout(resolve, 5_000));
      continue;
    }
    if (Date.now() - lastScheduleCheck >= 60_000) {
      const scheduled = await ensureScheduledWork(database);
      lastScheduleCheck = Date.now();
      logger.info("Scheduled-work check completed", scheduled);
    }
    const result = await runWorkerOnce(database, workerId, workflowExecutor, {
      environmentCreativeProductionPauseRequested: runtimeConfig.creativeProductionPaused,
    });
    if (!result.worked) await new Promise((resolve) => setTimeout(resolve, 5_000));
  } catch (error) {
    logger.error("Worker cycle failed", { workerId, error: error instanceof Error ? error.message : String(error) });
    await new Promise((resolve) => setTimeout(resolve, 5_000));
  }
}

logger.info("Worker stopped", { workerId });
await database.close();
