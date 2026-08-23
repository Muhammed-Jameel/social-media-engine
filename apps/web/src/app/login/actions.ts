"use server";

import { redirect } from "next/navigation";
import { endOwnerSession, isDemoMode, startOwnerSession, verifyOwnerCredentials } from "@/lib/auth";

export async function loginAction(formData: FormData): Promise<void> {
  if (isDemoMode()) redirect("/");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!verifyOwnerCredentials(email, password)) redirect("/login?error=invalid");
  await startOwnerSession(email);
  redirect("/");
}

export async function logoutAction(): Promise<void> {
  await endOwnerSession();
  redirect("/login");
}
