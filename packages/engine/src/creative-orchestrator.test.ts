import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type {
  ConceptTournament,
  CreativeConceptCandidate,
  ProfessionalCritique,
  ProfessionalCritiqueSet,
  VisualFamily,
  ImageryMode,
} from "@social-media-plugin/schemas";
import { FixtureAgentGateway } from "./agents";
import {
  buildArtDirectionKnowledgeContext,
  chooseCreativeRevisionPath,
  ProfessionalCreativeOrchestrator,
  ProfessionalPixelCriticPanel,
  type ProfessionalArtDirectionInput,
} from "./creative-orchestrator";
import { DesignKnowledgeRetriever, type DesignKnowledgePacket } from "./design-intelligence";

const assetId = "asset-benchmark-01";
const assetHash = "a".repeat(64);

function concept(
  index: number,
  packet: DesignKnowledgePacket,
  visualFamily: VisualFamily,
  imageryMode: ImageryMode,
): CreativeConceptCandidate {
  const references = packet.references.slice(0, 3);
  const principles = packet.principles.slice(0, 3);
  return {
    candidateId: `route-${index}`,
    title: `Distinct operating route ${index}`,
    purpose: "education",
    audienceTension: "Operational context disappears between decisions and handoffs.",
    desiredFeeling: "calm control",
    twoSecondTakeaway: "Context remains attached to the work.",
    singleVisualIdea: `A unique material system behavior transforms a broken handoff into a continuous controlled path ${index}.`,
    textlessComprehension: "A visible state change shows disconnected parts becoming one accountable flow.",
    visualMetaphor: `A materially specific transition mechanism unique to route ${index}.`,
    storytellingMechanism: "The scene moves from fragmented ownership to one inspectable next action.",
    verbalVisualRelationship: "The image demonstrates the change while the words name its operational consequence.",
    visualFamily,
    anthropomorphism: {
      level: index % 3,
      behaviorHumanized: "handoff",
      comprehensionBenefit: "The behavior makes responsibility legible without a mascot.",
      faceRequired: false,
      faceTestResult: "The behavior remains clear after removing every facial cue.",
      emotionalRegister: "assured",
      capabilityBoundary: "It signals an explicit handoff, never autonomous judgment.",
      childishnessRisk: "low",
    },
    composition: {
      focalPoint: "The moment the fragmented path becomes continuous",
      focalWeight: 0.57,
      centerOfGravity: index % 2 ? "right" : "left",
      eyePath: ["state break", "green transfer", "resolved owner"],
      grid: { columns: 8, baseUnit: 12, intentionalBreak: "The transfer crosses one grid boundary to show state change." },
      zones: [
        { name: "change", role: "focal", x: 0.1, y: 0.2, width: 0.5, height: 0.45 },
        { name: "claim", role: "support", x: 0.55, y: 0.1, width: 0.35, height: 0.25 },
        { name: "signature", role: "brand", x: 0.7, y: 0.86, width: 0.2, height: 0.06 },
      ],
      foreground: "One sharply resolved transfer edge",
      middleGround: "The source and destination states",
      background: "A quiet paper field with no ornamental technology texture",
      negativeSpacePurpose: "Protect the headline entry and isolate the causal state change.",
    },
    typography: {
      language: "ar",
      direction: "rtl",
      headlineLines: ["السياق يبقى", "داخل العمل"],
      displayScaleRatio: 4.2,
      alignment: "start",
      interactionWithImagery: "The headline begins in the calm field and points toward the completed transfer.",
      arabicSpecificDecision: "Break after the complete semantic clause and balance the joined letter mass optically.",
    },
    imagery: {
      mode: imageryMode,
      subject: `Original route-${index} operational material behavior`,
      crop: "Tight enough to make contact and transfer edges visible",
      perspective: index % 2 ? "low oblique" : "near-orthographic",
      lighting: "Directional soft light with a single charged green state",
      material: "Paper, translucent resin, or brushed metal according to route",
      texture: "Controlled tactile detail without synthetic glow haze",
      relationToTypography: "The material action counterbalances rather than sits behind the Arabic type.",
      assetPlan: [{ asset: "bespoke focal scene", source: "generated-bespoke", licenseEvidence: "Original SOCIAL_MEDIA_PLUGIN generation record" }],
    },
    referenceUses: references.map(({ reference }, referenceIndex) => ({
      referenceId: reference.referenceId,
      principleId: principles[referenceIndex]!.principle.id,
      learnedPrinciple: "Use one dominant action and let supporting detail reinforce its causal meaning.",
      whyRelevant: "The brief needs immediate comprehension without returning to a fixed template.",
      mustNotCopy: "Do not reuse the source subject, crop, layout, palette recipe, character, or campaign mechanism.",
      rightsState: "REFERENCE_ONLY",
    })),
    forbiddenAdditions: ["floating UI cards", "robot head", "decorative gradient"],
    originalityRationale: `Route ${index} combines a new operational behavior, material, viewpoint, and Arabic composition not found together in any one reference.`,
    professionalChoiceRationale: "The route makes the service behavior inspectable and gives every compositional choice a communication job.",
    risks: ["Contact edges must survive final-size raster inspection."],
  };
}

