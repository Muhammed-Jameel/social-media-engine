import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { z } from "zod";
import { resolveWithinRoot } from "./security";

const PostizIntegrationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).nullish().transform((value) => value || "Unnamed channel"),
  identifier: z.string().min(1),
  picture: z.string().optional().nullable(),
  disabled: z.boolean().optional(),
}).transform(({ identifier, ...integration }) => ({ ...integration, providerIdentifier: identifier }));

const PostizIntegrationsResponseSchema = z.union([
  z.array(PostizIntegrationSchema),
  z.object({ integrations: z.array(PostizIntegrationSchema) }).transform((value) => value.integrations),
]);

const PostizUploadSchema = z.object({
  id: z.string().min(1),
  path: z.string().min(1),
  name: z.string().optional(),
});

const PostizCreateResponseSchema = z.array(z.object({
  postId: z.string().min(1),
  integration: z.string().min(1),
}));

export type PostizIntegration = z.infer<typeof PostizIntegrationSchema>;
export type PostizUpload = z.infer<typeof PostizUploadSchema>;

export interface PostizPostValue {
  content: string;
  image: PostizUpload[];
}

export interface PostizOutboundPost {
  integration: { id: string };
  value: PostizPostValue[];
  settings: Record<string, unknown> & { __type: string };
}

export interface PostizCreateRequest {
  type: "draft" | "schedule" | "now";
  date: string;
  shortLink: boolean;
  tags: Array<Record<string, unknown>>;
  posts: PostizOutboundPost[];
}

export interface PostizClientOptions {
  baseUrl: string;
  apiKey: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

export class PostizApiError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = "PostizApiError";
  }
}

function normalizeBaseUrl(value: string): string {
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("POSTIZ_API_URL must use HTTP or HTTPS.");
  url.username = "";
  url.password = "";
  const clean = url.toString().replace(/\/$/, "");
  return clean.endsWith("/public/v1") ? clean : `${clean}/public/v1`;
}

function safeProviderMessage(value: unknown): string {
  if (!value || typeof value !== "object") return "Postiz returned an unexpected response.";
  const record = value as Record<string, unknown>;
  for (const key of ["message", "error", "detail"]) {
    if (typeof record[key] === "string") return record[key].slice(0, 500);
  }
  return "Postiz returned an unexpected response.";
}

