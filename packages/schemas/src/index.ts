import { z } from "zod";

export const SCHEMA_VERSION = "1.0.0" as const;

export const PlatformSchema = z.enum([
  "instagram",
  "facebook",
  "linkedin",
  "tiktok",
  "youtube",
  "x",
  "manual",
]);

export const ContentFormatSchema = z.enum([
  "single_image",
  "carousel",
  "story",
  "reel",
  "video",
  "text",
  "document",
  "multi_image",
]);

export const LanguageSchema = z.enum(["ar", "en", "bilingual"]);
export const FunnelStageSchema = z.enum(["awareness", "consideration", "conversion", "retention"]);
export const RiskLevelSchema = z.enum(["low", "medium", "high", "critical"]);
export const ApprovalClassSchema = z.enum(["AUTO", "MONTHLY_APPROVAL", "ITEM_APPROVAL"]);
export const ContentStatusSchema = z.enum([
  "DRAFT",
  "NEEDS_REVIEW",
  "REVISION_REQUESTED",
  "APPROVED",
  "SCHEDULED",
  "PUBLISHING",
  "PUBLISHED",
  "FAILED",
  "BLOCKED",
  "CANCELLED",
]);

export const CapabilityStateSchema = z.enum([
  "AVAILABLE",
  "UNAVAILABLE_PERMISSION",
  "UNAVAILABLE_PLAN",
  "UNAVAILABLE_POLICY",
  "PREVIEW",
  "MANUAL_HANDOFF_REQUIRED",
  "NOT_CONFIGURED",
]);

export const WorkflowStatusSchema = z.enum([
  "PENDING",
  "RUNNING",
  "WAITING_FOR_APPROVAL",
  "WAITING_FOR_RETRY",
  "SUCCEEDED",
  "FAILED",
  "DEAD_LETTER",
  "CANCELLED",
]);

export const SourceReferenceSchema = z.object({
  sourceId: z.string().min(1),
  path: z.string().min(1),
  title: z.string().min(1),
  authority: z.enum(["canonical", "high", "medium", "historical", "reference"]),
  retrievedAt: z.string().datetime(),
  excerpt: z.string().max(500).optional(),
  url: z.string().url().optional(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/).optional(),
});

export const ArtifactEnvelopeSchema = z.object({
  schemaVersion: z.string().min(1).default(SCHEMA_VERSION),
  modelVersion: z.string().min(1).nullable(),
  promptVersion: z.string().min(1),
  skillVersions: z.array(z.string().min(1)),
  templateVersion: z.string().min(1).nullable(),
  traceId: z.string().uuid(),
  createdAt: z.string().datetime(),
  sources: z.array(SourceReferenceSchema),
});

export const MonthlyStrategySchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  objective: z.string().min(10),
  businessPriorities: z.array(z.string().min(3)).min(1),
  narrativeArc: z.array(z.string().min(3)).min(1),
  targetAudiences: z.array(z.string().min(2)).min(1),
  pillarMix: z.record(z.string(), z.number().min(0).max(1)),
  cadence: z.object({
    feedPerWeek: z.number().int().min(0).max(14),
    storiesPerWeek: z.number().int().min(0).max(35),
    videosPerMonth: z.number().int().min(0).max(60),
  }),
  primaryKpis: z.array(z.string().min(2)).min(1),
  experimentAllocation: z.number().min(0).max(0.5),
  status: z.enum(["DRAFT", "IN_REVIEW", "APPROVED", "REVISION_REQUESTED", "ARCHIVED"]),
  analysisWindow: z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
    timezone: z.string().min(1),
  }),
  envelope: ArtifactEnvelopeSchema,
});

export const ContentItemSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  strategyId: z.string().uuid(),
  externalKey: z.string().min(1),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  strategicObjective: z.string().min(3),
  audience: z.string().min(2),
  funnelStage: FunnelStageSchema,
  contentPillar: z.string().min(2),
  tension: z.string().min(3),
  keyMessage: z.string().min(3),
  perceptionShift: z.string().min(3),
  format: ContentFormatSchema,
  platforms: z.array(PlatformSchema).min(1),
  language: LanguageSchema,
  hookHypothesis: z.string().min(3),
  creativeHypothesis: z.string().min(3),
  proofRequirements: z.array(z.string().min(2)),
  cta: z.string().min(2),
  kpiHierarchy: z.array(z.string().min(2)).min(1),
  scheduledAt: z.string().datetime(),
  timezone: z.string().min(1),
  status: ContentStatusSchema,
  approvalClass: ApprovalClassSchema,
  riskLevel: RiskLevelSchema,
  riskReasons: z.array(z.string()),
  experimentId: z.string().uuid().nullable(),
  relatedPriorPostIds: z.array(z.string().uuid()),
  antiRepetitionScore: z.number().min(0).max(100),
  isDemo: z.boolean(),
  qaFlags: z.array(z.string()),
  envelope: ArtifactEnvelopeSchema,
});

