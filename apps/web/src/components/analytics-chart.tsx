import type { AnalyticsView } from "@aurendor/db/runtime";
import { compactNumber, formatDate } from "@/lib/format";

export function AnalyticsChart({ series }: { series: AnalyticsView["series"] }) {
  const width = 760;
  const height = 250;
  const padding = 24;
  const max = Math.max(...series.map((point) => point.qualifiedReach), 1);
  const points = series.map((point, index) => {
    const x = padding + (index / Math.max(series.length - 1, 1)) * (width - padding * 2);
    const y = height - padding - (point.qualifiedReach / max) * (height - padding * 2);
    return { ...point, x, y };
  });
  const line = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
  const area = `${line} L${points.at(-1)?.x ?? padding},${height - padding} L${padding},${height - padding} Z`;

  return (
    <div className="chart-wrap">
      <div className="chart-summary"><strong>{compactNumber(series.reduce((total, item) => total + item.qualifiedReach, 0))}</strong><span>Total qualified reach · 8 weeks</span></div>
      <svg className="line-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby="chart-title chart-desc">
        <title id="chart-title">Qualified reach over eight weeks</title>
        <desc id="chart-desc">Qualified reach increases from {series[0]?.qualifiedReach ?? 0} to {series.at(-1)?.qualifiedReach ?? 0} people. Demonstration data only.</desc>
        {[0.25, 0.5, 0.75, 1].map((ratio) => <line key={ratio} x1={padding} x2={width - padding} y1={height - padding - ratio * (height - padding * 2)} y2={height - padding - ratio * (height - padding * 2)} className="chart-gridline" />)}
        <path d={area} className="chart-area" />
        <path d={line} className="chart-line" />
        {points.map((point) => (
          <circle key={point.date} cx={point.x} cy={point.y} r="4" className="chart-point">
            <title>{`${formatDate(point.date)}: ${compactNumber(point.qualifiedReach)}`}</title>
          </circle>
        ))}
      </svg>
      <div className="chart-labels" aria-hidden="true"><span>{formatDate(series[0]?.date ?? "2026-07-06", { day: undefined, year: undefined })}</span><span>{formatDate(series.at(-1)?.date ?? "2026-08-24", { day: undefined, year: undefined })}</span></div>
    </div>
  );
}
