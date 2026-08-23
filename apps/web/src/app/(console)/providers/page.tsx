import { ExternalLink, PlugZap, ShieldQuestion } from "lucide-react";
import { getRepository } from "@aurendor/db/runtime";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime, humanize } from "@/lib/format";

export const metadata = { title: "Provider capabilities" };

export default async function ProvidersPage() {
  const capabilities = await (await getRepository()).listProviderCapabilities();
  const grouped = capabilities.reduce<Record<string, typeof capabilities>>((result, capability) => {
    (result[capability.provider] ??= []).push(capability);
    return result;
  }, {});
  return (
    <>
      <PageHeader eyebrow="Provider control plane" title="A connection is not a capability." description="The engine records what each provider can safely do, why, and when that evidence was last verified. Missing credentials never become inferred permission." />
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
      <div className="policy-note"><ShieldQuestion size={18} /><div><strong>TikTok is manual by policy.</strong><span>For an internal/private utility, Direct Post is not treated as an available production capability. The engine can prepare a draft and require owner handoff.</span></div></div>
    </>
  );
}
