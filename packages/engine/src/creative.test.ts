import { describe, expect, it } from "vitest";
import {
  contrastRatio,
  duplicateCreativeFingerprints,
  evaluateSocialCreative,
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

describe("AURENDOR deterministic creative renderer", () => {
  it("renders a stable fingerprint and escapes exact copy", () => {
    const input = { ...arabicLight, headline: "قرار < أسرع & أوضح" };
    const first = renderSocialSvg(input);
    const second = renderSocialSvg(input);

    expect(fingerprintSvg(first)).toBe(fingerprintSvg(second));
    expect(first).toContain("قرار &lt; أسرع &amp; أوضح");
    expect(first).toContain('data-aurendor-brand-version="final-2026.1"');
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
});

describe("AURENDOR offline creative evaluator", () => {
  it("clears objective gates but never claims a visual critic pass", () => {
    const svg = renderSocialSvg(arabicLight);
    const evaluation = evaluateSocialCreative({ input: arabicLight, svg, assetLicenseStatus: "NOT_REQUIRED" });

    expect(evaluation.hardFails).toEqual([]);
    expect(evaluation.decision).toBe("AUTOMATED_CHECKS_PASSED_VISUAL_REVIEW_REQUIRED");
    expect(evaluation.rubric.diagnosticTotal).toBe(88.5);
    expect(evaluation.rubric.diagnosticTotal).toBeLessThan(evaluation.rubric.publicationCandidateThreshold);
    expect(evaluation.visualInspection).toEqual(expect.objectContaining({ required: true, status: "NOT_PERFORMED" }));
  });

  it("hard-fails Arabic copy rendered in the wrong direction", () => {
    const input: SocialSvgInput = { ...arabicLight, direction: "ltr" };
    const evaluation = evaluateSocialCreative({ input, svg: renderSocialSvg(input), assetLicenseStatus: "NOT_REQUIRED" });

    expect(evaluation.hardFails.map((failure) => failure.code)).toContain("RTL_DIRECTION_MISMATCH");
    expect(evaluation.decision).toBe("REJECTED_BY_AUTOMATION");
  });

  it("hard-fails unknown asset licensing", () => {
    const evaluation = evaluateSocialCreative({ input: arabicLight, svg: renderSocialSvg(arabicLight), assetLicenseStatus: "UNKNOWN" });

    expect(evaluation.hardFails.map((failure) => failure.code)).toContain("UNAPPROVED_LICENSE");
  });

  it("hard-fails unsafe copy density and clipping risk", () => {
    const input: SocialSvgInput = {
      ...arabicLight,
      headline: "عنوان ".repeat(20),
      support: "تفاصيل كثيرة لا تصلح لتصميم اجتماعي يقرأ على شاشة هاتف صغيرة. ".repeat(5),
    };
    const evaluation = evaluateSocialCreative({ input, svg: renderSocialSvg(input), assetLicenseStatus: "NOT_REQUIRED" });
    const codes = evaluation.hardFails.map((failure) => failure.code);

    expect(codes).toContain("TEXT_CLIPPING_RISK");
    expect(codes).toContain("TEXT_DENSITY_EXCEEDED");
  });

  it("hard-fails a tampered, noncanonical low-contrast palette", () => {
    const svg = renderSocialSvg(arabicLight)
      .replace('data-aurendor-primary="#003F35"', 'data-aurendor-primary="#E7ECE8"')
      .replace('data-aurendor-secondary="#3A5145"', 'data-aurendor-secondary="#DCE3DE"');
    const evaluation = evaluateSocialCreative({ input: arabicLight, svg, assetLicenseStatus: "NOT_REQUIRED" });
    const codes = evaluation.hardFails.map((failure) => failure.code);

    expect(codes).toContain("WRONG_BRAND_COLOR");
    expect(codes).toContain("LOW_CONTRAST_PRIMARY");
    expect(codes).toContain("LOW_CONTRAST_SECONDARY");
  });

  it("hard-fails a missing canonical logo fingerprint", () => {
    const svg = renderSocialSvg(arabicLight).replace(/ data-source-sha256="[a-f0-9]{64}"/u, "");
    const evaluation = evaluateSocialCreative({ input: arabicLight, svg, assetLicenseStatus: "NOT_REQUIRED" });

    expect(evaluation.hardFails.map((failure) => failure.code)).toContain("WRONG_LOGO");
  });

  it("finds exact duplicate creatives without treating variants as duplicates", () => {
    const first = renderSocialSvg(arabicLight);
    const variant = renderSocialSvg({ ...arabicLight, mode: "dark" });

    expect(duplicateCreativeFingerprints([first, variant])).toEqual([]);
    expect(duplicateCreativeFingerprints([first, variant, first])).toEqual([fingerprintSvg(first)]);
  });
});