export class PostizClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: PostizClientOptions) {
    this.baseUrl = normalizeBaseUrl(options.baseUrl);
    this.apiKey = options.apiKey.trim();
    if (!this.apiKey) throw new Error("POSTIZ_API_KEY is required.");
    this.timeoutMs = options.timeoutMs ?? 20_000;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  private async request(path: string, init: RequestInit = {}): Promise<unknown> {
    let response: Response;
    try {
      response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        ...init,
        headers: {
          Authorization: this.apiKey,
          ...(init.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
          ...init.headers,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      const reason = error instanceof Error && error.name === "TimeoutError" ? "timed out" : "could not be reached";
      throw new PostizApiError(`Postiz ${reason}.`, null, true);
    }
    const body = await response.json().catch(() => null) as unknown;
    if (!response.ok) {
      throw new PostizApiError(safeProviderMessage(body), response.status, response.status === 408 || response.status === 429 || response.status >= 500);
    }
    return body;
  }

  async isConnected(): Promise<boolean> {
    const body = await this.request("/is-connected");
    return z.object({ connected: z.boolean() }).parse(body).connected;
  }

  async listIntegrations(): Promise<PostizIntegration[]> {
    return PostizIntegrationsResponseSchema.parse(await this.request("/integrations"));
  }

  async listPosts(startDate: string, endDate: string): Promise<unknown> {
    return this.request('/posts?' + new URLSearchParams({ startDate, endDate }));
  }

  async postAnalytics(postId: string, days = 7): Promise<unknown> {
    return this.request(`/analytics/post/${encodeURIComponent(postId)}?date=${days}`);
  }

  async uploadFile(input: { bytes: Uint8Array; filename: string; mimeType: string }): Promise<PostizUpload> {
    const form = new FormData();
    const ownedBytes = Uint8Array.from(input.bytes);
    form.set("file", new Blob([ownedBytes.buffer], { type: input.mimeType }), basename(input.filename));
    return PostizUploadSchema.parse(await this.request("/upload", { method: "POST", body: form }));
  }

  async createPosts(payload: PostizCreateRequest): Promise<Array<{ postId: string; integration: string }>> {
    return PostizCreateResponseSchema.parse(await this.request("/posts", { method: "POST", body: JSON.stringify(payload) }));
  }
}

export function getPostizClient(environment: NodeJS.ProcessEnv = process.env): PostizClient | null {
  const baseUrl = environment.POSTIZ_API_URL?.trim();
  const apiKey = environment.POSTIZ_API_KEY?.trim();
  if (!baseUrl || !apiKey) return null;
  return new PostizClient({ baseUrl, apiKey });
}

export function postizFrontendUrl(environment: NodeJS.ProcessEnv = process.env): string {
  const raw = environment.POSTIZ_FRONTEND_URL?.trim() || "http://localhost:4007";
  const url = new URL(raw);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("POSTIZ_FRONTEND_URL must use HTTP or HTTPS.");
  return url.toString().replace(/\/$/, "");
}

export function postizProviderType(providerIdentifier: string): string | null {
  const normalized = providerIdentifier.toLowerCase();
  if (["instagram", "instagram-standalone", "facebook", "linkedin", "linkedin-page", "tiktok", "x"].includes(normalized)) return normalized;
  return null;
}

export function postizSettings(providerIdentifier: string, options: { tiktokDirectPostVerified?: boolean; linkedinDocumentCarousel?: boolean; carouselName?: string } = {}): Record<string, unknown> & { __type: string } {
  const type = postizProviderType(providerIdentifier);
  if (!type) throw new Error(`Unsupported Postiz provider: ${providerIdentifier}`);
  if (type === "instagram" || type === "instagram-standalone") return { __type: type, post_type: "post" };
  if (type === "linkedin" || type === "linkedin-page") return { __type: type, post_as_images_carousel: options.linkedinDocumentCarousel ?? false, ...(options.linkedinDocumentCarousel ? { carousel_name: options.carouselName || "SOCIAL_MEDIA_PLUGIN" } : {}) };
  if (type === "tiktok") {
    return {
      __type: type,
      privacy_level: "PUBLIC_TO_EVERYONE",
      duet: false,
      stitch: false,
      comment: true,
      autoAddMusic: "no",
      brand_content_toggle: false,
      brand_organic_toggle: true,
      video_made_with_ai: true,
      // UPLOAD hands the media to TikTok for owner completion. Direct posting
      // stays unavailable until the application audit is explicitly recorded.
      content_posting_method: options.tiktokDirectPostVerified ? "DIRECT_POST" : "UPLOAD",
    };
  }
  if (type === "x") return { __type: type, who_can_reply_post: "everyone", community: "", made_with_ai: true, paid_partnership: false };
  return { __type: type };
}

export function platformForPostizProvider(providerIdentifier: string): "instagram" | "facebook" | "linkedin" | "tiktok" | "x" | null {
  const type = postizProviderType(providerIdentifier);
  if (type === "instagram" || type === "instagram-standalone") return "instagram";
  if (type === "linkedin" || type === "linkedin-page") return "linkedin";
  if (type === "facebook" || type === "tiktok" || type === "x") return type;
  return null;
}

export function postizValues(input: {
  providerIdentifier: string;
  caption: string;
  continuation?: string;
  media: PostizUpload[];
}): PostizPostValue[] {
  if (platformForPostizProvider(input.providerIdentifier) !== "x" || input.media.length <= 4) {
    return [{ content: input.caption, image: input.media }];
  }
  const chunks: PostizUpload[][] = [];
  for (let index = 0; index < input.media.length; index += 4) chunks.push(input.media.slice(index, index + 4));
  return chunks.map((image, index) => ({
    content: index === 0
      ? `${input.caption}\n\n${index + 1}/${chunks.length}`
      : `${input.continuation?.trim() || "تكملة العرض."}\n\n${index + 1}/${chunks.length}`,
    image,
  }));
}

export function publicationRequestHash(payload: PostizCreateRequest): string {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export async function readVerifiedAsset(input: { root: string; sourcePath: string; sha256: string }): Promise<Uint8Array> {
  const absolute = resolveWithinRoot(resolve(input.root), input.sourcePath);
  const bytes = await readFile(absolute);
  const actual = createHash("sha256").update(bytes).digest("hex");
  if (actual !== input.sha256) throw new Error(`Asset hash mismatch for ${basename(input.sourcePath)}.`);
  return bytes;
}
