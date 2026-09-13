import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { renderCanonicalHorizontalLogo } from "../packages/engine/src/creative";

const execFileAsync = promisify(execFile);
const root = fileURLToPath(new URL("../", import.meta.url));
const cohortRoot = `${root}artifacts/creative-rebuild/source-backed-cohort-2026-08-31/`;
const sourceRoot = `${cohortRoot}source-images/`;
const sha256 = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");
const dataUri = (mime: string, bytes: Uint8Array) => `data:${mime};base64,${Buffer.from(bytes).toString("base64")}`;

const [arabicRegular, arabicBold] = await Promise.all([
  readFile(`${root}apps/web/src/app/fonts/GhroobArabicITF-Regular.otf`),
  readFile(`${root}apps/web/src/app/fonts/GhroobArabicITF-Bold.otf`),
]);

interface EvidenceRef {
  publisher: string;
  title: string;
  url: string;
  publishedAt: string;
  claimBoundary: string;
}

interface Candidate {
  id: string;
  title: string;
  exactCopy: string[];
  sourceImage?: string;
  sourcePromptSummary: string;
  evidence: EvidenceRef;
  html: (sourceUri?: string) => string;
}

const logo = (fill: string) => `<svg class="brand-logo" viewBox="0 0 414.84 85.88" aria-label="AURENDOR">${renderCanonicalHorizontalLogo(fill, 0, 0, 414.84)}</svg>`;

const base = (title: string, content: string, extraCss = "") => `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8"/><title>${title}</title><style>
@font-face{font-family:Ghroob;src:url('${dataUri("font/otf", arabicRegular)}') format('opentype');font-weight:400}
@font-face{font-family:Ghroob;src:url('${dataUri("font/otf", arabicBold)}') format('opentype');font-weight:700}
*{box-sizing:border-box}html,body{margin:0;width:1080px;height:1350px;overflow:hidden;background:#F4F8F5}
.canvas{position:relative;width:1080px;height:1350px;overflow:hidden;font-family:Ghroob,Arial,sans-serif;direction:rtl;text-align:right;letter-spacing:normal}
.brand-logo{position:absolute;z-index:20;left:72px;bottom:48px;width:152px;height:auto}
.eyebrow{font-size:28px;line-height:1.25;font-weight:700;margin:0 0 20px}
h1{font-size:82px;line-height:1.04;font-weight:700;margin:0}
h1 span{display:block}
.support{font-size:31px;line-height:1.52;font-weight:400;margin:24px 0 0}
.source{font-size:28px;line-height:1.42;font-weight:700;margin:0}
.copy-safe{position:absolute;z-index:12;overflow:visible}
${extraCss}
</style></head><body>${content}</body></html>`;

