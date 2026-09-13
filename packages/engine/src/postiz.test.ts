import { describe, expect, it, vi } from "vitest";
import { PostizClient, platformForPostizProvider, postizSettings, postizValues } from "./postiz";

describe("PostizClient", () => {
  it("normalizes a self-hosted API base and never sends the key in the URL", async () => {
    const fetchImpl = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      expect(String(url)).toBe("http://localhost:4007/api/public/v1/integrations");
      expect(String(url)).not.toContain("secret-key");
      expect(new Headers(init?.headers).get("Authorization")).toBe("secret-key");
      return new Response(JSON.stringify([{ id: "ig-1", name: "Aurendor", identifier: "instagram" }]), { status: 200 });
    });
    const client = new PostizClient({ baseUrl: "http://localhost:4007/api", apiKey: "secret-key", fetchImpl: fetchImpl as typeof fetch });
    await expect(client.listIntegrations()).resolves.toHaveLength(1);
  });

  it("creates an X thread when a carousel exceeds four images", () => {
    const media = Array.from({ length: 6 }, (_, index) => ({ id: `media-${index}`, path: `https://example.com/${index}.png` }));
    const values = postizValues({ providerIdentifier: "x", caption: "Opening", continuation: "Continue", media });
    expect(values).toHaveLength(2);
    expect(values[0]?.image).toHaveLength(4);
    expect(values[1]?.image).toHaveLength(2);
    expect(values[1]?.content).toContain("2/2");
  });

  it("maps the five active AURENDOR providers and applies safe defaults", () => {
    expect(platformForPostizProvider("linkedin-page")).toBe("linkedin");
    expect(platformForPostizProvider("instagram-standalone")).toBe("instagram");
    expect(postizSettings("tiktok")).toMatchObject({ duet: false, stitch: false, brand_organic_toggle: true, video_made_with_ai: true, content_posting_method: "UPLOAD" });
    expect(postizSettings("tiktok", { tiktokDirectPostVerified: true })).toMatchObject({ content_posting_method: "DIRECT_POST" });
    expect(platformForPostizProvider("youtube")).toBeNull();
  });
});
