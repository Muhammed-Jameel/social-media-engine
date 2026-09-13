import Link from "next/link";
import { ExternalLink, PlugZap, ShieldQuestion } from "lucide-react";
import { getRepository } from "@aurendor/db/runtime";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime, humanize } from "@/lib/format";
import { getPostizRuntimeState } from "@/lib/postiz-publishing";

export const metadata = { title: "Provider capabilities" };

export default async function ProvidersPage() {
  const [capabilities, postiz] = await Promise.all([(await getRepository()).listProviderCapabilities(), getPostizRuntimeState()]);
  const grouped = capabilities.reduce<Record<string, typeof capabilities>>((result, capability) => {
    (result[capability.provider] ??= []).push(capability);
    return result;
  }, {});
  return (
    <>
      <PageHeader eyebrow="Provider control plane" title="A connection is not a capability." description="The engine records what each provider can safely do, why, and when that evidence was last verified. Missing credentials never become inferred permission." />
      <Panel title="Self-hosted Postiz" description="The single publishing gateway for Instagram, Facebook, LinkedIn, TikTok, and X.">
        <div className="postiz-provider-overview">
          <div><StatusBadge value={postiz.connected ? "AVAILABLE" : postiz.configured ? "UNAVAILABLE_PERMISSION" : "NOT_CONFIGURED"} /><strong>{postiz.connected ? `${postiz.integrations.length} supported channel${postiz.integrations.length === 1 ? "" : "s"} connected` : postiz.error || "Start Postiz and add its API key to Content OS."}</strong></div>
          <div className="page-actions"><a className="button button-secondary" href={postiz.frontendUrl} target="_blank" rel="noreferrer"><ExternalLink size={15} /> Open Postiz</a><Link className="button button-primary" href="/publishing">Publishing workspace</Link></div>
        </div>
        {postiz.integrations.length ? <div className="postiz-channel-strip">{postiz.integrations.map((integration) => <span key={integration.id}><PlugZap size={13} />{integration.name}<small>{humanize(integration.platform)}</small></span>)}</div> : null}
      </Panel>
      <div className="provider-summary">
        <div><strong>{Object.keys(grouped).length}</strong><span>providers modeled</span></div>
        <div><strong>{capabilities.filter((item) => item.state === "AVAILABLE").length}</strong><span>available capabilities</span></div>
        <div><strong>{capabilities.filter((item) => item.state !== "AVAILABLE").length}</strong><span>constraints or setup actions</span></div>
      </div>
      <div className="provider-grid">
        {Object.entries(grouped).map(([provider, items]) => (
          <Panel key={provider} title={humanize(provider)} description={`${items.filter((item) => item.state === "AVAILABLE").length}/${items.length} capabilities available`} className="provider-card">
            <div className="capability-list">
              {items.map((item) => (
                <article className="capability-row" key={item.id}>
                  <div className="capability-icon">{item.state === "AVAILABLE" ? <PlugZap size={17} /> : <ShieldQuestion size={17} />}</div>
                  <div className="capability-copy"><div><strong>{humanize(item.capability)}</strong><StatusBadge value={item.state} /></div><p>{item.reason}</p><span>{item.verifiedAt ? `Verified ${formatDateTime(item.verifiedAt)}` : "Not yet verified against an account"}</span></div>
                  {item.sourceUrl ? <a className="table-open" href={item.sourceUrl} target="_blank" rel="noreferrer" aria-label={`Open source for ${item.capability}`}><ExternalLink size={15} /></a> : null}
                </article>
              ))}
            </div>
          </Panel>
        ))}
      </div>
      <div className="policy-note"><ShieldQuestion size={18} /><div><strong>TikTok Direct Post requires an audited provider app.</strong><span>Until TikTok approves the configured Postiz application, public visibility remains restricted. Content OS keeps Draft available while live dispatch stays gated.</span></div></div>
    </>
  );
}
