function readString(environment: NodeJS.ProcessEnv, keys: readonly string[]): string | undefined {
  for (const key of keys) {
    const value = environment[key]?.trim();
    if (value) return value;
  }
  return undefined;
}

function readBoolean(environment: NodeJS.ProcessEnv, keys: readonly string[]): boolean {
  for (const key of keys) {
    if (environment[key] === "true") return true;
    if (environment[key] === "false") return false;
  }
  return false;
}

export const AURENDOR_ORGANIZATION_ID = readString(process.env, [
  "SOCIAL_ENGINE_ORGANIZATION_ID",
  "SOCIAL_MEDIA_ORGANIZATION_ID",
  "AURENDOR_ORGANIZATION_ID",
]) ?? "org-aurendor";

export const AURENDOR_OWNER_ID = readString(process.env, [
  "SOCIAL_ENGINE_OWNER_ID",
  "SOCIAL_MEDIA_OWNER_ID",
  "AURENDOR_OWNER_ID",
]) ?? "user-owner";

export const SOCIAL_MEDIA_ORGANIZATION_ID = AURENDOR_ORGANIZATION_ID;
export const SOCIAL_MEDIA_OWNER_ID = AURENDOR_OWNER_ID;

export const SEPTEMBER_CAMPAIGN_ID = "campaign-2026-09";
export const SEPTEMBER_STRATEGY_ID = "strategy-2026-09";
export const ACTIVE_BRAND_VERSION_ID = "brand-final-2026-1";

export function isEnginePaused(environment: NodeJS.ProcessEnv = process.env): boolean {
  return readBoolean(environment, [
    "SOCIAL_ENGINE_PAUSED",
    "SOCIAL_MEDIA_ENGINE_PAUSED",
    "AURENDOR_ENGINE_PAUSED",
  ]);
}

export function isCreativeProductionPaused(environment: NodeJS.ProcessEnv = process.env): boolean {
  return readBoolean(environment, [
    "SOCIAL_ENGINE_CREATIVE_PRODUCTION_PAUSED",
    "SOCIAL_MEDIA_CREATIVE_PRODUCTION_PAUSED",
    "AURENDOR_CREATIVE_PRODUCTION_PAUSED",
  ]);
}

export function getSourceRootFromEnvironment(environment: NodeJS.ProcessEnv = process.env): string | undefined {
  return readString(environment, [
    "SOCIAL_MEDIA_SOURCE_ROOT",
    "SOCIAL_ENGINE_SOURCE_ROOT",
    "AURENDOR_SOURCE_ROOT",
  ]);
}
