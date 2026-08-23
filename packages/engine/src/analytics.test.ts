import { describe, expect, it } from "vitest";
import { normalizeRates } from "./analytics";

describe("analytics normalization", () => {
  it("uses reach as the meaningful rate denominator", () => {
    expect(
      normalizeRates({
        metrics: {
          impressions: 1500,
          reach: 1000,
          views: null,
          likes: 50,
          comments: 10,
          shares: 20,
          saves: 40,
          clicks: 30,
          profileVisits: 8,
          follows: 2,
          watchTimeSeconds: null,
          completionRate: null,
          negativeFeedback: 1,
        },
      }),
    ).toEqual({ engagementRate: 0.12, saveRate: 0.04, shareRate: 0.02, clickThroughRate: 0.02, negativeFeedbackRate: 0.001 });
  });
});