export const CopyVariantSchema = z.object({
  id: z.string().uuid(),
  contentItemId: z.string().uuid(),
  platform: PlatformSchema,
  language: LanguageSchema,
  angle: z.string().min(3),
  onDesignCopy: z.array(z.string().min(1)).min(1),
  caption: z.string().min(1),
  altText: z.string().min(1),
  hashtags: z.array(z.string().regex(/^#[^\s#]+$/)).max(10),
  factualClaims: z.array(
    z.object({
      claim: z.string().min(2),
      sourceIds: z.array(z.string().min(1)),
      status: z.enum(["SUPPORTED", "UNSUPPORTED", "NEEDS_REVIEW"]),
    }),
  ),
  editorialScore: z.number().min(0).max(100),
  selected: z.boolean(),
  envelope: ArtifactEnvelopeSchema,
});

export const DesignBriefSchema = z.object({
  id: z.string().uuid(),
  contentItemId: z.string().uuid(),
  communicationGoal: z.string().min(3),
  visualConcept: z.string().min(3),
  focalPoint: z.string().min(2),
  hierarchy: z.array(z.string().min(2)).min(1),
  layoutFamily: z.string().min(2),
  canvas: z.object({ width: z.number().int().positive(), height: z.number().int().positive() }),
  imageDirection: z.string().min(2),
  typographyDirection: z.string().min(2),
  palette: z.array(z.string().regex(/^#[0-9A-Fa-f]{6}$/)).min(2).max(8),
  whitespaceTarget: z.number().min(0.3).max(0.6),
  exactText: z.array(z.string().min(1)).min(1),
  mobileConstraints: z.array(z.string().min(2)).min(1),
  referenceIds: z.array(z.string().min(1)).max(10),
  forbiddenCliches: z.array(z.string().min(2)),
  envelope: ArtifactEnvelopeSchema,
});

export const RenderedAssetSchema = z.object({
  id: z.string().uuid(),
  contentItemId: z.string().uuid(),
  designBriefId: z.string().uuid(),
  provider: z.enum(["deterministic_svg", "canva", "imported", "manual"]),
  providerDraftId: z.string().nullable(),
  editableUrl: z.string().url().nullable(),
  storagePath: z.string().min(1),
  publicUrl: z.string().url().nullable(),
  mimeType: z.string().min(3),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  sequence: z.number().int().min(0),
  sourcePath: z.string().nullable(),
  licenseStatus: z.enum(["OWNED", "LICENSED", "UNKNOWN", "NOT_REQUIRED"]),
  envelope: ArtifactEnvelopeSchema,
});

export const CreativeScoreSchema = z.object({
  conceptOriginality: z.number().min(0).max(14),
  hierarchy: z.number().min(0).max(12),
  typography: z.number().min(0).max(12),
  compositionGrid: z.number().min(0).max(10),
  brandDistinctiveness: z.number().min(0).max(10),
  messageClarity: z.number().min(0).max(10),
  readability: z.number().min(0).max(8),
  whitespace: z.number().min(0).max(7),
  graphicQuality: z.number().min(0).max(6),
  colorContrast: z.number().min(0).max(5),
  platformSuitability: z.number().min(0).max(3),
  polish: z.number().min(0).max(3),
});

export const CritiqueSchema = z
  .object({
    id: z.string().uuid(),
    renderedAssetId: z.string().uuid(),
    critic: z.enum(["VISUAL_A", "VISUAL_B", "EDITORIAL", "BRAND_GUARDIAN", "ADJUDICATOR"]),
    scores: CreativeScoreSchema,
    total: z.number().min(0).max(100),
    hardFails: z.array(z.string()),
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    revisionInstructions: z.array(z.string()),
    decision: z.enum(["PASS", "REVISE", "REGENERATE", "ESCALATE"]),
    envelope: ArtifactEnvelopeSchema,
  })
  .superRefine((value, context) => {
    if (value.decision === "PASS" && value.hardFails.length > 0) {
      context.addIssue({
        code: "custom",
        path: ["decision"],
        message: "A creative with a hard fail cannot pass.",
      });
    }
  });

export const DesignPurposeSchema = z.enum([
  "awareness",
  "education",
  "promotion",
  "announcement",
  "engagement",
  "product-introduction",
  "service-explanation",
  "thought-leadership",
  "event",
  "statistic",
  "case-study",
  "storytelling",
  "brand-building",
  "conversion",
  "editorial",
]);

export const VisualFamilySchema = z.enum([
  "conceptual-hero",
  "editorial-statement",
  "product-system-story",
  "data-story",
  "character-narrative",
  "process-explainer",
  "before-after",
  "case-study",
  "announcement",
  "arabic-educational-carousel",
]);

export const ImageryModeSchema = z.enum([
  "bespoke-photography",
  "conceptual-photomanipulation",
  "bespoke-3d",
  "conceptual-illustration",
  "product-ui",
  "typography-led",
  "abstract-system",
  "no-imagery",
]);

export const AnthropomorphismLevelSchema = z.number().int().min(0).max(5);

export const ReferencePrincipleUseSchema = z.object({
  referenceId: z.string().min(8),
  principleId: z.string().min(3),
  learnedPrinciple: z.string().min(12),
  whyRelevant: z.string().min(12),
  mustNotCopy: z.string().min(12),
  rightsState: z.literal("REFERENCE_ONLY"),
});

const CompositionZoneSchema = z.object({
  name: z.string().min(2),
  role: z.enum(["focal", "support", "evidence", "brand", "negative-space"]),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().positive().max(1),
  height: z.number().positive().max(1),
});

export const CreativeConceptCandidateSchema = z
  .object({
    candidateId: z.string().min(3),
    title: z.string().min(3),
    purpose: DesignPurposeSchema,
    audienceTension: z.string().min(12),
    desiredFeeling: z.string().min(5),
    twoSecondTakeaway: z.string().min(8),
    singleVisualIdea: z.string().min(16),
    textlessComprehension: z.string().min(12),
    visualMetaphor: z.string().min(12),
    storytellingMechanism: z.string().min(12),
    verbalVisualRelationship: z.string().min(12),
    visualFamily: VisualFamilySchema,
    anthropomorphism: z.object({
      level: AnthropomorphismLevelSchema,
      behaviorHumanized: z.string().min(3),
      comprehensionBenefit: z.string().min(8),
      faceRequired: z.boolean(),
      faceTestResult: z.string().min(8),
      emotionalRegister: z.string().min(3),
      capabilityBoundary: z.string().min(8),
      childishnessRisk: z.enum(["low", "medium", "high"]),
    }),
    composition: z.object({
      focalPoint: z.string().min(3),
      focalWeight: z.number().min(0.35).max(0.8),
      centerOfGravity: z.enum(["left", "right", "center", "upper", "lower", "diagonal"]),
      eyePath: z.array(z.string().min(2)).min(2).max(6),
      grid: z.object({ columns: z.number().int().min(2).max(12), baseUnit: z.number().int().positive(), intentionalBreak: z.string().min(3).nullable() }),
      zones: z.array(CompositionZoneSchema).min(3).max(8),
      foreground: z.string().min(3),
      middleGround: z.string().min(3),
      background: z.string().min(3),
      negativeSpacePurpose: z.string().min(8),
    }),
    typography: z.object({
      language: LanguageSchema,
      direction: z.enum(["rtl", "ltr"]),
      headlineLines: z.array(z.string().min(1)).min(1).max(4),
      displayScaleRatio: z.number().min(2).max(8),
      alignment: z.enum(["start", "end", "center", "mixed-intentional"]),
      interactionWithImagery: z.string().min(8),
      arabicSpecificDecision: z.string().min(8).nullable(),
    }),
    imagery: z.object({
      mode: ImageryModeSchema,
      subject: z.string().min(3),
      crop: z.string().min(3),
      perspective: z.string().min(3),
      lighting: z.string().min(3),
      material: z.string().min(3),
      texture: z.string().min(3),
      relationToTypography: z.string().min(8),
      assetPlan: z.array(z.object({ asset: z.string().min(2), source: z.enum(["generated-bespoke", "owned", "licensed", "product-ui", "native-shape", "none"]), licenseEvidence: z.string().min(2) })).min(1),
    }),
    referenceUses: z.array(ReferencePrincipleUseSchema).min(3).max(6),
    forbiddenAdditions: z.array(z.string().min(3)).min(3),
    originalityRationale: z.string().min(24),
    professionalChoiceRationale: z.string().min(24),
    risks: z.array(z.string().min(3)),
  })
  .superRefine((value, context) => {
    if (new Set(value.referenceUses.map((item) => item.referenceId)).size < 3) {
      context.addIssue({ code: "custom", path: ["referenceUses"], message: "At least three distinct professional references are required to prevent single-reference imitation." });
    }
    if (value.typography.language === "ar" && value.typography.direction !== "rtl") {
      context.addIssue({ code: "custom", path: ["typography", "direction"], message: "Arabic concepts must be composed RTL from the beginning." });
    }
    if (value.typography.language === "ar" && !value.typography.arabicSpecificDecision) {
      context.addIssue({ code: "custom", path: ["typography", "arabicSpecificDecision"], message: "Arabic concepts require an explicit Arabic typographic decision." });
    }
  });

export const ConceptTournamentSchema = z
  .object({
    candidates: z.array(CreativeConceptCandidateSchema).min(3).max(6),
    pairwiseComparisons: z.array(
      z.object({
        candidateAId: z.string().min(3),
        candidateBId: z.string().min(3),
        winnerId: z.string().min(3),
        conceptReason: z.string().min(12),
        communicationReason: z.string().min(12),
        executionRisk: z.string().min(8),
      }),
    ).min(2),
    selectedCandidateIds: z.array(z.string().min(3)).min(1).max(2),
    rejectedCandidates: z.array(z.object({ candidateId: z.string().min(3), reason: z.string().min(12) })).min(1),
  })
  .superRefine((value, context) => {
    const candidateIds = new Set(value.candidates.map((candidate) => candidate.candidateId));
    for (const selected of value.selectedCandidateIds) {
      if (!candidateIds.has(selected)) context.addIssue({ code: "custom", path: ["selectedCandidateIds"], message: `Unknown selected candidate: ${selected}` });
    }
    for (const comparison of value.pairwiseComparisons) {
      if (![comparison.candidateAId, comparison.candidateBId].includes(comparison.winnerId)) {
        context.addIssue({ code: "custom", path: ["pairwiseComparisons"], message: "Pairwise winner must be one of the compared candidates." });
      }
    }
  });

export const ProfessionalDesignBriefSchema = DesignBriefSchema.extend({
  intelligenceVersion: z.string().min(3),
  purpose: DesignPurposeSchema,
  desiredFeeling: z.string().min(5),
  twoSecondTakeaway: z.string().min(8),
  selectedCandidateId: z.string().min(3),
  conceptTournament: ConceptTournamentSchema,
  exactLineBreaks: z.array(z.string().min(1)).min(1).max(8),
  referenceUses: z.array(ReferencePrincipleUseSchema).min(3).max(6),
  recentFeedConstraints: z.object({
    comparedPostIds: z.array(z.string()),
    prohibitedRepeatedStructures: z.array(z.string()),
    targetRhythmRole: z.enum(["anchor", "breath", "energy", "information", "narrative"]),
  }),
  originalityCheck: z.object({ nearestReferenceIds: z.array(z.string()), reviewerRequired: z.boolean(), rationale: z.string().min(16) }),
}).superRefine((value, context) => {
  if (!value.conceptTournament.candidates.some((candidate) => candidate.candidateId === value.selectedCandidateId)) {
    context.addIssue({ code: "custom", path: ["selectedCandidateId"], message: "Selected candidate must exist in the concept tournament." });
  }
  if (!value.conceptTournament.selectedCandidateIds.includes(value.selectedCandidateId)) {
    context.addIssue({ code: "custom", path: ["selectedCandidateId"], message: "Selected candidate must have won the concept tournament." });
  }
});

export const ProfessionalCreativeScoreSchema = z.object({
  concept: z.number().min(0).max(20),
  composition: z.number().min(0).max(20),
  typography: z.number().min(0).max(20),
  visualCraft: z.number().min(0).max(20),
  brand: z.number().min(0).max(20),
  communication: z.number().min(0).max(20),
  professionalPolish: z.number().min(0).max(20),
  distinctiveness: z.number().min(0).max(20),
});

export const ProfessionalCriticRoleSchema = z.enum([
  "SENIOR_ART_DIRECTOR",
  "SENIOR_GRAPHIC_DESIGNER",
  "SOCIAL_PERFORMANCE_STRATEGIST",
  "ARABIC_DESIGN_REVIEWER",
]);

export const ProfessionalCreativeHardFailSchema = z.enum([
  "OBVIOUS_TEMPLATE_APPEARANCE",
  "GENERIC_AI_ROBOT",
  "UNREADABLE_ARABIC",
  "ARBITRARY_ICON",
  "POOR_TYPOGRAPHY",
  "WEAK_HIERARCHY",
  "EXCESSIVE_TEXT",
  "RANDOM_GRADIENT",
  "MEANINGLESS_DECORATION",
  "LOW_RESOLUTION_IMAGERY",
  "BROKEN_PERSPECTIVE",
  "AI_ARTIFACT",
  "INCONSISTENT_CHARACTER",
  "OBJECTIFYING_CASTING",
  "FEMALE_USED_AS_ATTENTION_DEVICE",
  "UNJUSTIFIED_HUMAN_SUBJECT",
  "CASTING_POLICY_MISMATCH",
  "LOGO_MISUSE",
  "NO_FOCAL_POINT",
  "NO_VISUAL_CONCEPT",
  "CHILDISH_ANTHROPOMORPHISM",
  "REFERENCE_TOO_CLOSE",
  "UNLICENSED_ASSET",
]);

export const ProfessionalCritiqueSchema = z
  .object({
    critiqueId: z.string().min(3),
    renderedAssetId: z.string().min(3),
    renderedAssetSha256: z.string().regex(/^[a-f0-9]{64}$/),
    criticRole: ProfessionalCriticRoleSchema,
    actualPixelsInspected: z.literal(true),
    viewingScales: z.array(z.enum(["original", "mobile", "thumbnail", "feed"])).min(2),
    scores: ProfessionalCreativeScoreSchema,
    total: z.number().min(0).max(160),
    evidenceObservations: z.array(
      z.object({
        dimension: ProfessionalCreativeScoreSchema.keyof(),
        region: z.string().min(3),
        observation: z.string().min(12),
        impact: z.enum(["positive", "neutral", "negative", "hard-fail"]),
      }),
    ).min(4),
    hardFails: z.array(ProfessionalCreativeHardFailSchema),
    professionalAnchorComparison: z.object({
      referenceIds: z.array(z.string().min(8)).min(2).max(5),
      verdict: z.enum(["materially-below", "below", "comparable", "above"]),
      observableDifferences: z.array(z.string().min(12)).min(2),
    }),
    strengths: z.array(z.string().min(8)),
    weaknesses: z.array(z.string().min(8)),
    revisionInstructions: z.array(z.string().min(12)),
    restartConcept: z.boolean(),
    decision: z.enum(["REJECT", "MAJOR_REVISION", "INSUFFICIENT", "PROFESSIONAL_CANDIDATE", "EXCELLENT"]),
  })
  .superRefine((value, context) => {
    const recomputed = Object.values(value.scores).reduce((sum, score) => sum + score, 0);
    if (Math.abs(recomputed - value.total) > 0.01) {
      context.addIssue({ code: "custom", path: ["total"], message: `Total must equal the eight rubric dimensions (${recomputed}).` });
    }
    if (value.hardFails.length && value.decision !== "REJECT") {
      context.addIssue({ code: "custom", path: ["decision"], message: "Any professional hard fail forces rejection." });
    }
    if (value.decision === "PROFESSIONAL_CANDIDATE" && value.total < 145) {
      context.addIssue({ code: "custom", path: ["decision"], message: "Professional candidates require at least 145/160." });
    }
    if (value.decision === "EXCELLENT" && value.total < 152) {
      context.addIssue({ code: "custom", path: ["decision"], message: "Excellent candidates require at least 152/160." });
    }
    if (["PROFESSIONAL_CANDIDATE", "EXCELLENT"].includes(value.decision) && ["materially-below", "below"].includes(value.professionalAnchorComparison.verdict)) {
      context.addIssue({ code: "custom", path: ["professionalAnchorComparison", "verdict"], message: "A design below its professional anchors cannot be a professional candidate." });
    }
  });

export const PairwiseCreativeComparisonSchema = z.object({
  comparisonId: z.string().min(3),
  candidateAAssetId: z.string().min(3),
  candidateBAssetId: z.string().min(3),
  blindLabelsUsed: z.boolean(),
  winner: z.enum(["A", "B", "tie-neither-professional"]),
  reasons: z.array(z.string().min(12)).min(3),
  dimensionWinners: z.record(ProfessionalCreativeScoreSchema.keyof(), z.enum(["A", "B", "tie"])),
});

export const ProfessionalCritiqueSetSchema = z
  .object({
    setId: z.string().min(3),
    renderedAssetId: z.string().min(3),
    renderedAssetSha256: z.string().regex(/^[a-f0-9]{64}$/),
    language: LanguageSchema,
    critiques: z.array(ProfessionalCritiqueSchema).min(3).max(4),
    pairwiseComparisons: z.array(PairwiseCreativeComparisonSchema),
    finalDecision: z.enum(["REJECT", "MAJOR_REVISION", "INSUFFICIENT", "PROFESSIONAL_CANDIDATE", "EXCELLENT", "BLOCKED"]),
    disagreementReasons: z.array(z.string()),
    nextAction: z.string().min(8),
  })
  .superRefine((value, context) => {
    const roles = value.critiques.map((critique) => critique.criticRole);
    const requiredRoles = ["SENIOR_ART_DIRECTOR", "SENIOR_GRAPHIC_DESIGNER", "SOCIAL_PERFORMANCE_STRATEGIST"];
    if (value.language === "ar") requiredRoles.push("ARABIC_DESIGN_REVIEWER");
    for (const role of requiredRoles) {
      if (!roles.includes(role as z.infer<typeof ProfessionalCriticRoleSchema>)) {
        context.addIssue({ code: "custom", path: ["critiques"], message: `Missing required independent critic: ${role}` });
      }
    }
    if (new Set(roles).size !== roles.length) {
      context.addIssue({ code: "custom", path: ["critiques"], message: "Critic roles must be independent and unique." });
    }
    if (value.critiques.some((critique) => critique.renderedAssetSha256 !== value.renderedAssetSha256)) {
      context.addIssue({ code: "custom", path: ["renderedAssetSha256"], message: "Every critic must inspect the exact current asset hash." });
    }
    if (["PROFESSIONAL_CANDIDATE", "EXCELLENT"].includes(value.finalDecision)) {
      if (value.critiques.some((critique) => critique.total < 145 || critique.hardFails.length > 0 || ["materially-below", "below"].includes(critique.professionalAnchorComparison.verdict))) {
        context.addIssue({ code: "custom", path: ["finalDecision"], message: "Every required critic must independently clear the professional bar with no hard fail." });
      }
    }
  });

export const ApprovalDecisionSchema = z.object({
  id: z.string().uuid(),
  contentItemId: z.string().uuid(),
  actorId: z.string().min(1),
  decision: z.enum(["APPROVE", "REJECT", "REQUEST_REVISION", "DISABLE"]),
  reasonCodes: z.array(
    z.enum([
      "too_generic",
      "too_promotional",
      "typography_poor",
      "image_unsuitable",
      "voice_wrong",
      "fact_wrong",
      "concept_weak",
      "arabic_unnatural",
      "layout_busy",
      "not_premium",
      "duplicate_idea",
      "wrong_audience",
      "other",
    ]),
  ),
  feedback: z.string().max(5000),
  decidedAt: z.string().datetime(),
  traceId: z.string().uuid(),
});

export const ProviderCapabilitySchema = z.object({
  provider: z.enum(["openai", "canva", "instagram", "facebook", "linkedin", "tiktok", "x", "youtube", "storage", "email"]),
  accountId: z.string().nullable(),
  capability: z.string().min(2),
  state: CapabilityStateSchema,
  reason: z.string().min(2),
  verifiedAt: z.string().datetime().nullable(),
  sourceUrl: z.string().url().nullable(),
  metadata: z.record(z.string(), z.unknown()),
});

const Sha256Schema = z.string().regex(/^[a-f0-9]{64}$/);

export const PublicationJobSchema = z
  .object({
    id: z.string().uuid(),
    contentItemId: z.string().min(1),
    platform: PlatformSchema,
    accountId: z.string().min(1),
    accountVerifiedAt: z.string().datetime(),
    operation: z.enum(["CREATE", "SCHEDULE", "PUBLISH", "UPLOAD_DRAFT"]),
    scheduledAt: z.string().datetime(),
    timezone: z.string().min(1),
    environment: z.enum(["DRY_RUN", "STAGING", "PRODUCTION"]),
    productionEnabled: z.boolean(),
    emergencyPaused: z.boolean(),
    materialDeviation: z.boolean(),
    status: z.enum(["PENDING", "VALIDATING", "READY", "PUBLISHING", "PUBLISHED", "FAILED", "CANCELLED", "MANUAL_HANDOFF", "RECONCILING"]),
    idempotencyKeyVersion: z.string().min(1),
    idempotencyKey: z.string().min(16),
    payloadHash: Sha256Schema,
    intentRef: z.string().min(1),
    approvedAssetHashes: z.array(Sha256Schema).min(1),
    approvedCopyHash: Sha256Schema,
    approvedBrandVersion: z.string().min(1),
    approvalEvidenceHash: Sha256Schema,
    complianceEvidenceHash: Sha256Schema,
    actorId: z.string().min(1),
    authorizationScope: z.string().min(1),
    authorizationSignature: z.string().min(16),
    authorizationExpiresAt: z.string().datetime(),
    authorizationRevokedAt: z.string().datetime().nullable(),
    providerPublicationId: z.string().nullable(),
    attemptState: z.enum(["NOT_STARTED", "INTENT_PERSISTED", "REQUEST_SENT", "ACKNOWLEDGED", "AMBIGUOUS", "VERIFIED", "FAILED"]),
    reconciliationState: z.enum(["NOT_REQUIRED", "PENDING", "MATCHED", "NOT_FOUND", "CONFLICT", "UNKNOWN"]),
    attemptCount: z.number().int().min(0),
    maxAttempts: z.number().int().min(1).max(10),
    lastErrorCode: z.string().nullable(),
    dryRun: z.boolean(),
    traceId: z.string().uuid(),
  })
  .superRefine((value, context) => {
    const productionMutation = value.environment === "PRODUCTION" && ["CREATE", "SCHEDULE", "PUBLISH"].includes(value.operation);
    if (productionMutation && (!value.productionEnabled || value.dryRun || value.emergencyPaused || value.authorizationRevokedAt)) {
      context.addIssue({ code: "custom", path: ["status"], message: "Production mutation is not authorized by the current safety state." });
    }
    if (productionMutation && value.materialDeviation) {
      context.addIssue({ code: "custom", path: ["materialDeviation"], message: "A material deviation requires a new approval before publication." });
    }
  });

export const MetricSnapshotSchema = z.object({
  id: z.string().uuid(),
  providerPublicationId: z.string().min(1),
  platform: PlatformSchema,
  capturedAt: z.string().datetime(),
  postAgeHours: z.number().min(0),
  metrics: z.object({
    impressions: z.number().min(0).nullable(),
    reach: z.number().min(0).nullable(),
    views: z.number().min(0).nullable(),
    likes: z.number().min(0).nullable(),
    comments: z.number().min(0).nullable(),
    shares: z.number().min(0).nullable(),
    saves: z.number().min(0).nullable(),
    clicks: z.number().min(0).nullable(),
    profileVisits: z.number().min(0).nullable(),
    follows: z.number().min(0).nullable(),
    watchTimeSeconds: z.number().min(0).nullable(),
    completionRate: z.number().min(0).max(1).nullable(),
    negativeFeedback: z.number().min(0).nullable(),
  }),
  rawPayload: z.record(z.string(), z.unknown()),
  rawSchemaVersion: z.string().min(1),
  isDemo: z.boolean(),
});

export const ExperimentSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  hypothesis: z.string().min(10),
  variable: z.string().min(2),
  variants: z.array(z.object({ id: z.string().min(1), description: z.string().min(2) })).min(2),
  primaryKpi: z.string().min(2),
  guardrailKpis: z.array(z.string().min(2)),
  expectedDirection: z.string().min(2),
  result: z.string().nullable(),
  confidence: z.number().min(0).max(1).nullable(),
  decision: z.enum(["PENDING", "ADOPT", "REJECT", "RETEST", "INCONCLUSIVE"]),
});

export const InsightSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  kind: z.enum(["OBSERVATION", "CORRELATION", "HYPOTHESIS", "EXPERIMENT_SUPPORTED"]),
  statement: z.string().min(10),
  supportingPostIds: z.array(z.string().uuid()).min(1),
  windowStart: z.string().datetime(),
  windowEnd: z.string().datetime(),
  sampleSize: z.number().int().min(1),
  confidenceNote: z.string().min(2),
  nextAction: z.string().min(2),
});

