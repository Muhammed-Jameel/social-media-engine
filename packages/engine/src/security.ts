import { createHmac, timingSafeEqual } from "node:crypto";
import { isAbsolute, normalize, relative, resolve } from "node:path";

const instructionPatterns = [
  /ignore (?:all |any )?(?:previous|prior|system|developer) instructions?/i,
  /(?:system|developer) message\s*:/i,
  /reveal|exfiltrat|print (?:the )?(?:secret|token|api key|password)/i,
  /(?:run|execute) (?:this )?(?:command|script|code)/i,
  /تجاهل (?:كل )?(?:التعليمات|الأوامر) السابقة/u,
  /اكشف|اطبع (?:المفتاح|الرمز|كلمة المرور)/u,
];

export interface SanitizedExternalText {
  text: string;
  instructionLike: boolean;
  matchedPatterns: string[];
  truncated: boolean;
}

export function sanitizeExternalText(value: string, maxCharacters = 20_000): SanitizedExternalText {
  const normalized = value
    .replace(/\u0000/g, "")
    .replace(/[\u200B-\u200D\u2060\uFEFF]/gu, "")
    .normalize("NFKC");
  const matchedPatterns = instructionPatterns.filter((pattern) => pattern.test(normalized)).map((pattern) => pattern.source);
  return {
    text: normalized.slice(0, maxCharacters),
    instructionLike: matchedPatterns.length > 0,
    matchedPatterns,
    truncated: normalized.length > maxCharacters,
  };
}

function privateIpv4(hostname: string): boolean {
  const parts = hostname.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  return parts[0] === 10 || parts[0] === 127 || (parts[0] === 169 && parts[1] === 254) ||
    (parts[0] === 172 && (parts[1] ?? 0) >= 16 && (parts[1] ?? 0) <= 31) ||
    (parts[0] === 192 && parts[1] === 168) || parts[0] === 0;
}

export function validateRemoteAssetUrl(value: string): URL {
  const url = new URL(value);
  const hostname = url.hostname.toLowerCase();
  if (url.protocol !== "https:") throw new Error("Remote assets must use HTTPS.");
  if (url.username || url.password) throw new Error("Remote asset URLs cannot contain embedded credentials.");
  if (
    hostname === "localhost" ||
    hostname.endsWith(".local") ||
    hostname === "::1" ||
    hostname.startsWith("fc") ||
    hostname.startsWith("fd") ||
    hostname.startsWith("fe80:") ||
    privateIpv4(hostname)
  ) {
    throw new Error("Remote asset URL resolves to a local or private address.");
  }
  return url;
}

export function resolveWithinRoot(root: string, untrustedPath: string): string {
  if (untrustedPath.includes("\u0000")) throw new Error("Storage path contains a null byte.");
  const normalizedPath = normalize(untrustedPath);
  const candidate = isAbsolute(normalizedPath) ? resolve(normalizedPath) : resolve(root, normalizedPath);
  const relation = relative(resolve(root), candidate);
  if (relation.startsWith("..") || isAbsolute(relation)) throw new Error("Storage path escapes its authorized root.");
  return candidate;
}

export interface WebhookReplayStore {
  reserve(key: string, expiresAt: Date): Promise<boolean>;
}

export async function verifySignedWebhook(input: {
  body: Uint8Array;
  signatureHex: string;
  timestampSeconds: number;
  secret: string;
  provider: string;
  replayKey: string;
  replayStore: WebhookReplayStore;
  now?: Date;
  toleranceSeconds?: number;
}): Promise<void> {
  const now = input.now ?? new Date();
  const tolerance = input.toleranceSeconds ?? 300;
  if (!Number.isInteger(input.timestampSeconds) || Math.abs(now.getTime() / 1000 - input.timestampSeconds) > tolerance) {
    throw new Error("Webhook timestamp is outside the accepted replay window.");
  }
  if (!/^[a-f0-9]{64}$/i.test(input.signatureHex)) throw new Error("Webhook signature has an invalid format.");
  const signed = Buffer.concat([
    Buffer.from(`${input.timestampSeconds}.`, "utf8"),
    Buffer.from(input.body),
  ]);
  const expected = createHmac("sha256", input.secret).update(signed).digest();
  const supplied = Buffer.from(input.signatureHex, "hex");
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) throw new Error("Webhook signature verification failed.");
  const reserved = await input.replayStore.reserve(
    `${input.provider}:${input.replayKey}:${input.signatureHex}`,
    new Date(now.getTime() + tolerance * 1000),
  );
  if (!reserved) throw new Error("Webhook replay detected.");
}
