import { describe, expect, it } from "vitest";
import { classifyApproval, publicationIdempotencyKey, publicationPreflight } from "./policy";

describe("publishing policy", () => {
  it("routes high-risk and pricing content to item approval", () => {
    expect(classifyApproval({ text: "New pricing announcement", risk: "medium" })).toBe("ITEM_APPROVAL");
    expect(classifyApproval({ text: "Operational education", risk: "high" })).toBe("ITEM_APPROVAL");
    expect(classifyApproval({ text: "Operational education", risk: "low" })).toBe("MONTHLY_APPROVAL");
  });

  it("builds stable idempotency keys independent of hash order", () => {
    const base = {
      version: "v1",
      organizationId: "social-media-plugin",
      contentItemId: "post-1",
      brandVersion: "final-2026.1",
      copyHash: "copy-hash",
      platform: "instagram",
      accountId: "account-1",
      operation: "schedule",
      scheduledAt: "2026-09-01T16:30:00.000Z",
      timezone: "Asia/Baghdad",
      approvalScopeHash: "approval-scope-hash",
    };
    expect(publicationIdempotencyKey({ ...base, artifactHashes: ["b", "a"] })).toBe(
      publicationIdempotencyKey({ ...base, artifactHashes: ["a", "b"] }),
    );
  });

  it("blocks production when immutable approval or rights evidence drifts", () => {
    const result = publicationPreflight({
      content: {
        status: "APPROVED",
        approvalClass: "ITEM_APPROVAL",
        riskLevel: "high",
        scheduledAt: "2026-09-05T09:00:00.000Z",
      },
      assetHashes: ["new-hash"],
      approvedAssetHashes: ["approved-hash"],
      assetLicenseStatuses: ["UNKNOWN"],
      approvedCopyHash: "approved-copy",
      currentCopyHash: "changed-copy",
      approvedBrandVersion: "final-2026.1",
      currentBrandVersion: "proposed-2026.2",
      compliancePassed: false,
      approvalScopeMatches: false,
      approvalExpiresAt: "2026-09-04T09:00:00.000Z",
      approvalRevoked: false,
      authHealthy: true,
      materialDeviation: true,
      accountVerified: true,
      providerCapabilityAvailable: true,
      paused: false,
      dryRun: false,
      productionPublishingEnabled: true,
      now: new Date("2026-09-01T09:00:00.000Z"),
    });
    expect(result.ok).toBe(false);
    expect(result.reasons).toEqual(expect.arrayContaining([
      "An asset has unknown publication rights.",
      "Rendered asset hash differs from approved assets.",
      "A material deviation requires a new approval.",
    ]));
  });
});