export const WorkflowStepSchema = z.object({
  name: z.string().min(2),
  status: WorkflowStatusSchema,
  attempt: z.number().int().min(0),
  maxAttempts: z.number().int().min(1).max(10),
  startedAt: z.string().datetime().nullable(),
  completedAt: z.string().datetime().nullable(),
  nextAttemptAt: z.string().datetime().nullable(),
  errorCode: z.string().nullable(),
});

export const WorkflowRunSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  type: z.enum(["MONTHLY_PLAN", "POST_PRODUCTION", "PUBLISH", "ANALYTICS", "RETROSPECTIVE"]),
  status: WorkflowStatusSchema,
  idempotencyKey: z.string().min(16),
  currentStep: z.string().min(2),
  steps: z.array(WorkflowStepSchema).min(1),
  input: z.record(z.string(), z.unknown()),
  output: z.record(z.string(), z.unknown()).nullable(),
  traceId: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const OwnerCommandSchema = z.object({
  command: z.string().min(3).max(5000),
  scope: z.enum(["ONE_TIME", "CAMPAIGN", "PERSISTENT_PREFERENCE", "SAFETY_POLICY"]),
  classification: z.string().min(2),
  proposedChange: z.record(z.string(), z.unknown()),
  requiresConfirmation: z.boolean(),
});

