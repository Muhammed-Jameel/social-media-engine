import { describe, expect, it } from "vitest";
import { estimateModelCostUsd } from "./cost";

describe("model cost accounting", () => {
  it("does not invent a cost when no dated rate card is configured", () => {
    expect(estimateModelCostUsd({ inputTokens: 10_000, outputTokens: 2_000 }, null)).toBeNull();
  });

  it("computes cost from an explicit source-dated rate card", () => {
    expect(estimateModelCostUsd(
      { inputTokens: 1_000_000, outputTokens: 500_000 },
      { inputPerMillionUsd: 4, outputPerMillionUsd: 20, source: "owner-configured", verifiedAt: "2026-08-23T00:00:00Z" },
    )).toBe(14);
  });
});
