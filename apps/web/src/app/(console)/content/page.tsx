import { Filter, Search } from "lucide-react";
import { getRepository } from "@aurendor/db/runtime";
import { ContentCard } from "@/components/content-card";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/panel";

export const metadata = { title: "Content library" };

export default async function ContentPage({ searchParams }: { searchParams: Promise<{ status?: string; platform?: string }> }) {
  const { status, platform } = await searchParams;
  const content = await (await getRepository()).listContent({
    month: "2026-09",
    ...(status ? { status } : {}),
    ...(platform ? { platform } : {}),
  });
  return (
    <>
      <PageHeader eyebrow="Content library" title="Every artifact. Every decision." description="Inspect the strategy, copy, assets, critique evidence, and approval history behind each scheduled item." />
      <form className="filter-bar" method="get">
        <span className="filter-icon"><Filter size={16} /></span>
        <label><span>Status</span><select name="status" defaultValue={status ?? ""}><option value="">All statuses</option><option value="NEEDS_REVIEW">Needs review</option><option value="APPROVED">Approved</option><option value="REVISION_REQUESTED">Revision requested</option><option value="BLOCKED">Blocked</option></select></label>
        <label><span>Platform</span><select name="platform" defaultValue={platform ?? ""}><option value="">All platforms</option><option value="instagram">Instagram</option><option value="facebook">Facebook</option><option value="linkedin">LinkedIn</option><option value="tiktok">TikTok</option></select></label>
        <button className="button" type="submit"><Search size={15} /> Apply filters</button>
        <p>{content.length} result{content.length === 1 ? "" : "s"}</p>
      </form>
      {content.length ? <div className="content-grid">{content.map((item, index) => <ContentCard key={item.id} item={item} eager={index === 0} />)}</div> : <div className="panel"><EmptyState title="No content matches" body="Clear or change the filters to return to the September library." /></div>}
    </>
  );
}
