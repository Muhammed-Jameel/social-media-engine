import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import { z, type ZodType } from "zod";
import type { DatabaseClient } from "@aurendor/db/runtime";
import {
  AnthropomorphismLevelSchema,
  ArtifactEnvelopeSchema,
  DesignPurposeSchema,
  ImageryModeSchema,
  ProfessionalCritiqueSetSchema,
  ProfessionalDesignBriefSchema,
  SourceReferenceSchema,
  VisualFamilySchema,
} from "@aurendor/schemas";
import {
  ArtDirectionDecisionSchema,
  ProfessionalCreativeOrchestrator,
  ProfessionalPixelCriticPanel,
  type ProfessionalAnchorImageInput,
} from "./creative-orchestrator";
import { DesignKnowledgeRetriever } from "./design-intelligence";
import { canonicalSha256, computePostProductionApprovalBinding } from "./evidence";
import { EngineError } from "./errors";
import {
  enqueueWorkflow,
  offlineWorkflowExecutor,
  type WorkflowStepExecutor,
} from "./workflows";

const SHA256_PATTERN = /^[a-f0-9]{64}$/u;
const DEFAULT_PIXEL_FETCH_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_PIXEL_BYTES = 25 * 1024 * 1024;
const MAX_PIXEL_DIMENSION = 16_384;
const MAX_PIXEL_AREA = 100_000_000;
const SUPPORTED_PIXEL_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
type SupportedPixelMimeType = typeof SUPPORTED_PIXEL_MIME_TYPES[number];
const Sha256Schema = z.string().regex(SHA256_PATTERN);
const PixelUrlSchema = z.string().refine(
  (value) => /^(?:https:\/\/|data:image\/)/u.test(value),
  "Pixel evidence must use an HTTPS URL or an image data URL.",
);

const ResearchEvidenceSchema = z
  .object({
    disposition: z.enum(["EVIDENCE_ATTACHED", "NOT_REQUIRED"]),
    rationale: z.string().min(12),
    sources: z.array(SourceReferenceSchema),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.disposition === "EVIDENCE_ATTACHED" && value.sources.length === 0) {
      context.addIssue({ code: "custom", path: ["sources"], message: "Evidence-attached research requires at least one source." });
    }
    if (value.disposition === "NOT_REQUIRED" && value.sources.length > 0) {
      context.addIssue({ code: "custom", path: ["sources"], message: "Use EVIDENCE_ATTACHED when source evidence is present." });
    }
  });

export const ProfessionalPostProductionInputSchema = z
  .object({
    schemaVersion: z.literal("1.0.0"),
    contentItemId: z.string().uuid(),
    communicationGoal: z.string().min(12),
    purpose: DesignPurposeSchema,
    audience: z.string().min(2),
    audienceTension: z.string().min(12),
    desiredFeeling: z.string().min(5),
    twoSecondTakeaway: z.string().min(8),
    language: z.enum(["ar", "en"]),
    exactText: z.array(z.string().min(1)).min(1),
    visualFamily: VisualFamilySchema,
    imageryMode: ImageryModeSchema,
    anthropomorphismLevel: AnthropomorphismLevelSchema,
    informationDensity: z.enum(["low", "medium", "high"]),
    canvas: z.object({ width: z.number().int().positive(), height: z.number().int().positive() }).strict(),
    recentFeed: z.object({
      comparedPostIds: z.array(z.string()).min(1),
      comparedAssetSha256ByPostId: z.record(z.string(), Sha256Schema),
      prohibitedRepeatedStructures: z.array(z.string()),
      targetRhythmRole: z.enum(["anchor", "breath", "energy", "information", "narrative"]),
    }).strict().superRefine((value, context) => {
      const uniquePostIds = new Set(value.comparedPostIds);
      const hashPostIds = Object.keys(value.comparedAssetSha256ByPostId);
      if (uniquePostIds.size !== value.comparedPostIds.length) {
        context.addIssue({ code: "custom", path: ["comparedPostIds"], message: "Recent-feed post IDs must be unique." });
      }
      if (
        hashPostIds.length !== uniquePostIds.size
        || hashPostIds.some((postId) => !uniquePostIds.has(postId))
      ) {
        context.addIssue({
          code: "custom",
          path: ["comparedAssetSha256ByPostId"],
          message: "Recent-feed asset hashes must cover exactly the compared post ID set.",
        });
      }
    }),
    research: ResearchEvidenceSchema,
    editorialApproval: z.object({
      status: z.literal("APPROVED"),
      reviewerRef: z.string().min(1),
      approvedAt: z.string().datetime(),
      unsupportedClaimCount: z.literal(0),
      exactTextSha256: z.string().regex(SHA256_PATTERN),
      notes: z.array(z.string()),
    }).strict(),
    envelope: ArtifactEnvelopeSchema,
  })
  .strict()
  .superRefine((value, context) => {
    const envelopeSourceIds = new Set(value.envelope.sources.map((source) => source.sourceId));
    for (const source of value.research.sources) {
      if (!envelopeSourceIds.has(source.sourceId)) {
        context.addIssue({
          code: "custom",
          path: ["research", "sources"],
          message: `Research source ${source.sourceId} is missing from the artifact envelope.`,
        });
      }
    }
    const exactTextSha256 = sha256Json(value.exactText);
    if (value.editorialApproval.exactTextSha256 !== exactTextSha256) {
      context.addIssue({
        code: "custom",
        path: ["editorialApproval", "exactTextSha256"],
        message: "Editorial approval does not bind the exact current on-design copy.",
      });
    }
  });

export type ProfessionalPostProductionInput = z.infer<typeof ProfessionalPostProductionInputSchema>;

const PrincipleInstructionSchema = z.object({
  principleId: z.string().min(3),
  decision: z.string().min(12),
  why: z.string().min(12),
  mustNotCopy: z.string().min(12),
});

const CriticAnchorDescriptorSchema = z.object({
  referenceId: z.string().min(8),
  sourcePath: z.string().min(1),
  sourceSha256: z.string().regex(SHA256_PATTERN),
  compareFor: z.array(z.string()).min(1),
});

const RetrievalReferenceEvidenceSchema = z.object({
  referenceId: z.string().min(8),
  sourceSha256: Sha256Schema,
}).strict();

const DesignIntelligenceEvidenceSchema = z.object({
  status: z.literal("READY"),
  knowledgeHash: Sha256Schema,
  corpusVersion: z.string().min(3),
  referenceIds: z.array(z.string().min(8)).min(3),
  retrievalReferences: z.array(RetrievalReferenceEvidenceSchema).min(3),
  principleIds: z.array(z.string().min(3)).min(3),
  principleInstructions: z.array(PrincipleInstructionSchema).min(3),
  criticAnchors: z.array(CriticAnchorDescriptorSchema).min(2).max(6),
  antiCopyControls: z.array(z.string().min(12)).min(1),
  rawReferencePixelsIncluded: z.literal(false),
  sourcePathsRestrictedToPixelCritics: z.literal(true),
}).strict().superRefine((value, context) => {
  const retrievalIds = value.retrievalReferences.map((reference) => reference.referenceId);
  if (canonicalSha256(retrievalIds) !== canonicalSha256(value.referenceIds)) {
    context.addIssue({
      code: "custom",
      path: ["retrievalReferences"],
      message: "Retrieval reference identities must exactly match the ranked reference ID sequence.",
    });
  }
});

const GenerationHandoffSchema = z.object({
  brief: ProfessionalDesignBriefSchema,
  principleInstructions: z.array(PrincipleInstructionSchema).min(3),
  referenceIds: z.array(z.string().min(8)).min(3).max(10),
  rawReferencePixelsIncluded: z.literal(false),
  antiCopyControls: z.array(z.string().min(12)).min(1),
});

const ConceptStageEvidenceSchema = z.object({
  knowledgeHash: z.string().regex(SHA256_PATTERN),
  decision: ArtDirectionDecisionSchema,
  brief: ProfessionalDesignBriefSchema,
  generationHandoff: GenerationHandoffSchema,
  generationHandoffSha256: z.string().regex(SHA256_PATTERN),
});

