import type { MetricSnapshot } from "@aurendor/schemas";

export interface NormalizedRates {
  engagementRate: number | null;
  saveRate: number | null;
  shareRate: number | null;
  clickThroughRate: number | null;
  negativeFeedbackRate: number | null;
}

function rate(numerator: number | null, denominator: number | null): number | null {
  if (numerator === null || denominator === null || denominator <= 0) return null;
  return numerator / denominator;
}

export function normalizeRates(snapshot: Pick<MetricSnapshot, "metrics">): NormalizedRates {
  const denominator = snapshot.metrics.reach ?? snapshot.metrics.impressions;
  const engagementParts = [snapshot.metrics.likes, snapshot.metrics.comments, snapshot.metrics.shares, snapshot.metrics.saves].filter(
    (value): value is number => value !== null,
  );
  const engagement = engagementParts.length > 0 ? engagementParts.reduce((sum, value) => sum + value, 0) : null;
  return {
    engagementRate: rate(engagement, denominator),
    saveRate: rate(snapshot.metrics.saves, denominator),
    shareRate: rate(snapshot.metrics.shares, denominator),
    clickThroughRate: rate(snapshot.metrics.clicks, snapshot.metrics.impressions),
    negativeFeedbackRate: rate(snapshot.metrics.negativeFeedback, denominator),
  };
}

export function evidenceLabel(input: { sampleSize: number; controlledExperiment: boolean; comparablePosts: number }): "OBSERVATION" | "CORRELATION" | "HYPOTHESIS" | "EXPERIMENT_SUPPORTED" {
  if (input.controlledExperiment && input.sampleSize >= 20) return "EXPERIMENT_SUPPORTED";
  if (input.comparablePosts >= 8) return "CORRELATION";
  if (input.sampleSize >= 2) return "HYPOTHESIS";
  return "OBSERVATION";
}

