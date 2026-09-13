import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  ConceptTournamentSchema,
  PairwiseCreativeComparisonSchema,
  ProfessionalCritiqueSchema,
  ProfessionalCritiqueSetSchema,
  ProfessionalDesignBriefSchema,
  type ConceptTournament,
  type DesignBrief,
  type DesignPurpose,
  type ImageryMode,
  type PairwiseCreativeComparison,
  type ProfessionalCritique,
  type ProfessionalCritiqueSet,
  type ProfessionalDesignBrief,
  type VisualFamily,
} from "@social-media-plugin/schemas";
import type { AgentRole, StructuredAgentGateway } from "./agents";
import { createAgentGateway } from "./agents";
import {
  DesignKnowledgeRetriever,
  type DesignKnowledgePacket,
  type DesignKnowledgeRequest,
} from "./design-intelligence";

export const ART_DIRECTION_DECISION_QUESTIONS = [
  "What exact communication job must this design complete?",
  "What unresolved audience tension makes that job worth attention?",
  "What should the audience feel before it starts reading supporting copy?",
  "What single meaning must survive a two-second mobile glance?",
  "What is the one visual idea—not a theme, style, or list of objects?",
  "What remains understandable if every word is temporarily removed?",
  "Which metaphor makes the invisible operating idea materially visible?",
  "What changes from the beginning to the end of the visual story?",
  "How do the image and words complete each other instead of repeating each other?",
  "Where is the dominant focal point and what is the intended eye path?",
  "What earns the negative space and what must stay out of it?",
  "How does Arabic or English reading direction determine composition from the start?",
  "What bespoke asset, material, crop, perspective, and light make the idea credible?",
  "Would human-like behavior improve comprehension, and can it work without a face?",
  "Why is this an SOCIAL_MEDIA_PLUGIN idea rather than a generic technology campaign?",
] as const;

const ArtDirectionDecisionAnswersSchema = z.object({
  communicationJob: z.string().min(12),
  audienceTension: z.string().min(12),
  desiredFeeling: z.string().min(5),
  twoSecondMeaning: z.string().min(8),
  singleVisualIdea: z.string().min(16),
  textlessComprehension: z.string().min(12),
  materialMetaphor: z.string().min(12),
  storyChange: z.string().min(12),
  verbalVisualRelationship: z.string().min(12),
  focalPointAndEyePath: z.string().min(12),
  negativeSpacePurpose: z.string().min(12),
  languageCompositionDecision: z.string().min(12),
  assetCraftDecision: z.string().min(12),
  anthropomorphismDecision: z.string().min(12),
  socialMediaPluginDistinctiveness: z.string().min(12),
});

export const ArtDirectionDecisionSchema = z.object({
  answers: ArtDirectionDecisionAnswersSchema,
  tournament: ConceptTournamentSchema,
});

export interface ProfessionalArtDirectionInput {
  contentItemId: string;
  communicationGoal: string;
  purpose: DesignPurpose;
  audience: string;
  audienceTension: string;
  desiredFeeling: string;
  twoSecondTakeaway: string;
  language: "ar" | "en";
  exactText: string[];
  visualFamily: VisualFamily;
  imageryMode: ImageryMode;
  anthropomorphismLevel: number;
  informationDensity: "low" | "medium" | "high";
  canvas: { width: number; height: number };
  recentFeed: {
    comparedPostIds: string[];
    prohibitedRepeatedStructures: string[];
    targetRhythmRole: "anchor" | "breath" | "energy" | "information" | "narrative";
  };
  envelope: DesignBrief["envelope"];
  fixture?: z.infer<typeof ArtDirectionDecisionSchema>;
  traceId?: string;
}

export interface ArtDirectionResult {
  knowledge: DesignKnowledgePacket;
  decisionAnswers: z.infer<typeof ArtDirectionDecisionAnswersSchema>;
  tournament: ConceptTournament;
  brief: ProfessionalDesignBrief;
  generationHandoff: {
    brief: ProfessionalDesignBrief;
    principleInstructions: DesignKnowledgePacket["generationContext"]["principleInstructions"];
    referenceIds: string[];
    rawReferencePixelsIncluded: false;
    antiCopyControls: string[];
  };
}

function makeKnowledgeRequest(input: ProfessionalArtDirectionInput): DesignKnowledgeRequest {
  return {
    purpose: input.purpose,
    visualFamily: input.visualFamily,
    language: input.language,
    imageryMode: input.imageryMode,
    anthropomorphismLevel: input.anthropomorphismLevel,
    desiredFeeling: input.desiredFeeling,
    communicationGoal: input.communicationGoal,
    informationDensity: input.informationDensity,
    principleLimit: 10,
    referenceLimit: 6,
  };
}