const ArtDirectionSelectionEvidenceSchema = z.object({
  brief: ProfessionalDesignBriefSchema,
  generationHandoff: GenerationHandoffSchema,
  generationHandoffSha256: z.string().regex(SHA256_PATTERN),
  selectedCandidateId: z.string().min(3),
  selectionSha256: z.string().regex(SHA256_PATTERN),
});

export const ProfessionalProductionDraftSchema = z.object({
  draftId: z.string().min(3),
  designBriefId: z.string().uuid(),
  provider: z.string().min(2),
  editableUrl: z.string().url().nullable(),
  generationHandoffSha256: z.string().regex(SHA256_PATTERN),
  productionEvidence: z.record(z.string(), z.unknown()),
});
export type ProfessionalProductionDraft = z.infer<typeof ProfessionalProductionDraftSchema>;

const PixelArtifactSchema = z.object({
  scale: z.enum(["original", "mobile"]),
  imageUrl: PixelUrlSchema,
  mimeType: z.enum(SUPPORTED_PIXEL_MIME_TYPES),
  width: z.number().int().positive().max(MAX_PIXEL_DIMENSION),
  height: z.number().int().positive().max(MAX_PIXEL_DIMENSION),
  sha256: Sha256Schema,
  sourceAssetSha256: Sha256Schema,
}).strict();

const RenderPackageFields = {
  renderedAssetId: z.string().min(3),
  renderedAssetSha256: Sha256Schema,
  designBriefId: z.string().uuid(),
  draftId: z.string().min(3),
  licenseStatus: z.enum(["OWNED", "LICENSED", "NOT_REQUIRED"]),
  original: PixelArtifactSchema,
  mobile: PixelArtifactSchema,
};

function validateRenderManifest(
  value: { renderedAssetSha256: string; original: z.infer<typeof PixelArtifactSchema>; mobile: z.infer<typeof PixelArtifactSchema> },
  context: z.RefinementCtx,
): void {
  if (value.original.scale !== "original") {
    context.addIssue({ code: "custom", path: ["original", "scale"], message: "Original evidence must be labeled original." });
  }
  if (value.mobile.scale !== "mobile") {
    context.addIssue({ code: "custom", path: ["mobile", "scale"], message: "Mobile evidence must be labeled mobile." });
  }
  if (value.original.sha256 !== value.renderedAssetSha256 || value.original.sourceAssetSha256 !== value.renderedAssetSha256) {
    context.addIssue({ code: "custom", path: ["renderedAssetSha256"], message: "The canonical render hash must identify the original pixels." });
  }
  if (value.mobile.sourceAssetSha256 !== value.renderedAssetSha256) {
    context.addIssue({ code: "custom", path: ["mobile", "sourceAssetSha256"], message: "Mobile pixels must derive from the exact canonical render." });
  }
  if (value.mobile.width >= value.original.width || value.mobile.height >= value.original.height) {
    context.addIssue({ code: "custom", path: ["mobile"], message: "Mobile pixels must be strictly smaller than the original in both dimensions." });
  }
  if (BigInt(value.original.width) * BigInt(value.mobile.height) !== BigInt(value.original.height) * BigInt(value.mobile.width)) {
    context.addIssue({ code: "custom", path: ["mobile"], message: "Mobile pixels must preserve the exact original aspect ratio." });
  }
  if (
    value.original.width * value.original.height > MAX_PIXEL_AREA
    || value.mobile.width * value.mobile.height > MAX_PIXEL_AREA
  ) {
    context.addIssue({ code: "custom", path: ["original"], message: "Pixel dimensions exceed the verified decoding safety limit." });
  }
}

const UnverifiedProfessionalRenderPackageSchema = z.object(RenderPackageFields).strict().superRefine(validateRenderManifest);

export const ProfessionalRenderPackageSchema = z.object({
  ...RenderPackageFields,
  actualBytesVerified: z.literal(true),
  pixelEvidenceSha256: Sha256Schema,
}).strict().superRefine((value, context) => {
  validateRenderManifest(value, context);
  const expected = computePixelEvidenceSha256(value);
  if (value.pixelEvidenceSha256 !== expected) {
    context.addIssue({
      code: "custom",
      path: ["pixelEvidenceSha256"],
      message: "Pixel evidence hash does not match the canonical two-scale pixel manifest.",
    });
  }
});
export type ProfessionalRenderPackage = z.infer<typeof ProfessionalRenderPackageSchema>;

export const ProfessionalTechnicalPreflightSchema = z
  .object({
    preflightId: z.string().min(3),
    renderedAssetSha256: Sha256Schema,
    pixelEvidenceSha256: Sha256Schema,
    actualBytesVerified: z.literal(true),
    dimensionsVerified: z.boolean(),
    exactCopyBindingVerified: z.boolean(),
    licenseVerified: z.boolean(),
    hardFails: z.array(z.string()),
    decision: z.enum(["PASS", "REJECT"]),
    notes: z.array(z.string()),
  })
  .superRefine((value, context) => {
    const allObjectiveChecksPass = value.dimensionsVerified && value.exactCopyBindingVerified && value.licenseVerified && value.hardFails.length === 0;
    if (value.decision === "PASS" && !allObjectiveChecksPass) {
      context.addIssue({ code: "custom", path: ["decision"], message: "Technical preflight cannot pass with an unresolved objective check." });
    }
  });
export type ProfessionalTechnicalPreflight = z.infer<typeof ProfessionalTechnicalPreflightSchema>;

export const ProfessionalOriginalityReviewSchema = z.object({
  reviewId: z.string().min(3),
  renderedAssetSha256: Sha256Schema,
  pixelEvidenceSha256: Sha256Schema,
  knowledgeHash: Sha256Schema,
  corpusVersion: z.string().min(3),
  retrievalReferences: z.array(RetrievalReferenceEvidenceSchema).min(3),
  candidatePoolCount: z.number().int().positive(),
  actualPixelsInspected: z.literal(true),
  reviewerRef: z.string().min(1),
  reviewedAt: z.string().datetime(),
  inspectedNeighborIds: z.array(z.string().min(3)).min(3),
  referenceDistanceChecked: z.literal(true),
  selfRepetitionChecked: z.literal(true),
  decision: z.enum(["CLEAR", "TOO_CLOSE", "SELF_REPETITION", "BLOCKED"]),
  observations: z.array(z.string().min(12)).min(2),
  revisionInstructions: z.array(z.string().min(12)),
});
export type ProfessionalOriginalityReview = z.infer<typeof ProfessionalOriginalityReviewSchema>;

export const ProfessionalFeedCoherenceReviewSchema = z.object({
  reviewId: z.string().min(3),
  renderedAssetSha256: Sha256Schema,
  pixelEvidenceSha256: Sha256Schema,
  actualPixelsInspected: z.literal(true),
  reviewerRef: z.string().min(1),
  reviewedAt: z.string().datetime(),
  comparedPostIds: z.array(z.string()).min(1),
  comparedAssetSha256ByPostId: z.record(z.string(), Sha256Schema),
  simulatedViews: z.array(z.enum(["3-post", "9-post", "12-post", "monthly"])).min(1),
  repeatedStructures: z.array(z.string()),
  observations: z.array(z.string().min(12)).min(2),
  decision: z.enum(["PASS", "REVISE", "BLOCKED"]),
}).strict().superRefine((value, context) => {
  const postIds = new Set(value.comparedPostIds);
  const hashPostIds = Object.keys(value.comparedAssetSha256ByPostId);
  if (
    postIds.size !== value.comparedPostIds.length
    || hashPostIds.length !== postIds.size
    || hashPostIds.some((postId) => !postIds.has(postId))
  ) {
    context.addIssue({
      code: "custom",
      path: ["comparedAssetSha256ByPostId"],
      message: "Feed-review asset hashes must cover exactly the unique compared post ID set.",
    });
  }
});
export type ProfessionalFeedCoherenceReview = z.infer<typeof ProfessionalFeedCoherenceReviewSchema>;

