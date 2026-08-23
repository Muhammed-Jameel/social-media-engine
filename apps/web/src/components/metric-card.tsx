import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

export function MetricCard({ label, value, note, delta, accent = false }: { label: string; value: string; note: string; delta?: number | null; accent?: boolean }) {
  const DeltaIcon = delta === undefined || delta === null || delta === 0 ? Minus : delta > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <article className={accent ? "metric-card metric-accent" : "metric-card"}>
      <p>{label}</p>
      <strong>{value}</strong>
      <div className="metric-note">
        {delta !== undefined ? <span className={delta && delta > 0 ? "delta-positive" : delta && delta < 0 ? "delta-negative" : "delta-flat"}><DeltaIcon size={14} />{delta === null ? "Baseline" : `${delta > 0 ? "+" : ""}${Math.round(delta * 100)}%`}</span> : null}
        <span>{note}</span>
      </div>
    </article>
  );
}
