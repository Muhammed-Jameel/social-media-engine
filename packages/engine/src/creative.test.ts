import { describe, expect, it } from "vitest";
import type { DesignBrief } from "@social-media-plugin/schemas";
import {
  contrastRatio,
  DeterministicSvgProvider,
  duplicateCreativeFingerprints,
  evaluateTechnicalCreativePreflight,
  fingerprintSvg,
  renderSocialSvg,
  type SocialSvgInput,
} from "./creative";

const arabicLight: SocialSvgInput = {
  kicker: "منظومة لا أداة",
  headline: "لا تحتاج شركتك إلى أدوات أكثر",
  support: "تحتاج إلى منظومة رقمية تربط القرار بالتنفيذ، وتحول التعقيد إلى نمو يمكن قياسه.",
  footer: "اورندور · الحضارة الرقمية تبدأ من الوضوح",
  direction: "rtl",
  mode: "light",
  width: 1080,
  height: 1350,
};

describe("SOCIAL_MEDIA_PLUGIN deterministic creative renderer", () => {
  it("renders a stable fingerprint and escapes exact copy", () => {
    const input = { ...arabicLight, headline: "قرار < أسرع & أوضح" };
    const first = renderSocialSvg(input);
    const second = renderSocialSvg(input);

    expect(fingerprintSvg(first)).toBe(fingerprintSvg(second));
    expect(first).toContain("قرار &lt; أسرع &amp; أوضح");
    expect(first).toContain('data-social-brand-version="final-2026.1"');
    expect(first).toContain('text-anchor="middle" direction="rtl"');
    expect(first).toContain('data-role="canonical-logo"');
    expect(first).toContain('data-line-index="1"');
    expect(first).not.toContain("<tspan");
    expect(first).not.toContain("<foreignObject");
  });

  it("keeps canonical light and dark contrast comfortably above AA", () => {
    expect(contrastRatio("#F4F8F5", "#003F35")).toBeGreaterThan(11);
    expect(contrastRatio("#003F35", "#77FF70")).toBeGreaterThan(9);
  });

  it("labels deterministic output as preview and refuses metadata-only revision", async () => {
    const provider = new DeterministicSvgProvider();
    expect(await provider.capabilities()).toEqual(expect.objectContaining({ create: "PREVIEW", revise: "MANUAL_HANDOFF_REQUIRED" }));
    const brief: DesignBrief = {
      id: "00000000-0000-4000-8000-000000000010",
      contentItemId: "00000000-0000-4000-8000-000000000011",
      communicationGoal: "Explain one controlled handoff.",
      visualConcept: "A path keeps context attached.",
      focalPoint: "handoff seam",
      hierarchy: ["seam", "headline"],
      layoutFamily: "preview-light",
      canvas: { width: 1080, height: 1350 },
      imageDirection: "preview geometry",
      typographyDirection: "Arabic RTL",
      palette: ["#003F35", "#0EDB23"],
      whitespaceTarget: 0.42,
      exactText: ["السياق يبقى متصلاً"],
      mobileConstraints: ["Inspect final raster pixels."],
      referenceIds: [],
      forbiddenCliches: ["robot"],
      envelope: {
        schemaVersion: "1.0.0",
        modelVersion: null,
        promptVersion: "preview-test",
        skillVersions: [],
        templateVersion: null,
        traceId: "00000000-0000-4000-8000-000000000012",
        createdAt: "2026-08-23T10:00:00.000Z",
        sources: [],
      },
    };
    const [draft] = await provider.create(brief);
    await expect(provider.revise(draft!.id, { instructions: ["Make it more polished"] })).rejects.toThrow("cannot apply a truthful pixel revision");
  });
});

