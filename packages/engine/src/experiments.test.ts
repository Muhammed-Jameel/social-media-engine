import { describe, expect, it } from "vitest";
import { assignExperimentVariant, evaluateTwoVariantExperiment } from "./experiments";

describe("content experimentation", () => {
  it("assigns a stable variant without runtime randomness", () => {
    const input = {
      experimentId: "hook-framing-v1",
      contentItemId: "content-17",
      variants: [{ id: "control", allocation: 0.5 }, { id: "tension-hook", allocation: 0.5 }],
    };
    expect(assignExperimentVariant(input)).toBe(assignExperimentVariant(input));
  });

  it("refuses to declare a winner before the minimum evidence gate", () => {
    const result = evaluateTwoVariantExperiment({
      observations: [
        { variantId: "control", eligiblePosts: 2, denominator: 500, outcomes: 20 },
        { variantId: "tension-hook", eligiblePosts: 2, denominator: 500, outcomes: 35 },
      ],
      minimumPostsPerVariant: 5,
      minimumDenominatorPerVariant: 1_000,
    });
    expect(result).toMatchObject({ state: "INSUFFICIENT_EVIDENCE", winner: null, decision: "INCONCLUSIVE" });
  });

  it("labels strong evidence while retaining social-delivery limitations", () => {
    const result = evaluateTwoVariantExperiment({
      observations: [
        { variantId: "control", eligiblePosts: 10, denominator: 10_000, outcomes: 250 },
        { variantId: "tension-hook", eligiblePosts: 10, denominator: 10_000, outcomes: 500 },
      ],
      minimumPostsPerVariant: 5,
      minimumDenominatorPerVariant: 1_000,
    });
    expect(result.state).toBe("EXPERIMENT_SUPPORTED");
    expect(result.winner).toBe("tension-hook");
    expect(result.limitations).not.toHaveLength(0);
  });
});
