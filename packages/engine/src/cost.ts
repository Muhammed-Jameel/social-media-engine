export interface ModelUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface ModelRateCard {
  inputPerMillionUsd: number;
  outputPerMillionUsd: number;
  source: string;
  verifiedAt: string;
}

export function estimateModelCostUsd(usage: ModelUsage, rateCard: ModelRateCard | null): number | null {
  if (!rateCard) return null;
  if (usage.inputTokens < 0 || usage.outputTokens < 0) throw new Error("Token usage cannot be negative.");
  const inputCost = usage.inputTokens / 1_000_000 * rateCard.inputPerMillionUsd;
  const outputCost = usage.outputTokens / 1_000_000 * rateCard.outputPerMillionUsd;
  return Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000;
}