/**
 * Art direction receives analyzed principles, never local paths or corpus pixels.
 * This structure is safe to serialize into a model request.
 */
export function buildArtDirectionKnowledgeContext(packet: DesignKnowledgePacket) {
  return {
    knowledgeHash: packet.knowledgeHash,
    request: packet.request,
    principles: packet.generationContext.principleInstructions,
    references: packet.references.map(({ reference, reasons }) => ({
      referenceId: reference.referenceId,
      clusterId: reference.clusterId,
      reviewStatus: reference.reviewStatus,
      anchorTier: reference.anchorTier,
      qualityDimensions: reference.qualityDimensions,
      strengthRationale: reference.strengthRationale,
      analysis: reference.analysis,
      doNotCopy: reference.doNotCopy,
      relevanceReasons: reasons,
    })),
    antiCopyControls: packet.antiCopyControls,
    rawReferencePixelsIncluded: false as const,
  };
}

function assertTournamentDiversity(tournament: ConceptTournament, packet: DesignKnowledgePacket): void {
  if (tournament.candidates.length < 4) {
    throw new Error("Art direction must produce at least four concept candidates before selection.");
  }
  const familyCount = new Set(tournament.candidates.map((candidate) => candidate.visualFamily)).size;
  const imageryCount = new Set(tournament.candidates.map((candidate) => candidate.imagery.mode)).size;
  if (familyCount < 3 || imageryCount < 3) {
    throw new Error("Concept tournament is cosmetically varied; it needs at least three visual families and three imagery modes.");
  }

  const retrievedReferences = new Set(packet.references.map(({ reference }) => reference.referenceId));
  const retrievedPrinciples = new Set(packet.principles.map(({ principle }) => principle.id));
  for (const candidate of tournament.candidates) {
    for (const use of candidate.referenceUses) {
      if (!retrievedReferences.has(use.referenceId)) {
        throw new Error(`Concept ${candidate.candidateId} cites an unretrieved reference: ${use.referenceId}`);
      }
      if (!retrievedPrinciples.has(use.principleId)) {
        throw new Error(`Concept ${candidate.candidateId} cites an unretrieved principle: ${use.principleId}`);
      }
    }
  }
}

function selectedConcept(tournament: ConceptTournament) {
  const selectedId = tournament.selectedCandidateIds[0];
  const candidate = tournament.candidates.find((item) => item.candidateId === selectedId);
  if (!candidate) throw new Error("Concept tournament did not produce a valid selected candidate.");
  return candidate;
}

function buildProfessionalBrief(
  input: ProfessionalArtDirectionInput,
  packet: DesignKnowledgePacket,
  tournament: ConceptTournament,
): ProfessionalDesignBrief {
  const candidate = selectedConcept(tournament);
  const forbidden = [...new Set([
    ...candidate.forbiddenAdditions,
    "generic AI robot or glowing brain",
    "arbitrary floating UI cards",
    "a person without a necessary narrative role",
    "a woman used as decorative attention bait",
    "objectifying, sexualized, or ornamental posing, cropping, or styling",
    "reference-derived logo, character, silhouette, or distinctive composition",
  ])];
  return ProfessionalDesignBriefSchema.parse({
    id: randomUUID(),
    contentItemId: input.contentItemId,
    communicationGoal: input.communicationGoal,
    visualConcept: candidate.singleVisualIdea,
    focalPoint: candidate.composition.focalPoint,
    hierarchy: candidate.composition.eyePath,
    layoutFamily: candidate.visualFamily,
    canvas: input.canvas,
    imageDirection: [
      candidate.imagery.subject,
      candidate.imagery.crop,
      candidate.imagery.perspective,
      candidate.imagery.lighting,
      candidate.imagery.material,
      candidate.imagery.relationToTypography,
    ].join(" · "),
    typographyDirection: [
      candidate.typography.direction,
      candidate.typography.alignment,
      candidate.typography.interactionWithImagery,
      candidate.typography.arabicSpecificDecision,
    ].filter(Boolean).join(" · "),
    palette: ["#003F35", "#0EDB23", "#77FF70", "#F4F8F5"],
    whitespaceTarget: 0.42,
    exactText: input.exactText,
    mobileConstraints: [
      `Preserve the ${candidate.twoSecondTakeaway} takeaway at a 320 px-wide preview.`,
      "Inspect original-size and mobile raster pixels; metadata and SVG tags are not visual evidence.",
      "Keep legal/supporting copy out of the primary focal path.",
    ],
    referenceIds: candidate.referenceUses.map((use) => use.referenceId),
    forbiddenCliches: forbidden,
    envelope: input.envelope,
    intelligenceVersion: `${packet.knowledgeHash.slice(0, 12)}:${packet.request.language}`,
    purpose: input.purpose,
    desiredFeeling: input.desiredFeeling,
    twoSecondTakeaway: input.twoSecondTakeaway,
    selectedCandidateId: candidate.candidateId,
    conceptTournament: tournament,
    exactLineBreaks: candidate.typography.headlineLines,
    referenceUses: candidate.referenceUses,
    recentFeedConstraints: input.recentFeed,
    originalityCheck: {
      nearestReferenceIds: candidate.referenceUses.map((use) => use.referenceId),
      reviewerRequired: true,
      rationale: candidate.originalityRationale,
    },
  });
}

