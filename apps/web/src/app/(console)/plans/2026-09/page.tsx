import { readSeptemberEditorialPlan, SeptemberEditorialPlan } from "@/components/september-editorial-plan";
import Image from "next/image";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  Film,
  Images,
  LockKeyhole,
  MessageSquareText,
  ShieldCheck,
} from "lucide-react";
import { getRepository } from "@social-media-plugin/db/runtime";
import { approveMonthAction } from "@/app/actions";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { StatusBadge } from "@/components/status-badge";
import { formatDate, humanize } from "@/lib/format";
import {
  finalCaption,
  septemberCreativePosts,
  type SeptemberContentTrack,
} from "@/lib/september-creative-plan";

const creativeModes = [
  { value: "product_ui", label: "واجهات حقيقية" },
  { value: "workflow_diagram", label: "مخططات عمل" },
  { value: "typographic", label: "طباعي" },
  { value: "object_led", label: "أشياء ومجاز" },
  { value: "data_evidence", label: "أدلة وفحص" },
  { value: "mixed_media", label: "وسائط مختلطة" },
] as const;

const trackLabels: Record<SeptemberContentTrack, string> = {
  brand_intro: "تعريف أورندور",
  ai_automation_service: "خدمات الذكاء والأتمتة",
  bunyan_pro: "Bunyan Pro",
  value_first: "فائدة مستقلة",
};

const productionLabels = {
  PLAN_COVER_ONLY: "غلاف تخطيط فقط",
  HIGGSFIELD_AUTH_REQUIRED: "بانتظار اتصال Higgsfield",
  READY_FOR_ASSET_PRODUCTION: "جاهز للإنتاج",
  READY_FOR_OWNER_REVIEW: "جاهز لمراجعة المالك",
} as const;

export const metadata = { title: "September plan" };