export const ProfessionalScheduleResultSchema = z.object({
  renderedAssetSha256: Sha256Schema,
  pixelEvidenceSha256: Sha256Schema,
  policyEvidenceSha256: Sha256Schema,
  approvalBindingSha256: Sha256Schema,
  status: z.enum(["SCHEDULED", "PUBLISH_WORKFLOW_ENQUEUED"]),
  scheduleRef: z.string().min(3),
  scheduledAt: z.string().datetime(),
  externalMutation: z.boolean(),
});
export type ProfessionalScheduleResult = z.infer<typeof ProfessionalScheduleResultSchema>;

const CritiqueStageEvidenceSchema = z.object({
  renderedAssetSha256: Sha256Schema,
  pixelEvidenceSha256: Sha256Schema,
  critiqueSet: ProfessionalCritiqueSetSchema,
}).strict();
const AnchorComparisonEvidenceSchema = z.object({
  renderedAssetSha256: Sha256Schema,
  pixelEvidenceSha256: Sha256Schema,
  decision: z.literal("PASS"),
  criticRoles: z.array(z.string()).min(3),
  anchorVerdicts: z.array(z.enum(["comparable", "above"])).min(3),
}).strict();
const OriginalityStageEvidenceSchema = z.object({
  renderedAssetSha256: Sha256Schema,
  pixelEvidenceSha256: Sha256Schema,
  review: ProfessionalOriginalityReviewSchema,
}).strict();
const FeedStageEvidenceSchema = z.object({
  renderedAssetSha256: Sha256Schema,
  pixelEvidenceSha256: Sha256Schema,
  review: ProfessionalFeedCoherenceReviewSchema,
}).strict();
const TechnicalStageEvidenceSchema = z.object({
  renderedAssetSha256: Sha256Schema,
  pixelEvidenceSha256: Sha256Schema,
  preflight: ProfessionalTechnicalPreflightSchema,
}).strict();
const RenderStageEvidenceSchema = z.object({
  renderedAssetSha256: Sha256Schema,
  pixelEvidenceSha256: Sha256Schema,
  renderPackage: ProfessionalRenderPackageSchema,
}).strict().superRefine((value, context) => {
  if (
    value.renderedAssetSha256 !== value.renderPackage.renderedAssetSha256
    || value.pixelEvidenceSha256 !== value.renderPackage.pixelEvidenceSha256
  ) {
    context.addIssue({ code: "custom", path: ["pixelEvidenceSha256"], message: "Render-stage hashes must match the verified render package." });
  }
});
const DraftStageEvidenceSchema = z.object({ draft: ProfessionalProductionDraftSchema });

export const ProfessionalOwnerApprovalEvidenceSchema = z.object({
  approved: z.literal(true),
  actorId: z.string().min(1),
  approvalRef: z.string().min(1),
  completedAt: z.string().datetime(),
  renderedAssetSha256: Sha256Schema,
  pixelEvidenceSha256: Sha256Schema,
  policyEvidenceSha256: Sha256Schema,
  approvalBindingSha256: Sha256Schema,
}).strict().superRefine((value, context) => {
  const expected = computePostProductionApprovalBinding(value);
  if (value.approvalBindingSha256 !== expected) {
    context.addIssue({ code: "custom", path: ["approvalBindingSha256"], message: "Owner approval is not bound to the exact durable policy evidence." });
  }
});
export type ProfessionalOwnerApprovalEvidence = z.infer<typeof ProfessionalOwnerApprovalEvidenceSchema>;

const PolicyStageEvidenceWithoutHashSchema = z.object({
  schemaVersion: z.literal("1.0.0"),
  policyVersion: z.literal("professional-creative-v3"),
  status: z.literal("READY_FOR_OWNER_REVIEW"),
  renderedAssetId: z.string().min(3),
  renderedAssetSha256: Sha256Schema,
  pixelEvidenceSha256: Sha256Schema,
  stageEvidenceSha256: z.object({
    technicalPreflight: Sha256Schema,
    independentPixelCritics: Sha256Schema,
    professionalAnchorComparison: Sha256Schema,
    originalityReview: Sha256Schema,
    feedCoherence: Sha256Schema,
  }).strict(),
  eligibleForOwnerReview: z.literal(true),
  externalMutation: z.literal(false),
}).strict();

export const ProfessionalPolicyStageEvidenceSchema = PolicyStageEvidenceWithoutHashSchema.extend({
  policyEvidenceSha256: Sha256Schema,
}).strict().superRefine((value, context) => {
  const { policyEvidenceSha256, ...preimage } = value;
  if (policyEvidenceSha256 !== sha256Json(preimage)) {
    context.addIssue({ code: "custom", path: ["policyEvidenceSha256"], message: "Policy evidence hash must be the canonical self-excluding hash." });
  }
});
export type ProfessionalPolicyStageEvidence = z.infer<typeof ProfessionalPolicyStageEvidenceSchema>;

export interface ProfessionalAssetProducer {
  produce(input: {
    workflowId: string;
    traceId: string;
    brief: z.infer<typeof ProfessionalDesignBriefSchema>;
    generationHandoff: z.infer<typeof GenerationHandoffSchema>;
    generationHandoffSha256: string;
  }): Promise<unknown>;
}

export interface ProfessionalRenderer {
  render(input: {
    workflowId: string;
    traceId: string;
    brief: z.infer<typeof ProfessionalDesignBriefSchema>;
    draft: ProfessionalProductionDraft;
  }): Promise<unknown>;
}

export interface ProfessionalTechnicalPreflightAdapter {
  inspect(input: {
    workflowId: string;
    traceId: string;
    brief: z.infer<typeof ProfessionalDesignBriefSchema>;
    renderPackage: ProfessionalRenderPackage;
  }): Promise<unknown>;
}

export interface ProfessionalOriginalityReviewer {
  review(input: {
    workflowId: string;
    traceId: string;
    brief: z.infer<typeof ProfessionalDesignBriefSchema>;
    renderPackage: ProfessionalRenderPackage;
    knowledgeHash: string;
    corpusVersion: string;
    retrievalReferences: Array<z.infer<typeof RetrievalReferenceEvidenceSchema>>;
    retrievedReferenceIds: string[];
  }): Promise<unknown>;
}

export interface ProfessionalFeedReviewer {
  review(input: {
    workflowId: string;
    traceId: string;
    brief: z.infer<typeof ProfessionalDesignBriefSchema>;
    renderPackage: ProfessionalRenderPackage;
    comparedPostIds: string[];
    comparedAssetSha256ByPostId: Record<string, string>;
    prohibitedRepeatedStructures: string[];
    targetRhythmRole: ProfessionalPostProductionInput["recentFeed"]["targetRhythmRole"];
    database: DatabaseClient;
  }): Promise<unknown>;
}

export interface ProfessionalScheduleAdapter {
  schedule(input: {
    workflowId: string;
    traceId: string;
    contentItemId: string;
    renderPackage: ProfessionalRenderPackage;
    policyEvidence: ProfessionalPolicyStageEvidence;
    approval: ProfessionalOwnerApprovalEvidence;
    database: DatabaseClient;
  }): Promise<unknown>;
}

export interface ProfessionalAnchorLoader {
  load(anchors: z.infer<typeof CriticAnchorDescriptorSchema>[]): Promise<ProfessionalAnchorImageInput[]>;
}

export interface ProfessionalPostProductionExecutorOptions {
  retriever: DesignKnowledgeRetriever;
  orchestrator?: ProfessionalCreativeOrchestrator;
  criticPanel?: ProfessionalPixelCriticPanel;
  anchorLoader?: ProfessionalAnchorLoader;
  assetProducer?: ProfessionalAssetProducer;
  renderer?: ProfessionalRenderer;
  technicalPreflight?: ProfessionalTechnicalPreflightAdapter;
  originalityReviewer?: ProfessionalOriginalityReviewer;
  feedReviewer?: ProfessionalFeedReviewer;
  scheduler?: ProfessionalScheduleAdapter;
}

