import { AlertTriangle, CheckCircle2, CircleDashed, CircleOff, Clock3, PauseCircle } from "lucide-react";
import { humanize } from "@/lib/format";

function tone(value: string): "good" | "warn" | "bad" | "quiet" | "info" {
  const normalized = value.toUpperCase();
  if (["APPROVED", "PUBLISHED", "AVAILABLE", "PASS", "COMPLETED", "CONNECTED", "READY"].includes(normalized)) return "good";
  if (["NEEDS_REVIEW", "REVISION_REQUESTED", "PARTIAL", "MANUAL_ONLY", "IN_REVIEW", "WAITING", "PENDING"].includes(normalized)) return "warn";
  if (["BLOCKED", "FAILED", "REJECTED", "UNAVAILABLE", "CANCELLED", "CRITICAL"].includes(normalized)) return "bad";
  if (["PAUSED", "DISABLED"].includes(normalized)) return "quiet";
  return "info";
}

export function StatusBadge({ value, label }: { value: string; label?: string }) {
  const currentTone = tone(value);
  const Icon = currentTone === "good" ? CheckCircle2 : currentTone === "warn" ? Clock3 : currentTone === "bad" ? AlertTriangle : currentTone === "quiet" ? PauseCircle : CircleDashed;
  return (
    <span className={`status-badge status-${currentTone}`}>
      <Icon aria-hidden="true" size={13} strokeWidth={2.2} />
      {label ?? humanize(value)}
    </span>
  );
}

export function RiskBadge({ value }: { value: string }) {
  const normalized = value.toLowerCase();
  const Icon = normalized === "high" || normalized === "critical" ? AlertTriangle : CircleOff;
  return (
    <span className={`status-badge ${normalized === "high" || normalized === "critical" ? "status-bad" : "status-quiet"}`}>
      <Icon aria-hidden="true" size={13} />
      {humanize(value)} risk
    </span>
  );
}
