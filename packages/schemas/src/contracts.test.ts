import { describe, expect, it } from "vitest";
import { CritiqueSchema, PublicationPlanSchema, SocialLearningRuleSchema } from "./index";

const hashA = "a".repeat(64);
const hashB = "b".repeat(64);
const hashC = "c".repeat(64);
const ruleBase = {
  ruleId: "c57b9b6f-ef2b-4a45-b7c8-6eec5b8f3f9f",
  organizationId: "8a4dfc20-58e5-4a3a-9f9d-9fb8de8ec7d9",
  brandVersion: "brand-final-2026-1",
  scope: { scopeLevel: "global" as const },
  key: "fact-copy-length",
  precedence: 40,
  strength: "MEDIUM" as const,
  metadata: { source: "MODEL" as const, reason: "Observed improved performance in September benchmark reviews." },
};

const nativeBase = {
  schemaVersion: "1.0.0" as const,
  artifactId: "publication-plan-1",
  artifactType: "publication_plan" as const,
  skill: "social-publishing",
  skillVersion: "1.0.0",
  modelVersion: "none",
  promptVersion: "none",
  traceId: "9f34cb07-5e1e-4fb3-bb4e-f61adb57c87b",
  createdAt: "2026-08-23T09:00:00+03:00",
  inputRefs: [],
  evidence: [],
  warnings: [],
  status: "needs_approval" as const,
};

const publicationPlan = {
  ...nativeBase,
  contentItemId: "content-1",
  accountId: "account-1",
  platform: "instagram" as const,
  capabilities: [
    {
      capability: "carousel_publish",
      state: "unknown" as const,
      verifiedAt: "2026-08-23T09:00:00+03:00",
      sourceUrl: "https://developers.facebook.com/docs/instagram-platform/content-publishing/",
    },
  ],
  validation: {
    accountMapped: true,
    authHealthy: true,
    captionValid: true,
    assetsExist: true,
    hashesMatch: true,
    licensesApproved: true,
    compliancePassed: true,
    scheduleValid: true,
    emergencyPaused: false,
    materialDeviation: false,
  },
  approvalEvidence: {
    approvalId: "approval-1",
    actorId: "owner-1",
    actorRole: "OWNER" as const,
    signature: "signed-approval-proof-1",
    signedAt: "2026-08-23T09:00:00+03:00",
    expiresAt: "2026-09-30T23:59:59+03:00",
    revokedAt: null,
    scope: {
      contentItemId: "content-1",
      accountId: "account-1",
      platform: "instagram" as const,
      operation: "schedule" as const,
      brandVersion: "final-2026.1",
      copyHash: hashB,
      assetHashes: [hashA],
    },
  },
  complianceEvidence: {
    artifactId: "compliance-1",
    artifactHash: hashC,
    decision: "pass" as const,
    brandVersion: "final-2026.1",
  },
  authProof: {
    accountId: "account-1",
    verifiedAt: "2026-08-23T09:00:00+03:00",
    scopes: ["content_publish"],
    expiresAt: "2026-12-01T00:00:00+03:00",
    revokedAt: null,
  },
  brandVersion: "final-2026.1",
  copyHash: hashB,
  assets: [{ assetId: "asset-1", hash: hashA, licenseStatus: "OWNED" as const }],
  assetHashes: [hashA],
  scheduledAt: "2026-09-05T12:00:00+03:00",
  timezone: "Asia/Baghdad",
  idempotencyKeyVersion: "v1",
  idempotencyKey: "instagram-publication-key-v1",
  payloadHash: hashC,
  intentRef: "outbox-intent-1",
  attemptState: "intent_persisted" as const,
  reconciliationState: "not_required" as const,
  environment: "dry_run" as const,
  productionEnabled: false,
  operation: "schedule" as const,
  decision: "dry_run_only" as const,
};

describe("native safety contracts", () => {
  it("rejects a visual PASS when any hard fail exists", () => {
    const result = CritiqueSchema.safeParse({
      id: "0f40d40c-d489-48bc-a342-e3b2a3104649",
      renderedAssetId: "cf5a3376-2a5e-4584-8d86-e72f80a2e56d",
      critic: "VISUAL_A",
      scores: {
        conceptOriginality: 0,
        hierarchy: 0,
        typography: 0,
        compositionGrid: 0,
        brandDistinctiveness: 0,
        messageClarity: 0,
        readability: 0,
        whitespace: 0,
        graphicQuality: 0,
        colorContrast: 0,
        platformSuitability: 0,
        polish: 0,
      },
      total: 0,
      hardFails: ["Arabic text overlaps the icon"],
      strengths: [],
      weaknesses: [],
      revisionInstructions: [],
      decision: "PASS",
      envelope: {
        schemaVersion: "1.0.0",
        modelVersion: null,
        promptVersion: "test-v1",
        skillVersions: ["social-design-critique@1.0.0"],
        templateVersion: null,
        traceId: "62e2c2da-e45b-4f6e-abcf-af87716c574b",
        createdAt: "2026-08-23T06:00:00.000Z",
        sources: [],
      },
    });
    expect(result.success).toBe(false);
  });

  it("accepts a fully bound dry-run publication plan", () => {
    expect(PublicationPlanSchema.safeParse(publicationPlan).success).toBe(true);
  });

  it("rejects UNKNOWN-license assets before publication", () => {
    const unsafe = {
      ...publicationPlan,
      assets: [{ ...publicationPlan.assets[0], licenseStatus: "UNKNOWN" }],
    };
    expect(PublicationPlanSchema.safeParse(unsafe).success).toBe(false);
  });

  it("rejects an approval whose immutable asset scope has drifted", () => {
    const unsafe = {
      ...publicationPlan,
      approvalEvidence: {
        ...publicationPlan.approvalEvidence,
        scope: { ...publicationPlan.approvalEvidence.scope, assetHashes: ["d".repeat(64)] },
      },
    };
    expect(PublicationPlanSchema.safeParse(unsafe).success).toBe(false);
  });

  it("accepts a valid learning fact rule", () => {
    expect(
      SocialLearningRuleSchema.safeParse({
        ...ruleBase,
        category: "fact",
        fact: "Owner requires concise one-sentence captions for Arabic reels.",
        value: "concise-caption-required",
        confidence: 0.84,
        supportingStatementIds: ["S-1", "S-2"],
      }).success,
    ).toBe(true);
  });

  it("rejects a malformed learning preference payload", () => {
    expect(
      SocialLearningRuleSchema.safeParse({
        ...ruleBase,
        category: "preference",
        preferenceArea: "visual_style",
        value: { contrast: "high" },
        persistenceWindowDays: -1,
        decayRate: 1.2,
      }).success,
    ).toBe(false);
  });
});