function tournament(packet: DesignKnowledgePacket, count = 4): ConceptTournament {
  const families: VisualFamily[] = ["conceptual-hero", "editorial-statement", "process-explainer", "character-narrative"];
  const modes: ImageryMode[] = ["conceptual-photomanipulation", "typography-led", "bespoke-3d", "conceptual-illustration"];
  const candidates = Array.from({ length: count }, (_, index) => concept(index + 1, packet, families[index]!, modes[index]!));
  return {
    candidates,
    pairwiseComparisons: [
      { candidateAId: "route-1", candidateBId: "route-2", winnerId: "route-1", conceptReason: "The state change is more singular.", communicationReason: "It reads faster without labels.", executionRisk: "Contact craft needs inspection." },
      { candidateAId: "route-1", candidateBId: "route-3", winnerId: "route-1", conceptReason: "The metaphor is less generic.", communicationReason: "The operational consequence remains clearer.", executionRisk: "Arabic mass must be optically balanced." },
    ],
    selectedCandidateIds: ["route-1"],
    rejectedCandidates: [{ candidateId: "route-2", reason: "Its typographic route carries less product-specific evidence." }],
  };
}

function directionInput(packet: DesignKnowledgePacket, count = 4): ProfessionalArtDirectionInput {
  return {
    contentItemId: "00000000-0000-4000-8000-000000000001",
    communicationGoal: "Explain how SOCIAL_MEDIA_PLUGIN keeps operational context attached to each handoff.",
    purpose: "education",
    audience: "Iraqi and regional operations leaders",
    audienceTension: "Critical context is lost when work passes between people and tools.",
    desiredFeeling: "calm control",
    twoSecondTakeaway: "Context remains attached to the work.",
    language: "ar",
    exactText: ["السياق يبقى داخل العمل"],
    visualFamily: "conceptual-hero",
    imageryMode: "conceptual-photomanipulation",
    anthropomorphismLevel: 1,
    informationDensity: "low",
    canvas: { width: 1080, height: 1350 },
    recentFeed: { comparedPostIds: [], prohibitedRepeatedStructures: ["centered rounded card"], targetRhythmRole: "anchor" },
    envelope: {
      schemaVersion: "1.0.0",
      modelVersion: "fixture-v1",
      promptVersion: "art-direction-v2",
      skillVersions: ["social-art-direction@2.0.0"],
      templateVersion: null,
      traceId: "00000000-0000-4000-8000-000000000002",
      createdAt: "2026-08-23T10:00:00.000Z",
      sources: [],
    },
    fixture: {
      answers: {
        communicationJob: "Make continuity of operational context immediately legible.",
        audienceTension: "Leaders cannot see which context survived a handoff.",
        desiredFeeling: "Calm confidence in a controlled operating flow.",
        twoSecondMeaning: "Context stays attached while work changes owners.",
        singleVisualIdea: "A broken material path seals itself only at an explicit handoff.",
        textlessComprehension: "The discontinuity visibly becomes one connected accountable path.",
        materialMetaphor: "A charged seam preserves information across two unlike materials.",
        storyChange: "Loose fragments become one inspectable sequence with a clear owner.",
        verbalVisualRelationship: "The visual proves continuity while the headline names the retained context.",
        focalPointAndEyePath: "The eye enters at the break, follows the green seal, and exits at the owner marker.",
        negativeSpacePurpose: "The quiet field protects Arabic entry and makes the transfer singular.",
        languageCompositionDecision: "The RTL headline begins at the upper right and hands attention into the leftward action.",
        assetCraftDecision: "A bespoke macro material scene needs credible contacts, soft directional light, and restrained texture.",
        anthropomorphismDecision: "Humanize the act of handing over through motion; a face would reduce authority.",
        socialMediaPluginDistinctiveness: "The green charge represents active operational intelligence inside a deep-green material world.",
      },
      tournament: tournament(packet, count),
    },
  };
}

