import { describe, expect, it } from "vitest";
import { buildCopyPackage, copyQualityFindings } from "./copy";

const base = {
  contentItemId: "content-copy-fixture",
  tension: "متابعة الطلبات موزعة بين الرسائل والذاكرة الشخصية.",
  keyMessage: "المسار الواضح يجعل القرار والمتابعة قابلين للقياس.",
  perceptionShift: "الأتمتة بنية تشغيلية وليست مجرد أداة إضافية.",
  cta: "احفظ الخريطة وطبّقها على مسار واحد هذا الأسبوع.",
  platforms: ["instagram", "linkedin"] as const,
  now: new Date("2026-08-23T09:00:00.000Z"),
};

describe("copy production", () => {
  it("produces three materially distinct Arabic angles and platform-native variants", () => {
    const result = buildCopyPackage({ ...base, language: "ar", platforms: [...base.platforms] });
    expect(new Set(result.angles.map((angle) => angle.id)).size).toBe(3);
    expect(result.platformVariants).toHaveLength(2);
    expect(result.platformVariants[0]?.caption).not.toBe(result.platformVariants[1]?.caption);
    expect(copyQualityFindings(result)).toEqual([]);
  });

  it("blocks quantified operational claims that have no evidence", () => {
    const result = buildCopyPackage({
      ...base,
      language: "en",
      platforms: ["linkedin"],
      keyMessage: "The workflow saves 40% of review time.",
      perceptionShift: "A structured workflow makes handoffs visible.",
      tension: "Review work is fragmented.",
      cta: "Map one workflow.",
    });
    expect(result.status).toBe("needs_evidence");
    expect(copyQualityFindings(result).some((finding) => finding.startsWith("Unsupported claim:"))).toBe(true);
  });
});