export class ProfessionalCreativeOrchestrator {
  constructor(
    private readonly retriever: DesignKnowledgeRetriever,
    private readonly gateway: StructuredAgentGateway = createAgentGateway(),
  ) {}

  async direct(input: ProfessionalArtDirectionInput): Promise<ArtDirectionResult> {
    const knowledge = this.retriever.retrieve(makeKnowledgeRequest(input));
    if (knowledge.status !== "READY") {
      throw new Error(`Design intelligence retrieval is blocked: ${knowledge.blockers.join(" ")}`);
    }
    const result = await this.gateway.run({
      role: "ART_DIRECTOR",
      taskName: "social_media_plugin_professional_art_direction_v2",
      instructions: [
        "Answer all fifteen art-direction decisions explicitly before selecting a visual route.",
        ...ART_DIRECTION_DECISION_QUESTIONS.map((question, index) => `${index + 1}. ${question}`),
        "Produce at least four genuinely different concepts spanning at least three visual families and three imagery modes.",
        "Run pairwise comparisons. Reject weak routes instead of blending them into a compromise.",
        "References are evidence of principles only. Never reproduce a layout, character, logo, silhouette, palette recipe, campaign prop, or creator mannerism.",
        "Arabic work is composed RTL from the first sketch. Humanize system behavior before considering a face.",
        "Default to product UI, workflows, objects, environments, hands, and motion graphics. Every visible person needs a story-specific role and agency; never use women or any person as decorative attention bait.",
      ].join("\n"),
      input: {
        brief: {
          communicationGoal: input.communicationGoal,
          purpose: input.purpose,
          audience: input.audience,
          audienceTension: input.audienceTension,
          desiredFeeling: input.desiredFeeling,
          twoSecondTakeaway: input.twoSecondTakeaway,
          language: input.language,
          exactText: input.exactText,
          canvas: input.canvas,
          recentFeed: input.recentFeed,
        },
        designKnowledge: buildArtDirectionKnowledgeContext(knowledge),
      },
      schema: ArtDirectionDecisionSchema,
      ...(input.fixture ? { fixture: input.fixture } : {}),
      reasoningEffort: "high",
      ...(input.traceId ? { traceId: input.traceId } : {}),
    });
    assertTournamentDiversity(result.value.tournament, knowledge);
    const brief = buildProfessionalBrief(input, knowledge, result.value.tournament);
    return {
      knowledge,
      decisionAnswers: result.value.answers,
      tournament: result.value.tournament,
      brief,
      generationHandoff: {
        brief,
        principleInstructions: knowledge.generationContext.principleInstructions,
        referenceIds: brief.referenceIds,
        rawReferencePixelsIncluded: false,
        antiCopyControls: knowledge.antiCopyControls,
      },
    };
  }
}

export interface ReviewImageInput {
  imageUrl: string;
  label: string;
  scale: "original" | "mobile" | "thumbnail" | "feed";
}

export interface ProfessionalAnchorImageInput {
  imageUrl: string;
  referenceId: string;
  compareFor: string[];
}

export interface ProfessionalPixelReviewInput {
  renderedAssetId: string;
  renderedAssetSha256: string;
  language: "ar" | "en";
  candidateImages: ReviewImageInput[];
  professionalAnchors: ProfessionalAnchorImageInput[];
  fixtures?: Partial<Record<ProfessionalCritique["criticRole"], ProfessionalCritique>>;
  traceId?: string;
}

