import { describe, expect, it } from "vitest";
import { classifyOwnerCommand } from "./controls";

describe("natural-language owner controls", () => {
  it("treats an emergency pause as an immediate safety command", () => {
    expect(classifyOwnerCommand("أوقف النشر الآن")).toMatchObject({
      scope: "SAFETY_POLICY",
      classification: "PAUSE_PUBLISHING",
      requiresConfirmation: false,
      proposedChange: { paused: true },
    });
  });

  it("requires confirmation before persisting a subjective preference", () => {
    expect(classifyOwnerCommand("Make the tone less promotional")).toMatchObject({
      scope: "PERSISTENT_PREFERENCE",
      classification: "EDITORIAL_PREFERENCE",
      requiresConfirmation: true,
    });
  });

  it("does not invent an interpretation for an ambiguous command", () => {
    expect(classifyOwnerCommand("Change it")).toMatchObject({ classification: "REVIEW_REQUIRED", requiresConfirmation: true });
  });
});