export const RuleCategorySchema = z.enum(["fact", "brandRule", "preference", "campaign", "performance"]);
export const RuleScopeSchema = z.object({
  scopeLevel: z.enum(["global", "brand", "campaign", "platform", "language", "content_type", "content_item"]),
  campaignId: z.string().uuid().optional(),
  platform: PlatformSchema.optional(),
  language: LanguageSchema.optional(),
  contentItemId: z.string().uuid().optional(),
});

export const RuleStrengthSchema = z.enum(["WEAK", "MEDIUM", "STRONG", "HARD"]);
export const RulePrecedenceSchema = z.number().int().min(0).max(100).default(50);
export const RuleDirectiveTypeSchema = z.enum(["MUST_INCLUDE", "MUST_AVOID", "RECOMMEND", "FORBID", "PRIORITIZE", "DEPRIORITIZE"]);

const RuleMetadataSchema = z.object({
  actorId: z.string().optional(),
  source: z.enum(["OWNER", "SYSTEM", "MODEL", "POLICY"]),
  reason: z.string().min(2),
  approvedAt: z.string().datetime().optional(),
  sourceRefs: z.array(SourceReferenceSchema).optional(),
  tags: z.array(z.string().min(1)).default([]),
  conflictGroup: z.string().min(2).optional(),
  isArchived: z.boolean().default(false),
});