function sha256Json(value: unknown): string {
  return canonicalSha256(value);
}

interface PixelEvidenceManifestInput {
  renderedAssetId: string;
  renderedAssetSha256: string;
  original: z.infer<typeof PixelArtifactSchema>;
  mobile: z.infer<typeof PixelArtifactSchema>;
}

export function computePixelEvidenceSha256(value: PixelEvidenceManifestInput): string {
  const artifactManifest = (artifact: z.infer<typeof PixelArtifactSchema>) => ({
    scale: artifact.scale,
    mimeType: artifact.mimeType,
    width: artifact.width,
    height: artifact.height,
    sha256: artifact.sha256,
    sourceAssetSha256: artifact.sourceAssetSha256,
  });
  return canonicalSha256({
    schemaVersion: "1.0.0",
    kind: "POST_PRODUCTION_PIXEL_EVIDENCE",
    renderedAssetId: value.renderedAssetId,
    renderedAssetSha256: value.renderedAssetSha256,
    original: artifactManifest(value.original),
    mobile: artifactManifest(value.mobile),
  });
}

export interface ProfessionalPixelVerificationOptions {
  fetchImpl?: typeof fetch;
  maxBytes?: number;
  timeoutMs?: number;
}

interface LoadedPixelBytes {
  bytes: Buffer;
  transportMimeType: SupportedPixelMimeType;
}

interface IntrinsicImageDescription {
  mimeType: SupportedPixelMimeType;
  width: number;
  height: number;
}

function normalizeSupportedMimeType(value: string): SupportedPixelMimeType | null {
  const normalized = value.split(";", 1)[0]?.trim().toLocaleLowerCase();
  return SUPPORTED_PIXEL_MIME_TYPES.find((mimeType) => mimeType === normalized) ?? null;
}

function decodeDataImageUrl(imageUrl: string, maxBytes: number): LoadedPixelBytes {
  const match = /^data:([^;,]+);base64,([a-z0-9+/]*={0,2})$/iu.exec(imageUrl);
  if (!match) {
    throw asPolicyBlock("Pixel data URLs must contain a supported image MIME type and strict base64 bytes.");
  }
  const transportMimeType = normalizeSupportedMimeType(match[1] ?? "");
  if (!transportMimeType) {
    throw asPolicyBlock("Pixel data URL uses an unsupported image type.", { mimeType: match[1] });
  }
  const base64 = match[2] ?? "";
  if (!base64 || base64.length % 4 !== 0) {
    throw asPolicyBlock("Pixel data URL contains invalid or empty base64 bytes.");
  }
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  const estimatedBytes = (base64.length / 4) * 3 - padding;
  if (estimatedBytes <= 0 || estimatedBytes > maxBytes) {
    throw asPolicyBlock("Pixel data URL violates the decoded byte-size limit.", { estimatedBytes, maxBytes });
  }
  const bytes = Buffer.from(base64, "base64");
  if (
    bytes.length !== estimatedBytes
    || bytes.toString("base64").replace(/=+$/u, "") !== base64.replace(/=+$/u, "")
  ) {
    throw asPolicyBlock("Pixel data URL base64 could not be decoded losslessly.");
  }
  return { bytes, transportMimeType };
}

async function fetchHttpsImage(
  imageUrl: string,
  claimedMimeType: SupportedPixelMimeType,
  options: Required<Pick<ProfessionalPixelVerificationOptions, "fetchImpl" | "maxBytes" | "timeoutMs">>,
): Promise<LoadedPixelBytes> {
  const parsedUrl = new URL(imageUrl);
  if (parsedUrl.protocol !== "https:") {
    throw asPolicyBlock("Remote pixel evidence must use HTTPS.", { protocol: parsedUrl.protocol });
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs);
  try {
    const response = await options.fetchImpl(parsedUrl, {
      signal: controller.signal,
      redirect: "error",
      headers: { accept: claimedMimeType },
    });
    if (!response.ok) {
      throw asPolicyBlock("Remote pixel evidence request failed.", { status: response.status });
    }
    if (response.url && new URL(response.url).protocol !== "https:") {
      throw asPolicyBlock("Remote pixel evidence resolved outside HTTPS.");
    }
    const transportMimeType = normalizeSupportedMimeType(response.headers.get("content-type") ?? "");
    if (!transportMimeType || transportMimeType !== claimedMimeType) {
      throw asPolicyBlock("Remote pixel Content-Type does not match the claimed image type.", {
        claimedMimeType,
        responseContentType: response.headers.get("content-type"),
      });
    }
    const contentLength = response.headers.get("content-length");
    if (contentLength && /^\d+$/u.test(contentLength) && Number(contentLength) > options.maxBytes) {
      throw asPolicyBlock("Remote pixel evidence exceeds the byte-size limit.", { contentLength, maxBytes: options.maxBytes });
    }
    if (!response.body) throw asPolicyBlock("Remote pixel evidence returned an empty body.");
    const chunks: Buffer[] = [];
    let totalBytes = 0;
    const reader = response.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > options.maxBytes) {
        controller.abort();
        throw asPolicyBlock("Remote pixel evidence exceeded the streamed byte-size limit.", { maxBytes: options.maxBytes });
      }
      chunks.push(Buffer.from(value));
    }
    if (totalBytes === 0) throw asPolicyBlock("Remote pixel evidence returned zero bytes.");
    return { bytes: Buffer.concat(chunks, totalBytes), transportMimeType };
  } catch (error) {
    if (error instanceof EngineError) throw error;
    if (controller.signal.aborted) {
      throw asPolicyBlock("Remote pixel evidence fetch timed out.", { timeoutMs: options.timeoutMs });
    }
    throw asPolicyBlock("Remote pixel evidence could not be fetched.", {
      cause: error instanceof Error ? error.message : String(error),
    });
  } finally {
    clearTimeout(timeout);
  }
}

function pngDescription(bytes: Buffer): IntrinsicImageDescription | null {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (bytes.length < 24 || !bytes.subarray(0, 8).equals(signature)) return null;
  if (bytes.readUInt32BE(8) !== 13 || bytes.toString("ascii", 12, 16) !== "IHDR") {
    throw asPolicyBlock("PNG pixel evidence is missing a valid IHDR dimension header.");
  }
  return { mimeType: "image/png", width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

function jpegDescription(bytes: Buffer): IntrinsicImageDescription | null {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 1 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    while (offset < bytes.length && bytes[offset] === 0xff) offset += 1;
    const marker = bytes[offset];
    offset += 1;
    if (marker === undefined || marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) continue;
    if (offset + 2 > bytes.length) break;
    const segmentLength = bytes.readUInt16BE(offset);
    if (segmentLength < 2 || offset + segmentLength > bytes.length) break;
    const isStartOfFrame = (
      marker >= 0xc0
      && marker <= 0xcf
      && ![0xc4, 0xc8, 0xcc].includes(marker)
    );
    if (isStartOfFrame) {
      if (segmentLength < 7) break;
      return {
        mimeType: "image/jpeg",
        width: bytes.readUInt16BE(offset + 5),
        height: bytes.readUInt16BE(offset + 3),
      };
    }
    offset += segmentLength;
  }
  throw asPolicyBlock("JPEG pixel evidence has no decodable intrinsic dimensions.");
}

function readUInt24LE(bytes: Buffer, offset: number): number {
  return (bytes[offset] ?? 0) | ((bytes[offset + 1] ?? 0) << 8) | ((bytes[offset + 2] ?? 0) << 16);
}

function webpDescription(bytes: Buffer): IntrinsicImageDescription | null {
  if (
    bytes.length < 30
    || bytes.toString("ascii", 0, 4) !== "RIFF"
    || bytes.toString("ascii", 8, 12) !== "WEBP"
  ) return null;
  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const chunkType = bytes.toString("ascii", offset, offset + 4);
    const chunkLength = bytes.readUInt32LE(offset + 4);
    const payload = offset + 8;
    if (payload + chunkLength > bytes.length) break;
    if (chunkType === "VP8X" && chunkLength >= 10) {
      return {
        mimeType: "image/webp",
        width: readUInt24LE(bytes, payload + 4) + 1,
        height: readUInt24LE(bytes, payload + 7) + 1,
      };
    }
    if (
      chunkType === "VP8 "
      && chunkLength >= 10
      && bytes[payload + 3] === 0x9d
      && bytes[payload + 4] === 0x01
      && bytes[payload + 5] === 0x2a
    ) {
      return {
        mimeType: "image/webp",
        width: bytes.readUInt16LE(payload + 6) & 0x3fff,
        height: bytes.readUInt16LE(payload + 8) & 0x3fff,
      };
    }
    if (chunkType === "VP8L" && chunkLength >= 5 && bytes[payload] === 0x2f) {
      const packed = bytes.readUInt32LE(payload + 1);
      return {
        mimeType: "image/webp",
        width: (packed & 0x3fff) + 1,
        height: ((packed >>> 14) & 0x3fff) + 1,
      };
    }
    offset = payload + chunkLength + (chunkLength % 2);
  }
  throw asPolicyBlock("WebP pixel evidence has no decodable intrinsic dimensions.");
}