const candidates: Candidate[] = [
  {
    id: "sb01-ar-payment-acceptance",
    title: "الدفع الرقمي يكتمل عند نقطة القبول",
    exactCopy: [
      "شمول مالي · ٠١",
      "الدفع الرقمي",
      "لا يكتمل عند الحساب",
      "يكتمل عند نقطة القبول",
      "وجود الحساب بداية. الاستخدام يبدأ حين يجد الناس مكانًا يقبل الدفع بلا نقد.",
      "المصدر: البنك المركزي العراقي، استراتيجية الشمول المالي الوطنية ٢٠٢٥–٢٠٢٩.",
    ],
    sourceImage: "sb01-payment-acceptance-base.png",
    sourcePromptSummary: "Original textless payment-acceptance still life generated for this cohort: a green token stops at one intentionally empty receiving socket on limestone; no reference pixels, text, logo, or UI supplied.",
    evidence: {
      publisher: "Central Bank of Iraq",
      title: "National Financial Inclusion Strategy 2025–2029",
      url: "https://cbi.iq/static/uploads/up/file-175032973296039.pdf",
      publishedAt: "2025",
      claimBoundary: "Account access alone does not prove usage; lack of acceptance equipment is reported as a principal barrier to non-cash payment.",
    },
    html: (sourceUri) => base("الدفع الرقمي يكتمل عند نقطة القبول", `<main class="canvas photo-payment" lang="ar" dir="rtl">
      <img class="hero" src="${sourceUri}" alt=""/>
      <div class="calm-field" aria-hidden="true"></div>
      <header class="copy-safe headline" data-copy-region="headline" data-arabic-zone>
        <p class="eyebrow">شمول مالي · ٠١</p>
        <h1><span>الدفع الرقمي</span><span>لا يكتمل عند الحساب</span><span class="accent">يكتمل عند نقطة القبول</span></h1>
        <p class="support">وجود الحساب بداية. الاستخدام يبدأ حين يجد الناس مكانًا يقبل الدفع بلا نقد.</p>
      </header>
      <p class="copy-safe source" data-copy-region="source" data-arabic-zone>المصدر: البنك المركزي العراقي، استراتيجية الشمول المالي الوطنية ٢٠٢٥–٢٠٢٩.</p>
      ${logo("#003F35")}
    </main>`, `.photo-payment{background:#EEE8DD;color:#003F35}.photo-payment .hero{position:absolute;inset:0;width:1080px;height:1350px;object-fit:cover}.photo-payment .calm-field{position:absolute;z-index:3;inset:0;background:linear-gradient(180deg,rgba(244,248,245,.98) 0%,rgba(244,248,245,.90) 30%,rgba(244,248,245,.15) 58%,rgba(244,248,245,0) 100%)}.photo-payment .headline{right:72px;top:66px;width:936px;height:575px}.photo-payment .eyebrow{color:#08783F}.photo-payment h1{font-size:78px}.photo-payment h1 .accent{color:#08783F}.photo-payment .support{width:825px;color:#3A5145}.photo-payment .source{right:72px;bottom:58px;width:700px;color:#003F35;text-shadow:0 1px 10px rgba(244,248,245,.95)}`),
  },
  {
    id: "sb02-ar-service-time",
    title: "التحول الحقيقي يختصر زمن الخدمة",
    exactCopy: [
      "تحوّل خدمة · ٠٢",
      "التحول الحقيقي",
      "لا يضيف شاشة",
      "يختصر زمن الخدمة",
      "في تجربة عراقية موثّقة، انتقل البحث عن الملف من ساعات إلى أقل من دقيقة.",
      "المصدر: برنامج الأمم المتحدة الإنمائي في العراق، ٢٠٢٥.",
    ],
    sourceImage: "sb02-service-time-base.png",
    sourcePromptSummary: "Original textless archive-to-service photograph generated for this cohort: worn files enter one engineered indexing channel and a clean record tray emerges; no reference pixels, text, logo, people, or UI supplied.",
    evidence: {
      publisher: "UNDP Iraq",
      title: "What used to take hours… is now done in just one minute",
      url: "https://www.undp.org/iraq/stories/what-used-take-hours-now-done-just-one-minute",
      publishedAt: "2025-12-21",
      claimBoundary: "The hours-to-under-one-minute comparison belongs to the documented Iraqi police-service case and is not generalized beyond it.",
    },
    html: (sourceUri) => base("التحول الحقيقي يختصر زمن الخدمة", `<main class="canvas photo-service" lang="ar" dir="rtl">
      <img class="hero" src="${sourceUri}" alt=""/>
      <div class="shade" aria-hidden="true"></div>
      <header class="copy-safe headline" data-copy-region="headline" data-arabic-zone>
        <p class="eyebrow">تحوّل خدمة · ٠٢</p>
        <h1><span>التحول الحقيقي</span><span>لا يضيف شاشة</span><span class="accent">يختصر زمن الخدمة</span></h1>
        <p class="support">في تجربة عراقية موثّقة، انتقل البحث عن الملف من ساعات إلى أقل من دقيقة.</p>
      </header>
      <p class="copy-safe source" data-copy-region="source" data-arabic-zone>المصدر: برنامج الأمم المتحدة الإنمائي في العراق، ٢٠٢٥.</p>
      ${logo("#F4F8F5")}
    </main>`, `.photo-service{background:#00302A;color:#F4F8F5}.photo-service .hero{position:absolute;inset:0;width:1080px;height:1350px;object-fit:cover}.photo-service .shade{position:absolute;z-index:3;inset:0;background:linear-gradient(180deg,rgba(0,48,42,.97) 0%,rgba(0,48,42,.90) 35%,rgba(0,48,42,.10) 68%,rgba(0,48,42,.70) 100%)}.photo-service .headline{right:72px;top:70px;width:936px;height:570px}.photo-service .eyebrow,.photo-service h1 .accent{color:#77FF70}.photo-service h1{font-size:80px}.photo-service .support{width:820px;color:#E4EEE8}.photo-service .source{right:72px;bottom:58px;width:700px;color:#F4F8F5;text-shadow:0 2px 12px rgba(0,32,27,.95)}`),
  },
  {
    id: "sb03-ar-governance-trust",
    title: "التقنية تقلّل الاحتكاك والحوكمة تبني الثقة",
    exactCopy: [
      "حوكمة رقمية · ٠٣",
      "التقنية تقلّل الاحتكاك",
      "الحوكمة تبني الثقة",
      "الخدمة الرقمية توحّد الإجراء وتزيد قابلية التتبّع. لكن الثقة تحتاج أيضًا قواعد ومساءلة وقدرة مؤسسية.",
      "المصدر: برنامج الأمم المتحدة الإنمائي في العراق، قراءة مؤشر مدركات الفساد ٢٠٢٥.",
      "تقنية",
      "حوكمة",
      "ثقة",
    ],
    sourcePromptSummary: "Original deterministic typographic architecture using only project fonts, brand colors, and CSS; no external or generated visual pixels.",
    evidence: {
      publisher: "UNDP Iraq",
      title: "Iraq’s CPI 2025: From Starting Reform to Earning Trust",
      url: "https://www.undp.org/iraq/blog/iraqs-cpi-2025-starting-reform-earning-trust",
      publishedAt: "2026",
      claimBoundary: "A two-part governance principle; no invented causal statistic or AURENDOR performance claim.",
    },
    html: () => base("التقنية تقلّل الاحتكاك والحوكمة تبني الثقة", `<main class="canvas governance" lang="ar" dir="rtl">
      <header class="copy-safe headline" data-copy-region="headline" data-arabic-zone>
        <p class="eyebrow">حوكمة رقمية · ٠٣</p>
        <h1><span>التقنية تقلّل الاحتكاك</span><span class="accent">الحوكمة تبني الثقة</span></h1>
        <p class="support">الخدمة الرقمية توحّد الإجراء وتزيد قابلية التتبّع. لكن الثقة تحتاج أيضًا قواعد ومساءلة وقدرة مؤسسية.</p>
      </header>
      <section class="protected-visual mechanism" data-avoid-copy="true" aria-label="تسلسل من التقنية إلى الحوكمة ثم الثقة">
        <article><b>تقنية</b><i></i></article><article><b>حوكمة</b><i></i></article><article class="charged"><b>ثقة</b><i></i></article>
      </section>
      <p class="copy-safe source" data-copy-region="source" data-arabic-zone>المصدر: برنامج الأمم المتحدة الإنمائي في العراق، قراءة مؤشر مدركات الفساد ٢٠٢٥.</p>
      ${logo("#F4F8F5")}
    </main>`, `.governance{background:#003F35;color:#F4F8F5}.governance:before{content:"";position:absolute;inset:0;background:linear-gradient(135deg,transparent 0 56%,rgba(119,255,112,.04) 56% 57%,transparent 57%)}.governance .headline{right:72px;top:70px;width:936px;height:500px}.governance .eyebrow,.governance h1 .accent{color:#77FF70}.governance h1{font-size:84px}.governance .support{width:860px;color:#DDEAE3}.governance .mechanism{position:absolute;z-index:8;right:72px;top:690px;width:936px;height:360px;display:grid;grid-template-columns:repeat(3,1fr);gap:22px;direction:rtl}.governance .mechanism article{position:relative;border:2px solid #5E8175;background:#00342D;padding:38px 30px;display:flex;align-items:flex-end;justify-content:flex-start;overflow:hidden}.governance .mechanism article:before{content:"";position:absolute;right:30px;top:34px;width:84px;height:84px;border:2px solid #77FF70;opacity:.34}.governance .mechanism article:after{content:"";position:absolute;right:62px;top:66px;width:84px;height:84px;border:2px solid #77FF70;opacity:.18}.governance .mechanism b{font-size:50px;line-height:1;font-weight:700;position:relative;z-index:2}.governance .mechanism i{position:absolute;right:28px;left:28px;bottom:106px;height:6px;background:#66887C}.governance .mechanism .charged{background:#77FF70;color:#003F35;border-color:#77FF70}.governance .mechanism .charged:before,.governance .mechanism .charged:after{border-color:#003F35}.governance .mechanism .charged i{background:#003F35}.governance .source{right:72px;bottom:142px;width:780px;color:#C8DAD1}`),
  },
  {
    id: "sb04-ar-data-visibility",
    title: "البيانات النادرة تترك القرار في الظل",
    exactCopy: [
      "بنية بيانات · ٠٤",
      "حين تندر البيانات",
      "يبقى القرار في الظل",
      "الرؤية المحدودة للاحتياجات والفرص ليست مشكلة تقرير؛ إنها مشكلة قرار.",
      "المصدر: برنامج الأمم المتحدة الإنمائي في العراق، مبادرة آي داتا، ٢٠٢٥.",
      "مرئي",
      "غير مرئي",
    ],
    sourcePromptSummary: "Original deterministic qualitative visibility field using project typography and CSS; no chart values, external assets, or generated visual pixels.",
    evidence: {
      publisher: "UNDP Iraq",
      title: "Unlocking Iraq’s Innovation Potential Through Data: The iDATA Local Solution",
      url: "https://www.undp.org/iraq/blog/unlocking-iraqs-innovation-potential-through-data-idata-local-solution",
      publishedAt: "2025-04-21",
      claimBoundary: "Qualitative visibility metaphor only; no invented values, percentages, or causal performance claim.",
    },
    html: () => base("البيانات النادرة تترك القرار في الظل", `<main class="canvas visibility" lang="ar" dir="rtl">
      <header class="copy-safe headline" data-copy-region="headline" data-arabic-zone>
        <p class="eyebrow">بنية بيانات · ٠٤</p>
        <h1><span>حين تندر البيانات</span><span class="accent">يبقى القرار في الظل</span></h1>
        <p class="support">الرؤية المحدودة للاحتياجات والفرص ليست مشكلة تقرير؛ إنها مشكلة قرار.</p>
      </header>
      <section class="protected-visual field" data-avoid-copy="true" aria-label="حقل بيانات تظهر منه مساحة محدودة فقط">
        <div class="window"><span>مرئي</span></div><b>غير مرئي</b>
      </section>
      <p class="copy-safe source" data-copy-region="source" data-arabic-zone>المصدر: برنامج الأمم المتحدة الإنمائي في العراق، مبادرة آي داتا، ٢٠٢٥.</p>
      ${logo("#003F35")}
    </main>`, `.visibility{background:#F4F8F5;color:#003F35}.visibility .headline{right:72px;top:66px;width:936px;height:480px}.visibility .eyebrow,.visibility h1 .accent{color:#08783F}.visibility h1{font-size:82px}.visibility .support{width:850px;color:#3A5145}.visibility .field{position:absolute;z-index:5;right:72px;top:620px;width:936px;height:430px;background-color:#003F35;background-image:radial-gradient(circle at center,rgba(119,255,112,.30) 0 5px,transparent 6px);background-size:52px 52px;overflow:hidden}.visibility .field:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,63,53,.98),rgba(0,63,53,.74) 58%,rgba(0,63,53,.08))}.visibility .window{position:absolute;z-index:3;left:54px;top:54px;width:352px;height:322px;border:8px solid #77FF70;background-color:#003F35;background-image:radial-gradient(circle at center,#77FF70 0 6px,transparent 7px);background-size:52px 52px;box-shadow:0 30px 80px rgba(0,25,21,.32)}.visibility .window span{position:absolute;left:22px;bottom:18px;padding:8px 14px 11px;background:#77FF70;color:#003F35;font-size:30px;line-height:1;font-weight:700}.visibility .field>b{position:absolute;z-index:4;right:34px;bottom:28px;color:#C6D8CF;font-size:30px;line-height:1;font-weight:700}.visibility .source{right:72px;bottom:142px;width:760px;color:#315548}`),
  },
  {
    id: "sb05-ar-repeated-decision",
    title: "أي قرار يستهلك وقت فريقك كل أسبوع؟",
    exactCopy: [
      "نمط تشغيل · ٠٥",
      "أي قرار",
      "يستهلك وقت فريقك",
      "كل أسبوع؟",
      "إذا تكرر السؤال نفسه، سجّل القاعدة قبل أن تجعل الاجتماع هو النظام.",
      "المصدر: إرشادات هندسة وزارة الداخلية البريطانية، ٢٠٢٦.",
    ],
    sourceImage: "sb05-repeated-decision-base.png",
    sourcePromptSummary: "Original textless repeated-decision still life generated for this cohort: five limestone slots carry the same operational trace and one green decision block is ready to repeat; no reference pixels, text, logo, people, or UI supplied.",
    evidence: {
      publisher: "UK Home Office Engineering Guidance and Standards",
      title: "Automate to eliminate manual steps",
      url: "https://engineering.homeoffice.gov.uk/principles/automate-to-eliminate-manual-steps/",
      publishedAt: "2026-02-13",
      claimBoundary: "The post identifies and measures recurring manual decision toil; it promises no saving before a baseline and controlled change exist.",
    },
    html: (sourceUri) => base("أي قرار يستهلك وقت فريقك كل أسبوع؟", `<main class="canvas repeated-decision" lang="ar" dir="rtl">
      <img class="hero" src="${sourceUri}" alt=""/>
      <div class="calm-field" aria-hidden="true"></div>
      <header class="copy-safe headline" data-copy-region="headline" data-arabic-zone>
        <p class="eyebrow">نمط تشغيل · ٠٥</p>
        <h1><span>أي قرار</span><span>يستهلك وقت فريقك</span><span class="accent">كل أسبوع؟</span></h1>
        <p class="support">إذا تكرر السؤال نفسه، سجّل القاعدة قبل أن تجعل الاجتماع هو النظام.</p>
      </header>
      <p class="copy-safe source" data-copy-region="source" data-arabic-zone>المصدر: إرشادات هندسة وزارة الداخلية البريطانية، ٢٠٢٦.</p>
      ${logo("#003F35")}
    </main>`, `.repeated-decision{background:#EEE8DD;color:#003F35}.repeated-decision .hero{position:absolute;inset:0;width:1080px;height:1350px;object-fit:cover}.repeated-decision .calm-field{position:absolute;z-index:3;inset:0;background:linear-gradient(180deg,rgba(244,248,245,.99) 0%,rgba(244,248,245,.91) 34%,rgba(244,248,245,.10) 59%,rgba(244,248,245,0) 100%)}.repeated-decision .headline{right:72px;top:66px;width:936px;height:575px}.repeated-decision .eyebrow,.repeated-decision h1 .accent{color:#08783F}.repeated-decision h1{font-size:80px}.repeated-decision .support{width:830px;color:#3A5145}.repeated-decision .source{right:72px;bottom:58px;width:760px;color:#003F35;text-shadow:0 1px 10px rgba(244,248,245,.96)}`),
  },
  {
    id: "sb06-ar-service-continuity",
    title: "حين تنقطع الكهرباء هل تعرف خدمتك ماذا تفعل؟",
    exactCopy: [
      "استمرارية خدمة · ٠٦",
      "حين تنقطع الكهرباء",
      "هل تعرف خدمتك ماذا تفعل؟",
      "في مسح منشآت العراق ٢٠٢٢، أفادت ٤١٫٣٪ من المنشآت الرسمية المشمولة بانقطاعات كهربائية.",
      "يبقى",
      "ما يلزم الآن",
      "يؤجَّل",
      "ما ينتظر بوضوح",
      "يُستعاد",
      "ما يعود بلا فقد",
      "المصدر: مسح منشآت العراق، مجموعة البنك الدولي، ٢٠٢٢.",
    ],
    sourcePromptSummary: "Original deterministic three-state service-continuity editorial using only project fonts, canonical brand assets, and CSS; no external pixels, broken Arabic lettering, outage icon, chart, or fake interface.",
    evidence: {
      publisher: "World Bank Group Enterprise Surveys",
      title: "Iraq 2022 Country Profile",
      url: "https://www.enterprisesurveys.org/content/dam/enterprisesurveys/documents/country/Iraq-2022.pdf",
      publishedAt: "2022",
      claimBoundary: "The 41.3% figure describes surveyed formal establishments reporting electrical outages; it is not a population estimate or an AURENDOR continuity outcome.",
    },
    html: () => base("حين تنقطع الكهرباء هل تعرف خدمتك ماذا تفعل؟", `<main class="canvas continuity" lang="ar" dir="rtl">
      <header class="copy-safe headline" data-copy-region="headline" data-arabic-zone>
        <p class="eyebrow">استمرارية خدمة · ٠٦</p>
        <h1><span>حين تنقطع الكهرباء</span><span class="accent">هل تعرف خدمتك ماذا تفعل؟</span></h1>
        <p class="support">في مسح منشآت العراق ٢٠٢٢، أفادت ٤١٫٣٪ من المنشآت الرسمية المشمولة بانقطاعات كهربائية.</p>
      </header>
      <section class="protected-visual state-board" data-avoid-copy="true" aria-label="ثلاث حالات محددة لاستمرار الخدمة">
        <p class="board-label">خطة الاستمرار</p>
        <div class="states">
          <article class="remain"><small>١</small><b>يبقى</b><span>ما يلزم الآن</span></article>
          <article class="defer"><small>٢</small><b>يؤجَّل</b><span>ما ينتظر بوضوح</span></article>
          <article class="restore"><small>٣</small><b>يُستعاد</b><span>ما يعود بلا فقد</span></article>
        </div>
        <div class="continuity-band" aria-hidden="true"><i></i><i></i><i></i></div>
      </section>
      <p class="copy-safe source" data-copy-region="source" data-arabic-zone>المصدر: مسح منشآت العراق، مجموعة البنك الدولي، ٢٠٢٢.</p>
      ${logo("#003F35")}
    </main>`, `.continuity{background:#F4F8F5;color:#003F35}.continuity:before{content:"";position:absolute;inset:0;background:linear-gradient(135deg,rgba(0,63,53,.018) 25%,transparent 25% 50%,rgba(0,63,53,.018) 50% 75%,transparent 75%);background-size:48px 48px}.continuity .headline{right:72px;top:66px;width:936px;height:500px}.continuity .eyebrow{color:#08783F}.continuity h1{font-size:77px}.continuity h1 .accent{color:#08783F}.continuity .support{width:900px;color:#3A5145;font-size:29px;line-height:1.48}.continuity .state-board{position:absolute;z-index:6;right:72px;top:610px;width:936px;height:478px;padding:30px 32px 34px;background:#003F35;color:#F4F8F5;overflow:hidden}.continuity .board-label{margin:0;color:#77FF70;font-size:28px;line-height:1;font-weight:700}.continuity .states{position:absolute;right:32px;left:32px;top:86px;height:292px;display:grid;grid-template-columns:repeat(3,1fr);gap:14px;direction:rtl}.continuity .states article{position:relative;padding:30px 26px;display:flex;flex-direction:column;justify-content:flex-end;align-items:flex-start;direction:rtl;text-align:right}.continuity .states small{position:absolute;right:24px;top:20px;font-size:24px;line-height:1;font-weight:700}.continuity .states b{font-size:56px;line-height:1;font-weight:700}.continuity .states span{margin-top:14px;font-size:27px;line-height:1.2;font-weight:400}.continuity .remain{background:#77FF70;color:#003F35}.continuity .defer{background:#F4F8F5;color:#003F35}.continuity .restore{border:3px solid #77FF70;background:#00342D;color:#F4F8F5}.continuity .restore small{color:#77FF70}.continuity .continuity-band{position:absolute;right:32px;left:32px;bottom:32px;height:16px;display:grid;grid-template-columns:repeat(3,1fr);gap:14px;direction:rtl}.continuity .continuity-band i{display:block;background:#77FF70}.continuity .continuity-band i:nth-child(2){background:#F4F8F5}.continuity .source{right:72px;bottom:142px;width:760px;color:#315548}`),
  },
];

