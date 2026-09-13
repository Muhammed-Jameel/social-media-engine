import "server-only";

import { createHmac, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "social_media_plugin_owner_session";
const SESSION_AGE_SECONDS = 60 * 60 * 12;

export interface OwnerSession {
  email: string;
  role: "owner";
  demo: boolean;
}

export function isDemoMode(): boolean {
  if (process.env.DEMO_MODE === "true") return true;
  if (process.env.DEMO_MODE === "false") return false;
  return process.env.NODE_ENV === "development";
}

function sessionSecret(): string | null {
  const value = process.env.OWNER_SESSION_SECRET?.trim();
  return value && value.length >= 32 ? value : null;
}

function encode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signature(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function verifyToken(token: string): OwnerSession | null {
  const secret = sessionSecret();
  if (!secret) return null;
  const [payload, suppliedSignature] = token.split(".");
  if (!payload || !suppliedSignature || !safeEqual(signature(payload, secret), suppliedSignature)) return null;

  try {
    const value = JSON.parse(decode(payload)) as { email?: string; role?: string; exp?: number };
    if (!value.email || value.role !== "owner" || !value.exp || value.exp <= Math.floor(Date.now() / 1000)) return null;
    return { email: value.email, role: "owner", demo: false };
  } catch {
    return null;
  }
}

export async function getOwnerSession(): Promise<OwnerSession | null> {
  if (isDemoMode()) {
    return {
      email: process.env.OWNER_EMAIL?.trim() || "owner@social-media-plugin.com",
      role: "owner",
      demo: true,
    };
  }
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return token ? verifyToken(token) : null;
}

export async function requireOwner(): Promise<OwnerSession> {
  const session = await getOwnerSession();
  if (!session) redirect("/login");
  return session;
}

export function verifyOwnerCredentials(email: string, password: string): boolean {
  const expectedEmail = process.env.OWNER_EMAIL?.trim().toLowerCase();
  const encodedHash = process.env.OWNER_PASSWORD_HASH?.trim();
  if (!expectedEmail || !encodedHash || email.trim().toLowerCase() !== expectedEmail) return false;

  const [scheme, salt, expectedDigest] = encodedHash.split(":");
  if (scheme !== "scrypt" || !salt || !expectedDigest) return false;
  try {
    const actual = scryptSync(password, Buffer.from(salt, "base64url"), 64);
    const expected = Buffer.from(expectedDigest, "base64url");
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export async function startOwnerSession(email: string): Promise<void> {
  const secret = sessionSecret();
  if (!secret) throw new Error("OWNER_SESSION_SECRET must contain at least 32 characters.");
  const payload = encode(JSON.stringify({ email: email.trim().toLowerCase(), role: "owner", exp: Math.floor(Date.now() / 1000) + SESSION_AGE_SECONDS }));
  const store = await cookies();
  store.set(COOKIE_NAME, `${payload}.${signature(payload, secret)}`, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_AGE_SECONDS,
  });
}

export async function endOwnerSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
