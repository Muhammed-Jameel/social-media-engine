import { describe, expect, it } from "vitest";
import { z } from "zod";
import { buildStructuredAgentInput, FixtureAgentGateway } from "./agents";

describe("structured agent pixel inputs", () => {
  it("builds a labelled multimodal message instead of metadata-only input", () => {
    const input = buildStructuredAgentInput({
      input: { assetSha256: "a".repeat(64) },
      imageInputs: [
        {
          imageUrl: "data:image/png;base64,AAAA",
          label: "candidate at original size",
          kind: "rendered-candidate",
          detail: "original",
        },
      ],
    });

    expect(input).toEqual([
      expect.objectContaining({
        role: "user",
        content: [
          expect.objectContaining({
            type: "input_text",
            text: expect.stringContaining("Inspect the supplied pixels"),
          }),
          expect.objectContaining({ type: "input_image", image_url: "data:image/png;base64,AAAA", detail: "original" }),
        ],
      }),
    ]);
  });

  it("does not let non-visual roles receive images", async () => {
    const gateway = new FixtureAgentGateway();
    await expect(gateway.run({
      role: "COPYWRITER_EN",
      taskName: "forbidden-pixel-read",
      instructions: "Return the fixture.",
      input: {},
      imageInputs: [{ imageUrl: "https://example.com/candidate.png", label: "candidate", kind: "rendered-candidate" }],
      schema: z.object({ ok: z.boolean() }),
      fixture: { ok: true },
    })).rejects.toThrow("not authorized");
  });

  it("never converts a local path into an implicit upload", async () => {
    const gateway = new FixtureAgentGateway();
    await expect(gateway.run({
      role: "VISUAL_CRITIC_A",
      taskName: "local-path-pixel-read",
      instructions: "Return the fixture.",
      input: {},
      imageInputs: [{ imageUrl: "/private/reference.png", label: "reference", kind: "professional-anchor" }],
      schema: z.object({ ok: z.boolean() }),
      fixture: { ok: true },
    })).rejects.toThrow("local paths are never uploaded implicitly");
  });
});
