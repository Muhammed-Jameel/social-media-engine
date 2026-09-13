import { existsSync } from "node:fs";
import { isEnginePaused, isCreativeProductionPaused } from "../packages/db/src/ids";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

console.log(JSON.stringify({
  demo: process.env.DEMO_MODE === "true",
  dryRun: process.env.DRY_RUN !== "false",
  productionRequested: process.env.PRODUCTION_PUBLISHING_ENABLED === "true",
  ownerEmailConfigured: !!process.env.OWNER_EMAIL,
  ownerHashConfigured: !!process.env.OWNER_PASSWORD_HASH?.startsWith("scrypt:"),
  sessionSecretConfigured: (process.env.OWNER_SESSION_SECRET?.length ?? 0) >= 32,
  globalPauseRequested: isEnginePaused(process.env),
  creativeProductionPauseRequested: isCreativeProductionPaused(process.env),
}));