function describeIntrinsicImage(bytes: Buffer): IntrinsicImageDescription {
  const description = pngDescription(bytes) ?? jpegDescription(bytes) ?? webpDescription(bytes);
  if (!description || description.width <= 0 || description.height <= 0) {
    throw asPolicyBlock("Pixel bytes are not a supported, dimensioned PNG, JPEG, or WebP image.");
  }
  if (
    description.width > MAX_PIXEL_DIMENSION
    || description.height > MAX_PIXEL_DIMENSION
    || description.width * description.height > MAX_PIXEL_AREA
  ) {
    throw asPolicyBlock("Decoded pixel dimensions exceed the safety limit.", { ...description });
  }
  return description;
}

async function verifyPixelArtifactBytes(
  artifact: z.infer<typeof PixelArtifactSchema>,
  options: Required<Pick<ProfessionalPixelVerificationOptions, "fetchImpl" | "maxBytes" | "timeoutMs">>,
): Promise<z.infer<typeof PixelArtifactSchema>> {
  const loaded = artifact.imageUrl.startsWith("data:")
    ? decodeDataImageUrl(artifact.imageUrl, options.maxBytes)
    : await fetchHttpsImage(artifact.imageUrl, artifact.mimeType, options);
  if (loaded.transportMimeType !== artifact.mimeType) {
    throw asPolicyBlock("Pixel transport MIME type does not match the declared artifact MIME type.", {
      scale: artifact.scale,
      declared: artifact.mimeType,
      transported: loaded.transportMimeType,
    });
  }
  const intrinsic = describeIntrinsicImage(loaded.bytes);
  if (intrinsic.mimeType !== artifact.mimeType) {
    throw asPolicyBlock("Pixel byte signature does not match the declared artifact MIME type.", {
      scale: artifact.scale,
      declared: artifact.mimeType,
      detected: intrinsic.mimeType,
    });
  }
  if (intrinsic.width !== artifact.width || intrinsic.height !== artifact.height) {
    throw asPolicyBlock("Declared pixel dimensions do not match dimensions decoded from the actual bytes.", {
      scale: artifact.scale,
      declared: { width: artifact.width, height: artifact.height },
      decoded: { width: intrinsic.width, height: intrinsic.height },
    });
  }
  const actualSha256 = createHash("sha256").update(loaded.bytes).digest("hex");
  if (actualSha256 !== artifact.sha256) {
    throw asPolicyBlock("Declared pixel hash does not match the actual fetched or decoded bytes.", {
      scale: artifact.scale,
      expectedSha256: artifact.sha256,
      actualSha256,
    });
  }
  return Object.freeze({
    ...artifact,
    imageUrl: `data:${artifact.mimeType};base64,${loaded.bytes.toString("base64")}`,
  });
}

export async function verifyProfessionalRenderPackagePixels(
  value: unknown,
  verificationOptions: ProfessionalPixelVerificationOptions = {},
): Promise<ProfessionalRenderPackage> {
  const unverified = parseWithPolicy(UnverifiedProfessionalRenderPackageSchema, value, "Professional renderer output");
  const options = {
    fetchImpl: verificationOptions.fetchImpl ?? fetch,
    maxBytes: verificationOptions.maxBytes ?? DEFAULT_MAX_PIXEL_BYTES,
    timeoutMs: verificationOptions.timeoutMs ?? DEFAULT_PIXEL_FETCH_TIMEOUT_MS,
  };
  if (!Number.isSafeInteger(options.maxBytes) || options.maxBytes <= 0) {
    throw asPolicyBlock("Pixel verification maxBytes must be a positive safe integer.");
  }
  if (!Number.isSafeInteger(options.timeoutMs) || options.timeoutMs <= 0) {
    throw asPolicyBlock("Pixel verification timeoutMs must be a positive safe integer.");
  }
  const [original, mobile] = await Promise.all([
    verifyPixelArtifactBytes(unverified.original, options),
    verifyPixelArtifactBytes(unverified.mobile, options),
  ]);
  const manifest = { ...unverified, original, mobile };
  const verified = ProfessionalRenderPackageSchema.parse({
    ...manifest,
    actualBytesVerified: true,
    pixelEvidenceSha256: computePixelEvidenceSha256(manifest),
  });
  Object.freeze(verified.original);
  Object.freeze(verified.mobile);
  return Object.freeze(verified);
}

export const verifyAndFreezeRenderPackage = verifyProfessionalRenderPackagePixels;

function asPolicyBlock(message: string, details: Record<string, unknown> = {}): EngineError {
  return new EngineError({ code: "POLICY_BLOCKED", message, details });
}

function missingCapability(step: string, adapterName: string, details: Record<string, unknown> = {}): never {
  throw new EngineError({
    code: "CAPABILITY_UNAVAILABLE",
    message: `POST_PRODUCTION/${step} requires a verified ${adapterName} adapter.`,
    ownerActionRequired: true,
    details: { step, adapterName, manualHandoffRequired: true, ...details },
  });
}

function parseWithPolicy<T>(schema: ZodType<T>, value: unknown, label: string): T {
  const parsed = schema.safeParse(value);
  if (parsed.success) return parsed.data;
  throw asPolicyBlock(`${label} failed runtime validation.`, {
    issues: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
  });
}

function previousEvidence<T>(workflowOutput: Record<string, unknown>, step: string, schema: ZodType<T>): T {
  const evidence = workflowOutput[step];
  if (evidence === undefined) throw asPolicyBlock(`Required durable evidence is missing for POST_PRODUCTION/${step}.`, { step });
  const direct = schema.safeParse(evidence);
  if (direct.success) return direct.data;
  const payload = typeof evidence === "object" && evidence !== null && !Array.isArray(evidence)
    ? Object.fromEntries(Object.entries(evidence).filter(([key]) => key !== "completedAt"))
    : evidence;
  return parseWithPolicy(schema, payload, `POST_PRODUCTION/${step} evidence`);
}

function toArtDirectionInput(input: ProfessionalPostProductionInput) {
  return {
    contentItemId: input.contentItemId,
    communicationGoal: input.communicationGoal,
    purpose: input.purpose,
    audience: input.audience,
    audienceTension: input.audienceTension,
    desiredFeeling: input.desiredFeeling,
    twoSecondTakeaway: input.twoSecondTakeaway,
    language: input.language,
    exactText: input.exactText,
    visualFamily: input.visualFamily,
    imageryMode: input.imageryMode,
    anthropomorphismLevel: input.anthropomorphismLevel,
    informationDensity: input.informationDensity,
    canvas: input.canvas,
    recentFeed: input.recentFeed,
    envelope: input.envelope,
    traceId: input.envelope.traceId,
  };
}