export default async function SeptemberPlanPage({ searchParams }: { searchParams: Promise<{ result?: string }> }) {
  const editorial = await readSeptemberEditorialPlan();
  if (editorial) return <SeptemberEditorialPlan plan={editorial} />;
  const { result } = await searchParams;
  const repository = await getRepository();
  const [dashboard, content] = await Promise.all([
    repository.getDashboard(),
    repository.listContent({ month: "2026-09", lifecycle: "active" }),
  ]);
  const currentByKey = new Map(content.map((item) => [item.externalKey, item]));
  const rebuildDrafts: Array<{ id: string; date: string; title: string; assets: Array<{ path: string }> }> = JSON.parse(
    await readFile(join(process.cwd(), "public/monthly-plan/2026-09/rebuild/manifest.json"), "utf8"),
  );
  const carouselCount = septemberCreativePosts.filter((post) => post.format === "carousel").length;
  const reelCount = septemberCreativePosts.filter((post) => post.format === "reel").length;
  const storyFrameCount = septemberCreativePosts.reduce((total, post) => total + post.supportingStories.length, 0);
  const trackCounts = {
    brand_intro: septemberCreativePosts.filter((post) => post.contentTrack === "brand_intro").length,
    ai_automation_service: septemberCreativePosts.filter((post) => post.contentTrack === "ai_automation_service").length,
    bunyan_pro: septemberCreativePosts.filter((post) => post.contentTrack === "bunyan_pro").length,
    value_first: septemberCreativePosts.filter((post) => post.contentTrack === "value_first").length,
  };

  return (
    <>
      <PageHeader
        eyebrow="11–30 September 2026 · Revised creative review"
        title="خطة سبتمبر: فائدة عملية وأنظمة حقيقية"
        description="عشرة منشورات جديدة للمراجعة: ثمانية كاروسيلات وفيلمان، مع النصوص والقصص الداعمة. الخطة السابقة محفوظة أدناه للمقارنة."
        contentLang="ar"
        contentDir="rtl"
        actions={(
          <>
            <StatusBadge value={dashboard.strategy.status} />
            <Link href="/guide" className="button"><BookOpenCheck size={16} /> Dashboard guide</Link>
          </>
        )}
      />

      <Panel title="New September rebuild" description="Ten revised pieces are rendered for creative review. The earlier plan is retained below for comparison.">
        <div className="brief-body">
          <p>Review the new carousels, actual product evidence, captions, and replacement video drafts as they become available. These files have not been approved or scheduled.</p>
          <a className="button" href="/monthly-plan/2026-09/rebuild/review.html">Open new creative review <ArrowUpRight size={16} /></a>
        </div>
        <div className="month-plan-grid">
          {rebuildDrafts.map((draft) => {
            const cover = draft.assets.find((asset) => asset.path.endsWith("poster.png")) ?? draft.assets.find((asset) => asset.path.endsWith("slide-01.png"));
            return cover ? (
              <article className="month-plan-card" key={draft.id}>
                <a className="month-plan-cover" href={`/monthly-plan/2026-09/rebuild/review.html#${draft.id}`}>
                  <Image src={`/monthly-plan/2026-09/rebuild/${cover.path}`} alt={draft.title} width={1080} height={cover.path.endsWith("poster.png") ? 1920 : 1350} sizes="(max-width: 620px) 92vw, 360px" />
                  <span className="production-step">New draft · needs creative review</span>
                </a>
                <div className="month-plan-card-body" lang="ar" dir="rtl">
                  <time dateTime={draft.date}>{draft.date}</time>
                  <h3>{draft.title}</h3>
                  <a className="text-link" href={`/monthly-plan/2026-09/rebuild/review.html#${draft.id}`}>عرض الملفات والوصف الكامل</a>
                </div>
              </article>
            ) : null;
          })}
        </div>
      </Panel>

      {result === "month-approved" ? (
        <div className="result-banner" role="status">
          <CheckCircle2 size={17} />
          <div>
            <strong>September strategy approved.</strong>
            <span>Incomplete carousel and reel assets remain in review and were not bulk-approved.</span>
          </div>
        </div>
      ) : null}

      <div className="plan-brief-grid">
        <Panel title="The publishing rhythm" description="The exact sequence inherited by planning and production.">
          <div className="brief-body">
            <p className="eyebrow">3 opening posts, then one repeating loop</p>
            <h2 className="brief-objective" lang="ar" dir="rtl">تعريف أورندور ← ذكاء وأتمتة ← Bunyan Pro ← فائدة مستقلة</h2>
            <div className="brief-facts">
              <span><strong>{septemberCreativePosts.length}</strong> feed posts</span>
              <span><strong>{carouselCount}</strong> carousels</span>
              <span><strong>{reelCount}</strong> reels</span>
              <span><strong>{storyFrameCount}</strong> story frames</span>
            </div>
          </div>
        </Panel>
        <Panel title="Production boundary" description="The dashboard separates planning from publishable media.">
          <div className="boundary-body">
            <div><CalendarClock size={18} /><p><strong>Planning covers</strong><span>Visible now; never treated as final assets</span></p></div>
            <div><LockKeyhole size={18} /><p><strong>Video rebuild</strong><span>Real product footage and directed motion; earlier tests are not release assets</span></p></div>
            <div><ShieldCheck size={18} /><p><strong>Release</strong><span>Every frame, clip, and final file needs QA</span></p></div>
          </div>
        </Panel>
      </div>

      <div className="plan-track-summary" lang="ar" dir="rtl">
        {(Object.keys(trackCounts) as SeptemberContentTrack[]).map((track) => (
          <div key={track}>
            <strong>{trackCounts[track]}</strong>
            <span>{trackLabels[track]}</span>
          </div>
        ))}
      </div>

      <div className="hard-fail-banner" role="status">
        <Film size={19} />
        <div>
          <strong>Previous creative requires replacement.</strong>
          <span>This page still contains the earlier 20-post plan. The revised September content and videos are under production review. These earlier assets are not the new delivery and should not be published.</span>
        </div>
      </div>

      <Panel
        className="month-plan-panel"
        title="Earlier September plan — reference only"
        description="The earlier 20 items remain available for comparison. Existing launch slides are review assets; later covers are planning assets. None are newly approved by this rebuild."
      >
        <div className="month-mix-summary" lang="ar" dir="rtl">
          {creativeModes.map((mode) => (
            <div key={mode.value}>
              <strong>{septemberCreativePosts.filter((post) => post.creativeMode === mode.value).length}</strong>
              <span>{mode.label}</span>
            </div>
          ))}
        </div>

        <div className="month-plan-grid">
          {septemberCreativePosts.map((post) => {
            const dbItem = currentByKey.get(post.key);
            return (
              <article className="month-plan-card" key={post.key}>
                <div className="month-plan-cover">
                  <Image
                    src={post.coverUrl}
                    alt={post.altText}
                    width={1080}
                    height={1350}
                    sizes="(max-width: 620px) 92vw, (max-width: 840px) 44vw, (max-width: 1180px) 30vw, 240px"
                    loading={post.sequence <= 4 ? "eager" : "lazy"}
                  />
                  <span className="production-step">{post.format === "reel" ? <Film size={13} /> : <Images size={13} />}{productionLabels[post.productionStatus]}</span>
                </div>
                <div className="month-plan-card-body" lang="ar" dir="rtl">
                  <div className="month-plan-meta">
                    <span>{post.key}{post.pinCandidate ? " · مثبّت" : ""}</span>
                    <time dateTime={post.publishAt}>{formatDate(post.publishAt, { year: undefined })}</time>
                  </div>
                  <h3>{post.title}</h3>
                  <p>{post.hook}</p>
                  <div className="month-plan-tags">
                    <span>{trackLabels[post.contentTrack]}</span>
                    <span>{humanize(post.format)}</span>
                    <span>{post.supportingStories.length} قصص</span>
                    <span>{post.platforms.join(" · ")}</span>
                  </div>
                  {dbItem ? (
                    <Link className="text-link plan-review-link" href={"/content/" + dbItem.id}>
                      <StatusBadge value={dbItem.status} />
                      Open the same item in Content <ArrowUpRight size={14} />
                    </Link>
                  ) : (
                    <p className="qa-note">Run the September sync to attach this plan item to Content.</p>
                  )}
                  <details className="month-plan-details">
                    <summary>الخطة الكاملة</summary>
                    <dl>
                      <div><dt>القصة</dt><dd>{post.storyArc.setup} ← {post.storyArc.friction} ← {post.storyArc.intervention} ← {post.storyArc.resolution}</dd></div>
                      <div><dt>الكابشن النهائي</dt><dd className="preserve-lines">{finalCaption(post)}</dd></div>
                      <div><dt>أماكن CTA</dt><dd>{post.ctaPlacements.map(humanize).join(" · ")}</dd></div>
                      <div><dt>التوجيه البصري</dt><dd>{post.visualDirection}</dd></div>
                      {post.format === "carousel" ? (
                        <div>
                          <dt>شرائح الكاروسيل</dt>
                          <dd>{post.slides.map((slide) => slide.sequence + ". " + slide.title).join(" ← ")}</dd>
                        </div>
                      ) : (
                        <div>
                          <dt>مقاطع الريل</dt>
                          <dd>{post.reelProduction?.clips.map((clip) => clip.sequence + ". " + clip.narrativeBeat + " [" + humanize(clip.sourceType) + "]").join(" ← ")}</dd>
                        </div>
                      )}
                      <div>
                        <dt>القصص الداعمة</dt>
                        <dd>{post.supportingStories.map((story) => story.sequence + ". " + story.exactText + " [" + humanize(story.interaction.type) + "]").join(" ← ")}</dd>
                      </div>
                      {post.productionStatus === "READY_FOR_OWNER_REVIEW" ? (
                        <div>
                          <dt>ملفات يوم الإطلاق</dt>
                          <dd>
                            <div className="launch-asset-group" aria-label={`Produced assets for ${post.key}`}>
                              <div className="launch-asset-strip">
                                {post.slides.map((slide) => slide.assetUrl ? (
                                  <figure key={slide.assetUrl}>
                                    <Image src={slide.assetUrl} alt={slide.altText} width={1080} height={1350} sizes="160px" loading="lazy" />
                                    <figcaption>شريحة {slide.sequence}</figcaption>
                                  </figure>
                                ) : null)}
                              </div>
                              <div className="launch-story-strip">
                                {post.supportingStories.map((story) => story.assetUrl ? (
                                  <figure key={story.assetUrl}>
                                    <Image src={story.assetUrl} alt={story.exactText} width={1080} height={1920} sizes="120px" loading="lazy" />
                                    <figcaption>قصة {story.sequence}</figcaption>
                                  </figure>
                                ) : null)}
                              </div>
                            </div>
                          </dd>
                        </div>
                      ) : null}
                      <div><dt>حدود الدليل</dt><dd>{post.proofBoundary}</dd></div>
                      <div><dt>سياسة الأشخاص</dt><dd>{post.castingPlan.justification}</dd></div>
                      <div><dt>القياس</dt><dd>{post.kpis.join(" · ")}</dd></div>
                    </dl>
                  </details>
                </div>
              </article>
            );
          })}
        </div>
      </Panel>

      <Panel
        title="Stories support the feed"
        description="Every post receives an interaction before publishing and a second story that drives viewers back to the post."
      >
        <div className="story-policy-grid" lang="ar" dir="rtl">
          <div><MessageSquareText size={20} /><strong>قبل المنشور</strong><span>سؤال، تصويت، اختبار، أو مؤشر يجمع تجربة الجمهور الحقيقية.</span></div>
          <div><ArrowUpRight size={20} /><strong>بعد المنشور</strong><span>قصة تكمل الفكرة وتعيد الجمهور إلى المنشور بدل تكرار نصه.</span></div>
          <div><ShieldCheck size={20} /><strong>قاعدة ثابتة</strong><span>كل تسلسل مرتبط بمنشور واحد وينتهي بدعوة واضحة لفتحه.</span></div>
        </div>
      </Panel>

      <Panel
        title="Historical source library"
        description="The old imported W*/V* designs are retained as read-only evidence. They no longer appear in the active Content review queue."
      >
        <Link className="button" href="/content?lifecycle=superseded">View historical items</Link>
      </Panel>

      <section className="approval-gate" aria-label="Earlier strategy approval paused during rebuild">
        <div>
          <span className="approval-gate-icon"><CheckCircle2 size={22} /></span>
          <div>
            <p className="eyebrow eyebrow-pale">Owner action</p>
            <h2>Approve September’s strategic direction</h2>
            <p>This approves the strategy boundary only. Incomplete carousels, unauthenticated reels, unresolved QA flags, high-risk claims, and hard-failed creative stay in review.</p>
          </div>
        </div>
        <form action={approveMonthAction} className="approval-gate-form">
          <input type="hidden" name="strategyId" value={dashboard.strategy.id} />
          <label htmlFor="month-feedback">Approval note</label>
          <textarea id="month-feedback" name="feedback" placeholder="Optional context for the audit trail" />
          <button type="submit" className="button button-primary" disabled>Approval paused during rebuild</button>
        </form>
      </section>

      <p className="inline-note"><AlertTriangle size={14} /> The revised September plan launches on September 11. The dates and repetitive sequence below belong to the earlier plan and have not yet been replaced in this dashboard.</p>
    </>
  );
}
