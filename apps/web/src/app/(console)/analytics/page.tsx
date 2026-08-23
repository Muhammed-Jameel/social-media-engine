import { ArrowRight, Beaker, Info } from "lucide-react";
import Link from "next/link";
import { getRepository } from "@aurendor/db/runtime";
import { AnalyticsChart } from "@/components/analytics-chart";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { compactNumber, percent } from "@/lib/format";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const analytics = await (await getRepository()).getAnalytics();
  return (
    <>
      <PageHeader eyebrow="Analytics & learning" title="Evidence before optimization." description="Rates are normalized, cohorts are comparable, and synthetic demonstrations remain visibly separated from production truth." actions={<span className="evidence-label"><Beaker size={14} /> Synthetic demo</span>} />
      <div className="evidence-callout"><Info size={17} /><div><strong>{analytics.window}</strong><span>These values test the analysis surface. They must not be used as proof of AURENDOR performance.</span></div></div>
      <div className="metric-grid">
        {analytics.primaryMetrics.map((metric, index) => <MetricCard key={metric.label} label={metric.label} value={metric.unit === "rate" ? percent(metric.value) : compactNumber(metric.value)} note={metric.unit} delta={metric.delta} accent={index === 0} />)}
      </div>
      <div className="analytics-grid">
        <Panel title="Qualified reach" description="Unique people matching the intended audience signal · weekly · synthetic"><AnalyticsChart series={analytics.series} /></Panel>
        <Panel title="Learning notes" description="Directional observations with explicit next actions.">
          <div className="analytics-insights">{analytics.insights.slice(0, 4).map((insight, index) => <article key={insight.id}><span>{String(index + 1).padStart(2, "0")}</span><div><p className="meta-line">{insight.confidenceNote}</p><h3>{insight.statement}</h3><p>{insight.nextAction}</p></div></article>)}</div>
        </Panel>
      </div>
      <Panel title="Creative cohorts" description="Format-level rates; no winner is declared without enough comparable posts.">
        <div className="calendar-table-wrap"><table className="data-table"><thead><tr><th>Cohort</th><th>Posts</th><th>Save rate</th><th>Share rate</th><th>Evidence</th></tr></thead><tbody>{analytics.cohorts.map((cohort) => <tr key={cohort.label}><td><strong>{cohort.label}</strong></td><td>{cohort.posts}</td><td>{percent(cohort.saveRate)}</td><td>{percent(cohort.shareRate)}</td><td>{cohort.confidence}</td></tr>)}</tbody></table></div>
        <div className="panel-footer"><p>Next optimization decision starts only after production metrics satisfy the cohort minimum.</p><Link href="/runs" className="text-link">Inspect learning runs <ArrowRight size={14} /></Link></div>
      </Panel>
    </>
  );
}
