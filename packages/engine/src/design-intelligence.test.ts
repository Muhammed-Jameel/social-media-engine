import { describe, expect, it } from "vitest";
import { DesignKnowledgeRetriever, type DesignKnowledgeBase } from "./design-intelligence";

const basePrinciple = {
  name: "Focal dominance",
  description: "One dominant semantic object carries the idea before supporting copy is read.",
  whyItWorks: "Unequal visual weight creates an immediate entry point and reduces decoding time.",
  appropriateFor: ["education"],
  avoidWhen: [],
  visualFamilies: ["conceptual-hero"],
  languages: ["ar", "en"] as Array<"ar" | "en">,
  anthropomorphismLevels: [0, 1, 2],
  strongReferenceIds: [],
  socialMediaPluginApplication: "Give the concept object at least half of the available visual emphasis.",
  retrievalTags: ["clarity", "single", "focus"],
  mustNotCopy: "Do not reproduce the source object, crop, or headline relationship.",
  domain: "composition",
};

const knowledge: DesignKnowledgeBase = {
  corpusVersion: "corpus-test-v1",
  principles: [
    { ...basePrinciple, id: "P-1" },
    { ...basePrinciple, id: "P-2", name: "Semantic crop" },
    { ...basePrinciple, id: "P-3", name: "Purposeful space" },
  ],
  references: ["a", "b", "c"].map((suffix, index) => ({
    referenceId: `ref_${suffix.repeat(16)}`,
    sourcePath: `/read-only/${suffix}.webp`,
    sha256: suffix.repeat(64),
    clusterId: `cluster_0${index + 1}`,
    rightsState: "REFERENCE_ONLY" as const,
    reviewStatus: "CURATED_STRONG" as const,
    anchorTier: "gold" as const,
    purposes: ["education"],
    visualFamilies: ["conceptual-hero"],
    languages: ["ar" as const],
    imageryModes: ["conceptual-illustration"],
    anthropomorphismLevels: [1],
    retrievalTags: ["clarity"],
    strengthRationale: "A strong purpose-led hierarchy with an immediate semantic focal point.",
    qualityDimensions: ["concept", "composition"],
    principleIds: ["P-1"],
    doNotCopy: ["Do not reproduce its composition."],
    analysis: {},
  })),
};

describe("design intelligence retrieval", () => {
  it("returns a diverse principle-only generation packet and pixel anchors for critics", () => {
    const packet = new DesignKnowledgeRetriever(knowledge).retrieve({
      purpose: "education",
      visualFamily: "conceptual-hero",
      language: "ar",
      imageryMode: "conceptual-illustration",
      anthropomorphismLevel: 1,
      desiredFeeling: "intelligent clarity",
      communicationGoal: "Explain retrieval without technical clutter",
      informationDensity: "low",
    });
    expect(packet.status).toBe("READY");
    expect(packet.generationContext.rawReferencePixelsIncluded).toBe(false);
    expect(packet.references).toHaveLength(3);
    expect(new Set(packet.references.map((item) => item.reference.clusterId)).size).toBe(3);
    expect(packet.criticAnchors.every((anchor) => anchor.sourcePath.startsWith("/read-only/"))).toBe(true);
    expect(packet.knowledgeHash).toMatch(/^[a-f0-9]{64}$/);
  });
});
