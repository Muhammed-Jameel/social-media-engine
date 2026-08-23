import { getRepository } from "@aurendor/db/runtime";
import { AppShell } from "@/components/app-shell";
import { requireOwner } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const [session, repository] = await Promise.all([requireOwner(), getRepository()]);
  const [settings, notifications] = await Promise.all([repository.getSettings(), repository.listNotifications()]);
  return <AppShell session={session} settings={settings} notificationCount={notifications.length}>{children}</AppShell>;
}
