import { describe, expect, it } from "vitest";
import { FixtureAgentGateway } from "./agents";
import { createBootstrapMonthlyPlan, MonthlyPlanningService } from "./planning";

const input = {
  organizationId: "aurendor",
  month: "2026-10",
  timezone: "Asia/Baghdad",
  businessPriorities: ["Operational AI authority", "Aurendor Build consideration"],
  audiences: ["Iraqi business owners", "Construction operations leaders"],
  now: new Date("2026-09-26T09:00:00.000Z"),
};

describe("monthly planning", () => {
  it("creates a coherent bootstrap plan with explicit uncertainty and a timely reserve", () => {
    const plan = createBootstrapMonthlyPlan(input);
    expect(plan.items).toHaveLength(8);
    expect(plan.items.every((item) => item.publishAtLocal.startsWith("2026-10"))).toBe(true);
    expect(plan.items.filter((item) => item.pillar === "product")).toHaveLength(1);
    expect(plan.items.find((item) => item.pillar === "timely-reserve")?.status).toBe("needs_evidence");
    expect(plan.warnings.some((warning) => warning.includes("no real historical"))).toBe(true);
  });

  it("runs the same schema-valid path through the offline agent gateway", async () => {
    const service = new MonthlyPlanningService(new FixtureAgentGateway());
    const plan = await service.generate(input);
    expect(plan.artifactType).toBe("monthly_plan");
    expect(plan.approvalState).toBe("in_review");
  });
});
