import Image from "next/image";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ArrowUpRight, BookOpenCheck } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";

type EditorialItem = {
  id: string;
  date: string;
  time: string;
  cycle: number;
  format: string;
  titleAr: string;
  readerPayoff: string;
  production?: { reviewUrl: string; cover: string; status: string };
};
type EditorialPlan = { items: EditorialItem[]; sources: unknown[] };
const base = "/monthly-plan/2026-09/editorial";
const pillarNames: Record<string, string> = {
  S: "خدمات AI للأعمال",
  B: "Bunyan Pro",
  U: "AI مفيد للأفراد",
};

export async function readSeptemberEditorialPlan(): Promise<EditorialPlan | null> {
  try {
    const plan = JSON.parse(await readFile(join(process.cwd(), "public", base, "plan.json"), "utf8")) as EditorialPlan;
    if (!Array.isArray(plan.items) || plan.items.length !== 30 || !Array.isArray(plan.sources)) return null;
    return plan;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export function SeptemberEditorialPlan({ plan }: { plan: EditorialPlan }) {
  const produced = plan.items.filter((item) => item.production);
  return (
    <>
      <PageHeader
        eyebrow="11–30 September 2026 · Editorial plan v8"
        title="كل منشور يترك شيئًا مفيدًا"
        description="٣٠ فكرة مكتوبة بالكامل: خدمات الذكاء الاصطناعي للأعمال، فوائد بنيان برو لأصحاب شركات البناء، واستخدامات عملية للأفراد. ثلاث قطع كل يومين، بمزيج متوازن بين المحاور."
        contentLang="ar"
        contentDir="rtl"
        actions={<a href={`${base}/review.html`} className="button"><BookOpenCheck size={16} /> Open complete content plan</a>}
      />
      {produced.length ? (
        <Panel title="Produced content · creative review" description="Produced cycles include carousel closing CTAs, supporting Stories and separate vertical/horizontal video exports. Publishing and first-week results are tracked in their dashboard pages.">
          <div className="brief-body"><a className="button" href={`${base}/cycle-01/review.html`}>الدورة الأولى <ArrowUpRight size={16} /></a> <a className="button" href={`${base}/cycle-02/review.html`}>الدورة الثانية <ArrowUpRight size={16} /></a> <a className="button" href="/publishing">أوقات النشر وحالة الجدولة</a> <a className="button" href="/analytics">النتائج الفعلية</a></div>
          <div className="month-plan-grid">
            {produced.map((item) => item.production ? <article className="month-plan-card" key={item.id}>
              <a href={item.production.reviewUrl}><Image src={item.production.cover} alt={item.titleAr} width={1080} height={1350} sizes="(max-width: 700px) 88vw, 320px" style={{ width: "100%", height: "auto" }} /></a>
              <div className="month-plan-card-body" lang="ar" dir="rtl"><h3 style={{ lineHeight: 1.85 }}>{item.titleAr}</h3><a className="text-link" href={item.production.reviewUrl}>الملفات المنتجة والوصف النهائي ↗</a></div>
            </article> : null)}
          </div>
        </Panel>
      ) : null}
      <div className="plan-track-summary" lang="ar" dir="rtl">
        <div><strong>30</strong><span>فكرة · ١١–٣٠ سبتمبر</span></div>
        <div><strong>20 + 10</strong><span>كاروسيل + نص ريل</span></div>
        <div><strong>10 / 10 / 10</strong><span>توازن المحاور الثلاثة</span></div>
        <div><strong>30</strong><span>قصة داعمة</span></div>
      </div>
      <Panel title="Research → useful ideas → complete Arabic copy" description={`${plan.sources.length} sources with dates, scope and limitations. Every item includes a reader takeaway, complete copy, platform adaptations and production direction.`}>
        <div className="brief-body" lang="ar" dir="rtl">
          <p>كل دورة من يومين تضم كاروسيلين ونص ريل، واحدًا من كل محور. النسخ مهيأة لـ Instagram وFacebook وLinkedIn وX وTikTok، مع قصص داعمة لـ Instagram وFacebook.</p>
          <p>المواعيد ضمن تجربة صباحية وبعد الظهر ومسائية بتوقيت بغداد. حالة النشر الفعلية تظهر في لوحة النشر؛ اكتمال التصميم لا يعني أنه نُشر.</p>
          <div className="brief-facts">
            <a className="button" href={`${base}/review.html`}>النصوص والمصادر وخطة التنفيذ <ArrowUpRight size={16} /></a>
            <a className="button" href={`${base}/calendar.csv`} download>تنزيل التقويم</a>
            <a className="button" href={`${base}/complete-briefs.md`} download>تنزيل جميع النصوص</a>
          </div>
        </div>
      </Panel>
      <Panel title="The 30-piece calendar" description="The reading benefit is shown first. Open an item for the complete slide or scene copy, caption, reusable template, five platform versions, Story and source trail.">
        <div className="month-plan-grid">
          {plan.items.map((item) => (
            <article className="month-plan-card" key={item.id}>
              <div className="month-plan-card-body" lang="ar" dir="rtl">
                <div className="month-plan-meta"><span>{item.id} · الدورة {item.cycle}</span><time dateTime={`${item.date}T${item.time}:00+03:00`}>{item.date.slice(5)} · {item.time}</time></div>
                <h3 style={{ lineHeight: 1.85 }}>{item.titleAr}</h3>
                <p style={{ lineHeight: 2 }}>{item.readerPayoff}</p>
                <div className="month-plan-tags"><span>{pillarNames[item.id.charAt(0)]}</span><span>{item.production ? "ملفات منتجة للمراجعة" : item.format === "reel" ? "نص ريل · ضمن دورة الإنتاج القادمة" : "كاروسيل"}</span></div>
                <a className="text-link" href={`${base}/review.html#${item.id}`}>قراءة النص الكامل والمصادر ↗</a>
              </div>
            </article>
          ))}
        </div>
      </Panel>
      <Panel title="Earlier creative · archive" description="Previous designs and video drafts remain accessible for reference. They are not the current editorial calendar.">
        <div className="brief-body"><a className="text-link" href="/monthly-plan/2026-09/rebuild/review.html">Open earlier visual and video review ↗</a></div>
      </Panel>
    </>
  );
}
