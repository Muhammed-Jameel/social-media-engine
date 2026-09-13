import { describe, expect, it } from "vitest";
import { EngineError, normalizeEngineError } from "./errors";
import { retryDelayMs, WORKFLOW_STEPS } from "./workflows";

describe("durable workflow policy", () => {
  it("uses bounded exponential retry backoff with jitter", () => {
    expect(retryDelayMs(1, 0)).toBe(5_000);
    expect(retryDelayMs(2, 0)).toBe(10_000);
    expect(retryDelayMs(3, 0)).toBe(20_000);
    expect(retryDelayMs(20, 1)).toBeLessThanOrEqual(15 * 60_000 + 15 * 60_000 * 0.25);
  });

  it("keeps owner review before approval and batch production", () => {
    const ownerReview = WORKFLOW_STEPS.MONTHLY_PLAN.indexOf("owner-review");
    expect(ownerReview).toBeGreaterThan(-1);
    expect(WORKFLOW_STEPS.MONTHLY_PLAN[ownerReview + 1]).toBe("approved");
    expect(WORKFLOW_STEPS.MONTHLY_PLAN[ownerReview + 2]).toBe("batch-production");
  });

  it("makes retrieval, concept competition, actual pixels, anchors, and feed review durable production stages", () => {
    const steps = WORKFLOW_STEPS.POST_PRODUCTION;
    const retrieval = steps.indexOf("design-intelligence-retrieval");
    const tournament = steps.indexOf("concept-tournament");
    const pixels = steps.indexOf("render-original-and-mobile");
    const critics = steps.indexOf("independent-pixel-critics");
    const anchors = steps.indexOf("professional-anchor-comparison");
    const originality = steps.indexOf("originality-review");
    const feed = steps.indexOf("feed-coherence");
    const ownerReview = steps.indexOf("owner-review");

    expect(retrieval).toBeLessThan(tournament);
    expect(tournament).toBeLessThan(pixels);
    expect(pixels).toBeLessThan(critics);
    expect(critics).toBeLessThan(anchors);
    expect(anchors).toBeLessThan(originality);
    expect(originality).toBeLessThan(feed);
    expect(feed).toBeLessThan(ownerReview);
    expect(steps[ownerReview + 1]).toBe("schedule");
  });

  it("preserves typed retry and owner-action semantics", () => {
    const error = new EngineError({
      code: "PROVIDER_AUTH_EXPIRED",
      message: "Reconnect the provider account.",
      retryable: false,
      ownerActionRequired: true,
    });
    expect(normalizeEngineError(error)).toBe(error);
    expect(error.ownerActionRequired).toBe(true);
  });
});
