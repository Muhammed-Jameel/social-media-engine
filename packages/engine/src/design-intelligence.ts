import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import { z } from "zod";
import type { DesignPurpose, ImageryMode, VisualFamily } from "@aurendor/schemas";

const PrincipleSchema = z.object({
  id: z.string().min(3),
  name: z.string().min(3),
  description: z.string().min(12),
  whyItWorks: z.string().min(12),
  appropriateFor: z.array(z.string()).min(1),
  avoidWhen: z.array(z.string()),
  visualFamilies: z.array(z.string()),
  languages: z.array(z.enum(["ar", "en"])).min(1),
  anthropomorphismLevels: z.array(z.number().int().min(0).max(5)),
  strongReferenceIds: z.array(z.string()),
  aurendorApplication: z.string().min(12),
  retrievalTags: z.array(z.string()),
  mustNotCopy: z.string().min(12),
});

const PrincipleFileSchema = z.object({
  schemaVersion: z.string(),
  domain: z.string().min(2),
  principles: z.array(PrincipleSchema).min(1),
});

const ReferenceSchema = z.object({
  referenceId: z.string().min(8),
  sourcePath: z.string().min(1),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  clusterId: z.string().min(3),
  rightsState: z.literal("REFERENCE_ONLY"),
  reviewStatus: z.enum(["CURATED_STRONG", "CURATED_SPECIALIST", "CONTEXT_ONLY", "REJECTED_AS_ANCHOR"]),
  anchorTier: z.enum(["gold", "silver", "context"]),
  purposes: z.array(z.string()).min(1),
  visualFamilies: z.array(z.string()).min(1),
  languages: z.array(z.enum(["ar", "en"])).min(1),
  imageryModes: z.array(z.string()).min(1),
  anthropomorphismLevels: z.array(z.number().int().min(0).max(5)),
  retrievalTags: z.array(z.string()),
  strengthRationale: z.string().min(16),
  qualityDimensions: z.array(z.string()).min(1),
  principleIds: z.array(z.string()).min(1),
  doNotCopy: z.array(z.string().min(8)).min(1),
  analysis: z.record(z.string(), z.unknown()),
});

const ReferenceFileSchema = z.object({
  schemaVersion: z.string(),
  corpusVersion: z.string().min(3),
  references: z.array(ReferenceSchema),
});

export type DesignPrinciple = z.infer<typeof PrincipleSchema> & { domain: string };
export type CuratedDesignReference = z.infer<typeof ReferenceSchema>;

export interface DesignKnowledgeBase {
  corpusVersion: string;
  principles: DesignPrinciple[];
  references: CuratedDesignReference[];
}

export interface DesignKnowledgeRequest {
  purpose: DesignPurpose;
  visualFamily: VisualFamily;
  language: "ar" | "en";
  imageryMode: ImageryMode;
  anthropomorphismLevel: number;
  desiredFeeling: string;
  communicationGoal: string;
  informationDensity: "low" | "medium" | "high";
  principleLimit?: number;
  referenceLimit?: number;
}

export interface RankedPrinciple {
  principle: DesignPrinciple;
  score: number;
  reasons: string[];
}

export interface RankedReference {
  reference: CuratedDesignReference;
  score: number;
  reasons: string[];
}

export interface DesignKnowledgePacket {
  schemaVersion: "1.0.0";
  status: "READY" | "BLOCKED";
  corpusVersion: string;
  knowledgeHash: string;
  request: DesignKnowledgeRequest;
  principles: RankedPrinciple[];
  references: RankedReference[];
  generationContext: {
    principleInstructions: Array<{ principleId: string; decision: string; why: string; mustNotCopy: string }>;
    referenceIds: string[];
    rawReferencePixelsIncluded: false;
  };
  criticAnchors: Array<{ referenceId: string; sourcePath: string; compareFor: string[] }>;
  antiCopyControls: string[];
  blockers: string[];
}

function stableHash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function tokens(value: string): Set<string> {
  return new Set(value.toLocaleLowerCase().split(/[^\p{L}\p{N}]+/u).filter((token) => token.length > 1));
}

function overlapScore(left: string[], right: string): number {
  const target = tokens(right);
  return left.reduce((score, value) => score + [...tokens(value)].filter((token) => target.has(token)).length, 0);
}

function scorePrinciple(principle: DesignPrinciple, request: DesignKnowledgeRequest): RankedPrinciple {
  let score = 0;
  const reasons: string[] = [];
  if (principle.appropriateFor.includes(request.purpose)) {
    score += 8;
    reasons.push(`supports ${request.purpose}`);
  }
  if (principle.visualFamilies.includes(request.visualFamily)) {
    score += 7;
    reasons.push(`belongs to ${request.visualFamily}`);
  }
  if (principle.languages.includes(request.language)) {
    score += request.language === "ar" ? 5 : 3;
    reasons.push(`validated for ${request.language}`);
  }
  if (principle.anthropomorphismLevels.includes(request.anthropomorphismLevel)) {
    score += 4;
    reasons.push(`matches anthropomorphism level ${request.anthropomorphismLevel}`);
  }
  const semantic = overlapScore(
    [principle.name, principle.description, principle.whyItWorks, ...principle.retrievalTags],
    `${request.desiredFeeling} ${request.communicationGoal} ${request.informationDensity}`,
  );
  score += Math.min(semantic, 6);
  if (semantic) reasons.push("semantic match to the communication objective");
  return { principle, score, reasons };
}

