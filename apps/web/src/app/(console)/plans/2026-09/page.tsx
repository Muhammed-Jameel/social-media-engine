import Link from "next/link";
import { AlertTriangle, ArrowUpRight, CalendarClock, CheckCircle2, ShieldCheck } from "lucide-react";
import { getRepository } from "@aurendor/db/runtime";
import { approveMonthAction } from "@/app/actions";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { RiskBadge, StatusBadge } from "@/components/status-badge";
import { formatDate, humanize } from "@/lib/format";

function weekOf(key: string): string {
  const match = key.match(/^W(\d)/);
  return match ? `Week ${match[1]}` : "Video series";
}

export const metadata = { title: "September plan" };

export default async function SeptemberPlanPage({ searchParams }: { searchParams: Promise<{ result?: string }> }) {
  const { result } = await searchParams;
  const repository = await getRepository();
  const [dashboard, content] = await Promise.all([repository.getDashboard(), repository.listContent({ month: "2026-09" })]);
  const groups = new Map<string, typeof content>();
  for (const item of content) {
    const week = weekOf(item.externalKey);
    const items = groups.get(week) ?? [];
    items.push(item);
    groups.set(week, items);
  }

  return (
    <>
      <PageHeader
        eyebrow="September 2026 · Monthly strategy"
        title="Approve the system, preserve the exceptions."
        description="Month approval commits the strategic direction and ordinary-risk items. High-risk or specially flagged work still requires a separate item decision."
        actions={<StatusBadge value={dashboard.strategy.status} />}
      />
      {result === "month-approved" ? <div className="result-banner" role="status"><CheckCircle2 size={17} /><div><strong>September strategy approved.</strong><span>Ordinary-risk items were advanced; high-risk and exception items remain isolated.</span></div></div> : null}

      <div className="plan-brief-grid">
        <Panel title="Strategic intent" description="The approved direction all agents must inherit.">
          <div className="brief-body">
            <p className="eyebrow">Primary objective</p>
            <h2 className="brief-objective">{dashboard.strategy.objective}</h2>
            <div className="brief-facts">
              <span><strong>{content.length}</strong> items</span>
              <span><strong>{content.filter((item) => item.format === "carousel").length}</strong> carousels</span>
              <span><strong>{content.filter((item) => item.riskLevel === "high").length}</strong> high risk</span>
              <span><strong>AR + EN</strong> bilingual system</span>
            </div>
          </div>
        </Panel>
        <Panel title="Approval boundary" description="T−5 decision checkpoint · 27 Aug 2026">
          <div className="boundary-body">
            <div><CalendarClock size={18} /><p><strong>Month approval</strong><span>Strategy and ordinary-risk items</span></p></div>
            <div><ShieldCheck size={18} /><p><strong>Item approval</strong><span>High-risk, claims, sensitive proof</span></p></div>
            <div><AlertTriangle size={18} /><p><strong>Hard fail</strong><span>Never overridden by a bulk action</span></p></div>
          </div>
        </Panel>
      </div>

      <Panel title="Editorial calendar" description="Imported September production work is quarantined in Needs review until owner approval.">
        <div className="calendar-table-wrap">
          <table className="data-table calendar-table">
            <thead><tr><th>Item</th><th>Scheduled</th><th>Format</th><th>Platforms</th><th>Risk</th><th>Status</th><th><span className="sr-only">Open</span></th></tr></thead>
            <tbody>
              {Array.from(groups.entries()).flatMap(([week, items]) => [
                <tr className="week-row" key={`${week}-header`}><th colSpan={7}>{week}<span>{items.length} items</span></th></tr>,
                ...items.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.externalKey}</strong><span>{item.title}</span></td>
                    <td>{formatDate(item.scheduledAt, { year: undefined, hour: "2-digit", minute: "2-digit", hour12: false })}</td>
                    <td>{humanize(item.format)}</td>
                    <td>{item.platforms.map(humanize).join(", ")}</td>
                    <td>{item.riskLevel === "high" || item.riskLevel === "critical" ? <RiskBadge value={item.riskLevel} /> : humanize(item.riskLevel)}</td>
                    <td><StatusBadge value={item.status} /></td>
                    <td><Link className="table-open" href={`/content/${item.id}`} aria-label={`Open ${item.externalKey}`}><ArrowUpRight size={16} /></Link></td>
                  </tr>
                )),
              ])}
            </tbody>
          </table>
        </div>
      </Panel>

      <section className="approval-gate">
        <div>
          <span className="approval-gate-icon"><CheckCircle2 size={22} /></span>
          <div><p className="eyebrow eyebrow-pale">Owner action</p><h2>Approve September’s strategic system</h2><p>Approves ordinary-risk items only. High-risk content and hard-failed creative remain held for individual review.</p></div>
        </div>
        <form action={approveMonthAction} className="approval-gate-form">
          <input type="hidden" name="strategyId" value={dashboard.strategy.id} />
          <label htmlFor="month-feedback">Approval note</label>
          <textarea id="month-feedback" name="feedback" placeholder="Optional context for the audit trail" />
          <button type="submit" className="button button-primary">Approve month boundary</button>
        </form>
      </section>
    </>
  );
}