const CRITIC_GATEWAY_ROLES: Record<ProfessionalCritique["criticRole"], AgentRole> = {
  SENIOR_ART_DIRECTOR: "VISUAL_CRITIC_A",
  SENIOR_GRAPHIC_DESIGNER: "VISUAL_CRITIC_B",
  SOCIAL_PERFORMANCE_STRATEGIST: "ADJUDICATOR",
  ARABIC_DESIGN_REVIEWER: "BRAND_GUARDIAN",
};

function requiredCriticRoles(language: "ar" | "en"): ProfessionalCritique["criticRole"][] {
  const roles: ProfessionalCritique["criticRole"][] = [
    "SENIOR_ART_DIRECTOR",
    "SENIOR_GRAPHIC_DESIGNER",
    "SOCIAL_PERFORMANCE_STRATEGIST",
  ];
  if (language === "ar") roles.push("ARABIC_DESIGN_REVIEWER");
  return roles;
}

function assertReviewInputs(input: ProfessionalPixelReviewInput): void {
  const scales = new Set(input.candidateImages.map((image) => image.scale));
  if (!scales.has("original") || !scales.has("mobile")) {
    throw new Error("Professional review requires actual candidate pixels at original and mobile scale.");
  }
  if (new Set(input.professionalAnchors.map((anchor) => anchor.referenceId)).size < 2) {
    throw new Error("Professional review requires at least two independently identified anchor images.");
  }
  if (input.candidateImages.length + input.professionalAnchors.length > 12) {
    throw new Error("Professional review exceeds the twelve-image inspection limit.");
  }
}

function assertCritiqueEvidence(critique: ProfessionalCritique, input: ProfessionalPixelReviewInput): void {
  if (critique.renderedAssetId !== input.renderedAssetId || critique.renderedAssetSha256 !== input.renderedAssetSha256) {
    throw new Error(`${critique.criticRole} reviewed a stale or different asset.`);
  }
  const suppliedScales = new Set(input.candidateImages.map((image) => image.scale));
  if (critique.viewingScales.some((scale) => !suppliedScales.has(scale))) {
    throw new Error(`${critique.criticRole} claimed to inspect a scale that was not supplied.`);
  }
  const suppliedAnchors = new Set(input.professionalAnchors.map((anchor) => anchor.referenceId));
  if (critique.professionalAnchorComparison.referenceIds.some((referenceId) => !suppliedAnchors.has(referenceId))) {
    throw new Error(`${critique.criticRole} claimed an anchor comparison without supplied pixels.`);
  }
}

function finalCritiqueDecision(critiques: ProfessionalCritique[]): ProfessionalCritiqueSet["finalDecision"] {
  if (critiques.some((critique) => critique.hardFails.length || critique.restartConcept || critique.decision === "REJECT")) return "REJECT";
  if (critiques.every((critique) => critique.total >= 152 && critique.decision === "EXCELLENT" && critique.professionalAnchorComparison.verdict !== "below" && critique.professionalAnchorComparison.verdict !== "materially-below")) return "EXCELLENT";
  if (critiques.every((critique) => critique.total >= 145 && ["PROFESSIONAL_CANDIDATE", "EXCELLENT"].includes(critique.decision) && critique.professionalAnchorComparison.verdict !== "below" && critique.professionalAnchorComparison.verdict !== "materially-below")) return "PROFESSIONAL_CANDIDATE";
  return "MAJOR_REVISION";
}

export class ProfessionalPixelCriticPanel {
  constructor(private readonly gateway: StructuredAgentGateway = createAgentGateway()) {}