function mimeTypeForPath(path: string): string | null {
  const extension = extname(path).toLocaleLowerCase();
  if (extension === ".png") return "image/png";
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".webp") return "image/webp";
  return null;
}

export function createVerifiedLocalAnchorLoader(): ProfessionalAnchorLoader {
  return {
    async load(anchors) {
      return Promise.all(anchors.map(async (anchor) => {
        const mimeType = mimeTypeForPath(anchor.sourcePath);
        if (!mimeType) throw asPolicyBlock("A professional anchor uses an unsupported image type.", { referenceId: anchor.referenceId });
        const bytes = await readFile(anchor.sourcePath);
        const actualSha256 = createHash("sha256").update(bytes).digest("hex");
        if (actualSha256 !== anchor.sourceSha256) {
          throw asPolicyBlock("A professional anchor changed after curation.", {
            referenceId: anchor.referenceId,
            expectedSha256: anchor.sourceSha256,
            actualSha256,
          });
        }
        return {
          imageUrl: `data:${mimeType};base64,${bytes.toString("base64")}`,
          referenceId: anchor.referenceId,
          compareFor: anchor.compareFor,
        };
      }));
    },
  };
}

function rethrowGatewayCapability(error: unknown, step: string): never {
  if (error instanceof EngineError) throw error;
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("Fixture is required for offline task") || message.includes("OPENAI_API_KEY is required")) {
    missingCapability(step, "live structured-agent gateway", { cause: message });
  }
  throw error;
}

function assertCurrentHash(expected: string, actual: string, stage: string): void {
  if (expected !== actual) throw asPolicyBlock(`${stage} references stale or different rendered pixels.`, { expected, actual, stage });
}

function assertQualifyingCritiqueSet(critiqueSet: z.infer<typeof ProfessionalCritiqueSetSchema>): void {
  if (!["PROFESSIONAL_CANDIDATE", "EXCELLENT"].includes(critiqueSet.finalDecision)) {
    throw asPolicyBlock("The independent critic set did not clear the professional quality bar.", {
      finalDecision: critiqueSet.finalDecision,
      nextAction: critiqueSet.nextAction,
    });
  }
  for (const critique of critiqueSet.critiques) {
    if (
      critique.renderedAssetId !== critiqueSet.renderedAssetId
      || critique.renderedAssetSha256 !== critiqueSet.renderedAssetSha256
      || critique.hardFails.length > 0
      || critique.restartConcept
      || !["PROFESSIONAL_CANDIDATE", "EXCELLENT"].includes(critique.decision)
      || !["comparable", "above"].includes(critique.professionalAnchorComparison.verdict)
    ) {
      throw asPolicyBlock("A required independent critic did not approve the exact current pixels against professional anchors.", {
        criticRole: critique.criticRole,
        decision: critique.decision,
        total: critique.total,
        restartConcept: critique.restartConcept,
        hardFails: critique.hardFails,
        anchorVerdict: critique.professionalAnchorComparison.verdict,
      });
    }
  }
}

