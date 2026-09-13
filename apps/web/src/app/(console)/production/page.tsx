import Image from "next/image";
import Link from "next/link";
import { getDatabase } from "@social-media-plugin/db/runtime";
import { canonicalSha256, currentPackage, listProductionJobs } from "@social-media-plugin/engine";
import { PageHeader } from "@/components/page-header";
import { EmptyState, Panel } from "@/components/panel";
import { requireOwner } from "@/lib/auth";
import { reviewProductionAction } from "./actions";

export default async function ProductionPage({ searchParams }: { searchParams: Promise<{ id?: string; result?: string }> }) {
  await requireOwner();
  const query = await searchParams;
  const jobs = await listProductionJobs(await getDatabase());
  const ready = jobs.filter(j => ["OWNER_REVIEW", "APPROVED"].includes(j.stage));
  const selected = ready.find(j => j.id === query.id) ?? ready[0];
  const pkg = selected ? currentPackage(selected) : null;
  const preview = (a: NonNullable<typeof pkg>["stories"][number]["asset"]) => {
    const url = a.sourcePath.replace("apps/web/public", "");
    return <figure key={a.id}>{a.mimeType === "video/mp4" ? <video controls preload="metadata" src={url} aria-label={a.altText} style={{ maxWidth: "100%", maxHeight: 600 }} /> : <Image src={url} alt={a.altText} width={a.width} height={a.height} style={{ width: "100%", height: "auto", maxWidth: 540 }} />}<figcaption>{a.width}×{a.height} · {a.visualSubject} · <code>{a.sha256.slice(0, 12)}</code></figcaption></figure>;
  };
  return <>
    <PageHeader eyebrow="Automatic production · final owner review" title="Five versions. One decision." description="Ideas, copy, assets and independent critique run before this inbox. Review the exact native versions; approval can schedule the five feed variants together. TikTok and interactive Stories retain clearly labeled native handoffs." />
    {query.result ? <p role="status" className="inline-alert">{query.result}</p> : null}
    <Panel title="Ready for your decision" description={`${ready.length} complete packages · ${jobs.length - ready.length} still in production or blocked`}>
      {ready.length ? ready.map(j => <p key={j.id}><Link href={`/production?id=${encodeURIComponent(j.id)}`}>{j.slot.title}</Link> · {j.stage}</p>) : <EmptyState title="No final packages yet" body="The automation must finish every evaluation gate before requesting your review. Existing September creative is preserved and is not silently approved for new platform formats." />}
    </Panel>
    {pkg && selected ? <>
      <Panel title={selected.slot.title} description={`Shared schedule: ${new Date(pkg.scheduledAt).toLocaleString("en-GB", { timeZone: "Asia/Baghdad" })} · Baghdad (UTC+3)`}>
        {pkg.variants.map(v => <section key={v.platform}><h2>{v.platform} · {v.format}</h2><p>Approved account ID: <code>{v.accountId}</code></p><p>{v.adaptationRationale}</p>{v.entries.map((e, i) => <article key={i}><p dir="auto" style={{ whiteSpace: "pre-wrap", lineHeight: 1.65 }}>{e.caption}</p><div className="asset-grid">{e.assets.map(preview)}</div></article>)}</section>)}
      </Panel>
      <Panel title="Supporting Stories" description="Reviewed backgrounds and prompts; native stickers and links are a separate manual handoff, not included in the five feed dispatches.">
        {pkg.stories.map((s, i) => <article key={i}>{preview(s.asset)}<p dir="auto">{s.engagementPrompt}</p><p dir="auto">{s.returnToPostCTA}</p><p>{s.platform} · {s.nativeStickerHandoff}</p></article>)}
      </Panel>
      <Panel title="Final owner decision" description="A rejection reason feeds the next copy/art-direction and design review cycle. Any revision removes the previous approval.">
        <form action={reviewProductionAction} className="review-form">
          <input type="hidden" name="id" value={selected.id} /><input type="hidden" name="packageHash" value={canonicalSha256(pkg)} />
          <label className="field-label">Decision<select name="decision"><option value="APPROVE">Approve package</option><option value="REVISE">Reject and revise using my reason</option></select></label>
          <label className="field-label">Feedback<textarea name="feedback" placeholder="Required when rejecting: what should change?" /></label>
          <label><input type="checkbox" name="schedule" value="yes" defaultChecked /> Schedule all five feed variants after approval, if publishing gates are enabled.</label>
          <label><input type="checkbox" name="confirm" value="yes" /> I reviewed the five versions, captions, media order and shared time. TikTok requires in-app completion; interactive Stories are a native handoff.</label>
          <button className="button button-primary" type="submit">Record decision</button>
        </form>
        {selected.feedback.length ? <details><summary>Revision history</summary>{selected.feedback.map((f, i) => <p key={i}>{f}</p>)}</details> : null}
      </Panel>
    </> : null}
    <details><summary>Production stages and blockers</summary>{jobs.map(j => <p key={j.id}>{j.slot.title} · {j.stage} · revision {j.revision}{j.stage === "BLOCKED" ? ` · ${j.feedback.slice(-3).join("; ")}` : ""}</p>)}</details>
  </>;
}