describe("SOCIAL_MEDIA_PLUGIN offline creative evaluator", () => {
  it("clears objective gates but never claims a visual critic pass", () => {
    const svg = renderSocialSvg(arabicLight);
    const evaluation = evaluateTechnicalCreativePreflight({ input: arabicLight, svg, assetLicenseStatus: "NOT_REQUIRED" });

    expect(evaluation.hardFails).toEqual([]);
    expect(evaluation.decision).toBe("TECHNICAL_PREFLIGHT_PASSED_PIXEL_REVIEW_REQUIRED");
    expect(evaluation.aestheticEvaluation).toEqual(expect.objectContaining({ performed: false, score: null }));
    expect(evaluation.visualInspection).toEqual(expect.objectContaining({ required: true, status: "NOT_PERFORMED" }));
  });

  it("hard-fails Arabic copy rendered in the wrong direction", () => {
    const input: SocialSvgInput = { ...arabicLight, direction: "ltr" };
    const evaluation = evaluateTechnicalCreativePreflight({ input, svg: renderSocialSvg(input), assetLicenseStatus: "NOT_REQUIRED" });

    expect(evaluation.hardFails.map((failure) => failure.code)).toContain("RTL_DIRECTION_MISMATCH");
    expect(evaluation.decision).toBe("REJECTED_BY_TECHNICAL_PREFLIGHT");
  });

  it("hard-fails unknown asset licensing", () => {
    const evaluation = evaluateTechnicalCreativePreflight({ input: arabicLight, svg: renderSocialSvg(arabicLight), assetLicenseStatus: "UNKNOWN" });

    expect(evaluation.hardFails.map((failure) => failure.code)).toContain("UNAPPROVED_LICENSE");
  });

  it("hard-fails unsafe copy density and clipping risk", () => {
    const input: SocialSvgInput = {
      ...arabicLight,
      headline: "عنوان ".repeat(20),
      support: "تفاصيل كثيرة لا تصلح لتصميم اجتماعي يقرأ على شاشة هاتف صغيرة. ".repeat(5),
    };
    const evaluation = evaluateTechnicalCreativePreflight({ input, svg: renderSocialSvg(input), assetLicenseStatus: "NOT_REQUIRED" });
    const codes = evaluation.hardFails.map((failure) => failure.code);

    expect(codes).toContain("TEXT_CLIPPING_RISK");
    expect(codes).toContain("TEXT_DENSITY_EXCEEDED");
  });

  it("hard-fails a tampered, noncanonical low-contrast palette", () => {
    const svg = renderSocialSvg(arabicLight)
      .replace('data-social-primary="#003F35"', 'data-social-primary="#E7ECE8"')
      .replace('data-social-secondary="#3A5145"', 'data-social-secondary="#DCE3DE"');
    const evaluation = evaluateTechnicalCreativePreflight({ input: arabicLight, svg, assetLicenseStatus: "NOT_REQUIRED" });
    const codes = evaluation.hardFails.map((failure) => failure.code);

    expect(codes).toContain("WRONG_BRAND_COLOR");
    expect(codes).toContain("LOW_CONTRAST_PRIMARY");
    expect(codes).toContain("LOW_CONTRAST_SECONDARY");
  });

  it("hard-fails a missing canonical logo fingerprint", () => {
    const svg = renderSocialSvg(arabicLight).replace(/ data-source-sha256="[a-f0-9]{64}"/u, "");
    const evaluation = evaluateTechnicalCreativePreflight({ input: arabicLight, svg, assetLicenseStatus: "NOT_REQUIRED" });

    expect(evaluation.hardFails.map((failure) => failure.code)).toContain("WRONG_LOGO");
  });

  it("finds exact duplicate creatives without treating variants as duplicates", () => {
    const first = renderSocialSvg(arabicLight);
    const variant = renderSocialSvg({ ...arabicLight, mode: "dark" });

    expect(duplicateCreativeFingerprints([first, variant])).toEqual([]);
    expect(duplicateCreativeFingerprints([first, variant, first])).toEqual([fingerprintSvg(first)]);
  });
});