const FeedbackRuleBaseSchema = z.object({
  ruleId: z.string().uuid(),
  organizationId: z.string().uuid(),
  brandVersion: z.string().min(1),
  category: RuleCategorySchema,
  scope: RuleScopeSchema,
  key: z.string().min(1),
  precedence: RulePrecedenceSchema,
  strength: RuleStrengthSchema,
  metadata: RuleMetadataSchema,
  activeFrom: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
});

export const FeedbackFactSchema = FeedbackRuleBaseSchema.extend({
  category: z.literal("fact"),
  fact: z.string().min(3),
  value: z.unknown(),
  confidence: z.number().min(0).max(1),
  supportingStatementIds: z.array(z.string().min(1)).default([]),
});

export const BrandRuleSchema = FeedbackRuleBaseSchema.extend({
  category: z.literal("brandRule"),
  ruleText: z.string().min(3),
  directive: RuleDirectiveTypeSchema,
  enforcementContext: z.record(z.string(), z.unknown()),
});

export const PreferenceSchema = FeedbackRuleBaseSchema.extend({
  category: z.literal("preference"),
  preferenceArea: z.string().min(2),
  value: z.record(z.string(), z.unknown()),
  persistenceWindowDays: z.number().int().min(0),
  decayRate: z.number().min(0).max(1),
});

export const CampaignLearningSchema = FeedbackRuleBaseSchema.extend({
  category: z.literal("campaign"),
  campaignId: z.string().uuid(),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  objective: z.string().min(3),
  expectedImpact: z.number().min(-1).max(1),
  guardrailKpis: z.array(z.string().min(1)).default([]),
});

export const PerformanceLearningSchema = FeedbackRuleBaseSchema.extend({
  category: z.literal("performance"),
  metric: z.string().min(2),
  direction: z.enum(["up", "down"]),
  threshold: z.number(),
  actionVerb: z.string().min(2),
  evidenceWindowDays: z.number().int().min(1),
  observedAt: z.string().datetime(),
  confidence: z.number().min(0).max(1),
});

export const SocialLearningRuleSchema = z.discriminatedUnion("category", [
  FeedbackFactSchema,
  BrandRuleSchema,
  PreferenceSchema,
  CampaignLearningSchema,
  PerformanceLearningSchema,
]);

export const SocialLearningRuleSetSchema = z.object({
  schemaVersion: z.string().default(SCHEMA_VERSION),
  organizationId: z.string().uuid(),
  generatedAt: z.string().datetime(),
  rules: z.array(SocialLearningRuleSchema),
});

/**
 * Normative v1 contracts emitted by the project-native skills. These are kept
 * separate from persistence views so an imported legacy record cannot be
 * mistaken for a complete, publication-eligible artifact.
 */
export const NativeArtifactStatusSchema = z.enum([
  "complete",
  "needs_evidence",
  "needs_approval",
  "manual_handoff",
  "blocked",
]);

export const NativeEvidenceSchema = z.object({
  sourceId: z.string().min(1),
  sourcePathOrUrl: z.string().min(1),
  sourceHash: Sha256Schema.optional(),
  retrievedAt: z.string().datetime({ offset: true }),
  authority: z.enum(["canonical", "high", "medium", "historical", "reference"]),
  supports: z.array(z.string().min(1)),
  conflictsWith: z.array(z.string().min(1)).optional(),
});

export const NativeArtifactBaseSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  artifactId: z.string().min(1),
  artifactType: z.string().min(1),
  skill: z.string().min(1),
  skillVersion: z.string().min(1),
  modelVersion: z.string().min(1),
  promptVersion: z.string().min(1),
  traceId: z.string().uuid(),
  createdAt: z.string().datetime({ offset: true }),
  inputRefs: z.array(
    z.object({
      artifactId: z.string().min(1),
      version: z.string().min(1),
      hash: Sha256Schema.optional(),
    }),
  ),
  evidence: z.array(NativeEvidenceSchema),
  warnings: z.array(z.string().min(1)),
  status: NativeArtifactStatusSchema,
});

export const BrandEvidencePacketSchema = NativeArtifactBaseSchema.extend({
  artifactType: z.literal("brand_evidence_packet"),
  brandVersion: z.string().min(1),
  effectiveAt: z.string().datetime({ offset: true }),
  query: z.string().min(1),
  facts: z.array(
    z.object({
      key: z.string().min(1),
      value: z.unknown(),
      confidence: z.number().min(0).max(1),
      sourceIds: z.array(z.string().min(1)).min(1),
      lifecycle: z.enum(["active", "proposed", "superseded", "historical"]),
    }),
  ),
  rules: z.array(z.object({ key: z.string().min(1), rule: z.string().min(1), sourceIds: z.array(z.string().min(1)).min(1) })),
  conflicts: z.array(
    z.object({
      key: z.string().min(1),
      competingValues: z.array(
        z.object({ value: z.unknown(), sourceId: z.string().min(1), authority: z.string().min(1), retrievedAt: z.string().datetime({ offset: true }) }),
      ).min(2),
      resolution: z.enum(["resolved", "unresolved", "owner_required"]),
      selectedSourceId: z.string().min(1).nullable(),
    }),
  ),
  missingEvidence: z.array(z.string().min(1)),
  proposedChanges: z.array(z.object({ key: z.string().min(1), proposedValue: z.unknown(), rationale: z.string().min(1) })),
});

export const ResearchPacketSchema = NativeArtifactBaseSchema.extend({
  artifactType: z.literal("research_packet"),
  subjectId: z.string().min(1),
  query: z.string().min(1),
  asOf: z.string().datetime({ offset: true }),
  findings: z.array(
    z.object({
      id: z.string().min(1),
      statement: z.string().min(1),
      sourceIds: z.array(z.string().min(1)).min(1),
      confidence: z.number().min(0).max(1),
      stability: z.enum(["durable", "time_sensitive", "volatile"]),
      validThrough: z.string().datetime({ offset: true }).nullable(),
    }),
  ),
  conflicts: z.array(z.object({ findingIds: z.array(z.string().min(1)).min(2), resolution: z.string().min(1).nullable() })),
  instructionLikeContent: z.array(
    z.object({ sourceId: z.string().min(1), detected: z.boolean(), handling: z.literal("treated_as_untrusted_data") }),
  ),
  factCheckStatus: z.enum(["passed", "partial", "failed", "blocked"]),
});

export const MonthlyPlanItemSchema = z.object({
  id: z.string().min(1),
  objective: z.string().min(3),
  audience: z.string().min(2),
  funnelStage: FunnelStageSchema,
  pillar: z.string().min(2),
  tension: z.string().min(3),
  keyMessage: z.string().min(3),
  perceptionShift: z.string().min(3),
  format: ContentFormatSchema,
  platforms: z.array(PlatformSchema).min(1),
  language: LanguageSchema,
  hookHypothesis: z.string().min(3),
  creativeHypothesis: z.string().min(3),
  proofRequirements: z.array(z.string().min(1)),
  cta: z.string().min(1),
  kpis: z.array(z.string().min(1)).min(1),
  publishAtLocal: z.string().datetime({ offset: true }),
  timezone: z.string().min(1),
  status: z.enum(["draft", "needs_evidence", "needs_approval", "approved", "blocked"]),
  approvalClass: ApprovalClassSchema,
  risk: RiskLevelSchema,
  riskReasons: z.array(z.string().min(1)),
  experimentId: z.string().nullable(),
  relatedPostIds: z.array(z.string().min(1)),
  antiRepetitionScore: z.number().min(0).max(100),
});

