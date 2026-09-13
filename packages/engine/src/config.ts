import { z } from "zod";

const booleanString = (fallback: boolean) =>
  z
    .enum(["true", "false"])
    .optional()
    .transform((value) => (value === undefined ? fallback : value === "true"));

const readBoolean = (environment: NodeJS.ProcessEnv, keys: readonly string[]): "true" | "false" | undefined => {
  for (const key of keys) {
    if (environment[key] === "true" || environment[key] === "false") return environment[key];
  }
  return undefined;
};

const EngineConfigSchema = z.object({
  appUrl: z.string().url().default("http://localhost:3000"),
  timezone: z.string().min(1).default("Asia/Baghdad"),
  demoMode: booleanString(true),
  dryRun: booleanString(true),
  productionPublishingEnabled: booleanString(false),
  paused: booleanString(false),
  creativeProductionPaused: booleanString(false),
  openAiApiKey: z.string().min(1).optional(),
  frontierModel: z.string().min(1).default("gpt-5.6-sol"),
  efficientModel: z.string().min(1).default("gpt-5.6-terra"),
  inputCostPerMillionUsd: z.coerce.number().nonnegative().optional(),
  outputCostPerMillionUsd: z.coerce.number().nonnegative().optional(),
  rateCardVerifiedAt: z.string().datetime({ offset: true }).optional(),
});

export type EngineConfig = z.infer<typeof EngineConfigSchema>;

export function getEngineConfig(environment: NodeJS.ProcessEnv = process.env): EngineConfig {
  return EngineConfigSchema.parse({
    appUrl: environment.APP_URL,
    timezone: environment.APP_TIMEZONE,
    demoMode: environment.DEMO_MODE,
    dryRun: environment.DRY_RUN,
    productionPublishingEnabled: environment.PRODUCTION_PUBLISHING_ENABLED,
    paused: readBoolean(environment, [
      "SOCIAL_ENGINE_PAUSED",
      "SOCIAL_MEDIA_ENGINE_PAUSED",
      "AURENDOR_ENGINE_PAUSED",
    ]),
    creativeProductionPaused: readBoolean(environment, [
      "SOCIAL_ENGINE_CREATIVE_PRODUCTION_PAUSED",
      "SOCIAL_MEDIA_CREATIVE_PRODUCTION_PAUSED",
      "AURENDOR_CREATIVE_PRODUCTION_PAUSED",
    ]),
    openAiApiKey: environment.OPENAI_API_KEY || undefined,
    frontierModel: environment.OPENAI_FRONTIER_MODEL,
    efficientModel: environment.OPENAI_EFFICIENT_MODEL,
    inputCostPerMillionUsd: environment.OPENAI_INPUT_COST_PER_MILLION_USD || undefined,
    outputCostPerMillionUsd: environment.OPENAI_OUTPUT_COST_PER_MILLION_USD || undefined,
    rateCardVerifiedAt: environment.OPENAI_RATE_CARD_VERIFIED_AT || undefined,
  });
}

export const MODEL_POLICY = {
  brandSynthesis: { tier: "frontier", reasoningEffort: "high" },
  monthlyStrategy: { tier: "frontier", reasoningEffort: "high" },
  researchSynthesis: { tier: "frontier", reasoningEffort: "high" },
  finalEditorial: { tier: "frontier", reasoningEffort: "high" },
  artDirection: { tier: "frontier", reasoningEffort: "high" },
  visualCritique: { tier: "frontier", reasoningEffort: "high" },
  adjudication: { tier: "frontier", reasoningEffort: "xhigh" },
  monthlyAnalytics: { tier: "frontier", reasoningEffort: "high" },
  metadataExtraction: { tier: "efficient", reasoningEffort: "low" },
  classification: { tier: "efficient", reasoningEffort: "low" },
} as const;
