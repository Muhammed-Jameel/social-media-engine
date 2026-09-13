import { SocialOperationsPanel } from "@/components/social-operations-panel";
import { randomUUID } from "node:crypto";
import Link from "next/link";
import { AlertTriangle, CalendarClock, CheckCircle2, ExternalLink, Layers3, PlugZap } from "lucide-react";
import { getDatabase, getRepository, listPostizBatches } from "@aurendor/db/runtime";
import { currentPackage, loadProductionJob } from "@aurendor/engine";
import { PageHeader } from "@/components/page-header";
import { EmptyState, Panel } from "@/components/panel";
import { PublishSubmitButton } from "@/components/publish-submit-button";
import { StatusBadge } from "@/components/status-badge";
import { isDemoMode } from "@/lib/auth";
import { formatDateTime, humanize } from "@/lib/format";
import { getPostizRuntimeState } from "@/lib/postiz-publishing";
import { dispatchToPostizAction } from "./actions";

const platforms = ["instagram", "facebook", "linkedin", "tiktok", "x"] as const;

export default async function PublishingPage({ searchParams }: { searchParams: Promise<{ content?: string; result?: string; batch?: string; error?: string }> }) {
  const query = await searchParams;
  const repository = await getRepository();
  const [runtime, content, history, settings] = await Promise.all([
    getPostizRuntimeState(),
    repository.listContent({ month: "2026-09" }),
    listPostizBatches(await getDatabase()),
    repository.getSettings(),
  ]);
  const eligible = content.filter((item) => ["APPROVED", "SCHEDULED"].includes(item.status) && !item.supersededAt);
  const selectedSummary = eligible.find((item) => item.id === query.content) ?? eligible[0] ?? null;
  const selected = selectedSummary ? await repository.getContentDetail(selectedSummary.id) : null;
  const job = selected ? await loadProductionJob(await getDatabase(), selected.id) : null;
  const pkg = job?.stage === "APPROVED" ? currentPackage(job) : null;
  const copy = new Map(pkg?.variants.map(v => [v.platform, v.entries[0]!.caption]) ?? []);
  const assetCount = pkg?.variants.reduce((sum, v) => sum + v.entries.flatMap(e => e.assets).length, 0) ?? 0;
  const liveEnabled = !isDemoMode() && !settings.dryRun && settings.productionPublishingEnabled && !settings.paused;
  const scheduleDefault = pkg?.scheduledAt ?? "";

  return (
    <>
      <PageHeader
        eyebrow="Postiz publishing bridge"
        title="Publish once. Adapt everywhere."
        description="A supervised publishing surface for the five active AURENDOR channels. Postiz handles provider connections; Content OS preserves approval, exact assets, audit history, and duplicate protection."
        actions={<a className="button button-secondary" href={runtime.frontendUrl} target="_blank" rel="noreferrer"><ExternalLink size={16} /> Open Postiz</a>}
      />

      <SocialOperationsPanel liveEnabled={liveEnabled} />

      {query.result ? <div className="result-banner" role="status"><CheckCircle2 size={17} /><div><strong>Package acknowledged by Postiz.</strong><span>{query.result === "draft" ? "The package was saved as a Postiz draft." : query.result === "schedule" ? "The selected channels are scheduled." : "Postiz accepted the immediate publishing request."}</span></div></div> : null}
      {query.error ? <div className="hard-fail-banner" role="alert"><AlertTriangle size={18} /><div><strong>Postiz did not accept the package.</strong><span>{query.error}</span></div></div> : null}

      <div className="publishing-readiness-grid">
        <div className="metric-card"><PlugZap size={19} /><span>Postiz API</span><strong>{runtime.configured && runtime.connected ? "Connected" : runtime.configured ? "Needs attention" : "Not configured"}</strong></div>
        <div className="metric-card"><Layers3 size={19} /><span>Social channels</span><strong>{runtime.integrations.length}/5 connected</strong></div>
        <div className="metric-card"><CalendarClock size={19} /><span>Live dispatch</span><strong>{liveEnabled ? "Enabled" : "Safely gated"}</strong></div>
      </div>

      {!runtime.configured ? (
        <Panel title="Finish the Postiz bridge" description="The self-hosted service can run before social credentials are added.">
          <ol className="setup-steps">
            <li><span>1</span><div><strong>Start Postiz</strong><code>pnpm postiz:up</code></div></li>
            <li><span>2</span><div><strong>Create the single administrator account</strong><small>Open Postiz, then create an API key under Settings → Developers → Public API.</small></div></li>
            <li><span>3</span><div><strong>Connect Content OS</strong><small>Add POSTIZ_API_URL and POSTIZ_API_KEY to the Content OS environment.</small></div></li>
          </ol>
        </Panel>
      ) : runtime.error ? <div className="inline-alert"><AlertTriangle size={16} />{runtime.error}</div> : null}

      <div className="review-layout publishing-layout">
        <div className="review-main">
          <Panel title="Approved content" description={`${eligible.length} item${eligible.length === 1 ? "" : "s"} currently eligible for Postiz.`}>
            {eligible.length ? <div className="publishing-content-list">{eligible.map((item) => <Link key={item.id} href={`/publishing?content=${encodeURIComponent(item.id)}`} className={item.id === selected?.id ? "publishing-content-row is-active" : "publishing-content-row"}><div><strong>{item.externalKey}</strong><span>{item.title}</span></div><StatusBadge value={item.status} /></Link>)}</div> : <EmptyState title="Nothing is approved yet" body="Approve an exact content package before sending it to Postiz." />}
          </Panel>

          <Panel title="Publication history" description="Provider acknowledgements are recorded; ambiguous requests are never retried automatically.">
            {history.length ? <div className="publication-history">{history.map((entry) => <article key={entry.id}><div><StatusBadge value={entry.state} /><strong>{entry.externalKey} · {entry.title}</strong></div><span>{humanize(entry.mode)} · {entry.platforms.map(humanize).join(", ")} · {formatDateTime(entry.createdAt)}</span>{entry.lastError ? <small>{entry.lastError}</small> : null}</article>)}</div> : <EmptyState title="No Postiz batches yet" body="The first draft, schedule, or immediate publish will appear here." />}
          </Panel>
        </div>

        <aside className="review-side">
          <Panel title="Exact Postiz package" description={selected ? `${selected.externalKey} · ${assetCount} feed asset${assetCount === 1 ? "" : "s"}` : "Select approved content first."} className="decision-panel">
            {selected && pkg ? <form action={dispatchToPostizAction} className="review-form publishing-form">
              <input type="hidden" name="contentItemId" value={selected.id} />
              <input type="hidden" name="nonce" value={randomUUID()} />

              <fieldset><legend>Connected channels</legend><div className="channel-picker">{runtime.integrations.length ? runtime.integrations.map((integration) => <label key={integration.id}><input type="checkbox" name="integrationId" value={integration.id} defaultChecked={selected.platforms.includes(integration.platform)} /><span><strong>{integration.name}</strong><small>{humanize(integration.platform)}{integration.platform === "tiktok" ? " · manual completion" : ""}</small></span></label>) : <small>No supported Postiz channels are connected yet.</small>}</div></fieldset>

              <label className="field-label">Delivery<select name="mode" defaultValue="draft"><option value="draft">Save all five as Postiz drafts</option><option value="schedule" disabled={!liveEnabled}>Schedule all five together</option></select></label>
              <input type="hidden" name="scheduledAt" value={scheduleDefault} /><p>Shared approved time: {formatDateTime(scheduleDefault)} · Baghdad. <Link href={`/production?id=${encodeURIComponent(selected.id)}`}>Review exact platform assets and thread entries</Link></p>

              {platforms.map((platform) => <label className="field-label" key={platform}>{humanize(platform)} approved caption<textarea name={`caption_${platform}`} defaultValue={copy.get(platform) ?? ""} dir="auto" rows={7} readOnly /></label>)}

              <div className="decision-warning"><AlertTriangle size={15} /><span>{liveEnabled ? "This sends the exact captions and ordered asset hashes to the selected channels. Choose Draft while reviewing." : "Live publishing is gated. Draft sync remains available after Postiz is connected."}</span></div>
              <label className="publish-confirmation"><input type="checkbox" name="confirmation" value="confirmed" required /><span>I confirm these exact channels, captions, assets, and timing.</span></label>
              <PublishSubmitButton />
            </form> : <><EmptyState title="Five-platform review required" body="Legacy single-media approvals cannot schedule the new all-platform batch. Complete the Production workflow and approve its exact five variants first." /><Link href="/production">Open Production review</Link></>}
          </Panel>
        </aside>
      </div>
    </>
  );
}