export const MonthlyPlanSchema = NativeArtifactBaseSchema.extend({
  artifactType: z.literal("monthly_plan"),
  organizationId: z.string().min(1),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  timezone: z.string().min(1),
  businessPriorities: z.array(z.string().min(1)).min(1),
  objectives: z.array(z.string().min(1)).min(1),
  audiences: z.array(z.string().min(1)).min(1),
  kpiHierarchy: z.array(z.string().min(1)).min(1),
  cadence: z.record(z.string(), z.number().nonnegative()),
  contentMix: z.record(z.string(), z.number().min(0).max(1)),
  narrativeArc: z.array(z.string().min(1)).min(1),
  timelyCapacity: z.number().min(0).max(1),
  items: z.array(MonthlyPlanItemSchema).min(1),
  strategyRisks: z.array(z.string().min(1)),
  approvalState: z.enum(["draft", "in_review", "approved", "revision_requested"]),
});

export const CopyPackageSchema = NativeArtifactBaseSchema.extend({
  artifactType: z.literal("copy_package"),
  contentItemId: z.string().min(1),
  language: LanguageSchema,
  locale: z.string().min(2),
  angles: z.array(z.object({ id: z.string().min(1), premise: z.string().min(1), hook: z.string().min(1) })).min(2),
  selectedAngleId: z.string().min(1),
  selectionRationale: z.string().min(1),
  platformVariants: z.array(
    z.object({ platform: PlatformSchema, caption: z.string().min(1), hashtags: z.array(z.string()), altText: z.string().min(1), cta: z.string().min(1) }),
  ).min(1),
  onDesignCopy: z.array(z.string().min(1)).min(1),
  carouselSlides: z.array(z.object({ sequence: z.number().int().positive(), text: z.string().min(1) })),
  reelScript: z.string().min(1).optional(),
  altTextByAsset: z.array(z.object({ assetId: z.string().min(1), altText: z.string().min(1) })),
  claimChecks: z.array(
    z.object({ claim: z.string().min(1), state: z.enum(["supported", "unsupported", "sensitive", "not_applicable"]), sourceIds: z.array(z.string().min(1)) }),
  ),
  editorialScores: z.record(z.string(), z.number().min(0).max(100)),
  rejectedVariantIds: z.array(z.string().min(1)),
}).superRefine((value, context) => {
  if (!value.angles.some((angle) => angle.id === value.selectedAngleId)) {
    context.addIssue({ code: "custom", path: ["selectedAngleId"], message: "The selected angle must be present in angles." });
  }
});

const ProductionAssetSchema = z.object({
  assetId: z.string().min(1),
  storageRef: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  contentHash: Sha256Schema,
  renderState: z.enum(["draft", "rendered", "verified", "failed"]),
});

export const DesignProductionResultSchema = NativeArtifactBaseSchema.extend({
  artifactType: z.literal("design_production_result"),
  designBriefId: z.string().min(1),
  provider: z.string().min(1),
  capabilityState: CapabilityStateSchema,
  idempotencyKey: z.string().min(16),
  attemptState: z.enum(["not_started", "requested", "rendered", "verified", "failed", "ambiguous"]),
  providerJobId: z.string().min(1).optional(),
  drafts: z.array(z.object({ draftId: z.string().min(1), state: z.string().min(1) })),
  renderedAssets: z.array(ProductionAssetSchema),
  editableUrl: z.string().url().optional(),
  assetLicenses: z.array(
    z.object({ assetId: z.string().min(1), status: z.enum(["OWNED", "LICENSED", "UNKNOWN", "NOT_REQUIRED"]), evidenceRef: z.string().min(1).nullable() }),
  ),
  fontValidation: z.object({ passed: z.boolean(), details: z.array(z.string()) }),
  rtlValidation: z.object({ passed: z.boolean(), details: z.array(z.string()) }),
  manualHandoff: z.record(z.string(), z.unknown()).optional(),
  nextAction: z.string().min(1),
});

const CompletedCriticResultSchema = z
  .object({
    status: z.literal("complete"),
    scores: CreativeScoreSchema,
    total: z.number().min(0).max(100),
    hardFails: z.array(z.string()),
    slideNotes: z.array(z.string()),
    sequenceNotes: z.array(z.string()),
    accessibilityPassed: z.boolean(),
    rtlPassed: z.boolean(),
    evidenceObservations: z.array(z.string()),
    decision: z.enum(["pass", "revise", "regenerate", "escalate"]),
  })
  .superRefine((value, context) => {
    if (value.decision === "pass" && value.hardFails.length > 0) {
      context.addIssue({ code: "custom", path: ["decision"], message: "A critic cannot pass an asset with a hard fail." });
    }
  });

const CriticSlotSchema = z.union([
  CompletedCriticResultSchema,
  z.object({ status: z.literal("missing"), reason: z.string().min(1) }),
]);

export const DesignCritiqueSetSchema = NativeArtifactBaseSchema.extend({
  artifactType: z.literal("design_critique_set"),
  designDraftId: z.string().min(1),
  renderedAssetIds: z.array(z.string().min(1)).min(1),
  criticA: CriticSlotSchema,
  criticB: CriticSlotSchema,
  disagreement: z.object({ scoreDelta: z.number().nonnegative().nullable(), material: z.boolean(), reasons: z.array(z.string()) }),
  adjudication: CompletedCriticResultSchema.optional(),
  decision: z.enum(["pass", "revise", "regenerate", "escalate", "blocked"]),
  revisionInstructions: z.array(z.string()),
  comparison: z.record(z.string(), z.unknown()).optional(),
}).superRefine((value, context) => {
  const missing = value.criticA.status === "missing" || value.criticB.status === "missing";
  const completed = [value.criticA, value.criticB].filter((critic): critic is z.infer<typeof CompletedCriticResultSchema> => critic.status === "complete");
  if (missing && (value.status !== "blocked" || value.decision !== "blocked")) {
    context.addIssue({ code: "custom", path: ["decision"], message: "Every required independent critic must be present; a partial critique set is blocked." });
  }
  if (completed.some((critic) => critic.hardFails.length > 0) && value.decision === "pass") {
    context.addIssue({ code: "custom", path: ["decision"], message: "A hard fail overrides aggregate creative scores." });
  }
});

export const ComplianceDecisionSchema = NativeArtifactBaseSchema.extend({
  artifactType: z.literal("compliance_decision"),
  subjectRefs: z.array(z.string().min(1)).min(1),
  brandVersion: z.string().min(1),
  checks: z.array(z.object({ key: z.string().min(1), passed: z.boolean(), evidenceRefs: z.array(z.string()) })),
  claimChecks: z.array(z.object({ claim: z.string().min(1), state: z.enum(["supported", "unsupported", "sensitive", "not_applicable"]), sourceIds: z.array(z.string()) })),
  policyChecks: z.array(z.object({ policy: z.string().min(1), passed: z.boolean(), details: z.string() })),
  violations: z.array(z.string()),
  approvalClass: ApprovalClassSchema,
  riskClass: RiskLevelSchema,
  decision: z.enum(["pass", "revise", "reject", "escalate"]),
  requiredActions: z.array(z.string()),
  ownerQuestion: z.string().min(1).optional(),
});

export const PublicationCapabilityStateSchema = z.enum([
  "available",
  "unavailable_permission",
  "unavailable_plan",
  "preview",
  "manual_handoff_required",
  "unknown",
]);

const PublicationApprovalEvidenceSchema = z.object({
  approvalId: z.string().min(1),
  actorId: z.string().min(1),
  actorRole: z.enum(["OWNER", "ADMIN"]),
  signature: z.string().min(16),
  signedAt: z.string().datetime({ offset: true }),
  expiresAt: z.string().datetime({ offset: true }),
  revokedAt: z.string().datetime({ offset: true }).nullable(),
  scope: z.object({
    contentItemId: z.string().min(1),
    accountId: z.string().min(1),
    platform: PlatformSchema,
    operation: z.enum(["create", "schedule", "publish", "upload_draft"]),
    brandVersion: z.string().min(1),
    copyHash: Sha256Schema,
    assetHashes: z.array(Sha256Schema).min(1),
  }),
});

