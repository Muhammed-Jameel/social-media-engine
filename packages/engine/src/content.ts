import { randomUUID } from "node:crypto";
import type { ContentFormat, Platform, RiskLevel } from "@aurendor/schemas";
import { classifyApproval } from "./policy";

const genericPatterns = [
  /in today'?s rapidly evolving/i,
  /unlock (the )?power of ai/i,
  /game[- ]changing/i,
  /revolutioni[sz]e/i,
  /cutting[- ]edge/i,
  /best[- ]in[- ]class/i,
  /effortless(ly)?/i,
  /it'?s not .{1,80}, it'?s .{1,80}/i,
  /في عالمنا سريع التطور/u,
  /إحداث ثورة/u,
  /حلول متكاملة لجميع/u,
  /الأفضل بلا منازع/u,
  /مذهل|خرافي|معجزة تقنية/u,
];

export interface EditorialFinding {
  pattern: string;
  excerpt: string;
  severity: "warning" | "reject";
}

export function detectGenericCopy(text: string): EditorialFinding[] {
  return genericPatterns.flatMap((pattern) => {
    const match = text.match(pattern);
    return match?.[0] ? [{ pattern: pattern.source, excerpt: match[0], severity: "reject" as const }] : [];
  });
}

export function antiGenericScore(text: string): number {
  const findings = detectGenericCopy(text);
  const repeatedPunctuation = (text.match(/!{2,}|…{2,}|—/g) ?? []).length;
  const emojiCount = (text.match(/\p{Extended_Pictographic}/gu) ?? []).length;
  return Math.max(0, 100 - findings.length * 22 - repeatedPunctuation * 4 - Math.max(0, emojiCount - 2) * 3);
}

export function platformExecution(input: { platform: Platform; format: ContentFormat }): { format: ContentFormat; note: string | null } {
  if (input.platform === "linkedin" && input.format === "carousel") {
    return { format: "multi_image", note: "Organic LinkedIn carousel is unsupported; execute as MultiImage or a document post." };
  }
  if (input.platform === "tiktok") {
    return { format: input.format, note: "TikTok uses draft upload and owner completion; unattended public posting is disabled." };
  }
  return { format: input.format, note: null };
}

export function classifyRisk(input: { text: string; hasVerifiedSources: boolean; namedCustomer?: boolean }): { level: RiskLevel; reasons: string[] } {
  const reasons: string[] = [];
  const normalized = input.text.toLowerCase();
  if (!input.hasVerifiedSources && /\d+%|statistic|according to|دراسة|نسبة/u.test(input.text)) reasons.push("Quantified or sourced claim lacks verified evidence.");
  if (input.namedCustomer) reasons.push("Named customer requires stored publication permission.");
  if (/price|pricing|legal|regulatory|politic|سعر|قانون|سياس/u.test(normalized)) reasons.push("Sensitive pricing, legal, regulatory, or political subject.");
  const level: RiskLevel = reasons.length >= 2 ? "high" : reasons.length === 1 ? "medium" : "low";
  return { level, reasons };
}

export function createFixtureIdea(input: { month: string; scheduledAt: string; title: string; language?: "ar" | "en" }) {
  const risk = classifyRisk({ text: input.title, hasVerifiedSources: true });
  return {
    id: randomUUID(),
    externalKey: `fixture-${input.month}-${createSlug(input.title)}`,
    title: input.title,
    language: input.language ?? "ar",
    objective: "Teach a practical automation pattern with calm authority.",
    audience: "Iraqi business owners and operations leaders",
    pillar: "operational-education",
    funnelStage: "awareness" as const,
    tension: "Manual follow-up hides where time and accountability are lost.",
    keyMessage: input.title,
    perceptionShift: "Automation begins with a clearly structured workflow, not a generic AI tool.",
    format: "carousel" as const,
    platforms: ["instagram", "linkedin"] as Platform[],
    hookHypothesis: "A direct operational tension earns attention without hype.",
    creativeHypothesis: "A light editorial carousel with one dark stat/punch slide will maximize saves and comprehension.",
    cta: "Save the framework and map one repeated workflow this week.",
    scheduledAt: input.scheduledAt,
    risk,
    approvalClass: classifyApproval({ text: input.title, risk: risk.level }),
  };
}

function createSlug(value: string): string {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

