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
