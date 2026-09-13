import { createHash, randomUUID } from "node:crypto";
import { MonthlyPlanSchema, type MonthlyPlan, type Platform } from "@social-media-plugin/schemas";
import type { StructuredAgentGateway } from "./agents";
import { createAgentGateway } from "./agents";
import { retrieveBrandContext } from "./brand";

export interface MonthlyPlanningInput {
  organizationId: string;
  month: string;
  timezone?: string;
  businessPriorities: string[];
  audiences: string[];
  platforms?: Platform[];
  traceId?: string;
  now?: Date;
}

const slots = [
  { day: 2, pillar: "operational-education", format: "carousel", tension: "Important follow-up lives in separate messages and personal memory." },
  { day: 5, pillar: "applied-ai", format: "single_image", tension: "AI experiments remain detached from the daily operating process." },
  { day: 9, pillar: "proof-and-systems", format: "carousel", tension: "Technology claims are difficult to trust without a visible system map." },
  { day: 12, pillar: "brand-authority", format: "single_image", tension: "Digital work is presented as tools instead of dependable infrastructure." },
  { day: 16, pillar: "operational-education", format: "carousel", tension: "Handoffs lose context because ownership and next action are not explicit." },
  { day: 19, pillar: "product", format: "single_image", tension: "Project status, documents, and financial follow-up are fragmented." },
  { day: 23, pillar: "founder-insight", format: "text", tension: "Automation is often chosen before the underlying decision is understood." },
  { day: 26, pillar: "timely-reserve", format: "single_image", tension: "A useful timely topic may emerge after the core month is approved." },
] as const;

function stableId(value: string): string {
  return `plan-${createHash("sha256").update(value).digest("hex").slice(0, 24)}`;
}

function scheduledAt(month: string, day: number): string {
  return new Date(`${month}-${String(day).padStart(2, "0")}T12:30:00+03:00`).toISOString();
}

function messageFor(pillar: string, priority: string): string {
  const map: Record<string, string> = {
    "operational-education": "A clear workflow makes accountability and the next decision visible.",
    "applied-ai": "Applied AI becomes useful when it is attached to a defined operating decision.",
    "proof-and-systems": "Trust grows when the system, evidence, and operating logic can be inspected.",
    "brand-authority": "SOCIAL_MEDIA_PLUGIN builds operational intelligence infrastructure, not isolated digital features.",
    product: "A focused operational product can replace fragmented project follow-up with a controlled flow.",
    "founder-insight": "The quality of automation depends on the quality of the process decision beneath it.",
    "timely-reserve": "Use the reserved slot only for a current topic with verified evidence and a durable SOCIAL_MEDIA_PLUGIN point of view.",
  };
  return map[pillar] ?? `Turn ${priority} into a concrete and inspectable operating practice.`;
}

