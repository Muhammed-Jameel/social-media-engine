import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, CheckCircle2, FileCheck2, Fingerprint, MessageSquareQuote, ShieldX } from "lucide-react";
import { getRepository } from "@aurendor/db/runtime";
import { notFound } from "next/navigation";
import { reviewContentAction } from "@/app/actions";
import { PageHeader } from "@/components/page-header";
import { EmptyState, Panel } from "@/components/panel";
import { RiskBadge, StatusBadge } from "@/components/status-badge";
import { formatDateTime, humanize } from "@/lib/format";

const reasonOptions = [
  ["too_generic", "Too generic"], ["too_promotional", "Too promotional"], ["typography_poor", "Typography poor"],
  ["image_unsuitable", "Image unsuitable"], ["voice_wrong", "Voice wrong"], ["fact_wrong", "Fact wrong"],
  ["concept_weak", "Concept weak"], ["arabic_unnatural", "Arabic unnatural"], ["layout_busy", "Layout busy"],
  ["not_premium", "Not premium"], ["duplicate_idea", "Duplicate idea"], ["wrong_audience", "Wrong audience"], ["other", "Other"],
] as const;

export default async function ContentDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ result?: string }> }) {
  const { id } = await params;
  const { result } = await searchParams;
  const item = await (await getRepository()).getContentDetail(id);
  if (!item) notFound();
  const hasHardFail = item.critiques.some((critique) => critique.hardFails.length > 0) || item.qaFlags.length > 0;

  return (
    <>
      <Link href="/content" className="back-link"><ArrowLeft size={15} /> Content library</Link>
      <PageHeader
        eyebrow={`${item.externalKey} · ${formatDateTime(item.scheduledAt)}`}
        title={item.title}
        description={`${humanize(item.format)} for ${item.platforms.map(humanize).join(", ")}. This approval surface binds the strategic intent, copy, rendered files, QA evidence, and owner decision.`}
        actions={<><StatusBadge value={item.status} />{item.riskLevel !== "low" ? <RiskBadge value={item.riskLevel} /> : null}</>}
      />
      {result ? <div className="result-banner" role="status"><CheckCircle2 size={17} /><div><strong>Owner decision recorded.</strong><span>The item state, approval evidence, and audit history were updated together.</span></div></div> : null}

      {hasHardFail ? (
        <div className="hard-fail-banner" role="alert">
          <ShieldX size={19} />
          <div><strong>Approval must be deliberate.</strong><span>{item.qaFlags.length ? `${item.qaFlags.length} imported QA signal(s) remain unresolved.` : "A critic recorded a hard fail."} Bulk approval cannot clear this boundary.</span></div>
        </div>
      ) : null}

      <div className="review-layout">
        <div className="review-main">
          <Panel title="Creative evidence" description={`${item.assets.length} immutable rendered asset${item.assets.length === 1 ? "" : "s"} · ordered for publishing`}>
            {item.assets.length ? (
              <div className="asset-grid">
                {item.assets.map((asset) => (
                  <figure className="asset-frame" key={asset.id}>
                    <div className="asset-media">
                      {asset.publicUrl && asset.mimeType.startsWith("image/") ? (
                        <Image src={asset.publicUrl} alt={`Slide ${asset.sequence + 1} for ${item.title}`} fill sizes="(max-width: 680px) 90vw, (max-width: 1200px) 42vw, 320px" />
                      ) : asset.publicUrl && asset.mimeType.startsWith("video/") ? (
                        <video src={asset.publicUrl} controls preload="metadata" aria-label={`Video creative for ${item.title}`} />
                      ) : <div className="media-placeholder">Preview unavailable</div>}
                    </div>
                    <figcaption><span>Asset {asset.sequence + 1} · {asset.width}×{asset.height}</span><code>{asset.sha256.slice(0, 10)}…</code></figcaption>
                  </figure>
                ))}
              </div>
            ) : <EmptyState title="No rendered assets" body="The item cannot move to publishing until a hashed creative is attached." />}
          </Panel>

          <Panel title="Platform copy" description="Selected copy variants and accessibility text.">
            {item.copyVariants.length ? <div className="copy-stack">{item.copyVariants.map((copy) => (
              <article className="copy-variant" key={copy.id}>
                <header><div><StatusBadge value={copy.platform} label={humanize(copy.platform)} /><span>{humanize(copy.language)} · editorial {copy.editorialScore}/100</span></div><MessageSquareQuote size={17} /></header>
                <p className={copy.language === "ar" || /[\u0600-\u06FF]/.test(copy.caption) ? "copy-caption is-arabic" : "copy-caption"} dir={copy.language === "ar" || /[\u0600-\u06FF]/.test(copy.caption) ? "rtl" : "ltr"}>{copy.caption}</p>
                <div className="copy-meta"><strong>Alt text</strong><p>{copy.altText}</p>{copy.hashtags.length ? <p className="hashtags">{copy.hashtags.join(" ")}</p> : null}</div>
              </article>
            ))}</div> : <EmptyState title="Copy is not attached" body="Approval should remain withheld until platform-native copy and alt text are present." />}
          </Panel>

          <Panel title="Critique & provenance" description="Machine and human evidence, never hidden behind a score.">
            <div className="evidence-grid">
              <div className="evidence-card"><Fingerprint size={18} /><div><strong>Asset identity</strong><span>{item.assets.length} SHA-256 hash{item.assets.length === 1 ? "" : "es"} recorded</span></div></div>
              <div className="evidence-card"><FileCheck2 size={18} /><div><strong>Import source</strong><span>{item.sourcePath ? "Canonical September package" : "Generated in engine"}</span></div></div>
            </div>
            {item.critiques.length ? <div className="critique-list">{item.critiques.map((critique) => (
              <article key={critique.id} className="critique-row">
                <div><StatusBadge value={critique.decision} /><strong>{humanize(critique.critic)}</strong><span>{critique.total}/100</span></div>
                {critique.hardFails.length ? <p className="hard-fail-copy"><AlertTriangle size={14} /> {critique.hardFails.join(" · ")}</p> : null}
                {critique.weaknesses.length ? <p>{critique.weaknesses.join(" · ")}</p> : null}
              </article>
            ))}</div> : <p className="inline-note">Imported legacy work has no complete multi-critic record. Its Needs review state is intentional.</p>}
          </Panel>
        </div>

        <aside className="review-side">
          <Panel title="Strategic contract" description="What this item must accomplish.">
            <dl className="definition-list">
              <div><dt>Audience</dt><dd>{item.audience || "Needs definition"}</dd></div>
              <div><dt>Funnel</dt><dd>{humanize(item.funnelStage)}</dd></div>
              <div><dt>Pillar</dt><dd>{item.contentPillar || "Needs definition"}</dd></div>
              <div><dt>Objective</dt><dd>{item.strategicObjective}</dd></div>
              <div><dt>Tension</dt><dd>{item.tension}</dd></div>
              <div><dt>Key message</dt><dd>{item.keyMessage}</dd></div>
              <div><dt>Creative hypothesis</dt><dd>{item.creativeHypothesis}</dd></div>
              <div><dt>CTA</dt><dd>{item.cta}</dd></div>
            </dl>
          </Panel>

          <Panel title="Owner decision" description="Every action is durable and written to the audit trail." className="decision-panel">
            <form action={reviewContentAction} className="review-form">
              <input type="hidden" name="contentItemId" value={item.id} />
              <label className="field-label">Decision<select name="decision" defaultValue="APPROVE" required><option value="APPROVE">Approve this item</option><option value="REQUEST_REVISION">Request revision</option><option value="REJECT">Reject and block</option><option value="DISABLE">Disable item</option></select></label>
              <fieldset><legend>Reason signals</legend><div className="reason-grid">{reasonOptions.map(([value, label]) => <label key={value}><input type="checkbox" name="reasonCodes" value={value} /><span>{label}</span></label>)}</div></fieldset>
              <label className="field-label">Audit note<textarea name="feedback" placeholder="What should the system preserve or change?" /></label>
              <div className="decision-warning"><AlertTriangle size={15} /><span>Approval confirms this exact copy and the listed asset hashes. Material changes require a new decision.</span></div>
              <button type="submit" className="button button-primary button-wide"><CheckCircle2 size={16} /> Record decision</button>
            </form>
          </Panel>

          <Panel title="Decision history" description="Newest decision first.">
            {item.approvals.length ? <ol className="history-list">{item.approvals.map((approval) => <li key={approval.id}><span /><div><StatusBadge value={approval.decision} /><p>{approval.feedback || "No additional note."}</p><time>{formatDateTime(approval.decidedAt)}</time></div></li>)}</ol> : <EmptyState title="Awaiting owner" body="No durable approval exists for this artifact." />}
          </Panel>
        </aside>
      </div>
    </>
  );
}
