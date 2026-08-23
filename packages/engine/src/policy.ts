import { createHash } from "node:crypto";
import type { ApprovalClass, ContentItem, RiskLevel } from "@aurendor/schemas";

const itemApprovalSignals = [
  "pricing",
  "price",
  "customer",
  "client name",
  "case study",
  "legal",
  "regulatory",
  "political",
  "election",
  "guarantee",
  "launch",
  "announcement",
];

export function classifyApproval(input: { text: string; risk: RiskLevel; hasNamedCustomer?: boolean }): ApprovalClass {
  const text = input.text.toLowerCase();
  if (
    input.risk === "high" ||
    input.risk === "critical" ||
    input.hasNamedCustomer ||
    itemApprovalSignals.some((signal) => text.includes(signal))
  ) {
    return "ITEM_APPROVAL";
  }
  return "MONTHLY_APPROVAL";
}

export function publicationIdempotencyKey(input: {
  version: string;
  organizationId: string;
  contentItemId: string;
  brandVersion: string;
  copyHash: string;
  artifactHashes: string[];
  platform: string;
  accountId: string;
  operation: string;
  scheduledAt: string;
  timezone: string;
  approvalScopeHash: string;
}): string {
  const canonical = JSON.stringify({
    version: input.version,
    organizationId: input.organizationId,
    contentItemId: input.contentItemId,
    brandVersion: input.brandVersion,
    copyHash: input.copyHash,
    artifactHashes: [...input.artifactHashes].sort(),
    platform: input.platform,
    accountId: input.accountId,
    operation: input.operation,
    scheduledAt: input.scheduledAt,
    timezone: input.timezone,
    approvalScopeHash: input.approvalScopeHash,
  });
  return createHash("sha256").update(canonical).digest("hex");
}

export interface PublicationPreflightInput {
  content: Pick<ContentItem, "status" | "approvalClass" | "riskLevel" | "scheduledAt">;
  assetHashes: string[];
  approvedAssetHashes: string[];
  assetLicenseStatuses: Array<"OWNED" | "LICENSED" | "UNKNOWN" | "NOT_REQUIRED">;
  approvedCopyHash: string;
  currentCopyHash: string;
  approvedBrandVersion: string;
  currentBrandVersion: string;
  compliancePassed: boolean;
  approvalScopeMatches: boolean;
  approvalExpiresAt: string;
  approvalRevoked: boolean;
  authHealthy: boolean;
  materialDeviation: boolean;
  accountVerified: boolean;
  providerCapabilityAvailable: boolean;
  paused: boolean;
  dryRun: boolean;
  productionPublishingEnabled: boolean;
  now: Date;
}

export interface PublicationPreflightResult {
  ok: boolean;
  mode: "DRY_RUN" | "PRODUCTION" | "BLOCKED";
  reasons: string[];
}

export function publicationPreflight(input: PublicationPreflightInput): PublicationPreflightResult {
  const reasons: string[] = [];
  if (input.paused) reasons.push("Global publishing pause is active.");
  if (!["APPROVED", "SCHEDULED"].includes(input.content.status)) reasons.push("Content is not approved for scheduling.");
  if (!input.accountVerified && !input.dryRun) reasons.push("Provider account is not verified.");
  if (!input.authHealthy && !input.dryRun) reasons.push("Provider authorization is expired, revoked, or otherwise unhealthy.");
  if (!input.providerCapabilityAvailable && !input.dryRun) reasons.push("Provider capability is unavailable.");
  if (input.assetHashes.length === 0) reasons.push("No rendered asset is attached.");
  if (input.assetLicenseStatuses.length !== input.assetHashes.length) reasons.push("Every rendered asset needs an explicit license decision.");
  if (input.assetLicenseStatuses.some((status) => status === "UNKNOWN")) reasons.push("An asset has unknown publication rights.");
  const approved = new Set(input.approvedAssetHashes);
  if (input.assetHashes.some((hash) => !approved.has(hash))) reasons.push("Rendered asset hash differs from approved assets.");
  if (input.currentCopyHash !== input.approvedCopyHash) reasons.push("Platform copy differs from the approved copy hash.");
  if (input.currentBrandVersion !== input.approvedBrandVersion) reasons.push("Brand version differs from the approved brand version.");
  if (!input.compliancePassed) reasons.push("Brand, claims, or policy compliance has not passed.");
  if (!input.approvalScopeMatches) reasons.push("Signed approval does not match the exact account, operation, copy, and assets.");
  if (input.approvalRevoked) reasons.push("Publication approval has been revoked.");
  if (new Date(input.approvalExpiresAt).getTime() <= new Date(input.content.scheduledAt).getTime()) reasons.push("Publication approval expires before the scheduled operation.");
  if (input.materialDeviation) reasons.push("A material deviation requires a new approval.");
  if (!input.dryRun && !input.productionPublishingEnabled) reasons.push("Production publishing is not enabled.");
  if (new Date(input.content.scheduledAt).getTime() < input.now.getTime() - 15 * 60_000) reasons.push("Scheduled time is more than 15 minutes in the past.");
  return {
    ok: reasons.length === 0,
    mode: reasons.length > 0 ? "BLOCKED" : input.dryRun ? "DRY_RUN" : "PRODUCTION",
    reasons,
  };
}
