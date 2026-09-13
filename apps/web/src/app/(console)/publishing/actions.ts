"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isDemoMode, requireOwner } from "@/lib/auth";
import { publishContentViaPostiz } from "@/lib/postiz-publishing";

const PlatformSchema = z.enum(["instagram", "facebook", "linkedin", "tiktok", "x"]);
const ModeSchema = z.enum(["draft", "schedule", "now"]);

function redirectWithError(message: string): never {
  redirect(`/publishing?error=${encodeURIComponent(message.slice(0, 300))}`);
}

export async function dispatchToPostizAction(formData: FormData): Promise<void> {
  const session = await requireOwner();
  try {
    const mode = ModeSchema.parse(String(formData.get("mode") ?? ""));
    if (formData.get("confirmation") !== "confirmed") throw new Error("Confirm the exact channels, copy, assets, and timing before dispatch.");
    const integrationIds = formData.getAll("integrationId").map(String).filter(Boolean);
    const captions = Object.fromEntries(
      PlatformSchema.options.map((platform) => [platform, String(formData.get(`caption_${platform}`) ?? "").trim()]),
    );
    const result = await publishContentViaPostiz({
      contentItemId: z.string().min(1).parse(String(formData.get("contentItemId") ?? "")),
      integrationIds,
      mode,
      scheduledAt: String(formData.get("scheduledAt") ?? ""),
      nonce: z.string().uuid().parse(String(formData.get("nonce") ?? "")),
      captions,
      xContinuation: String(formData.get("xContinuation") ?? ""),
      actorId: session.email,
      allowProduction: !isDemoMode(),
    });
    revalidatePath("/");
    revalidatePath("/content");
    revalidatePath("/publishing");
    redirect(`/publishing?result=${mode}&batch=${encodeURIComponent(result.batchId)}`);
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error && String((error as { digest?: unknown }).digest).startsWith("NEXT_REDIRECT")) throw error;
    redirectWithError(error instanceof Error ? error.message : "The Postiz dispatch failed.");
  }
}