  async review(input: ProfessionalPixelReviewInput): Promise<ProfessionalCritiqueSet> {
    assertReviewInputs(input);
    const roles = requiredCriticRoles(input.language);
    const critiques = await Promise.all(roles.map(async (criticRole) => {
      const result = await this.gateway.run({
        role: CRITIC_GATEWAY_ROLES[criticRole],
        taskName: `social_media_plugin_pixel_critique_${criticRole.toLocaleLowerCase()}`,
        instructions: [
          `Act independently as ${criticRole}; do not average toward politeness.`,
          "Inspect the actual candidate pixels at original and mobile scale and the supplied professional-anchor pixels.",
          "Score all eight dimensions out of 20 with region-specific evidence. Recompute the total exactly.",
          "A hard fail forces REJECT. Below 145/160 cannot be a professional candidate; below professional anchors cannot pass.",
          "Reject objectifying or ornamental casting, any woman used as an attention device, and any visible person without a necessary narrative role. Do not infer gender from pixels; assess the declared casting intent and the visible treatment.",
          "Do not use filenames, embedded data tags, the design brief, or claimed intent as proof of visual quality.",
        ].join(" "),
        input: {
          renderedAssetId: input.renderedAssetId,
          renderedAssetSha256: input.renderedAssetSha256,
          criticRole,
          requiredViewingScales: ["original", "mobile"],
          professionalAnchors: input.professionalAnchors.map((anchor) => ({ referenceId: anchor.referenceId, compareFor: anchor.compareFor })),
        },
        imageInputs: [
          ...input.candidateImages.map((image) => ({
            imageUrl: image.imageUrl,
            label: `${image.label} (${image.scale})`,
            kind: "rendered-candidate" as const,
            detail: image.scale === "original" ? "original" as const : "high" as const,
          })),
          ...input.professionalAnchors.map((anchor) => ({
            imageUrl: anchor.imageUrl,
            label: `professional anchor ${anchor.referenceId}`,
            kind: "professional-anchor" as const,
            detail: "high" as const,
          })),
        ],
        schema: ProfessionalCritiqueSchema,
        ...(input.fixtures?.[criticRole] ? { fixture: input.fixtures[criticRole] } : {}),
        reasoningEffort: "high",
        ...(input.traceId ? { traceId: input.traceId } : {}),
      });
      assertCritiqueEvidence(result.value, input);
      return result.value;
    }));

    const finalDecision = finalCritiqueDecision(critiques);
    return ProfessionalCritiqueSetSchema.parse({
      setId: randomUUID(),
      renderedAssetId: input.renderedAssetId,
      renderedAssetSha256: input.renderedAssetSha256,
      language: input.language,
      critiques,
      pairwiseComparisons: [],
      finalDecision,
      disagreementReasons: [],
      nextAction: finalDecision === "REJECT"
        ? "Discard this execution; return to art direction when the concept or core craft is rejected."
        : finalDecision === "MAJOR_REVISION"
          ? "Apply only the observable pixel-level revisions, rerender, hash the new asset, and restart independent review."
          : "Retain as a benchmark candidate and run blind old-versus-new plus feed-coherence review before release.",
    });
  }

  async comparePair(input: {
    candidateAAssetId: string;
    candidateBAssetId: string;
    candidateAImages: ReviewImageInput[];
    candidateBImages: ReviewImageInput[];
    fixture?: PairwiseCreativeComparison;
    traceId?: string;
  }): Promise<PairwiseCreativeComparison> {
    const result = await this.gateway.run({
      role: "ADJUDICATOR",
      taskName: "social_media_plugin_blind_pairwise_creative_v2",
      instructions: "Compare A and B only from supplied pixels. Use blind labels, select neither when both miss the professional bar, and give observable reasons across every rubric dimension.",
      input: {
        candidateAAssetId: input.candidateAAssetId,
        candidateBAssetId: input.candidateBAssetId,
        rubricDimensions: ["concept", "composition", "typography", "visualCraft", "brand", "communication", "professionalPolish", "distinctiveness"],
      },
      imageInputs: [
        ...input.candidateAImages.map((image) => ({ imageUrl: image.imageUrl, label: `A ${image.scale}`, kind: "rendered-candidate" as const, detail: "high" as const })),
        ...input.candidateBImages.map((image) => ({ imageUrl: image.imageUrl, label: `B ${image.scale}`, kind: "rendered-candidate" as const, detail: "high" as const })),
      ],
      schema: PairwiseCreativeComparisonSchema,
      ...(input.fixture ? { fixture: input.fixture } : {}),
      reasoningEffort: "high",
      ...(input.traceId ? { traceId: input.traceId } : {}),
    });
    if (!result.value.blindLabelsUsed) throw new Error("Pairwise comparison was not blind.");
    return result.value;
  }
}

export function chooseCreativeRevisionPath(input: {
  consecutiveExecutionFailures: number;
  critiqueSet: ProfessionalCritiqueSet;
}): "REVISE_EXECUTION" | "RETURN_TO_ART_DIRECTION" | "RETAIN_AS_BENCHMARK_CANDIDATE" {
  if (["PROFESSIONAL_CANDIDATE", "EXCELLENT"].includes(input.critiqueSet.finalDecision)) return "RETAIN_AS_BENCHMARK_CANDIDATE";
  if (
    input.consecutiveExecutionFailures >= 2
    || input.critiqueSet.finalDecision === "REJECT"
    || input.critiqueSet.critiques.some((critique) => critique.restartConcept || critique.hardFails.length > 0)
  ) return "RETURN_TO_ART_DIRECTION";
  return "REVISE_EXECUTION";
}
