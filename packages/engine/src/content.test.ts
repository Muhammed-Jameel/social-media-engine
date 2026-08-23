import { describe, expect, it } from "vitest";
import { antiGenericScore, detectGenericCopy, platformExecution } from "./content";

describe("content quality", () => {
  it("rejects generic AI phrasing", () => {
    expect(detectGenericCopy("Unlock the power of AI in today's rapidly evolving digital landscape.")).toHaveLength(2);
    expect(antiGenericScore("Unlock the power of AI in today's rapidly evolving digital landscape.")).toBeLessThan(70);
  });

  it("uses a platform-native LinkedIn execution", () => {
    expect(platformExecution({ platform: "linkedin", format: "carousel" }).format).toBe("multi_image");
  });
});

