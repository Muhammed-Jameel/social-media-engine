import Link from "next/link";
import { AlertTriangle, ArrowRight, BookOpenCheck, CheckCircle2, PlayCircle, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";

const screens = [
  ["Command", "Your home screen: month status, the nearest review work, provider limitations, learning signals, and alerts."],
  ["Plan", "The active Month 1 campaign: strategy, 20 scheduled releases, produced files or planning covers, copy, CTA, Stories, evidence, and production state."],
  ["Content", "The current SEP-* review queue, with a separate read-only Historical filter for superseded imported work."],
  ["Analytics", "A learning view for reach and format cohorts. It is currently synthetic demonstration data, not proof of AURENDOR performance."],
  ["Runs", "The durable workflow ledger. Use it to see which process ran, its current step, status, creation time, and trace identifier."],
  ["Providers", "A capability matrix. Connected does not automatically mean publishing is available; read the state and reason for each action."],
  ["Controls", "Safety controls for pausing the engine, interpreting a bounded owner command, and viewing the publication authorization chain."],
  ["Setup", "Configuration presence and local-start guidance. It never displays secret values in the browser."],
  ["Guide", "This page: the operating sequence, status meanings, revision workflow, commands, and current boundaries."],
] as const;

const statuses = [
  ["In review / Needs review", "No final owner approval exists. Inspect the creative, copy, evidence, risk, and CTA."],
  ["Approved", "The recorded decision applies only to the exact copy and asset hashes that were reviewed."],
  ["High risk", "Requires a separate item decision. Month approval cannot silently clear it."],
  ["Hard fail", "A blocking QA or critique issue exists. Revise and re-render before approval."],
  ["Paused / Frozen", "Workers or production design work cannot advance through the protected gate."],
  ["Synthetic", "Demonstration analytics only. Do not use them as an external performance claim."],
] as const;

export const metadata = { title: "Dashboard guide" };

export default function DashboardGuidePage() {
  return (
    <>
      <PageHeader
        eyebrow="Owner handbook"
        title="Use the dashboard with confidence."
        description="A simple guide to reviewing Month 1, recording decisions, understanding every screen, and keeping publication under owner control."
        actions={<Link href="/plans/2026-09" className="button button-primary"><BookOpenCheck size={16} /> Open Month 1</Link>}
      />

      <div className="guide-callout">
        <ShieldCheck size={20} />
        <div><strong>Safe current posture</strong><span>The dashboard is running in dry-run mode. Publishing is disabled, creative production is frozen at its release gate, and analytics are synthetic.</span></div>
      </div>

      <Panel title="The shortest correct workflow" description="Use this sequence whenever you review the month.">
        <ol className="guide-steps">
          <li><span>01</span><div><strong>Open Plan</strong><p>Read the strategy and creative-mix summary before judging individual posts.</p></div></li>
          <li><span>02</span><div><strong>Review SEP-01 through SEP-20 in order</strong><p>Check the visual first, then open “الخطة الكاملة” for caption, CTA, visual direction, slide structure, evidence boundary, and KPI.</p></div></li>
          <li><span>03</span><div><strong>Request changes by post key</strong><p>Use the visible key—for example SEP-08—and state exactly what should change: concept, Arabic copy, image, hierarchy, CTA, evidence, or format.</p></div></li>
          <li><span>04</span><div><strong>Use Content for formal item decisions</strong><p>Open the same current SEP-* item to inspect every hashed asset, then approve, request revision, reject, or disable it with an audit note.</p></div></li>
          <li><span>05</span><div><strong>Check Controls before any execution</strong><p>Confirm the engine posture and release gates. Month approval never grants an agent permission to publish.</p></div></li>
          <li><span>06</span><div><strong>Use Runs and Analytics after execution</strong><p>Runs explain workflow state. Analytics support learning only after real authenticated metrics replace the synthetic demo.</p></div></li>
        </ol>
      </Panel>

      <div className="guide-grid">
        <Panel title="What every screen does" description="The navigation map in plain language.">
          <div className="guide-screen-list">
            {screens.map(([name, description]) => <article key={name}><strong>{name}</strong><p>{description}</p></article>)}
          </div>
        </Panel>
        <Panel title="What the statuses mean" description="Read the state before taking action.">
          <div className="guide-status-list">
            {statuses.map(([name, description]) => <article key={name}><CheckCircle2 size={15} /><div><strong>{name}</strong><p>{description}</p></div></article>)}
          </div>
        </Panel>
      </div>

      <Panel title="How Month 1 is organized" description="The campaign is balanced by both publishing format and visual language.">
        <div className="guide-month-grid">
          <article><strong>20</strong><span>scheduled releases</span><p>Three launch announcements publish on day one; the service, Bunyan Pro, and value cycle follows.</p></article>
          <article><strong>14 / 6</strong><span>carousel / reel</span><p>All three launch announcements are carousels; six later reels remain provider-gated.</p></article>
          <article><strong>18 + 6</strong><span>launch assets</span><p>Eighteen finished feed slides and six supporting Story frames are ready for owner review.</p></article>
          <article><strong>40</strong><span>Story frames planned</span><p>Every feed post has one interaction before publishing and one Story that returns viewers to the post.</p></article>
        </div>
      </Panel>

      <div className="guide-grid guide-grid-spaced">
        <Panel title="Run it locally" description="Use the pinned Node version to avoid the pnpm compatibility error.">
          <div className="guide-code-block">
            <PlayCircle size={18} />
            <pre><code>{`cd /Users/muhammedjameel/Documents/AURENDOR/apps/social-media-engine-plugin
nvm install
nvm use
pnpm install
pnpm dev`}</code></pre>
          </div>
          <p className="guide-footnote">Open <a href="http://localhost:3000">localhost:3000</a>. Stop the server with <code>Ctrl+C</code>. Start <code>pnpm worker</code> in a second terminal only when you intentionally want queued workflow steps to advance.</p>
        </Panel>
        <Panel title="Current boundaries" description="What the dashboard does not claim yet.">
          <ul className="guide-boundaries">
            <li><AlertTriangle size={15} /><span>No verified live social-provider publishing adapter is enabled.</span></li>
            <li><AlertTriangle size={15} /><span>SEP-01 through SEP-03 have complete launch-day assets; later cards remain production plans.</span></li>
            <li><AlertTriangle size={15} /><span>Plan and Content show the same active records; historical imports are read only.</span></li>
            <li><AlertTriangle size={15} /><span>Analytics remain synthetic until authenticated provider collection is implemented and verified.</span></li>
            <li><AlertTriangle size={15} /><span>Any changed caption or rendered asset requires a fresh review because approval binds exact hashes.</span></li>
          </ul>
        </Panel>
      </div>

      <section className="guide-next">
        <div><p className="eyebrow eyebrow-pale">Recommended next action</p><h2>Review the three launch-day carousels.</h2><p>Open SEP-01, SEP-02, and SEP-03 in Content to inspect all 24 hashed slides and Story frames before recording a decision.</p></div>
        <Link href="/plans/2026-09" className="button">Start Month 1 review <ArrowRight size={15} /></Link>
      </section>
    </>
  );
}
