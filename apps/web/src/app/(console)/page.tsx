import Link from "next/link";
import { ArrowRight, CalendarCheck2, ChevronRight, Lightbulb, ShieldAlert } from "lucide-react";
import { getRepository } from "@social-media-plugin/db/runtime";
import { ContentCard } from "@/components/content-card";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { EmptyState, Panel } from "@/components/panel";
import { StatusBadge } from "@/components/status-badge";

export default async function DashboardPage() {
  const dashboard = await (await getRepository()).getDashboard();
  const completion = dashboard.strategy.itemCount ? Math.round((dashboard.strategy.approvedCount / dashboard.strategy.itemCount) * 100) : 0;

  return (
    <>
      <PageHeader
        eyebrow="Owner command"
        title="The month, under control."
        description="A single operational view of strategy approval, creative risk, provider capability, and what needs your decision next."
        actions={<Link href="/plans/2026-09" className="button button-primary"><CalendarCheck2 size={16} /> Review September plan</Link>}
      />

      <div className="metric-grid">
        <MetricCard label="September system" value={`${dashboard.counts.content}`} note="imported content items" accent />
        <MetricCard label="Approval coverage" value={`${completion}%`} note={`${dashboard.counts.approved} owner-approved`} />
        <MetricCard label="High-risk review" value={`${dashboard.counts.highRisk}`} note="cannot inherit month approval" />
        <MetricCard label="Provider constraints" value={`${dashboard.counts.providerActions}`} note="capabilities need action" />
      </div>

      <div className="dashboard-grid">
        <Panel title="Decision queue" description="Closest scheduled work appears first." action={<Link className="text-link" href="/content">All content <ArrowRight size={14} /></Link>}>
          <div className="compact-content-list">
            {dashboard.upcoming.length ? dashboard.upcoming.slice(0, 5).map((item, index) => <ContentCard key={item.id} item={item} compact eager={index === 0} />) : <EmptyState title="Queue is clear" body="New generated work will appear here after QA." />}
          </div>
        </Panel>

        <div className="dashboard-side">
          <Panel title="Strategy gate" description="September 2026 · Month-level intent">
            <div className="strategy-gate">
              <div className="strategy-gate-top"><StatusBadge value={dashboard.strategy.status} /><span>{dashboard.strategy.approvedCount}/{dashboard.strategy.itemCount} items</span></div>
              <h3>{dashboard.strategy.objective}</h3>
              <div className="progress-track" aria-label={`${completion}% approved`}><span style={{ width: `${completion}%` }} /></div>
              <p>{dashboard.strategy.needsReviewCount} items still require an explicit decision. High-risk content remains isolated from bulk approval.</p>
              <Link className="button" href="/plans/2026-09">Open approval gate <ChevronRight size={15} /></Link>
            </div>
          </Panel>

          <Panel title="Provider posture" description="Capabilities, not connection optimism.">
            <div className="provider-mini-list">
              {dashboard.providers.slice(0, 5).map((provider) => (
                <Link href="/providers" key={provider.id} className="provider-mini-row">
                  <span><strong>{provider.provider}</strong><small>{provider.capability}</small></span>
                  <StatusBadge value={provider.state} />
                </Link>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      <div className="lower-grid">
        <Panel title="Learning signal" description="Evidence is labeled before it becomes strategy.">
          <div className="insight-list">
            {dashboard.insights.length ? dashboard.insights.slice(0, 3).map((insight) => (
              <article key={insight.id} className="insight-row">
                <span className="insight-icon"><Lightbulb size={16} /></span>
                <div><p className="meta-line">{insight.kind} · {insight.confidenceNote}</p><h3>{insight.statement}</h3><p>{insight.nextAction}</p></div>
              </article>
            )) : <EmptyState title="No learned signal yet" body="Insights appear after comparable content has enough evidence." />}
          </div>
        </Panel>
        <Panel title="Attention" description="System messages that deserve owner awareness." className="attention-panel">
          <div id="notifications" className="notification-list">
            {dashboard.notifications.length ? dashboard.notifications.slice(0, 4).map((notice) => (
              <article key={notice.id} className="notice-row">
                <ShieldAlert size={16} />
                <div><h3>{notice.title}</h3><p>{notice.body}</p>{notice.actionUrl ? <Link href={notice.actionUrl} className="text-link">Review</Link> : null}</div>
              </article>
            )) : <EmptyState title="No active alerts" body="Provider, approval, and workflow exceptions will be surfaced here." />}
          </div>
        </Panel>
      </div>
    </>
  );
}