export const PublicationPlanSchema = NativeArtifactBaseSchema.extend({
  artifactType: z.literal("publication_plan"),
  contentItemId: z.string().min(1),
  accountId: z.string().min(1),
  platform: PlatformSchema,
  capabilities: z.array(z.object({ capability: z.string().min(1), state: PublicationCapabilityStateSchema, verifiedAt: z.string().datetime({ offset: true }), sourceUrl: z.string().url() })).min(1),
  validation: z.object({
    accountMapped: z.boolean(),
    authHealthy: z.boolean(),
    captionValid: z.boolean(),
    assetsExist: z.boolean(),
    hashesMatch: z.boolean(),
    licensesApproved: z.boolean(),
    compliancePassed: z.boolean(),
    scheduleValid: z.boolean(),
    emergencyPaused: z.boolean(),
    materialDeviation: z.boolean(),
  }),
  approvalEvidence: PublicationApprovalEvidenceSchema,
  complianceEvidence: z.object({ artifactId: z.string().min(1), artifactHash: Sha256Schema, decision: z.literal("pass"), brandVersion: z.string().min(1) }),
  authProof: z.object({ accountId: z.string().min(1), verifiedAt: z.string().datetime({ offset: true }), scopes: z.array(z.string().min(1)), expiresAt: z.string().datetime({ offset: true }).nullable(), revokedAt: z.string().datetime({ offset: true }).nullable() }),
  brandVersion: z.string().min(1),
  copyHash: Sha256Schema,
  assets: z.array(z.object({ assetId: z.string().min(1), hash: Sha256Schema, licenseStatus: z.enum(["OWNED", "LICENSED", "NOT_REQUIRED"]) })).min(1),
  assetHashes: z.array(Sha256Schema).min(1),
  scheduledAt: z.string().datetime({ offset: true }),
  timezone: z.string().min(1),
  idempotencyKeyVersion: z.string().min(1),
  idempotencyKey: z.string().min(16),
  payloadHash: Sha256Schema,
  intentRef: z.string().min(1),
  attemptState: z.enum(["not_started", "intent_persisted", "request_sent", "acknowledged", "ambiguous", "verified", "failed"]),
  reconciliationState: z.enum(["not_required", "pending", "matched", "not_found", "conflict", "unknown"]),
  environment: z.enum(["dry_run", "staging", "production"]),
  productionEnabled: z.boolean(),
  operation: z.enum(["create", "schedule", "publish", "upload_draft"]),
  providerResponseRef: z.string().min(1).optional(),
  publicationId: z.string().min(1).optional(),
  manualHandoff: z.record(z.string(), z.unknown()).optional(),
  decision: z.enum(["ready", "dry_run_only", "manual_handoff_required", "blocked"]),
}).superRefine((value, context) => {
  const scope = value.approvalEvidence.scope;
  const hashesMatchScope = scope.assetHashes.length === value.assetHashes.length && scope.assetHashes.every((hash) => value.assetHashes.includes(hash));
  const productionReady = value.environment === "production" && value.decision === "ready";
  const validationPassed = Object.entries(value.validation).every(([key, passed]) =>
    key === "emergencyPaused" || key === "materialDeviation" ? passed === false : passed === true,
  );
  if (scope.contentItemId !== value.contentItemId || scope.accountId !== value.accountId || scope.platform !== value.platform || scope.operation !== value.operation || scope.brandVersion !== value.brandVersion || scope.copyHash !== value.copyHash || !hashesMatchScope) {
    context.addIssue({ code: "custom", path: ["approvalEvidence", "scope"], message: "Approval scope must exactly bind the account, operation, brand, copy, and asset hashes." });
  }
  if (value.authProof.accountId !== value.accountId || value.authProof.revokedAt) {
    context.addIssue({ code: "custom", path: ["authProof"], message: "Authorization proof must be current and bound to the target account." });
  }
  if (value.approvalEvidence.revokedAt || new Date(value.approvalEvidence.expiresAt) <= new Date(value.scheduledAt)) {
    context.addIssue({ code: "custom", path: ["approvalEvidence"], message: "Publication approval is revoked or expires before the scheduled operation." });
  }
  if (value.complianceEvidence.brandVersion !== value.brandVersion) {
    context.addIssue({ code: "custom", path: ["complianceEvidence", "brandVersion"], message: "Compliance evidence must match the approved brand version." });
  }
  if (productionReady && (!value.productionEnabled || !validationPassed || !value.capabilities.some((capability) => capability.state === "available"))) {
    context.addIssue({ code: "custom", path: ["decision"], message: "A production-ready decision requires enablement, all safety validations, and a verified available capability." });
  }
  if (value.environment !== "production" && value.decision === "ready") {
    context.addIssue({ code: "custom", path: ["decision"], message: "Non-production plans must use dry_run_only, manual_handoff_required, or blocked." });
  }
});

const AnalyticalFindingSchema = z.object({
  statement: z.string().min(1),
  postIds: z.array(z.string().min(1)),
  windowStart: z.string().datetime({ offset: true }),
  windowEnd: z.string().datetime({ offset: true }),
  denominator: z.number().nonnegative(),
  sampleSize: z.number().int().nonnegative(),
  confidenceLanguage: z.string().min(1),
});

export const AnalyticsInsightReportSchema = NativeArtifactBaseSchema.extend({
  artifactType: z.literal("analytics_insight_report"),
  organizationId: z.string().min(1),
  window: z.object({ start: z.string().datetime({ offset: true }), end: z.string().datetime({ offset: true }), timezone: z.string().min(1) }),
  platformCoverage: z.array(z.object({ platform: PlatformSchema, complete: z.boolean(), limitations: z.array(z.string()) })),
  dataQuality: z.object({ state: z.enum(["good", "partial", "insufficient", "demo"]), notes: z.array(z.string()) }),
  metricDefinitions: z.array(z.object({ key: z.string().min(1), definition: z.string().min(1), denominator: z.string().min(1) })),
  normalizedMetrics: z.array(z.record(z.string(), z.unknown())),
  cohorts: z.array(z.record(z.string(), z.unknown())),
  observations: z.array(AnalyticalFindingSchema),
  correlations: z.array(AnalyticalFindingSchema),
  hypotheses: z.array(AnalyticalFindingSchema),
  experimentSupportedConclusions: z.array(AnalyticalFindingSchema),
  anomalies: z.array(z.string()),
  recommendations: z.array(z.string()),
  limitations: z.array(z.string()),
});

export const ContentExperimentSchema = NativeArtifactBaseSchema.extend({
  artifactType: z.literal("content_experiment"),
  experimentId: z.string().min(1),
  hypothesis: z.string().min(10),
  variable: z.string().min(1),
  variants: z.array(z.object({ id: z.string().min(1), description: z.string().min(1), changedVariables: z.array(z.string().min(1)).min(1) })).min(2),
  eligibility: z.string().min(1),
  allocation: z.record(z.string(), z.number().min(0).max(1)),
  primaryKpi: z.string().min(1),
  guardrailKpis: z.array(z.string().min(1)),
  expectedDirection: z.string().min(1),
  minimumEvidence: z.object({ sampleSize: z.number().int().positive(), durationDays: z.number().int().positive() }),
  startAt: z.string().datetime({ offset: true }),
  endAt: z.string().datetime({ offset: true }).optional(),
  experimentStatus: z.enum(["draft", "running", "complete", "cancelled"]),
  result: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  decision: z.enum(["adopt", "reject", "retest", "inconclusive"]).optional(),
  retest: z.boolean(),
}).superRefine((value, context) => {
  for (const variant of value.variants) {
    if (variant.changedVariables.some((changed) => changed !== value.variable)) {
      context.addIssue({ code: "custom", path: ["variants"], message: "Variants may differ only on the declared experiment variable." });
    }
  }
});

