import { createHash, randomUUID } from "node:crypto";
import {
  CopyPackageSchema,
  type CopyPackage,
  type Platform,
} from "@social-media-plugin/schemas";
import { antiGenericScore, detectGenericCopy } from "./content";

export interface CopyPackageInput {
  contentItemId: string;
  language: "ar" | "en";
  tension: string;
  keyMessage: string;
  perceptionShift: string;
  cta: string;
  platforms: Platform[];
  assetIds?: string[];
  verifiedClaimSources?: Record<string, string[]>;
  traceId?: string;
  now?: Date;
}

interface NarrativeAngle {
  id: string;
  premise: string;
  hook: string;
}

function sha(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function narrativeAngles(input: CopyPackageInput): NarrativeAngle[] {
  if (input.language === "ar") {
    return [
      {
        id: "diagnose-the-friction",
        premise: `تشخيص الخلل التشغيلي: ${input.tension}`,
        hook: "إذا كانت المتابعة تعتمد على التذكّر، فالمشكلة بالنظام مو بالفريق.",
      },
      {
        id: "map-the-system",
        premise: `تحويل الفكرة إلى خريطة عمل: ${input.keyMessage}`,
        hook: "قبل ما تضيف أداة جديدة، ارسم مسار القرار من أوله لآخره.",
      },
      {
        id: "show-the-control-point",
        premise: `إظهار نقطة السيطرة التي تغيّر النتيجة: ${input.perceptionShift}`,
        hook: "أقوى أتمتة تبدأ من سؤال واحد: وين تتوقف المعلومة؟",
      },
    ];
  }
  return [
    {
      id: "diagnose-the-friction",
      premise: `Diagnose the operating friction: ${input.tension}`,
      hook: "When follow-up depends on memory, the system—not the team—is the constraint.",
    },
    {
      id: "map-the-system",
      premise: `Map the operating system behind the idea: ${input.keyMessage}`,
      hook: "Before adding another tool, map the decision from signal to owner to action.",
    },
    {
      id: "show-the-control-point",
      premise: `Reveal the control point behind the shift: ${input.perceptionShift}`,
      hook: "Useful automation starts with one question: where does information stop moving?",
    },
  ];
}

function platformCaption(input: CopyPackageInput, angle: NarrativeAngle, platform: Platform): string {
  if (input.language === "ar") {
    if (platform === "linkedin") {
      return `${angle.hook}\n\n${input.tension}\n\n${input.keyMessage}\n\nالخطوة العملية: ثبّت نقطة دخول المعلومة، صاحب القرار، والإجراء التالي في مسار واحد يمكن قياسه. ${input.perceptionShift}\n\n${input.cta}`;
    }
    if (platform === "instagram") {
      return `${angle.hook}\n\n${input.keyMessage}\n\nابدأ بمسار واحد متكرر: مدخل واضح، مسؤول واضح، ونتيجة قابلة للمتابعة.\n\n${input.cta}`;
    }
    return `${angle.hook}\n\n${input.keyMessage}\n\n${input.cta}`;
  }
  if (platform === "linkedin") {
    return `${angle.hook}\n\n${input.tension}\n\n${input.keyMessage}\n\nA practical first move: define one entry point, one accountable owner, and one measurable next action. ${input.perceptionShift}\n\n${input.cta}`;
  }
  if (platform === "instagram") {
    return `${angle.hook}\n\n${input.keyMessage}\n\nStart with one repeated workflow: a clear input, a clear owner, and a visible outcome.\n\n${input.cta}`;
  }
  return `${angle.hook}\n\n${input.keyMessage}\n\n${input.cta}`;
}

function extractEvidenceSensitiveClaims(text: string): string[] {
  return text
    .split(/(?<=[.!?؟])\s+|\n+/u)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .filter((sentence) => /\d+(?:\.\d+)?\s*(?:%|percent|hours?|days?|weeks?|months?|دقيقة|دقائق|ساعة|ساعات|يوم|أيام|أسبوع|أسابيع|شهر|أشهر)/iu.test(sentence));
}

function copyScore(text: string): number {
  const generic = antiGenericScore(text);
  const usefulStructure = /خطوة|مسار|مسؤول|نتيجة|step|workflow|owner|outcome/iu.test(text) ? 5 : 0;
  const promotionalPenalty = (text.match(/اشتر|buy now|limited time|الأفضل|best/giu) ?? []).length * 8;
  return Math.max(0, Math.min(100, generic + usefulStructure - promotionalPenalty));
}

export function buildCopyPackage(input: CopyPackageInput): CopyPackage {
  const angles = narrativeAngles(input);
  const ranked = angles
    .map((angle) => ({ angle, score: copyScore(platformCaption(input, angle, input.platforms[0] ?? "manual")) }))
    .sort((left, right) => right.score - left.score || left.angle.id.localeCompare(right.angle.id));
  const selected = ranked[0]?.angle;
  if (!selected) throw new Error("At least one copy angle is required.");
  const platformVariants = input.platforms.map((platform) => {
    const caption = platformCaption(input, selected, platform);
    return {
      platform,
      caption,
      hashtags: platform === "instagram" ? ["#اورندور", "#أتمتة", "#ذكاء_تشغيلي"] : ["#Social Media Plugin", "#OperationalAI"],
      altText: input.language === "ar"
        ? `تصميم من اورندور يشرح: ${input.keyMessage}`
        : `SOCIAL_MEDIA_PLUGIN editorial graphic explaining: ${input.keyMessage}`,
      cta: input.cta,
    };
  });
  const allCopy = platformVariants.map((variant) => variant.caption).join("\n");
  const sensitiveClaims = extractEvidenceSensitiveClaims(allCopy);
  const claimChecks = sensitiveClaims.map((claim) => {
    const sourceIds = input.verifiedClaimSources?.[claim] ?? [];
    return { claim, state: sourceIds.length > 0 ? "supported" as const : "unsupported" as const, sourceIds };
  });
  const unsupportedClaims = claimChecks.filter((claim) => claim.state === "unsupported");
  const createdAt = (input.now ?? new Date()).toISOString();
  const artifact = {
    schemaVersion: "1.0.0" as const,
    artifactId: `copy-package-${sha(`${input.contentItemId}:${createdAt}`).slice(0, 24)}`,
    artifactType: "copy_package" as const,
    skill: input.language === "ar" ? "social-arabic-copywriter" : "social-english-copywriter",
    skillVersion: "1.0.0",
    modelVersion: "none",
    promptVersion: "deterministic-copy-v1",
    traceId: input.traceId ?? randomUUID(),
    createdAt,
    inputRefs: [{ artifactId: input.contentItemId, version: "current" }],
    evidence: [],
    warnings: unsupportedClaims.length > 0 ? ["One or more evidence-sensitive claims require support before approval."] : [],
    status: unsupportedClaims.length > 0 ? "needs_evidence" as const : "needs_approval" as const,
    contentItemId: input.contentItemId,
    language: input.language,
    locale: input.language === "ar" ? "ar-IQ" : "en",
    angles,
    selectedAngleId: selected.id,
    selectionRationale: `Selected on deterministic editorial score (${ranked[0]?.score ?? 0}/100), specificity, and low generic-language risk.`,
    platformVariants,
    onDesignCopy: [selected.hook, input.keyMessage].map((value) => value.slice(0, 180)),
    carouselSlides: [
      { sequence: 1, text: selected.hook },
      { sequence: 2, text: input.tension },
      { sequence: 3, text: input.perceptionShift },
      { sequence: 4, text: input.cta },
    ],
    altTextByAsset: (input.assetIds ?? []).map((assetId) => ({
      assetId,
      altText: input.language === "ar" ? `تصميم اورندور حول ${input.keyMessage}` : `SOCIAL_MEDIA_PLUGIN graphic about ${input.keyMessage}`,
    })),
    claimChecks,
    editorialScores: Object.fromEntries(platformVariants.map((variant) => [variant.platform, copyScore(variant.caption)])),
    rejectedVariantIds: ranked.slice(1).map(({ angle }) => angle.id),
  };
  return CopyPackageSchema.parse(artifact);
}

export function copyQualityFindings(copyPackage: CopyPackage): string[] {
  const findings = copyPackage.platformVariants.flatMap((variant) =>
    detectGenericCopy(variant.caption).map((finding) => `${variant.platform}: ${finding.excerpt}`),
  );
  for (const claim of copyPackage.claimChecks) {
    if (claim.state === "unsupported") findings.push(`Unsupported claim: ${claim.claim}`);
  }
  return findings;
}
