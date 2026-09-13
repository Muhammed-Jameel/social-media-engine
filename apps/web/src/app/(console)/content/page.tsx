import { Filter, Search } from "lucide-react";
import { getRepository } from "@social-media-plugin/db/runtime";
import { ContentCard } from "@/components/content-card";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/panel";

export const metadata = { title: "Content library" };

export default async function ContentPage({ searchParams }: { searchParams: Promise<{ status?: string; platform?: string; lifecycle?: string }> }) {
  const { status, platform, lifecycle: requestedLifecycle } = await searchParams;
  const lifecycle = requestedLifecycle === "superseded" || requestedLifecycle === "all" ? requestedLifecycle : "active";
  const content = await (await getRepository()).listContent({
    month: "2026-09",
    lifecycle,
    ...(status ? { status } : {}),
    ...(platform ? { platform } : {}),
  });
  return (
    <>
      <PageHeader eyebrow="Content library" title="Every artifact. Every decision." description={lifecycle === "active" ? "The current September plan: the same 20 items shown in Plan, with truthful production gates and review evidence." : "Historical source items are read-only. They remain available as evidence but cannot be approved or returned to the active queue."} />
      <form className="filter-bar" method="get">
        <span className="filter-icon"><Filter size={16} /></span>
        <label><span>Status</span><select name="status" defaultValue={status ?? ""}><option value="">All statuses</option><option value="NEEDS_REVIEW">Needs review</option><option value="APPROVED">Approved</option><option value="REVISION_REQUESTED">Revision requested</option><option value="BLOCKED">Blocked</option></select></label>
        <label><span>Platform</span><select name="platform" defaultValue={platform ?? ""}><option value="">All platforms</option><option value="instagram">Instagram</option><option value="facebook">Facebook</option><option value="tiktok">TikTok</option><option value="x">X (Twitter)</option><option value="linkedin">LinkedIn</option></select></label>
        <label><span>Library</span><select name="lifecycle" defaultValue={lifecycle}><option value="active">Current plan</option><option value="superseded">Historical</option><option value="all">Current + historical</option></select></label>
        <button className="button" type="submit"><Search size={15} /> Apply filters</button>
        <p>{content.length} result{content.length === 1 ? "" : "s"}</p>
      </form>
      {content.length ? <div className="content-grid">{content.map((item, index) => <ContentCard key={item.id} item={item} eager={index === 0} />)}</div> : <div className="panel"><EmptyState title="No content matches" body="Clear or change the filters to return to the September library." /></div>}
    </>
  );
}
