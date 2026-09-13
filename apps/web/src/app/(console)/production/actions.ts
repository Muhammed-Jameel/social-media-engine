"use server";
import { randomUUID } from "node:crypto";
import { getDatabase, projectRoot } from "@social-media-plugin/db/runtime";
import { currentPackage, decideProduction, loadProductionJob, saveProductionJob, verifyProductionBytes } from "@social-media-plugin/engine";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOwner, isDemoMode } from "@/lib/auth";
import { publishContentViaPostiz } from "@/lib/postiz-publishing";

export async function reviewProductionAction(form: FormData): Promise<void> {
  const owner = await requireOwner();
  const id = String(form.get("id") ?? "");
  let result = "";
  try {
    const decision = String(form.get("decision"));
    if (decision !== "APPROVE" && decision !== "REVISE") throw new Error("Invalid owner decision.");
    if (decision === "APPROVE" && form.get("confirm") !== "yes") throw new Error("Confirm the entire five-platform package and TikTok handoff.");
    const db = await getDatabase();
    const before = await loadProductionJob(db, id);
    if (!before) throw new Error("Package not found.");
    const pkg = currentPackage(before);
    if (!pkg) throw new Error("Package is not rendered.");
    await verifyProductionBytes(projectRoot(), pkg);
    const after = decideProduction(before, { decision, actor: owner.email, packageHash: String(form.get("packageHash")), feedback: String(form.get("feedback") ?? "") });
    await saveProductionJob(db, before, after, owner.email);
    result = decision === "REVISE" ? "Revision queued with your feedback." : "Owner approval recorded.";
    if (decision === "APPROVE" && form.get("schedule") === "yes") {
      // Deterministic authenticated owner action, not an AI publishing tool.
      await publishContentViaPostiz({ contentItemId: id, integrationIds: pkg.variants.map(v => v.accountId), mode: "schedule", scheduledAt: pkg.scheduledAt, nonce: randomUUID(), captions: {}, actorId: owner.email, allowProduction: !isDemoMode() });
      result = "All five channels accepted one shared schedule. TikTok is an inbox handoff; Stories remain a labeled native handoff.";
    }
  } catch (error) {
    result += ` ${error instanceof Error ? error.message : "Operation failed."}`;
  }
  revalidatePath("/production"); revalidatePath("/content"); revalidatePath("/publishing");
  redirect(`/production?id=${encodeURIComponent(id)}&result=${encodeURIComponent(result.trim())}`);
}
