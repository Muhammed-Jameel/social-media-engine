import { describe, expect, it } from "vitest";
import { getEngineConfig } from "./config";

describe("engine configuration", () => {
  it("leaves the optional deployment creative fail-safe inactive by default", () => {
    expect(getEngineConfig({}).creativeProductionPaused).toBe(false);
  });

  it("parses the deployment creative fail-safe independently of the global pause", () => {
    const config = getEngineConfig({
      SOCIAL_MEDIA_PLUGIN_ENGINE_PAUSED: "false",
      SOCIAL_MEDIA_PLUGIN_CREATIVE_PRODUCTION_PAUSED: "true",
    });
    expect(config.paused).toBe(false);
    expect(config.creativeProductionPaused).toBe(true);
  });

  it("accepts neutral pause flags with backward compatibility", () => {
    const config = getEngineConfig({
      SOCIAL_ENGINE_PAUSED: "true",
      SOCIAL_ENGINE_CREATIVE_PRODUCTION_PAUSED: "true",
      SOCIAL_MEDIA_PLUGIN_ENGINE_PAUSED: "false",
      SOCIAL_MEDIA_PLUGIN_CREATIVE_PRODUCTION_PAUSED: "false",
    });
    expect(config.paused).toBe(true);
    expect(config.creativeProductionPaused).toBe(true);
  });
});
