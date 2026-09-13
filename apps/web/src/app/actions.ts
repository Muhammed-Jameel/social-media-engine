"use server";

import { randomUUID } from "node:crypto";
import { getRepository, getDatabase } from "@social-media-plugin/db/runtime";
import { classifyOwnerCommand, loadProductionJob } from "@social-media-plugin/engine";
import { ApprovalDecisionSchema } from "@social-media-plugin/schemas";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/auth";

function required(formData: FormData, name: string): string {
  const value = String(formData.get(name) ?? "").trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

export async function reviewContentAction(formData: FormData): Promise<void> {
  await requireOwner();
  const contentItemId = required(formData, "contentItemId");
  if (await loadProductionJob(await getDatabase(), contentItemId)) redirect(`/production?id=${encodeURIComponent(contentItemId)}`);
  // Imported legacy items use stable `content-*` identifiers rather than UUIDs.
  // Preserve every other shared approval invariant while accepting that durable ID form.
  const webApprovalSchema = ApprovalDecisionSchema.omit({ contentItemId: true }).extend({ contentItemId: z.string().min(1) });
  const decision = webApprovalSchema.parse({
    id: randomUUID(),
    contentItemId,
    actorId: "user-owner",
    decision: required(formData, "decision"),
    reasonCodes: formData.getAll("reasonCodes").map(String),
    feedback: String(formData.get("feedback") ?? ""),
    decidedAt: new Date().toISOString(),
    traceId: randomUUID(),
  });
  await (await getRepository()).recordApproval(decision);
  revalidatePath("/");
  revalidatePath("/content");
  revalidatePath(`/content/${contentItemId}`);
  revalidatePath("/plans/2026-09");
  redirect(`/content/${contentItemId}?result=${decision.decision.toLowerCase()}`);
}

export async function approveMonthAction(formData: FormData): Promise<void> {
  await requireOwner();
  const strategyId = required(formData, "strategyId");
  const feedback = String(formData.get("feedback") ?? "");
  await (await getRepository()).approveMonth(strategyId, feedback);
  revalidatePath("/");
  revalidatePath("/content");
  revalidatePath("/plans/2026-09");
  redirect("/plans/2026-09?result=month-approved");
}

export async function setEnginePauseAction(formData: FormData): Promise<void> {
  await requireOwner();
  const paused = required(formData, "paused") === "true";
  const reason = required(formData, "reason");
  await (await getRepository()).setPaused(paused, reason);
  revalidatePath("/");
  revalidatePath("/controls");
  redirect(`/controls?result=${paused ? "paused" : "resumed"}`);
}

export async function interpretOwnerCommandAction(formData: FormData): Promise<void> {
  await requireOwner();
  const commandText = required(formData, "command");
  const command = classifyOwnerCommand(commandText);
  if (command.classification === "PAUSE_PUBLISHING") {
    await (await getRepository()).recordOwnerCommand(command, { confirmed: true });
    revalidatePath("/");
    revalidatePath("/controls");
    redirect("/controls?result=command-paused");
  }
  redirect(`/controls?preview=${encodeURIComponent(commandText)}`);
}

export async function confirmOwnerCommandAction(formData: FormData): Promise<void> {
  await requireOwner();
  const commandText = required(formData, "command");
  const command = classifyOwnerCommand(commandText);
  if (command.requiresConfirmation && formData.get("confirmation") !== "confirmed") {
    redirect(`/controls?preview=${encodeURIComponent(commandText)}&error=confirmation-required`);
  }
  await (await getRepository()).recordOwnerCommand(command, { confirmed: true });
  revalidatePath("/");
  revalidatePath("/controls");
  redirect(`/controls?result=command-${command.classification.toLowerCase()}`);
}
