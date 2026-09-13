import { OwnerCommandSchema } from "@social-media-plugin/schemas";
import { z } from "zod";

export type ClassifiedOwnerCommand = z.infer<typeof OwnerCommandSchema>;

export function classifyOwnerCommand(command: string): ClassifiedOwnerCommand {
  const trimmed = command.trim();
  if (!trimmed) throw new Error("Owner command cannot be empty.");
  const normalized = trimmed.toLocaleLowerCase("en");
  if (/\b(pause|stop|freeze)\b.*\b(engine|publish|publishing|posts?)\b|(?:أوقف|وقف|جمّد).*(?:النشر|المحرك)/u.test(normalized)) {
    return OwnerCommandSchema.parse({
      command: trimmed,
      scope: "SAFETY_POLICY",
      classification: "PAUSE_PUBLISHING",
      proposedChange: { paused: true },
      requiresConfirmation: false,
    });
  }
  if (/\b(resume|unpause|restart)\b.*\b(engine|publish|publishing|posts?)\b|(?:استأنف|شغّل).*(?:النشر|المحرك)/u.test(normalized)) {
    return OwnerCommandSchema.parse({
      command: trimmed,
      scope: "SAFETY_POLICY",
      classification: "RESUME_PUBLISHING",
      proposedChange: { paused: false },
      requiresConfirmation: true,
    });
  }
  if (/less promotional|more useful|fewer hashtags|tone|voice|أقل ترويج|أكثر فائدة|نبرة/u.test(normalized)) {
    return OwnerCommandSchema.parse({
      command: trimmed,
      scope: "PERSISTENT_PREFERENCE",
      classification: "EDITORIAL_PREFERENCE",
      proposedChange: { editorialPreference: trimmed, appliesAfterConfirmation: true },
      requiresConfirmation: true,
    });
  }
  if (/this (month|campaign)|september|october|هذا الشهر|الحملة/u.test(normalized)) {
    return OwnerCommandSchema.parse({
      command: trimmed,
      scope: "CAMPAIGN",
      classification: "CAMPAIGN_REVISION",
      proposedChange: { requestedRevision: trimmed },
      requiresConfirmation: true,
    });
  }
  return OwnerCommandSchema.parse({
    command: trimmed,
    scope: "ONE_TIME",
    classification: "REVIEW_REQUIRED",
    proposedChange: { interpretedIntent: null, originalCommand: trimmed },
    requiresConfirmation: true,
  });
}
