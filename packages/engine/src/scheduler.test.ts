import { describe, expect, it } from "vitest";
import { monthlyTriggerDecision } from "./scheduler";

describe("monthly scheduler", () => {
  it("triggers exactly at the Baghdad-local T-5 boundary", () => {
    expect(monthlyTriggerDecision({
      now: new Date("2026-08-26T20:59:59.000Z"),
      timezone: "Asia/Baghdad",
    }).due).toBe(false);
    const atBoundary = monthlyTriggerDecision({
      now: new Date("2026-08-26T21:00:00.000Z"),
      timezone: "Asia/Baghdad",
    });
    expect(atBoundary).toMatchObject({ localDate: "2026-08-27", targetMonth: "2026-09", planningDate: "2026-08-27", due: true });
  });

  it("marks a missed pre-month trigger as late rather than silently skipping it", () => {
    expect(monthlyTriggerDecision({
      now: new Date("2026-09-02T09:00:00.000Z"),
      timezone: "Asia/Baghdad",
      targetMonth: "2026-09",
    }).late).toBe(true);
  });
});
