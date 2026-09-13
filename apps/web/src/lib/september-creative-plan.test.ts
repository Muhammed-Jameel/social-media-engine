import { describe, expect, it } from "vitest";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { finalCaption, septemberCreativePosts } from "./september-creative-plan";

describe("September owner-reviewed content plan", () => {
  it("resolves every displayed asset with exact public-path casing", () => {
    const publicRoot = fileURLToPath(new URL("../../public/", import.meta.url));
    const urls = septemberCreativePosts.flatMap((post) => [
      post.coverUrl,
      ...post.slides.map((slide) => slide.assetUrl),
      ...post.supportingStories.map((story) => story.assetUrl),
    ]).filter((url): url is string => Boolean(url));
    for (const url of urls) {
      let directory = publicRoot;
      for (const segment of url.split("/").filter(Boolean)) {
        expect(readdirSync(directory), `Exact filename required for ${url}`).toContain(segment);
        directory = join(directory, segment);
      }
    }
  });
  it("keeps the required opening and repeating cadence", () => {
    expect(septemberCreativePosts).toHaveLength(20);
    expect(septemberCreativePosts.slice(0, 3).map((post) => post.contentTrack)).toEqual([
      "brand_intro",
      "brand_intro",
      "brand_intro",
    ]);
    const cycle = ["ai_automation_service", "bunyan_pro", "value_first"];
    expect(septemberCreativePosts.slice(3).map((post, index) => post.contentTrack === cycle[index % cycle.length])).not.toContain(false);
  });

  it("uses the requested carousel, reel, and story mix", () => {
    expect(septemberCreativePosts.filter((post) => post.format === "carousel")).toHaveLength(14);
    expect(septemberCreativePosts.filter((post) => post.format === "reel")).toHaveLength(6);
    expect(septemberCreativePosts.reduce((total, post) => total + post.supportingStories.length, 0)).toBe(40);
    for (const post of septemberCreativePosts) {
      expect(post.supportingStories.some((story) => story.role === "interaction")).toBe(true);
      expect(post.supportingStories.some((story) => story.role === "post_cta" && story.interaction.type === "open_post")).toBe(true);
    }
  });

  it("ships the three opening announcements as complete launch-day carousels", () => {
    const opening = septemberCreativePosts.slice(0, 3);
    expect(opening.map((post) => post.publishAt.slice(0, 10))).toEqual(["2026-09-01", "2026-09-01", "2026-09-01"]);
    for (const post of opening) {
      expect(post.format).toBe("carousel");
      expect(post.slides).toHaveLength(6);
      expect(post.slides.every((slide) => slide.assetUrl?.endsWith(".png"))).toBe(true);
      expect(post.supportingStories.every((story) => story.assetUrl?.endsWith(".png"))).toBe(true);
      expect(post.productionStatus).toBe("READY_FOR_OWNER_REVIEW");
    }
  });

  it("binds every CTA to the caption and final visual frame", () => {
    for (const post of septemberCreativePosts) {
      expect(finalCaption(post).endsWith(post.cta)).toBe(true);
      expect(post.ctaPlacements).toContain("caption_end");
      if (post.format === "carousel") {
        expect(post.ctaPlacements).toContain("carousel_last_frame");
        expect(post.slides.at(-1)?.role).toBe("cta");
      } else {
        expect(post.ctaPlacements).toContain("reel_end_card");
        expect(post.reelProduction?.clips.at(-1)?.narrativeBeat).toContain("CTA");
      }
    }
  });

  it("keeps reels provider-gated and applies the no-objectification policy", () => {
    for (const post of septemberCreativePosts) {
      expect(post.castingPlan.policy.womenAsAttentionDevice).toBe("FORBIDDEN");
      expect(post.castingPlan.policy.objectifyingTreatment).toBe("FORBIDDEN");
      if (post.format === "reel") {
        expect(post.reelProduction?.connectionState).toBe("AUTH_REQUIRED");
        expect(post.productionStatus).toBe("HIGGSFIELD_AUTH_REQUIRED");
      }
    }
  });

  it("targets the five active publishing platforms", () => {
    for (const post of septemberCreativePosts) {
      expect(post.platforms).toEqual(["Instagram", "Facebook", "TikTok", "X", "LinkedIn"]);
    }
  });
});