export function createBootstrapMonthlyPlan(input: MonthlyPlanningInput): MonthlyPlan {
  if (!/^\d{4}-\d{2}$/.test(input.month)) throw new Error(`Invalid target month: ${input.month}`);
  if (input.businessPriorities.length === 0) throw new Error("At least one business priority is required.");
  if (input.audiences.length === 0) throw new Error("At least one audience is required.");
  const createdAt = (input.now ?? new Date()).toISOString();
  const platforms = input.platforms?.length ? input.platforms : ["instagram", "facebook", "tiktok", "x", "linkedin"];
  const itemIds = slots.map((slot) => stableId(`${input.month}:${slot.day}:${slot.pillar}`));
  const items = slots.map((slot, index) => {
    const keyMessage = messageFor(slot.pillar, input.businessPriorities[index % input.businessPriorities.length] ?? input.businessPriorities[0]!);
    return {
      id: itemIds[index]!,
      objective: index === 5 ? "Create informed product consideration without unsupported promises." : "Build qualified awareness through useful operational intelligence.",
      audience: input.audiences[index % input.audiences.length]!,
      funnelStage: index === 5 ? "consideration" as const : index === 6 ? "retention" as const : "awareness" as const,
      pillar: slot.pillar,
      tension: slot.tension,
      keyMessage,
      perceptionShift: "AI and automation can become calm, measurable operating infrastructure.",
      format: slot.format,
      platforms,
      language: index === 6 ? "en" as const : "ar" as const,
      hookHypothesis: "A concrete operating tension will earn attention without hype or fake urgency.",
      creativeHypothesis: index % 2 === 0
        ? "A light editorial composition with one visual control point will improve comprehension and saves."
        : "A dark authority composition with disciplined typography will create rhythm without visual clutter.",
      proofRequirements: slot.pillar === "proof-and-systems" || slot.pillar === "product"
        ? ["Current first-party screen, workflow diagram, or approved internal system evidence"]
        : [],
      cta: index === 5 ? "Review whether this operating pattern matches one active project workflow." : "Save the framework and map one repeated workflow this week.",
      kpis: index === 5 ? ["qualified_profile_visits", "qualified_messages", "saves"] : ["qualified_reach", "saves", "shares"],
      publishAtLocal: scheduledAt(input.month, slot.day),
      timezone: input.timezone ?? "Asia/Baghdad",
      status: slot.pillar === "timely-reserve" ? "needs_evidence" as const : "needs_approval" as const,
      approvalClass: "MONTHLY_APPROVAL" as const,
      risk: "low" as const,
      riskReasons: slot.pillar === "timely-reserve" ? ["Topic and evidence must be selected near publication time."] : [],
      experimentId: index === 0 ? "bootstrap-hook-framing-v1" : null,
      relatedPostIds: index > 0 ? itemIds.slice(Math.max(0, index - 2), index) : [],
      antiRepetitionScore: Math.max(78, 94 - index * 2),
    };
  });
  return MonthlyPlanSchema.parse({
    schemaVersion: "1.0.0",
    artifactId: stableId(`${input.organizationId}:${input.month}:monthly-plan`),
    artifactType: "monthly_plan",
    skill: "social-content-strategy",
    skillVersion: "1.0.0",
    modelVersion: "none",
    promptVersion: "bootstrap-plan-v1",
    traceId: input.traceId ?? randomUUID(),
    createdAt,
    inputRefs: [],
    evidence: [],
    warnings: [
      "Bootstrap plan: no real historical platform performance was available, so KPI choices are hypotheses rather than observed winners.",
      "The timely reserve remains blocked until a dated source-backed topic is selected.",
    ],
    status: "needs_approval",
    organizationId: input.organizationId,
    month: input.month,
    timezone: input.timezone ?? "Asia/Baghdad",
    businessPriorities: input.businessPriorities,
    objectives: [
      "Build qualified awareness for SOCIAL_MEDIA_PLUGIN's operational intelligence category.",
      "Increase evidence-led consideration without overpromotion.",
      "Create reusable learning signals for the next monthly retrospective.",
    ],
    audiences: input.audiences,
    kpiHierarchy: ["qualified_messages", "qualified_profile_visits", "saves", "shares", "qualified_reach"],
    cadence: { feedPerWeek: 2, timelyReservePerMonth: 1 },
    contentMix: { education: 0.25, appliedAi: 0.125, proof: 0.125, brand: 0.125, product: 0.125, founder: 0.125, timelyReserve: 0.125 },
    narrativeArc: ["Recognize the operating friction", "See the system", "Inspect the proof", "Choose a controlled next step"],
    timelyCapacity: 0.125,
    items,
    strategyRisks: ["No production analytics baseline exists yet.", "Product and proof items require current first-party evidence before execution."],
    approvalState: "in_review",
  });
}

export class MonthlyPlanningService {
  constructor(private readonly gateway: StructuredAgentGateway = createAgentGateway()) {}

  async generate(input: MonthlyPlanningInput): Promise<MonthlyPlan> {
    const [brand, fixture] = await Promise.all([
      retrieveBrandContext({ query: `${input.month} ${input.businessPriorities.join(" ")} social strategy`, language: "bilingual", limit: 8 }),
      Promise.resolve(createBootstrapMonthlyPlan(input)),
    ]);
    const result = await this.gateway.run({
      role: "CONTENT_STRATEGIST",
      taskName: "social_media_plugin_monthly_plan_v1",
      instructions: [
        "Create a professional monthly content system, not a generic topic list.",
        "Every item must bind objective, audience tension, perception shift, evidence, CTA, KPI, risk, and anti-repetition context.",
        "Do not invent performance history, current facts, proof, customer names, offers, or provider capabilities.",
        "Keep the FINAL 2026 deep-green/neon identity and SOCIAL_MEDIA_PLUGIN operational-intelligence category authoritative.",
      ].join(" "),
      input: { request: input, brandContext: brand, bootstrapWhenHistoryMissing: true },
      schema: MonthlyPlanSchema,
      fixture,
      reasoningEffort: "high",
      ...(input.traceId ? { traceId: input.traceId } : {}),
    });
    return result.value;
  }
}
