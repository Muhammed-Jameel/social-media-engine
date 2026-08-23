import { describe, expect, it } from "vitest";
import { assertContentTransition, canTransitionContent, planningDateForMonth } from "./state-machine";

describe("content state machine", () => {
  it("allows reviewed content to become approved but never skips to published", () => {
    expect(canTransitionContent("NEEDS_REVIEW", "APPROVED")).toBe(true);
    expect(canTransitionContent("NEEDS_REVIEW", "PUBLISHED")).toBe(false);
    expect(() => assertContentTransition("NEEDS_REVIEW", "PUBLISHED")).toThrow(/Invalid content transition/);
  });

  it("computes the exact T-5 planning date across year boundaries", () => {
    expect(planningDateForMonth("2026-09", 5)).toBe("2026-08-27");
    expect(planningDateForMonth("2027-01", 5)).toBe("2026-12-27");
  });
});

