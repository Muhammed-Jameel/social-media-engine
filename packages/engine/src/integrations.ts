import { randomUUID } from "node:crypto";
import type { CapabilityState, Platform } from "@aurendor/schemas";

export interface PlatformCapabilities {
  directPublish: CapabilityState;
  schedule: CapabilityState;
  carousel: CapabilityState;
  video: CapabilityState;
  stories: CapabilityState;
  altText: CapabilityState;
  analytics: CapabilityState;
  comments: CapabilityState;
  reason: string[];
}

export interface PublishablePost {
  contentItemId: string;
  platform: Platform;
  accountId: string;
  caption: string;
  assetUrls: string[];
  assetHashes: string[];
  scheduledAt: string;
  idempotencyKey: string;
  dryRun: boolean;
}

export interface PublicationResult {
  status: "DRY_RUN" | "PUBLISHED" | "SCHEDULED" | "MANUAL_HANDOFF";
  providerPublicationId: string | null;
  receipt: Record<string, unknown>;
}

export interface SocialPublisher {
  readonly platform: Platform;
  capabilities(accountId: string): Promise<PlatformCapabilities>;
  validate(post: PublishablePost): Promise<{ ok: boolean; errors: string[]; warnings: string[] }>;
  publish(post: PublishablePost): Promise<PublicationResult>;
  getStatus(publicationId: string): Promise<{ status: string; verifiedAt: string }>;
}

const baseNotConfigured: PlatformCapabilities = {
  directPublish: "NOT_CONFIGURED",
  schedule: "NOT_CONFIGURED",
  carousel: "NOT_CONFIGURED",
  video: "NOT_CONFIGURED",
  stories: "NOT_CONFIGURED",
  altText: "NOT_CONFIGURED",
  analytics: "NOT_CONFIGURED",
  comments: "NOT_CONFIGURED",
  reason: ["OAuth account and production capabilities have not been verified."],
};

export class DryRunPublisher implements SocialPublisher {
  constructor(readonly platform: Platform) {}

  async capabilities(): Promise<PlatformCapabilities> {
    if (this.platform === "tiktok") {
      return {
        ...baseNotConfigured,
        directPublish: "UNAVAILABLE_POLICY",
        schedule: "MANUAL_HANDOFF_REQUIRED",
        video: "MANUAL_HANDOFF_REQUIRED",
        comments: "UNAVAILABLE_POLICY",
        reason: ["TikTok draft upload/manual completion is required for this internal AURENDOR utility."],
      };
    }
    if (this.platform === "linkedin") {
      return {
        ...baseNotConfigured,
        carousel: "UNAVAILABLE_POLICY",
        reason: ["LinkedIn organization scopes are unverified; organic carousels must execute as MultiImage or document posts."],
      };
    }
    return baseNotConfigured;
  }

  async validate(post: PublishablePost): Promise<{ ok: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    if (post.assetUrls.length === 0) errors.push("At least one asset URL is required.");
    if (post.assetHashes.length !== post.assetUrls.length) errors.push("Every asset URL must have an approved hash.");
    if (!post.caption.trim()) errors.push("Caption is required.");
    if (!post.dryRun) errors.push("This adapter is dry-run only.");
    if (this.platform === "tiktok") warnings.push("Result will be a manual creator handoff, never unattended public publication.");
    return { ok: errors.length === 0, errors, warnings };
  }

  async publish(post: PublishablePost): Promise<PublicationResult> {
    const validation = await this.validate(post);
    if (!validation.ok) throw new Error(`Dry-run publication failed validation: ${validation.errors.join(" ")}`);
    const manual = this.platform === "tiktok";
    return {
      status: manual ? "MANUAL_HANDOFF" : "DRY_RUN",
      providerPublicationId: null,
      receipt: {
        receiptId: randomUUID(),
        platform: this.platform,
        accountId: post.accountId,
        idempotencyKey: post.idempotencyKey,
        assetCount: post.assetUrls.length,
        scheduledAt: post.scheduledAt,
        validation,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  async getStatus(publicationId: string): Promise<{ status: string; verifiedAt: string }> {
    return { status: publicationId.startsWith("dry_") ? "DRY_RUN" : "UNKNOWN", verifiedAt: new Date().toISOString() };
  }
}

export function publisherFor(platform: Platform): SocialPublisher {
  return new DryRunPublisher(platform);
}

export interface DesignIntegrationCapability {
  provider: "canva";
  oauth: CapabilityState;
  brandTemplates: CapabilityState;
  autofill: CapabilityState;
  export: CapabilityState;
  socialPublishing: CapabilityState;
}

export function canvaCapability(configured: boolean): DesignIntegrationCapability {
  return {
    provider: "canva",
    oauth: configured ? "AVAILABLE" : "NOT_CONFIGURED",
    brandTemplates: configured ? "UNAVAILABLE_PLAN" : "NOT_CONFIGURED",
    autofill: configured ? "UNAVAILABLE_PLAN" : "NOT_CONFIGURED",
    export: configured ? "AVAILABLE" : "NOT_CONFIGURED",
    socialPublishing: "MANUAL_HANDOFF_REQUIRED",
  };
}