export const MonthlyRetrospectiveSchema = NativeArtifactBaseSchema.extend({
  artifactType: z.literal("monthly_retrospective"),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  timezone: z.string().min(1),
  analysisFreezeAt: z.string().datetime({ offset: true }),
  goals: z.array(z.record(z.string(), z.unknown())),
  kpiResults: z.array(z.record(z.string(), z.unknown())),
  contentMixResults: z.record(z.string(), z.unknown()),
  cohortFindings: z.array(AnalyticalFindingSchema),
  experimentFindings: z.array(z.record(z.string(), z.unknown())),
  audienceThemes: z.array(z.record(z.string(), z.unknown())),
  ownerFeedbackPatterns: z.array(z.string()),
  productionReliability: z.record(z.string(), z.unknown()),
  costSummary: z.record(z.string(), z.unknown()),
  playbookUpdatesProposed: z.array(z.string()),
  keepStopStart: z.object({ keep: z.array(z.string()), stop: z.array(z.string()), start: z.array(z.string()) }),
  unresolvedQuestions: z.array(z.string()),
  nextMonthInputs: z.array(z.string()),
  limitations: z.array(z.string()),
});

export const NextMonthPlanProposalSchema = NativeArtifactBaseSchema.extend({
  artifactType: z.literal("next_month_plan_proposal"),
  targetMonth: z.string().regex(/^\d{4}-\d{2}$/),
  timezone: z.string().min(1),
  triggeredAt: z.string().datetime({ offset: true }),
  fiveDayRule: z.object({ expectedAt: z.string().datetime({ offset: true }), triggeredOnTime: z.boolean(), exception: z.string().nullable() }),
  analysisWindows: z.object({ days30: z.string().min(1), days60: z.string().min(1), days90: z.string().min(1) }),
  retrospectiveId: z.string().min(1),
  businessPriorityVersion: z.string().min(1),
  researchPacketIds: z.array(z.string().min(1)),
  draftPlan: MonthlyPlanSchema.omit({ artifactType: true }),
  criticFindings: z.array(z.string()),
  revisionHistory: z.array(z.object({ revision: z.number().int().nonnegative(), changedAt: z.string().datetime({ offset: true }), summary: z.string().min(1) })),
  ownerSummary: z.string().min(1),
  materialDeviations: z.array(z.string()),
  approvalState: z.enum(["draft", "in_review", "approved", "revision_requested"]),
  productionGate: z.enum(["blocked", "owner_approval_required", "eligible_after_approval"]),
});

export const ContentQualityEvaluationSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  subjectId: z.string().min(1),
  evaluatedAt: z.string().datetime({ offset: true }),
  evaluatorVersion: z.string().min(1),
  scores: z.object({
    factuality: z.number().min(0).max(100),
    sourceSupport: z.number().min(0).max(100),
    brandVoice: z.number().min(0).max(100),
    languageNaturalness: z.number().min(0).max(100),
    specificity: z.number().min(0).max(100),
    hookStrength: z.number().min(0).max(100),
    usefulness: z.number().min(0).max(100),
    novelty: z.number().min(0).max(100),
    ctaFit: z.number().min(0).max(100),
    platformFit: z.number().min(0).max(100),
  }),
  hardFails: z.array(z.string()),
  findings: z.array(z.string()),
  decision: z.enum(["pass", "revise", "reject", "blocked"]),
  humanCalibrationRef: z.string().nullable(),
}).superRefine((value, context) => {
  if (value.decision === "pass" && value.hardFails.length > 0) {
    context.addIssue({ code: "custom", path: ["decision"], message: "Content with a hard fail cannot pass its quality gate." });
  }
});

export type Platform = z.infer<typeof PlatformSchema>;
export type ContentFormat = z.infer<typeof ContentFormatSchema>;
export type Language = z.infer<typeof LanguageSchema>;
export type RiskLevel = z.infer<typeof RiskLevelSchema>;
export type ApprovalClass = z.infer<typeof ApprovalClassSchema>;
export type ContentStatus = z.infer<typeof ContentStatusSchema>;
export type CapabilityState = z.infer<typeof CapabilityStateSchema>;
export type MonthlyStrategy = z.infer<typeof MonthlyStrategySchema>;
export type ContentItem = z.infer<typeof ContentItemSchema>;
export type CopyVariant = z.infer<typeof CopyVariantSchema>;
export type DesignBrief = z.infer<typeof DesignBriefSchema>;
export type RenderedAsset = z.infer<typeof RenderedAssetSchema>;
export type Critique = z.infer<typeof CritiqueSchema>;
export type DesignPurpose = z.infer<typeof DesignPurposeSchema>;
export type VisualFamily = z.infer<typeof VisualFamilySchema>;
export type ImageryMode = z.infer<typeof ImageryModeSchema>;
export type ReferencePrincipleUse = z.infer<typeof ReferencePrincipleUseSchema>;
export type CreativeConceptCandidate = z.infer<typeof CreativeConceptCandidateSchema>;
export type ConceptTournament = z.infer<typeof ConceptTournamentSchema>;
export type ProfessionalDesignBrief = z.infer<typeof ProfessionalDesignBriefSchema>;
export type ProfessionalCreativeScore = z.infer<typeof ProfessionalCreativeScoreSchema>;
export type ProfessionalCritique = z.infer<typeof ProfessionalCritiqueSchema>;
export type PairwiseCreativeComparison = z.infer<typeof PairwiseCreativeComparisonSchema>;
export type ProfessionalCritiqueSet = z.infer<typeof ProfessionalCritiqueSetSchema>;
export type ApprovalDecision = z.infer<typeof ApprovalDecisionSchema>;
export type ProviderCapability = z.infer<typeof ProviderCapabilitySchema>;
export type PublicationJob = z.infer<typeof PublicationJobSchema>;
export type MetricSnapshot = z.infer<typeof MetricSnapshotSchema>;
export type Experiment = z.infer<typeof ExperimentSchema>;
export type Insight = z.infer<typeof InsightSchema>;
export type WorkflowRun = z.infer<typeof WorkflowRunSchema>;
export type OwnerCommand = z.infer<typeof OwnerCommandSchema>;
export type RuleCategory = z.infer<typeof RuleCategorySchema>;
export type RuleScope = z.infer<typeof RuleScopeSchema>;
export type RuleStrength = z.infer<typeof RuleStrengthSchema>;
export type RulePrecedence = z.infer<typeof RulePrecedenceSchema>;
export type RuleDirectiveType = z.infer<typeof RuleDirectiveTypeSchema>;
export type FeedbackFact = z.infer<typeof FeedbackFactSchema>;
export type BrandRule = z.infer<typeof BrandRuleSchema>;
export type Preference = z.infer<typeof PreferenceSchema>;
export type CampaignLearning = z.infer<typeof CampaignLearningSchema>;
export type PerformanceLearning = z.infer<typeof PerformanceLearningSchema>;
export type SocialLearningRule = z.infer<typeof SocialLearningRuleSchema>;
export type SocialLearningRuleSet = z.infer<typeof SocialLearningRuleSetSchema>;
export type BrandEvidencePacket = z.infer<typeof BrandEvidencePacketSchema>;
export type ResearchPacket = z.infer<typeof ResearchPacketSchema>;
export type MonthlyPlan = z.infer<typeof MonthlyPlanSchema>;
export type CopyPackage = z.infer<typeof CopyPackageSchema>;
export type DesignProductionResult = z.infer<typeof DesignProductionResultSchema>;
export type DesignCritiqueSet = z.infer<typeof DesignCritiqueSetSchema>;
export type ComplianceDecision = z.infer<typeof ComplianceDecisionSchema>;
export type PublicationPlan = z.infer<typeof PublicationPlanSchema>;
export type AnalyticsInsightReport = z.infer<typeof AnalyticsInsightReportSchema>;
export type ContentExperiment = z.infer<typeof ContentExperimentSchema>;
export type MonthlyRetrospective = z.infer<typeof MonthlyRetrospectiveSchema>;
export type NextMonthPlanProposal = z.infer<typeof NextMonthPlanProposalSchema>;
export type ContentQualityEvaluation = z.infer<typeof ContentQualityEvaluationSchema>;