await Promise.all([
  mkdir(`${cohortRoot}production`, { recursive: true }),
  mkdir(`${cohortRoot}mobile`, { recursive: true }),
  mkdir(`${cohortRoot}html`, { recursive: true }),
]);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
const records: unknown[] = [];

try {
  for (const candidate of candidates) {
    const sourceBytes = candidate.sourceImage ? await readFile(`${sourceRoot}${candidate.sourceImage}`) : null;
    const html = candidate.html(sourceBytes ? dataUri("image/png", sourceBytes) : undefined);
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map((image) => image.decode()));
    });

    const technical = await page.evaluate((copy) => {
      const bodyText = document.body.innerText;
      const canvas = document.querySelector<HTMLElement>(".canvas")?.getBoundingClientRect();
      const copyRegions = [...document.querySelectorAll<HTMLElement>("[data-copy-region]")].map((node) => {
        const bounds = node.getBoundingClientRect();
        return {
          name: node.dataset.copyRegion,
          bounds: { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height, right: bounds.right, bottom: bounds.bottom },
          withinCanvas: bounds.left >= 0 && bounds.top >= 0 && bounds.right <= 1080 && bounds.bottom <= 1350,
          noOverflow: node.scrollWidth <= node.clientWidth + 1 && node.scrollHeight <= node.clientHeight + 1,
          letterSpacing: getComputedStyle(node).letterSpacing,
        };
      });
      const protectedVisuals = [...document.querySelectorAll<HTMLElement>("[data-avoid-copy]")].map((node) => node.getBoundingClientRect());
      const arabicZones = [...document.querySelectorAll<HTMLElement>("[data-arabic-zone]")].map((node) => node.getBoundingClientRect());
      return {
        documentLanguage: document.documentElement.lang,
        documentDirection: document.documentElement.dir,
        regularFontLoaded: document.fonts.check("400 31px Ghroob"),
        boldFontLoaded: document.fonts.check("700 82px Ghroob"),
        exactCopyPresent: copy.every((line) => bodyText.includes(line)),
        canvas: canvas ? { width: canvas.width, height: canvas.height } : null,
        copyRegions,
        foregroundArabicIntersections: protectedVisuals.reduce((count, visual) => count + arabicZones.filter((zone) => (
          visual.left < zone.right
          && visual.right > zone.left
          && visual.top < zone.bottom
          && visual.bottom > zone.top
        )).length, 0),
      };
    }, candidate.exactCopy);

    const preflightPassed = technical.documentLanguage === "ar"
      && technical.documentDirection === "rtl"
      && technical.regularFontLoaded
      && technical.boldFontLoaded
      && technical.exactCopyPresent
      && technical.canvas?.width === 1080
      && technical.canvas?.height === 1350
      && technical.copyRegions.every((region) => region.withinCanvas && region.noOverflow && (region.letterSpacing === "normal" || region.letterSpacing === "0px"))
      && technical.foregroundArabicIntersections === 0;

    if (!preflightPassed) throw new Error(`Technical preflight failed for ${candidate.id}: ${JSON.stringify(technical)}`);

    const productionFile = `production/${candidate.id}.png`;
    const mobileFile = `mobile/${candidate.id}.png`;
    await page.screenshot({ path: `${cohortRoot}${productionFile}`, type: "png", animations: "disabled" });
    await writeFile(`${cohortRoot}html/${candidate.id}.html`, html, "utf8");
    await execFileAsync("magick", [`${cohortRoot}${productionFile}`, "-filter", "Lanczos", "-resize", "324x405!", `${cohortRoot}${mobileFile}`]);
    const [productionBytes, mobileBytes] = await Promise.all([
      readFile(`${cohortRoot}${productionFile}`),
      readFile(`${cohortRoot}${mobileFile}`),
    ]);
    records.push({
      id: candidate.id,
      title: candidate.title,
      language: "ar",
      direction: "rtl",
      exactCopy: candidate.exactCopy,
      sourceImage: candidate.sourceImage ?? null,
      sourceImageSha256: sourceBytes ? sha256(sourceBytes) : null,
      sourcePromptSummary: candidate.sourcePromptSummary,
      evidence: candidate.evidence,
      production: { file: productionFile, width: 1080, height: 1350, sha256: sha256(productionBytes), byteLength: productionBytes.byteLength },
      mobile: { file: mobileFile, width: 324, height: 405, sha256: sha256(mobileBytes), byteLength: mobileBytes.byteLength },
      fontEvidence: { regularSha256: sha256(arabicRegular), boldSha256: sha256(arabicBold) },
      technicalPreflight: { ...technical, passed: true },
      rawProfessionalReferencePixelsSuppliedToGeneration: false,
      generatedTextInSource: false,
      publicationEligible: false,
    });
  }
} finally {
  await browser.close();
}

await writeFile(`${cohortRoot}manifest.json`, `${JSON.stringify({
  schemaVersion: "1.0.0",
  generatedAt: new Date().toISOString(),
  status: "PIXEL_REVIEW_REQUIRED",
  count: records.length,
  sourceBacked: true,
  publicationEligible: false,
  records,
}, null, 2)}\n`, "utf8");

await execFileAsync("magick", [
  ...candidates.map((candidate) => `${cohortRoot}production/${candidate.id}.png`),
  "-thumbnail", "432x540",
  "-background", "#DCE6E0",
  "-gravity", "center",
  "-extent", "456x564",
  "+append",
  `${cohortRoot}candidate-contact-sheet.png`,
]);
await execFileAsync("magick", [
  ...candidates.map((candidate) => `${cohortRoot}mobile/${candidate.id}.png`),
  "-background", "#DCE6E0",
  "-gravity", "center",
  "-extent", "344x425",
  "+append",
  `${cohortRoot}mobile-contact-sheet.png`,
]);

console.log(`Rendered ${records.length} source-backed Arabic candidates with exact production and mobile pixels.`);
