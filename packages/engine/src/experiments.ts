import { createHash } from "node:crypto";

export interface ExperimentVariant {
  id: string;
  allocation: number;
}

export function assignExperimentVariant(input: {
  experimentId: string;
  contentItemId: string;
  variants: ExperimentVariant[];
}): string {
  if (input.variants.length < 2) throw new Error("An experiment needs at least two variants.");
  const total = input.variants.reduce((sum, variant) => sum + variant.allocation, 0);
  if (Math.abs(total - 1) > 0.000_001 || input.variants.some((variant) => variant.allocation <= 0)) {
    throw new Error("Experiment variant allocations must be positive and sum to 1.");
  }
  const digest = createHash("sha256").update(`${input.experimentId}:${input.contentItemId}`).digest();
  const bucket = digest.readUInt32BE(0) / 0xffff_ffff;
  let boundary = 0;
  for (const variant of input.variants) {
    boundary += variant.allocation;
    if (bucket <= boundary) return variant.id;
  }
  return input.variants[input.variants.length - 1]!.id;
}

export interface VariantObservation {
  variantId: string;
  eligiblePosts: number;
  denominator: number;
  outcomes: number;
}

export interface ExperimentReadout {
  state: "INSUFFICIENT_EVIDENCE" | "DIRECTIONAL" | "EXPERIMENT_SUPPORTED";
  rates: Array<{ variantId: string; rate: number | null; denominator: number; eligiblePosts: number }>;
  winner: string | null;
  uplift: number | null;
  confidence: number | null;
  decision: "INCONCLUSIVE" | "RETEST" | "ADOPT";
  limitations: string[];
}

function normalCdf(value: number): number {
  const sign = value < 0 ? -1 : 1;
  const x = Math.abs(value) / Math.sqrt(2);
  const t = 1 / (1 + 0.3275911 * x);
  const erf = sign * (1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x));
  return 0.5 * (1 + erf);
}

export function evaluateTwoVariantExperiment(input: {
  observations: [VariantObservation, VariantObservation];
  minimumPostsPerVariant: number;
  minimumDenominatorPerVariant: number;
  confidenceThreshold?: number;
}): ExperimentReadout {
  const [left, right] = input.observations;
  const rates = input.observations.map((observation) => ({
    variantId: observation.variantId,
    rate: observation.denominator > 0 ? observation.outcomes / observation.denominator : null,
    denominator: observation.denominator,
    eligiblePosts: observation.eligiblePosts,
  }));
  const limitations = [
    "Platform delivery, audience mix, timing, and creative context can still confound a social-content experiment.",
    "Adoption applies only to the declared variable and eligible cohort; it does not rewrite brand truth.",
  ];
  if (
    left.eligiblePosts < input.minimumPostsPerVariant ||
    right.eligiblePosts < input.minimumPostsPerVariant ||
    left.denominator < input.minimumDenominatorPerVariant ||
    right.denominator < input.minimumDenominatorPerVariant
  ) {
    return { state: "INSUFFICIENT_EVIDENCE", rates, winner: null, uplift: null, confidence: null, decision: "INCONCLUSIVE", limitations };
  }
  const leftRate = left.outcomes / left.denominator;
  const rightRate = right.outcomes / right.denominator;
  const pooled = (left.outcomes + right.outcomes) / (left.denominator + right.denominator);
  const standardError = Math.sqrt(pooled * (1 - pooled) * (1 / left.denominator + 1 / right.denominator));
  const z = standardError > 0 ? Math.abs(leftRate - rightRate) / standardError : 0;
  const confidence = Math.max(0, Math.min(1, 2 * normalCdf(z) - 1));
  const winner = leftRate === rightRate ? null : leftRate > rightRate ? left.variantId : right.variantId;
  const baseline = Math.min(leftRate, rightRate);
  const uplift = baseline > 0 ? Math.abs(leftRate - rightRate) / baseline : null;
  const supported = winner !== null && confidence >= (input.confidenceThreshold ?? 0.95);
  return {
    state: supported ? "EXPERIMENT_SUPPORTED" : "DIRECTIONAL",
    rates,
    winner,
    uplift,
    confidence,
    decision: supported ? "ADOPT" : "RETEST",
    limitations,
  };
}