function critique(role: ProfessionalCritique["criticRole"], total = 146): ProfessionalCritique {
  const base = Math.floor(total / 8);
  const scores = {
    concept: base + (total % 8 > 0 ? 1 : 0),
    composition: base + (total % 8 > 1 ? 1 : 0),
    typography: base + (total % 8 > 2 ? 1 : 0),
    visualCraft: base + (total % 8 > 3 ? 1 : 0),
    brand: base + (total % 8 > 4 ? 1 : 0),
    communication: base + (total % 8 > 5 ? 1 : 0),
    professionalPolish: base + (total % 8 > 6 ? 1 : 0),
    distinctiveness: base,
  };
  return {
    critiqueId: `critique-${role}`,
    renderedAssetId: assetId,
    renderedAssetSha256: assetHash,
    criticRole: role,
    actualPixelsInspected: true,
    viewingScales: ["original", "mobile"],
    scores,
    total,
    evidenceObservations: [
      { dimension: "concept", region: "central seam", observation: "The material state change is immediately causal and specific.", impact: "positive" },
      { dimension: "composition", region: "upper-right field", observation: "The Arabic entry has enough space and a clear path into the scene.", impact: "positive" },
      { dimension: "typography", region: "headline block", observation: "Semantic line breaks remain intact at the mobile inspection scale.", impact: "positive" },
      { dimension: "visualCraft", region: "contact edge", observation: "The contact shadow is clean although one highlight still feels synthetic.", impact: "neutral" },
    ],
    hardFails: [],
    professionalAnchorComparison: {
      referenceIds: ["anchor-professional-01", "anchor-professional-02"],
      verdict: "comparable",
      observableDifferences: ["The candidate has equally singular focal hierarchy.", "Its microtexture is slightly less resolved but its Arabic hierarchy is stronger."],
    },
    strengths: ["The visual concept survives without copy."],
    weaknesses: ["One specular highlight can be more materially precise."],
    revisionInstructions: ["Reduce the upper seam highlight by roughly one third without changing geometry."],
    restartConcept: false,
    decision: "PROFESSIONAL_CANDIDATE",
  };
}

describe("professional creative orchestration", () => {
  it("retrieves diverse knowledge, strips paths, and produces a principle-only generation handoff", async () => {
    const retriever = await DesignKnowledgeRetriever.fromDirectory(join(process.cwd(), "design-intelligence"));
    const packet = retriever.retrieve({
      purpose: "education", visualFamily: "conceptual-hero", language: "ar", imageryMode: "conceptual-photomanipulation",
      anthropomorphismLevel: 1, desiredFeeling: "calm control", communicationGoal: "keep context attached to handoffs", informationDensity: "low",
      principleLimit: 10, referenceLimit: 6,
    });
    const serialized = JSON.stringify(buildArtDirectionKnowledgeContext(packet));
    expect(serialized).not.toContain("sourcePath");
    expect(serialized).not.toContain("/Users/");

    const result = await new ProfessionalCreativeOrchestrator(retriever, new FixtureAgentGateway()).direct(directionInput(packet));
    expect(result.tournament.candidates).toHaveLength(4);
    expect(result.brief.selectedCandidateId).toBe("route-1");
    expect(result.generationHandoff.rawReferencePixelsIncluded).toBe(false);
    expect(JSON.stringify(result.generationHandoff)).not.toContain("sourcePath");
  });

  it("rejects cosmetic three-route ideation before production", async () => {
    const retriever = await DesignKnowledgeRetriever.fromDirectory(join(process.cwd(), "design-intelligence"));
    const packet = retriever.retrieve({
      purpose: "education", visualFamily: "conceptual-hero", language: "ar", imageryMode: "conceptual-photomanipulation",
      anthropomorphismLevel: 1, desiredFeeling: "calm control", communicationGoal: "keep context attached to handoffs", informationDensity: "low",
      principleLimit: 10, referenceLimit: 6,
    });
    await expect(new ProfessionalCreativeOrchestrator(retriever, new FixtureAgentGateway()).direct(directionInput(packet, 3)))
      .rejects.toThrow("at least four concept candidates");
  });
});

describe("pixel-grounded critic panel", () => {
  it("requires original/mobile pixels and two professional anchors from every independent critic", async () => {
    const roles: ProfessionalCritique["criticRole"][] = ["SENIOR_ART_DIRECTOR", "SENIOR_GRAPHIC_DESIGNER", "SOCIAL_PERFORMANCE_STRATEGIST", "ARABIC_DESIGN_REVIEWER"];
    const panel = new ProfessionalPixelCriticPanel(new FixtureAgentGateway());
    const result = await panel.review({
      renderedAssetId: assetId,
      renderedAssetSha256: assetHash,
      language: "ar",
      candidateImages: [
        { imageUrl: "data:image/png;base64,AAAA", label: "candidate", scale: "original" },
        { imageUrl: "data:image/png;base64,BBBB", label: "candidate", scale: "mobile" },
      ],
      professionalAnchors: [
        { imageUrl: "data:image/jpeg;base64,CCCC", referenceId: "anchor-professional-01", compareFor: ["concept", "craft"] },
        { imageUrl: "data:image/jpeg;base64,DDDD", referenceId: "anchor-professional-02", compareFor: ["typography", "composition"] },
      ],
      fixtures: Object.fromEntries(roles.map((role) => [role, critique(role)])),
    });
    expect(result.critiques).toHaveLength(4);
    expect(result.finalDecision).toBe("PROFESSIONAL_CANDIDATE");
    expect(chooseCreativeRevisionPath({ consecutiveExecutionFailures: 0, critiqueSet: result })).toBe("RETAIN_AS_BENCHMARK_CANDIDATE");
  });

  it("returns to art direction after two failed execution loops", () => {
    const set = {
      finalDecision: "MAJOR_REVISION",
      critiques: [],
    } as unknown as ProfessionalCritiqueSet;
    expect(chooseCreativeRevisionPath({ consecutiveExecutionFailures: 2, critiqueSet: set })).toBe("RETURN_TO_ART_DIRECTION");
  });
});