export function createProfessionalPostProductionExecutor(
  options: ProfessionalPostProductionExecutorOptions,
): WorkflowStepExecutor {
  const orchestrator = options.orchestrator ?? new ProfessionalCreativeOrchestrator(options.retriever);
  const criticPanel = options.criticPanel ?? new ProfessionalPixelCriticPanel();
  const anchorLoader = options.anchorLoader ?? createVerifiedLocalAnchorLoader();

  return async ({ workflow, step, database }) => {
    if (workflow.type !== "POST_PRODUCTION") {
      throw asPolicyBlock("The professional post-production executor received the wrong workflow type.", { workflowType: workflow.type });
    }
    const input = parseWithPolicy(ProfessionalPostProductionInputSchema, workflow.input, "POST_PRODUCTION input");

    switch (step) {
      case "brief":
        return {
          output: {
            schemaVersion: input.schemaVersion,
            inputSha256: sha256Json(input),
            contentItemId: input.contentItemId,
            communicationGoal: input.communicationGoal,
            purpose: input.purpose,
          },
        };

      case "research":
        return {
          output: {
            disposition: input.research.disposition,
            rationale: input.research.rationale,
            sourceIds: input.research.sources.map((source) => source.sourceId),
            sourceEvidenceSha256: sha256Json(input.research.sources),
          },
        };

      case "copy":
        return { output: { exactText: input.exactText, exactTextSha256: sha256Json(input.exactText), language: input.language } };

      case "editorial-qa":
        return {
          output: {
            status: input.editorialApproval.status,
            reviewerRef: input.editorialApproval.reviewerRef,
            approvedAt: input.editorialApproval.approvedAt,
            exactTextSha256: input.editorialApproval.exactTextSha256,
            unsupportedClaimCount: input.editorialApproval.unsupportedClaimCount,
          },
        };

      case "design-intelligence-retrieval": {
        const knowledge = options.retriever.retrieve({
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
        });
        if (knowledge.status !== "READY") {
          throw asPolicyBlock("Design-intelligence retrieval did not produce a sufficiently diverse professional reference set.", {
            blockers: knowledge.blockers,
          });
        }
        const evidence = DesignIntelligenceEvidenceSchema.parse({
          status: knowledge.status,
          knowledgeHash: knowledge.knowledgeHash,
          corpusVersion: knowledge.corpusVersion,
          referenceIds: knowledge.references.map(({ reference }) => reference.referenceId),
          retrievalReferences: knowledge.references.map(({ reference }) => ({
            referenceId: reference.referenceId,
            sourceSha256: reference.sha256,
          })),
          principleIds: knowledge.principles.map(({ principle }) => principle.id),
          principleInstructions: knowledge.generationContext.principleInstructions,
          criticAnchors: knowledge.references.map(({ reference }) => ({
            referenceId: reference.referenceId,
            sourcePath: reference.sourcePath,
            sourceSha256: reference.sha256,
            compareFor: reference.qualityDimensions,
          })),
          antiCopyControls: knowledge.antiCopyControls,
          rawReferencePixelsIncluded: false,
          sourcePathsRestrictedToPixelCritics: true,
        });
        return { output: evidence };
      }

      case "concept-tournament": {
        const retrieval = previousEvidence(workflow.output, "design-intelligence-retrieval", DesignIntelligenceEvidenceSchema);
        let directed;
        try {
          directed = await orchestrator.direct(toArtDirectionInput(input));
        } catch (error) {
          rethrowGatewayCapability(error, step);
        }
        if (directed.knowledge.knowledgeHash !== retrieval.knowledgeHash) {
          throw asPolicyBlock("Art direction used a different design-intelligence retrieval than the durable workflow evidence.", {
            expectedKnowledgeHash: retrieval.knowledgeHash,
            actualKnowledgeHash: directed.knowledge.knowledgeHash,
          });
        }
        const decision = ArtDirectionDecisionSchema.parse({ answers: directed.decisionAnswers, tournament: directed.tournament });
        const generationHandoff = GenerationHandoffSchema.parse(directed.generationHandoff);
        const evidence = ConceptStageEvidenceSchema.parse({
          knowledgeHash: retrieval.knowledgeHash,
          decision,
          brief: directed.brief,
          generationHandoff,
          generationHandoffSha256: sha256Json(generationHandoff),
        });
        return { output: evidence };
      }

      case "art-direction-selection": {
        const concept = previousEvidence(workflow.output, "concept-tournament", ConceptStageEvidenceSchema);
        if (concept.brief.contentItemId !== input.contentItemId || sha256Json(concept.brief.exactText) !== sha256Json(input.exactText)) {
          throw asPolicyBlock("The selected professional brief is not bound to the current content item and exact copy.");
        }
        if (concept.generationHandoff.brief.id !== concept.brief.id) {
          throw asPolicyBlock("The principle-only generation handoff contains a different design brief.");
        }
        return {
          output: ArtDirectionSelectionEvidenceSchema.parse({
            brief: concept.brief,
            generationHandoff: concept.generationHandoff,
            generationHandoffSha256: concept.generationHandoffSha256,
            selectedCandidateId: concept.brief.selectedCandidateId,
            selectionSha256: sha256Json({ brief: concept.brief, selectedCandidateId: concept.brief.selectedCandidateId }),
          }),
        };
      }

      case "asset-production": {
        const selection = previousEvidence(workflow.output, "art-direction-selection", ArtDirectionSelectionEvidenceSchema);
        if (!options.assetProducer) {
          missingCapability(step, "professional asset producer", {
            designBriefId: selection.brief.id,
            generationHandoffSha256: selection.generationHandoffSha256,
          });
        }
        const draft = parseWithPolicy(
          ProfessionalProductionDraftSchema,
          await options.assetProducer.produce({
            workflowId: workflow.id,
            traceId: workflow.traceId,
            brief: selection.brief,
            generationHandoff: selection.generationHandoff,
            generationHandoffSha256: selection.generationHandoffSha256,
          }),
          "Professional asset-production adapter output",
        );
        if (draft.designBriefId !== selection.brief.id || draft.generationHandoffSha256 !== selection.generationHandoffSha256) {
          throw asPolicyBlock("The produced draft is not bound to the selected professional art direction.");
        }
        return { output: { draft } };
      }

      case "render-original-and-mobile": {
        const selection = previousEvidence(workflow.output, "art-direction-selection", ArtDirectionSelectionEvidenceSchema);
        const { draft } = previousEvidence(workflow.output, "asset-production", DraftStageEvidenceSchema);
        if (!options.renderer) missingCapability(step, "original-and-mobile raster renderer", { draftId: draft.draftId });
        const renderPackage = await verifyProfessionalRenderPackagePixels(
          await options.renderer.render({
            workflowId: workflow.id,
            traceId: workflow.traceId,
            brief: selection.brief,
            draft,
          }),
        );
        if (renderPackage.designBriefId !== selection.brief.id || renderPackage.draftId !== draft.draftId) {
          throw asPolicyBlock("Rendered pixels are not bound to the current draft and brief.");
        }
        if (renderPackage.original.width !== input.canvas.width || renderPackage.original.height !== input.canvas.height) {
          throw asPolicyBlock("The original render dimensions do not match the approved canvas.", {
            approvedCanvas: input.canvas,
            renderedCanvas: { width: renderPackage.original.width, height: renderPackage.original.height },
          });
        }
        return {
          output: {
            renderedAssetSha256: renderPackage.renderedAssetSha256,
            pixelEvidenceSha256: renderPackage.pixelEvidenceSha256,
            renderPackage,
          },
        };
      }

      case "technical-preflight": {
        const selection = previousEvidence(workflow.output, "art-direction-selection", ArtDirectionSelectionEvidenceSchema);
        const { renderPackage } = previousEvidence(workflow.output, "render-original-and-mobile", RenderStageEvidenceSchema);
        if (!options.technicalPreflight) missingCapability(step, "technical pixel-preflight", { renderedAssetSha256: renderPackage.renderedAssetSha256 });
        const preflight = parseWithPolicy(
          ProfessionalTechnicalPreflightSchema,
          await options.technicalPreflight.inspect({
            workflowId: workflow.id,
            traceId: workflow.traceId,
            brief: selection.brief,
            renderPackage,
          }),
          "Technical-preflight adapter output",
        );
        assertCurrentHash(renderPackage.renderedAssetSha256, preflight.renderedAssetSha256, step);
        assertCurrentHash(renderPackage.pixelEvidenceSha256, preflight.pixelEvidenceSha256, step);
        if (preflight.decision !== "PASS") throw asPolicyBlock("Technical preflight rejected the rendered pixels.", { preflight });
        return {
          output: {
            renderedAssetSha256: renderPackage.renderedAssetSha256,
            pixelEvidenceSha256: renderPackage.pixelEvidenceSha256,
            preflight,
          },
        };
      }

      case "independent-pixel-critics": {
        const retrieval = previousEvidence(workflow.output, "design-intelligence-retrieval", DesignIntelligenceEvidenceSchema);
        const { renderPackage } = previousEvidence(workflow.output, "render-original-and-mobile", RenderStageEvidenceSchema);
        const { preflight } = previousEvidence(workflow.output, "technical-preflight", TechnicalStageEvidenceSchema);
        assertCurrentHash(renderPackage.renderedAssetSha256, preflight.renderedAssetSha256, step);
        let anchors: ProfessionalAnchorImageInput[];
        try {
          anchors = await anchorLoader.load(retrieval.criticAnchors);
        } catch (error) {
          if (error instanceof EngineError) throw error;
          throw asPolicyBlock("Professional anchor pixels could not be resolved and hash-verified.", {
            cause: error instanceof Error ? error.message : String(error),
          });
        }
        let critiqueSet;
        try {
          critiqueSet = await criticPanel.review({
            renderedAssetId: renderPackage.renderedAssetId,
            renderedAssetSha256: renderPackage.renderedAssetSha256,
            language: input.language,
            candidateImages: [
              { imageUrl: renderPackage.original.imageUrl, label: "current rendered asset", scale: "original" },
              { imageUrl: renderPackage.mobile.imageUrl, label: "current mobile render", scale: "mobile" },
            ],
            professionalAnchors: anchors,
            traceId: workflow.traceId,
          });
        } catch (error) {
          rethrowGatewayCapability(error, step);
        }
        assertCurrentHash(renderPackage.renderedAssetSha256, critiqueSet.renderedAssetSha256, step);
        return {
          output: {
            renderedAssetSha256: renderPackage.renderedAssetSha256,
            pixelEvidenceSha256: renderPackage.pixelEvidenceSha256,
            critiqueSet,
          },
        };
      }

      case "professional-anchor-comparison": {
        const { critiqueSet, pixelEvidenceSha256 } = previousEvidence(workflow.output, "independent-pixel-critics", CritiqueStageEvidenceSchema);
        assertQualifyingCritiqueSet(critiqueSet);
        return {
          output: AnchorComparisonEvidenceSchema.parse({
            renderedAssetSha256: critiqueSet.renderedAssetSha256,
            pixelEvidenceSha256,
            decision: "PASS",
            criticRoles: critiqueSet.critiques.map((critique) => critique.criticRole),
            anchorVerdicts: critiqueSet.critiques.map((critique) => critique.professionalAnchorComparison.verdict),
          }),
        };
      }

      case "originality-review": {
        const selection = previousEvidence(workflow.output, "art-direction-selection", ArtDirectionSelectionEvidenceSchema);
        const retrieval = previousEvidence(workflow.output, "design-intelligence-retrieval", DesignIntelligenceEvidenceSchema);
        const { renderPackage } = previousEvidence(workflow.output, "render-original-and-mobile", RenderStageEvidenceSchema);
        if (!options.originalityReviewer) missingCapability(step, "pixel-level originality reviewer", { renderedAssetSha256: renderPackage.renderedAssetSha256 });
        const review = parseWithPolicy(
          ProfessionalOriginalityReviewSchema,
          await options.originalityReviewer.review({
            workflowId: workflow.id,
            traceId: workflow.traceId,
            brief: selection.brief,
            renderPackage,
            knowledgeHash: retrieval.knowledgeHash,
            corpusVersion: retrieval.corpusVersion,
            retrievalReferences: retrieval.retrievalReferences,
            retrievedReferenceIds: retrieval.referenceIds,
          }),
          "Originality-review adapter output",
        );
        assertCurrentHash(renderPackage.renderedAssetSha256, review.renderedAssetSha256, step);
        assertCurrentHash(renderPackage.pixelEvidenceSha256, review.pixelEvidenceSha256, step);
        if (
          review.knowledgeHash !== retrieval.knowledgeHash
          || review.corpusVersion !== retrieval.corpusVersion
          || canonicalSha256(review.retrievalReferences) !== canonicalSha256(retrieval.retrievalReferences)
        ) {
          throw asPolicyBlock("Originality review is not bound to the retrieved design-intelligence corpus.");
        }
        if (review.decision !== "CLEAR") throw asPolicyBlock("Originality review did not clear the current pixels.", { review });
        return {
          output: {
            renderedAssetSha256: renderPackage.renderedAssetSha256,
            pixelEvidenceSha256: renderPackage.pixelEvidenceSha256,
            review,
          },
        };
      }

      case "feed-coherence": {
        const selection = previousEvidence(workflow.output, "art-direction-selection", ArtDirectionSelectionEvidenceSchema);
        const { renderPackage } = previousEvidence(workflow.output, "render-original-and-mobile", RenderStageEvidenceSchema);
        if (!options.feedReviewer) missingCapability(step, "pixel-level feed-coherence reviewer", { renderedAssetSha256: renderPackage.renderedAssetSha256 });
        const review = parseWithPolicy(
          ProfessionalFeedCoherenceReviewSchema,
          await options.feedReviewer.review({
            workflowId: workflow.id,
            traceId: workflow.traceId,
            brief: selection.brief,
            renderPackage,
            comparedPostIds: input.recentFeed.comparedPostIds,
            comparedAssetSha256ByPostId: input.recentFeed.comparedAssetSha256ByPostId,
            prohibitedRepeatedStructures: input.recentFeed.prohibitedRepeatedStructures,
            targetRhythmRole: input.recentFeed.targetRhythmRole,
            database,
          }),
          "Feed-coherence adapter output",
        );
        assertCurrentHash(renderPackage.renderedAssetSha256, review.renderedAssetSha256, step);
        assertCurrentHash(renderPackage.pixelEvidenceSha256, review.pixelEvidenceSha256, step);
        if (review.decision !== "PASS") throw asPolicyBlock("Feed-coherence review did not clear the current pixels.", { review });
        const expectedPosts = new Set(input.recentFeed.comparedPostIds);
        if (review.comparedPostIds.some((postId) => !expectedPosts.has(postId)) || review.comparedPostIds.length === 0) {
          throw asPolicyBlock("Feed review did not inspect the approved recent-feed context.", {
            expectedPostIds: input.recentFeed.comparedPostIds,
            reviewedPostIds: review.comparedPostIds,
          });
        }
        if (canonicalSha256(review.comparedAssetSha256ByPostId) !== canonicalSha256(input.recentFeed.comparedAssetSha256ByPostId)) {
          throw asPolicyBlock("Feed review is not bound to the approved recent-feed pixels.");
        }
        return {
          output: {
            renderedAssetSha256: renderPackage.renderedAssetSha256,
            pixelEvidenceSha256: renderPackage.pixelEvidenceSha256,
            review,
          },
        };
      }

      case "policy-check": {
        const { renderPackage } = previousEvidence(workflow.output, "render-original-and-mobile", RenderStageEvidenceSchema);
        const technicalEvidence = previousEvidence(workflow.output, "technical-preflight", TechnicalStageEvidenceSchema);
        const critiqueEvidence = previousEvidence(workflow.output, "independent-pixel-critics", CritiqueStageEvidenceSchema);
        const anchorComparison = previousEvidence(workflow.output, "professional-anchor-comparison", AnchorComparisonEvidenceSchema);
        const originalityEvidence = previousEvidence(workflow.output, "originality-review", OriginalityStageEvidenceSchema);
        const feedEvidence = previousEvidence(workflow.output, "feed-coherence", FeedStageEvidenceSchema);
        const { preflight } = technicalEvidence;
        const { critiqueSet } = critiqueEvidence;
        const { review: originality } = originalityEvidence;
        const { review: feed } = feedEvidence;
        for (const evidenceHash of [preflight.renderedAssetSha256, critiqueSet.renderedAssetSha256, anchorComparison.renderedAssetSha256, originality.renderedAssetSha256, feed.renderedAssetSha256]) {
          assertCurrentHash(renderPackage.renderedAssetSha256, evidenceHash, step);
        }
        assertQualifyingCritiqueSet(critiqueSet);
        if (preflight.decision !== "PASS" || originality.decision !== "CLEAR" || feed.decision !== "PASS") {
          throw asPolicyBlock("Professional policy aggregation found an unresolved creative gate.");
        }
        const policyPreimage = PolicyStageEvidenceWithoutHashSchema.parse({
          schemaVersion: "1.0.0",
          policyVersion: "professional-creative-v3",
          status: "READY_FOR_OWNER_REVIEW",
          renderedAssetId: renderPackage.renderedAssetId,
          renderedAssetSha256: renderPackage.renderedAssetSha256,
          pixelEvidenceSha256: renderPackage.pixelEvidenceSha256,
          stageEvidenceSha256: {
            technicalPreflight: sha256Json(technicalEvidence),
            independentPixelCritics: sha256Json(critiqueEvidence),
            professionalAnchorComparison: sha256Json(anchorComparison),
            originalityReview: sha256Json(originalityEvidence),
            feedCoherence: sha256Json(feedEvidence),
          },
          eligibleForOwnerReview: true,
          externalMutation: false,
        });
        return {
          output: ProfessionalPolicyStageEvidenceSchema.parse({
            ...policyPreimage,
            policyEvidenceSha256: sha256Json(policyPreimage),
          }),
        };
      }

      case "schedule": {
        const { renderPackage } = previousEvidence(workflow.output, "render-original-and-mobile", RenderStageEvidenceSchema);
        const policyEvidence = previousEvidence(workflow.output, "policy-check", ProfessionalPolicyStageEvidenceSchema);
        const approval = previousEvidence(workflow.output, "owner-review", ProfessionalOwnerApprovalEvidenceSchema);
        assertCurrentHash(renderPackage.renderedAssetSha256, policyEvidence.renderedAssetSha256, step);
        assertCurrentHash(renderPackage.renderedAssetSha256, approval.renderedAssetSha256, step);
        assertCurrentHash(renderPackage.pixelEvidenceSha256, approval.pixelEvidenceSha256, step);
        assertCurrentHash(policyEvidence.policyEvidenceSha256, approval.policyEvidenceSha256, step);
        if (!options.scheduler) missingCapability(step, "approved scheduling adapter", { renderedAssetSha256: renderPackage.renderedAssetSha256 });
        const schedule = parseWithPolicy(
          ProfessionalScheduleResultSchema,
          await options.scheduler.schedule({
            workflowId: workflow.id,
            traceId: workflow.traceId,
            contentItemId: input.contentItemId,
            renderPackage,
            policyEvidence,
            approval,
            database,
          }),
          "Approved scheduling-adapter output",
        );
        assertCurrentHash(renderPackage.renderedAssetSha256, schedule.renderedAssetSha256, step);
        assertCurrentHash(renderPackage.pixelEvidenceSha256, schedule.pixelEvidenceSha256, step);
        assertCurrentHash(policyEvidence.policyEvidenceSha256, schedule.policyEvidenceSha256, step);
        assertCurrentHash(approval.approvalBindingSha256, schedule.approvalBindingSha256, step);
        return { output: { schedule } };
      }

      case "owner-review":
        throw asPolicyBlock("Owner review is controlled by the durable workflow approval transition, not by an executor adapter.");

      default:
        throw asPolicyBlock("Unknown professional post-production stage.", { step });
    }
  };
}

export function createWorkerWorkflowExecutor(postProductionExecutor: WorkflowStepExecutor): WorkflowStepExecutor {
  return async (context) => context.workflow.type === "POST_PRODUCTION"
    ? postProductionExecutor(context)
    : offlineWorkflowExecutor(context);
}

export async function enqueueProfessionalPostProduction(
  database: DatabaseClient,
  input: { idempotencyKey: string; payload: ProfessionalPostProductionInput; traceId?: string },
): Promise<string> {
  const payload = ProfessionalPostProductionInputSchema.parse(input.payload);
  return enqueueWorkflow(database, {
    type: "POST_PRODUCTION",
    idempotencyKey: input.idempotencyKey,
    payload,
    traceId: input.traceId ?? payload.envelope.traceId,
  });
}

export function exactTextSha256(exactText: string[]): string {
  return sha256Json(exactText);
}