function scoreReference(reference: CuratedDesignReference, request: DesignKnowledgeRequest): RankedReference {
  let score = reference.anchorTier === "gold" ? 4 : reference.anchorTier === "silver" ? 2 : 0;
  const reasons: string[] = [reference.strengthRationale];
  if (reference.purposes.includes(request.purpose)) {
    score += 8;
    reasons.push(`purpose match: ${request.purpose}`);
  }
  if (reference.visualFamilies.includes(request.visualFamily)) {
    score += 7;
    reasons.push(`visual-family match: ${request.visualFamily}`);
  }
  if (reference.languages.includes(request.language)) {
    score += request.language === "ar" ? 5 : 3;
    reasons.push(`language anchor: ${request.language}`);
  }
  if (reference.imageryModes.includes(request.imageryMode)) {
    score += 4;
    reasons.push(`imagery mode: ${request.imageryMode}`);
  }
  if (reference.anthropomorphismLevels.includes(request.anthropomorphismLevel)) {
    score += 3;
    reasons.push(`anthropomorphism level ${request.anthropomorphismLevel}`);
  }
  score += Math.min(overlapScore(reference.retrievalTags, `${request.desiredFeeling} ${request.communicationGoal}`), 5);
  if (reference.reviewStatus === "REJECTED_AS_ANCHOR") score = -100;
  return { reference, score, reasons };
}

function diversifyReferences(ranked: RankedReference[], limit: number): RankedReference[] {
  const selected: RankedReference[] = [];
  const clusterCounts = new Map<string, number>();
  for (const candidate of ranked) {
    if (selected.length >= limit) break;
    if (candidate.score < 0) continue;
    const clusterCount = clusterCounts.get(candidate.reference.clusterId) ?? 0;
    if (clusterCount >= 2) continue;
    if (selected.some((item) => item.reference.sha256 === candidate.reference.sha256)) continue;
    selected.push(candidate);
    clusterCounts.set(candidate.reference.clusterId, clusterCount + 1);
  }
  return selected;
}

export class DesignKnowledgeRetriever {
  constructor(private readonly knowledge: DesignKnowledgeBase) {}

  static async fromDirectory(root: string): Promise<DesignKnowledgeRetriever> {
    const principleDirectory = join(root, "principles");
    const files = (await readdir(principleDirectory)).filter((file) => file.endsWith(".yaml") && file !== "taxonomy.yaml").sort();
    const principles: DesignPrinciple[] = [];
    for (const filename of files) {
      const parsed = PrincipleFileSchema.parse(parseYaml(await readFile(join(principleDirectory, filename), "utf8")));
      principles.push(...parsed.principles.map((principle) => ({ ...principle, domain: parsed.domain })));
    }
    const referenceFile = ReferenceFileSchema.parse(JSON.parse(await readFile(join(root, "corpus", "references.json"), "utf8")) as unknown);
    return new DesignKnowledgeRetriever({ corpusVersion: referenceFile.corpusVersion, principles, references: referenceFile.references });
  }

  retrieve(request: DesignKnowledgeRequest): DesignKnowledgePacket {
    const principleLimit = request.principleLimit ?? 8;
    const referenceLimit = request.referenceLimit ?? 5;
    const principles = this.knowledge.principles
      .map((principle) => scorePrinciple(principle, request))
      .sort((left, right) => right.score - left.score || left.principle.id.localeCompare(right.principle.id))
      .slice(0, principleLimit);
    const references = diversifyReferences(
      this.knowledge.references
        .map((reference) => scoreReference(reference, request))
        .sort((left, right) => right.score - left.score || left.reference.referenceId.localeCompare(right.reference.referenceId)),
      referenceLimit,
    );
    const blockers: string[] = [];
    if (principles.length < 3) blockers.push("Fewer than three relevant design principles were retrieved.");
    if (references.length < 3) blockers.push("Fewer than three diverse professional references were retrieved.");
    if (new Set(references.map((item) => item.reference.clusterId)).size < 2) blockers.push("Reference set lacks visual-family diversity.");
    const packetWithoutHash = {
      schemaVersion: "1.0.0" as const,
      status: blockers.length ? "BLOCKED" as const : "READY" as const,
      corpusVersion: this.knowledge.corpusVersion,
      request,
      principles,
      references,
      generationContext: {
        principleInstructions: principles.map(({ principle }) => ({
          principleId: principle.id,
          decision: principle.aurendorApplication,
          why: principle.whyItWorks,
          mustNotCopy: principle.mustNotCopy,
        })),
        referenceIds: references.map(({ reference }) => reference.referenceId),
        rawReferencePixelsIncluded: false as const,
      },
      criticAnchors: references.map(({ reference }) => ({
        referenceId: reference.referenceId,
        sourcePath: reference.sourcePath,
        compareFor: reference.qualityDimensions,
      })),
      antiCopyControls: [
        "Generation receives extracted principles and reference IDs, never a request to reproduce a composition.",
        "Use at least three references across at least two computational clusters.",
        "Remove creator, campaign, and studio names from generation prompts.",
        "Hard-fail copied logos, characters, silhouettes, watermarks, or distinctive layouts.",
        "Compare final pixels with nearest corpus candidates before release.",
      ],
      blockers,
    };
    return { ...packetWithoutHash, knowledgeHash: stableHash(packetWithoutHash) };
  }
}
