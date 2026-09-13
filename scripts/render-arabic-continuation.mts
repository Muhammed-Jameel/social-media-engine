import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { renderCanonicalHorizontalLogo } from "../packages/engine/src/creative";

const execFileAsync = promisify(execFile);
const root = fileURLToPath(new URL("../", import.meta.url));
const runRoot = `${root}artifacts/creative-rebuild/arabic-learning-loop-continuation-2026-08-30/`;
const sha256 = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");
const dataUri = (mime: string, bytes: Uint8Array) =>
  `data:${mime};base64,${Buffer.from(bytes).toString("base64")}`;

const [arabicRegular, arabicBold] = await Promise.all([
  readFile(`${root}apps/web/src/app/fonts/GhroobArabicITF-Regular.otf`),
  readFile(`${root}apps/web/src/app/fonts/GhroobArabicITF-Bold.otf`),
]);

interface ContinuationCandidate {
  iteration: number;
  id: string;
  title: string;
  exactCopy: string[];
  sourcePromptSummary: string;
  sourceImage?: string;
  html: string;
}

function dotField() {
  const circles: string[] = [];
  for (let row = 0; row < 13; row += 1) {
    for (let column = 0; column < 20; column += 1) {
      const x = 30 + column * 54 + (row % 2) * 18;
      const y = 30 + row * 48;
      const wave = Math.sin(column * 0.74 + row * 0.41);
      const focus = Math.max(0, 1 - Math.hypot(x - 350, y - 305) / 430);
      const radius = Math.max(2.4, 4.8 + wave * 2.2 + focus * 9.6);
      const fill = (column + row) % 9 === 0 ? "#0EDB23" : column < 11 ? "#003F35" : "#08783F";
      const opacity = Math.min(0.92, 0.24 + focus * 0.68 + ((column * 3 + row) % 5) * 0.045);
      circles.push(`<circle cx="${x}" cy="${y}" r="${radius.toFixed(1)}" fill="${fill}" opacity="${opacity.toFixed(2)}"/>`);
    }
  }
  return circles.join("");
}

function shell(content: string, title: string, background: string, logoFill: string) {
  const logo = `<svg class="brand-logo" viewBox="0 0 414.84 85.88" aria-label="SOCIAL_MEDIA_PLUGIN">${renderCanonicalHorizontalLogo(logoFill, 0, 0, 414.84)}</svg>`;
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8"/>
  <title>${title}</title>
  <style>
    @font-face{font-family:Ghroob;src:url('${dataUri("font/otf", arabicRegular)}') format('opentype');font-weight:400}
    @font-face{font-family:Ghroob;src:url('${dataUri("font/otf", arabicBold)}') format('opentype');font-weight:700}
    *{box-sizing:border-box}
    html,body{margin:0;width:1080px;height:1350px;overflow:hidden;background:${background};-webkit-font-smoothing:antialiased}
    .canvas{position:relative;width:1080px;height:1350px;overflow:hidden;background:${background};font-family:Ghroob,Arial,sans-serif;direction:rtl;text-align:right}
    .brand-logo{position:absolute;left:68px;bottom:54px;width:158px;height:auto;z-index:10}
  </style>
</head>
<body>${content}${logo}</body>
</html>`;
}

const localDataCopy = [
  "ابتكار محلي · ٣٥",
  "البيانات المحلية",
  "تُظهر ما كان مبعثرًا",
  "تجمع منصة «آي داتا» بيانات رسمية وتعرضها بصورة تفاعلية للباحثين وروّاد الأعمال وصنّاع السياسات.",
  "المصدر: برنامج الأمم المتحدة الإنمائي في العراق، ٢٠٢٥.",
];

const accessibilityCopy = [
  "وصول رقمي · ٣٦",
  "صمّم الخدمة الرقمية",
  "لأوسع نطاق",
  "من الناس",
  "اجعل المحتوى قابلًا للإدراك والتشغيل والفهم، ومتوافقًا مع أدوات المساعدة.",
  "المصدر: إرشادات إتاحة محتوى الويب ٢.٢، اتحاد شبكة الويب العالمية.",
];

const humanDevelopmentSource = await readFile(`${runRoot}iteration-25/human-development-source.png`);
const accountActivitySource = await readFile(`${runRoot}iteration-32/account-activity-source.png`);
const humanDevelopmentCopy = [
  "من العراق · ٣٧",
  "التقدّم حقيقي",
  "لكنه غير مكتمل",
  "دخل العراق فئة التنمية البشرية المرتفعة في ٢٠٢٤، مع استمرار الفجوات بين المحافظات وبين النساء والرجال.",
  "المصدر: التقرير الوطني للتنمية البشرية في العراق ٢٠٢٥.",
];

const responsibleAiCopy = [
  "ذكاء مسؤول · ٣٨",
  "الدقة ليست",
  "المعيار الوحيد",
  "عدالة",
  "خصوصية",
  "مساءلة",
  "قيّم العدالة والخصوصية والمساءلة إلى جانب الأداء التقني.",
  "مرجع: إطار «نيست» لإدارة مخاطر الذكاء الاصطناعي، وتوصية اليونسكو لأخلاقياته.",
];

const observationCopy = [
  "بحث مستخدم · ٣٩",
  "سجّل ما رأيت",
  "افتراض",
  "لا ما افترضته",
  "دوّن ما فعله المستخدم، وما قاله، وأين واجه عائقًا.",
  "مرجع: دليل أبحاث المستخدم، بوابة الحكومة البريطانية.",
];

const userLanguageCopy = [
  "لغة الناس · ٤٠",
  "سمِّ الأشياء",
  "كما يسمّيها الناس",
  "يقولونها",
  "يبحثون بها",
  "يفهمونها",
  "تعلّم كلماتهم من البحث، وراجع ما يبحثون عنه، ثم اكتب بعبارات مألوفة وواضحة.",
  "مرجع: دليل أبحاث المستخدم وإرشادات اللغة الواضحة، بوابة الحكومة البريطانية.",
];

const completionRateCopy = [
  "قياس خدمة · ٤١",
  "البدء لا يكفي",
  "المعاملات المكتملة",
  "كل المعاملات التي بدأت",
  "نسبة الإتمام",
  "حدّد بدايةً واضحة ونهايةً واضحة، ثم احسب نسبة من أكملوا المهمة إلى كل من بدأوها.",
  "مرجع: دليل قياس نسبة الإتمام، بوابة الحكومة البريطانية.",
];

const comparativeTestCopy = [
  "تجربة مقارنة · ٤٢",
  "ابدأ بفرضية",
  "النسخة الأصلية",
  "النسخة البديلة",
  "ثم قارن نسختين",
  "قسّم المستخدمين عشوائيًا، وحدّد مقياس النجاح مسبقًا، ثم قارن النتيجة.",
  "مرجع: منهج اختبار نسختين، هيئة الإيرادات والجمارك البريطانية.",
];

const paymentAcceptanceCopy = [
  "دفع رقمي · ٤٣",
  "الدفع الرقمي",
  "لا يعمل وحده",
  "يحتاج نقطة قبول",
  "تصف الاستراتيجية الوطنية للشمول المالي نقص أجهزة الدفع لدى مقدّمي الخدمات بأنه العائق الرئيس للمدفوعات غير النقدية.",
  "المصدر: البنك المركزي العراقي، ٢٠٢٥.",
];

const accountActivityCopy = [
  "استخدام مالي · ٤٤",
  "فتح الحساب",
  "لا يعني استخدامه",
  "في التشخيص الوطني، أفاد ٥٤٪ من أصحاب الحسابات بعدم إجراء معاملة خلال الشهر السابق.",
  "المصدر: الاستراتيجية الوطنية للشمول المالي، البنك المركزي العراقي، ٢٠٢٥.",
];

const serviceContinuityCopy = [
  "استمرارية خدمة · ٤٥",
  "حين تنقطع الكهرباء",
  "انقطاع",
  "هل تكمل خدمتك؟",
  "في مسح منشآت العراق ٢٠٢٢، أفادت ٤١.٣٪ من منشآت القطاع الخاص الرسمية بتعرّضها لانقطاعات كهربائية.",
  "المصدر: مسح منشآت العراق، مجموعة البنك الدولي، ٢٠٢٢.",
];

const marketBeyondStorefrontsCopy = [
  "بحث سوق · ٤٦",
  "لا تبحث عن السوق",
  "في الواجهات فقط",
  "واجهة",
  "منزل",
  "مكان غير ثابت",
  "بغداد · البصرة · النجف · السليمانية",
  "في مسح ٢٠٢١ لأربع مدن عراقية، تراوحت الأعمال غير المسجّلة العاملة من المنازل بين ١٣٪ و٣٥.٢٪، ومن أماكن غير ثابتة بين ٢.٤٪ و٣٠.٧٪ بحسب المدينة.",
  "المصدر: مسح منشآت القطاع غير الرسمي، مجموعة البنك الدولي، ٢٠٢١.",
];

const writtenRecordCopy = [
  "أساس القياس · ٤٧",
  "القياس يبدأ",
  "بسجل مكتوب",
  "موازنة",
  "ربح",
  "خسارة",
  "يشير ملف مسح القطاع غير الرسمي إلى مكاسب محتملة للسجلات المكتوبة في إعداد الموازنة والاحتفاظ بسجل للأرباح أو الخسائر.",
  "المصدر: ملف مدن العراق، مسح منشآت القطاع غير الرسمي، البنك الدولي، ٢٠٢١.",
];

const costlyDecisionRebuildCopy = [
  "سؤال تشغيلي · ٣٠",
  "أي قرار يستهلك",
  "وقت فريقك كل أسبوع؟",
  "سمِّه بكلمتين.",
];

const resultProvenanceRebuildCopy = [
  "مبدأ ثقة · ٢٨",
  "النتيجة بلا مصدر",
  "ليست معرفة",
  "مصدر البيانات",
  "إصدارها",
  "تاريخ تحديثها",
  "١ — سجّل مصدر البيانات، إصدارها، وتاريخ تحديثها.",
];

const readinessQuestionsRebuildCopy = [
  "اختبار جاهزية · ٢ من ٣",
  "السؤالان الأولان",
  "١",
  "هل تتكرّر المهمة؟",
  "٢",
  "هل القرار واضح؟",
  "إن تغيّر القرار كل مرة، وثّق القاعدة أولًا.",
];

const readinessCloseRebuildCopy = [
  "اختبار جاهزية · ٣ من ٣",
  "هل يمكن قياس النتيجة؟",
  "٣",
  "إن كانت الإجابات نعم،",
  "ابدأ صغيرًا.",
  "مسار واحد · فريق واحد · مقياس واحد",
];

const decisionTimeRebuildCopy = [
  "مقياس تشغيلي · ٢٢",
  "قِس زمن القرار",
  "لا عدد النقرات",
  "ابدأ من ظهور الإشارة، وانتهِ عند اتخاذ القرار.",
  "إشارة",
  "قرار",
  "زمن القرار",
];

const candidates: ContinuationCandidate[] = [
  {
    iteration: 23,
    id: "35-ar-local-data-reveals",
    title: "Arabic Iraq-local data editorial",
    exactCopy: localDataCopy,
    sourcePromptSummary: "Native deterministic dot-field editorial built from project typography, canonical logo, and original HTML/SVG; no chart, map, dashboard, stock image, external asset, or professional reference pixel.",
    html: shell(`<main class="canvas" lang="ar" dir="rtl" style="background:linear-gradient(180deg,#F4F8F5 0%,#EEF5F0 100%);color:#003F35">
      <svg aria-hidden="true" viewBox="0 0 1080 650" style="position:absolute;left:0;top:0;width:1080px;height:650px">
        ${dotField()}
        <rect x="756" y="0" width="324" height="650" fill="#F4F8F5" opacity=".74"/>
        <path d="M 792 74 V 554" stroke="#0EDB23" stroke-width="8"/>
        <circle cx="792" cy="74" r="15" fill="#0EDB23"/>
        <circle cx="792" cy="554" r="15" fill="#F4F8F5" stroke="#0EDB23" stroke-width="7"/>
      </svg>
      <section data-copy-region="headline" style="position:absolute;z-index:5;right:68px;top:648px;width:944px;height:550px;text-align:right">
        <div style="font-size:32px;font-weight:700;line-height:1.3;color:#08783F;margin:0 0 28px">ابتكار محلي · ٣٥</div>
        <h1 style="font-size:88px;font-weight:700;line-height:1.06;margin:0;width:900px">
          <span style="display:block;color:#003F35">البيانات المحلية</span>
          <span style="display:block;color:#08783F;margin-top:8px">تُظهر ما كان مبعثرًا</span>
        </h1>
        <p style="font-size:40px;font-weight:400;line-height:1.42;color:#315548;margin:34px 0 0;width:890px">تجمع منصة «آي داتا» بيانات رسمية وتعرضها بصورة تفاعلية للباحثين وروّاد الأعمال وصنّاع السياسات.</p>
        <p style="font-size:34px;font-weight:700;line-height:1.4;color:#08783F;margin:28px 0 0;width:890px">المصدر: برنامج الأمم المتحدة الإنمائي في العراق، ٢٠٢٥.</p>
      </section>
    </main>`, "Local data reveals what was scattered", "#F4F8F5", "#003F35"),
  },
  {
    iteration: 24,
    id: "36-ar-design-for-wider-access",
    title: "Arabic wider-access editorial frame",
    exactCopy: accessibilityCopy,
    sourcePromptSummary: "Native open-frame accessibility editorial built from project typography, canonical logo, and original HTML/SVG; no disability stereotype, simulated assistive interface, Braille, icon set, external asset, or professional reference pixel.",
    html: shell(`<main class="canvas" lang="ar" dir="rtl" style="background:#003F35;color:#F4F8F5">
      <section data-copy-region="headline" style="position:absolute;z-index:5;right:68px;top:68px;width:944px;height:1130px;text-align:right">
        <div style="font-size:32px;font-weight:700;line-height:1.3;color:#77FF70;margin:0 0 24px">وصول رقمي · ٣٦</div>
        <h1 style="font-size:76px;font-weight:700;line-height:1.08;color:#F4F8F5;margin:0;width:900px">صمّم الخدمة الرقمية</h1>
        <div style="position:absolute;right:0;top:270px;width:944px;height:500px">
          <svg aria-hidden="true" viewBox="0 0 944 500" style="position:absolute;inset:0;width:944px;height:500px">
            <path d="M 0 170 V 0 H 330 M 500 0 H 944 V 170 M 944 330 V 500 H 610 M 440 500 H 0 V 330" fill="none" stroke="#F4F8F5" stroke-width="10"/>
            <circle cx="415" cy="0" r="18" fill="#0EDB23"/>
            <circle cx="944" cy="250" r="18" fill="#0EDB23"/>
            <circle cx="525" cy="500" r="18" fill="#0EDB23"/>
            <circle cx="0" cy="250" r="18" fill="#0EDB23"/>
          </svg>
          <div style="position:absolute;right:86px;top:96px;width:772px;text-align:center">
            <div style="font-size:112px;font-weight:700;line-height:1;color:#77FF70">لأوسع نطاق</div>
            <div style="font-size:94px;font-weight:700;line-height:1.05;color:#F4F8F5;margin-top:20px">من الناس</div>
          </div>
        </div>
        <p style="position:absolute;right:0;top:824px;width:900px;font-size:40px;font-weight:400;line-height:1.42;color:#CBE2D2;margin:0">اجعل المحتوى قابلًا للإدراك والتشغيل والفهم، ومتوافقًا مع أدوات المساعدة.</p>
        <p style="position:absolute;right:0;top:1010px;width:900px;font-size:34px;font-weight:700;line-height:1.4;color:#77FF70;margin:0">المصدر: إرشادات إتاحة محتوى الويب ٢.٢، اتحاد شبكة الويب العالمية.</p>
      </section>
    </main>`, "Design digital services for wider access", "#003F35", "#F4F8F5"),
  },
  {
    iteration: 25,
    id: "37-ar-progress-real-unfinished",
    title: "Arabic Iraq human-development documentary editorial",
    exactCopy: humanDevelopmentCopy,
    sourceImage: "human-development-source.png",
    sourcePromptSummary: "Original fictional documentary-style civic-campus photograph generated without references, writing, logos, landmarks, flags, staged corporate gestures, or professional reference pixels; exact Arabic and source added separately in HTML/CSS.",
    html: shell(`<main class="canvas" lang="ar" dir="rtl" style="background:#F4F8F5;color:#003F35">
      <img src="${dataUri("image/png", humanDevelopmentSource)}" alt="" style="position:absolute;inset:0;width:1080px;height:1350px;object-fit:cover"/>
      <div aria-hidden="true" style="position:absolute;left:0;top:0;width:1080px;height:700px;background:linear-gradient(180deg,rgba(244,248,245,.99) 0%,rgba(244,248,245,.92) 52%,rgba(244,248,245,0) 100%)"></div>
      <div aria-hidden="true" style="position:absolute;left:0;bottom:0;width:1080px;height:270px;background:linear-gradient(180deg,rgba(0,63,53,0) 0%,rgba(0,63,53,.92) 72%,#003F35 100%)"></div>
      <section data-copy-region="headline" style="position:absolute;z-index:5;right:68px;top:68px;width:944px;height:1130px;text-align:right">
        <div style="font-size:32px;font-weight:700;line-height:1.3;color:#08783F;margin:0 0 24px">من العراق · ٣٧</div>
        <h1 style="font-size:88px;font-weight:700;line-height:1.04;margin:0;width:900px">
          <span style="display:block;color:#003F35">التقدّم حقيقي</span>
          <span style="display:block;color:#08783F;margin-top:8px">لكنه غير مكتمل</span>
        </h1>
        <p style="font-size:40px;font-weight:400;line-height:1.42;color:#315548;margin:32px 0 0;width:890px">دخل العراق فئة التنمية البشرية المرتفعة في ٢٠٢٤، مع استمرار الفجوات بين المحافظات وبين النساء والرجال.</p>
        <p style="position:absolute;right:0;top:1030px;width:790px;font-size:34px;font-weight:700;line-height:1.4;color:#F4F8F5;margin:0">المصدر: التقرير الوطني للتنمية البشرية في العراق ٢٠٢٥.</p>
      </section>
    </main>`, "Iraq progress is real and unfinished", "#F4F8F5", "#F4F8F5"),
  },
  {
    iteration: 26,
    id: "38-ar-accuracy-not-only-criterion",
    title: "Arabic responsible-AI annotated poster",
    exactCopy: responsibleAiCopy,
    sourcePromptSummary: "Native bright two-column responsible-AI editorial built from project typography, canonical logo, and original HTML/CSS; no robot, brain, circuitry, interface, compliance badge, external asset, or professional reference pixel.",
    html: shell(`<main class="canvas" lang="ar" dir="rtl" style="background:#77FF70;color:#003F35">
      <aside style="position:absolute;left:0;top:0;width:320px;height:1350px;background:#003F35;color:#F4F8F5">
        <div style="position:absolute;right:42px;top:170px;font-size:68px;font-weight:700;line-height:1;color:#77FF70">عدالة</div>
        <div style="position:absolute;right:42px;top:420px;font-size:68px;font-weight:700;line-height:1;color:#F4F8F5">خصوصية</div>
        <div style="position:absolute;right:42px;top:670px;font-size:68px;font-weight:700;line-height:1;color:#77FF70">مساءلة</div>
        <p style="position:absolute;right:42px;top:900px;width:236px;font-size:34px;font-weight:700;line-height:1.42;color:#CBE2D2;margin:0">مرجع: إطار «نيست» لإدارة مخاطر الذكاء الاصطناعي، وتوصية اليونسكو لأخلاقياته.</p>
      </aside>
      <section data-copy-region="headline" style="position:absolute;z-index:5;right:68px;top:68px;width:944px;height:1130px;text-align:right">
        <div style="position:absolute;right:0;top:0;font-size:34px;font-weight:700;line-height:1.3;color:#003F35">ذكاء مسؤول · ٣٨</div>
        <h1 style="position:absolute;right:0;top:214px;width:650px;font-size:116px;font-weight:700;line-height:1.02;color:#003F35;margin:0">
          <span style="display:block">الدقة ليست</span>
          <span style="display:block;margin-top:14px">المعيار الوحيد</span>
        </h1>
        <div aria-hidden="true" style="position:absolute;right:0;top:635px;width:180px;height:10px;background:#003F35"></div>
        <p style="position:absolute;right:0;top:760px;width:640px;font-size:46px;font-weight:400;line-height:1.42;color:#174F3E;margin:0">قيّم العدالة والخصوصية والمساءلة إلى جانب الأداء التقني.</p>
      </section>
    </main>`, "Accuracy is not the only AI criterion", "#77FF70", "#F4F8F5"),
  },
  {
    iteration: 27,
    id: "39-ar-record-observation-not-assumption",
    title: "Arabic user-research correction proof",
    exactCopy: observationCopy,
    sourcePromptSummary: "Native editorial correction-proof poster built from project typography, canonical logo, and original HTML/SVG annotation marks; no sticky-note grid, interview portrait, transcript UI, external asset, or professional reference pixel.",
    html: shell(`<main class="canvas" lang="ar" dir="rtl" style="background:linear-gradient(160deg,#F4F8F5 0%,#EBF4ED 100%);color:#003F35">
      <section data-copy-region="headline" style="position:absolute;z-index:5;right:68px;top:68px;width:944px;height:1130px;text-align:right">
        <div style="position:absolute;right:0;top:0;font-size:34px;font-weight:700;line-height:1.3;color:#08783F">بحث مستخدم · ٣٩</div>
        <p style="position:absolute;left:0;top:0;width:330px;font-size:34px;font-weight:700;line-height:1.4;color:#536E65;margin:0;text-align:left">مرجع: دليل أبحاث المستخدم، بوابة الحكومة البريطانية.</p>
        <h1 style="position:absolute;right:0;top:190px;width:900px;font-size:108px;font-weight:700;line-height:1.04;color:#003F35;margin:0">سجّل ما رأيت</h1>
        <div aria-label="افتراض مشطوب" style="position:absolute;right:0;top:405px;width:900px;height:270px">
          <div style="position:absolute;right:0;top:0;width:900px;font-size:236px;font-weight:700;line-height:1;color:rgba(0,63,53,.14);text-align:center">افتراض</div>
          <svg aria-hidden="true" viewBox="0 0 900 270" style="position:absolute;inset:0;width:900px;height:270px;overflow:visible">
            <path d="M 86 198 C 255 142, 420 152, 806 78" fill="none" stroke="#0EDB23" stroke-width="18" stroke-linecap="round"/>
            <path d="M 92 216 C 280 166, 472 164, 812 96" fill="none" stroke="#08783F" stroke-width="5" stroke-linecap="round" opacity=".72"/>
          </svg>
        </div>
        <div style="position:absolute;right:0;top:700px;width:900px;font-size:82px;font-weight:700;line-height:1.08;color:#08783F">لا ما افترضته</div>
        <p style="position:absolute;right:0;top:900px;width:860px;font-size:44px;font-weight:400;line-height:1.42;color:#315548;margin:0">دوّن ما فعله المستخدم، وما قاله، وأين واجه عائقًا.</p>
      </section>
    </main>`, "Record what you observed, not assumed", "#F4F8F5", "#003F35"),
  },
  {
    iteration: 28,
    id: "40-ar-name-things-as-people-do",
    title: "Arabic people-language street specimen",
    exactCopy: userLanguageCopy,
    sourcePromptSummary: "Native diagonal public-language specimen built from project typography, canonical logo, and original HTML/CSS; no quotation bubble, interface card, sticky note, correction mark, external asset, or professional reference pixel.",
    html: shell(`<main class="canvas" lang="ar" dir="rtl" style="background:#003F35;color:#F4F8F5">
      <section data-copy-region="headline" style="position:absolute;z-index:5;right:68px;top:68px;width:944px;height:1130px;text-align:right">
        <div style="position:absolute;right:0;top:0;font-size:34px;font-weight:700;line-height:1.3;color:#77FF70">لغة الناس · ٤٠</div>
        <h1 style="position:absolute;right:0;top:132px;width:900px;font-size:106px;font-weight:700;line-height:1;color:#F4F8F5;margin:0">سمِّ الأشياء</h1>

        <div aria-hidden="true" style="position:absolute;right:-210px;top:360px;width:1370px;height:330px;background:#F4F8F5;transform:rotate(-7deg);box-shadow:0 26px 0 rgba(14,219,35,.22)"></div>
        <div style="position:absolute;right:12px;top:432px;width:900px;height:220px;transform:rotate(-7deg);display:flex;align-items:center;justify-content:flex-start;overflow:visible">
          <div style="width:100%;font-size:108px;font-weight:700;line-height:1;color:#08783F;white-space:nowrap;text-align:right">كما يسمّيها الناس</div>
        </div>

        <div style="position:absolute;right:0;top:748px;width:900px;display:flex;direction:rtl;align-items:center;justify-content:space-between;color:#77FF70;font-size:42px;font-weight:700;line-height:1">
          <span>يقولونها</span>
          <span aria-hidden="true" style="width:120px;height:4px;background:#0EDB23"></span>
          <span>يبحثون بها</span>
          <span aria-hidden="true" style="width:120px;height:4px;background:#0EDB23"></span>
          <span>يفهمونها</span>
        </div>

        <p style="position:absolute;right:0;top:860px;width:880px;font-size:44px;font-weight:400;line-height:1.42;color:#D8E9DE;margin:0">تعلّم كلماتهم من البحث، وراجع ما يبحثون عنه، ثم اكتب بعبارات مألوفة وواضحة.</p>
        <p style="position:absolute;right:0;top:1054px;width:760px;font-size:34px;font-weight:700;line-height:1.42;color:#77FF70;margin:0">مرجع: دليل أبحاث المستخدم وإرشادات اللغة الواضحة، بوابة الحكومة البريطانية.</p>
      </section>
    </main>`, "Name things as people name them", "#003F35", "#F4F8F5"),
  },
  {
    iteration: 29,
    id: "41-ar-measure-completion-rate",
    title: "Arabic service-completion typographic ledger",
    exactCopy: completionRateCopy,
    sourcePromptSummary: "Native completion-rate ledger built from project typography, canonical logo, and original HTML/CSS; no dashboard, funnel chart, progress bar, receipt scan, external asset, or professional reference pixel.",
    html: shell(`<main class="canvas" lang="ar" dir="rtl" style="background:#F4F8F5;color:#003F35">
      <aside aria-hidden="true" style="position:absolute;left:0;top:0;width:250px;height:1350px;background:#003F35;overflow:hidden">
        <div style="position:absolute;left:0;top:180px;width:250px;font-family:Arial,sans-serif;font-size:210px;font-weight:700;line-height:1;text-align:center;color:#77FF70">÷</div>
        <div style="position:absolute;left:0;top:560px;width:250px;font-family:Arial,sans-serif;font-size:210px;font-weight:700;line-height:1;text-align:center;color:#F4F8F5">=</div>
        <div style="position:absolute;left:52px;top:970px;width:146px;height:8px;background:#0EDB23"></div>
      </aside>

      <section data-copy-region="headline" style="position:absolute;z-index:5;right:68px;top:68px;width:744px;height:1130px;text-align:right">
        <div style="position:absolute;right:0;top:0;font-size:34px;font-weight:700;line-height:1.3;color:#08783F">قياس خدمة · ٤١</div>
        <h1 style="position:absolute;right:0;top:118px;width:744px;font-size:98px;font-weight:700;line-height:1.04;color:#003F35;margin:0">البدء لا يكفي</h1>

        <div style="position:absolute;right:0;top:360px;width:744px;text-align:center;color:#003F35">
          <div style="font-size:61px;font-weight:700;line-height:1.12">المعاملات المكتملة</div>
          <div aria-hidden="true" style="width:690px;height:8px;background:#003F35;margin:34px auto 28px"></div>
          <div style="font-size:55px;font-weight:400;line-height:1.16;color:#315548">كل المعاملات التي بدأت</div>
        </div>

        <div style="position:absolute;right:0;top:680px;width:744px;font-size:104px;font-weight:700;line-height:1;color:#08783F;text-align:center">نسبة الإتمام</div>
        <p style="position:absolute;right:0;top:855px;width:744px;font-size:42px;font-weight:400;line-height:1.42;color:#315548;margin:0">حدّد بدايةً واضحة ونهايةً واضحة، ثم احسب نسبة من أكملوا المهمة إلى كل من بدأوها.</p>
        <p style="position:absolute;right:0;top:1058px;width:744px;font-size:34px;font-weight:700;line-height:1.42;color:#08783F;margin:0">مرجع: دليل قياس نسبة الإتمام، بوابة الحكومة البريطانية.</p>
      </section>
    </main>`, "Starting is not enough; measure completion", "#F4F8F5", "#F4F8F5"),
  },
  {
    iteration: 30,
    id: "42-ar-start-with-hypothesis",
    title: "Arabic controlled-comparison overprint",
    exactCopy: comparativeTestCopy,
    sourcePromptSummary: "Native two-layer controlled-comparison overprint built from project typography, canonical logo, and original HTML/CSS; no split-screen UI, experiment dashboard, sticky notes, external asset, or professional reference pixel.",
    html: shell(`<main class="canvas" lang="ar" dir="rtl" style="background:#003F35;color:#F4F8F5">
      <section data-copy-region="headline" style="position:absolute;z-index:5;right:68px;top:68px;width:944px;height:1130px;text-align:right">
        <div style="position:absolute;right:0;top:0;font-size:34px;font-weight:700;line-height:1.3;color:#77FF70">تجربة مقارنة · ٤٢</div>
        <h1 style="position:absolute;right:0;top:126px;width:900px;font-size:102px;font-weight:700;line-height:1.04;color:#F4F8F5;margin:0">ابدأ بفرضية</h1>

        <div style="position:absolute;right:70px;top:340px;width:820px;height:330px">
          <div style="position:absolute;right:0;top:0;font-size:34px;font-weight:700;line-height:1;color:#CBE2D2">النسخة الأصلية</div>
          <div aria-hidden="true" style="position:absolute;right:18px;top:44px;width:760px;font-size:230px;font-weight:700;line-height:1;color:transparent;-webkit-text-stroke:5px #F4F8F5;opacity:.72;text-align:center">نسخة</div>
          <div style="position:absolute;left:0;top:202px;font-size:34px;font-weight:700;line-height:1;color:#77FF70">النسخة البديلة</div>
          <div aria-hidden="true" style="position:absolute;right:-10px;top:112px;width:760px;font-size:230px;font-weight:700;line-height:1;color:#0EDB23;opacity:.9;text-align:center;mix-blend-mode:screen">نسخة</div>
        </div>

        <div style="position:absolute;right:0;top:690px;width:900px;font-size:80px;font-weight:700;line-height:1.08;color:#F4F8F5">ثم قارن نسختين</div>
        <p style="position:absolute;right:0;top:855px;width:880px;font-size:44px;font-weight:400;line-height:1.42;color:#D8E9DE;margin:0">قسّم المستخدمين عشوائيًا، وحدّد مقياس النجاح مسبقًا، ثم قارن النتيجة.</p>
        <p style="position:absolute;right:0;top:1054px;width:820px;font-size:34px;font-weight:700;line-height:1.42;color:#77FF70;margin:0">مرجع: منهج اختبار نسختين، هيئة الإيرادات والجمارك البريطانية.</p>
      </section>
    </main>`, "Start with a hypothesis, then compare two versions", "#003F35", "#F4F8F5"),
  },
  {
    iteration: 31,
    id: "43-ar-digital-payment-needs-acceptance",
    title: "Arabic Iraq payment-acceptance negative space",
    exactCopy: paymentAcceptanceCopy,
    sourcePromptSummary: "Native negative-space payment-acceptance editorial built from project typography, canonical logo, and original HTML/SVG; no payment brand, card network, merchant photograph, dashboard, external asset, or professional reference pixel.",
    html: shell(`<main class="canvas" lang="ar" dir="rtl" style="background:#F4F8F5;color:#003F35">
      <section data-copy-region="headline" style="position:absolute;z-index:5;right:68px;top:68px;width:944px;height:1130px;text-align:right">
        <div style="position:absolute;right:0;top:0;font-size:34px;font-weight:700;line-height:1.3;color:#08783F">دفع رقمي · ٤٣</div>
        <h1 style="position:absolute;right:0;top:104px;width:900px;font-size:82px;font-weight:700;line-height:1.02;color:#003F35;margin:0">
          <span style="display:block">الدفع الرقمي</span>
          <span style="display:block;color:#08783F;margin-top:8px">لا يعمل وحده</span>
        </h1>

        <div style="position:absolute;right:-68px;top:330px;width:1080px;height:565px;background:#003F35;overflow:hidden">
          <svg aria-hidden="true" viewBox="0 0 1080 565" style="position:absolute;inset:0;width:1080px;height:565px">
            <path d="M 132 72 Q 132 34 170 34 H 425 Q 463 34 463 72 V 455 Q 463 502 416 502 H 179 Q 132 502 132 455 Z" fill="#F4F8F5"/>
            <rect x="178" y="92" width="240" height="136" rx="18" fill="#003F35"/>
            <rect x="200" y="116" width="196" height="88" rx="8" fill="#77FF70" opacity=".9"/>
            <g fill="#003F35">
              <circle cx="210" cy="282" r="16"/><circle cx="298" cy="282" r="16"/><circle cx="386" cy="282" r="16"/>
              <circle cx="210" cy="342" r="16"/><circle cx="298" cy="342" r="16"/><circle cx="386" cy="342" r="16"/>
              <circle cx="210" cy="402" r="16"/><circle cx="298" cy="402" r="16"/><circle cx="386" cy="402" r="16"/>
              <rect x="200" y="450" width="196" height="16" rx="8"/>
            </g>
            <path d="M 108 72 Q 108 10 170 10 H 425 Q 487 10 487 72 V 455 Q 487 526 416 526 H 179 Q 108 526 108 455 Z" fill="none" stroke="#0EDB23" stroke-width="7" stroke-dasharray="18 18" opacity=".9"/>
          </svg>
          <div style="position:absolute;right:68px;top:182px;width:510px;font-size:78px;font-weight:700;line-height:1.08;color:#77FF70;text-align:right">يحتاج نقطة قبول</div>
        </div>

        <p style="position:absolute;right:0;top:938px;width:900px;font-size:40px;font-weight:400;line-height:1.42;color:#315548;margin:0">تصف الاستراتيجية الوطنية للشمول المالي نقص أجهزة الدفع لدى مقدّمي الخدمات بأنه العائق الرئيس للمدفوعات غير النقدية.</p>
        <p style="position:absolute;right:0;top:1100px;width:760px;font-size:34px;font-weight:700;line-height:1.42;color:#08783F;margin:0">المصدر: البنك المركزي العراقي، ٢٠٢٥.</p>
      </section>
    </main>`, "Digital payment needs an acceptance point", "#F4F8F5", "#003F35"),
  },
  {
    iteration: 32,
    id: "44-ar-account-open-not-used",
    title: "Arabic Iraq inactive-account conceptual still life",
    exactCopy: accountActivityCopy,
    sourceImage: "account-activity-source.png",
    sourcePromptSummary: "Original textless conceptual editorial still life generated without references: one transparent circulation loop and one motionless green sphere on mineral surface; no account, card, cash, phone, logo, number, text, barrier, external asset, or professional reference pixel. Exact Arabic added separately in HTML/CSS.",
    html: shell(`<main class="canvas" lang="ar" dir="rtl" style="background:#F4F8F5;color:#003F35">
      <img src="${dataUri("image/png", accountActivitySource)}" alt="" style="position:absolute;inset:0;width:1080px;height:1350px;object-fit:cover;object-position:center center"/>
      <div aria-hidden="true" style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(244,248,245,0) 0%,rgba(244,248,245,.12) 44%,rgba(244,248,245,.88) 78%,rgba(244,248,245,.98) 100%)"></div>
      <div aria-hidden="true" style="position:absolute;left:0;top:0;width:1080px;height:430px;background:linear-gradient(180deg,rgba(244,248,245,.96) 0%,rgba(244,248,245,.78) 60%,rgba(244,248,245,0) 100%)"></div>

      <section data-copy-region="headline" style="position:absolute;z-index:5;right:68px;top:68px;width:944px;height:1130px;text-align:right">
        <div style="position:absolute;right:0;top:0;font-size:34px;font-weight:700;line-height:1.3;color:#08783F">استخدام مالي · ٤٤</div>
        <h1 style="position:absolute;right:0;top:118px;width:820px;font-size:94px;font-weight:700;line-height:1.02;color:#003F35;margin:0">
          <span style="display:block">فتح الحساب</span>
          <span style="display:block;color:#08783F;margin-top:8px">لا يعني استخدامه</span>
        </h1>
        <p style="position:absolute;right:0;top:835px;width:620px;font-size:40px;font-weight:400;line-height:1.42;color:#315548;margin:0">في التشخيص الوطني، أفاد ٥٤٪ من أصحاب الحسابات بعدم إجراء معاملة خلال الشهر السابق.</p>
        <p style="position:absolute;right:0;top:1054px;width:760px;font-size:34px;font-weight:700;line-height:1.42;color:#08783F;margin:0">المصدر: الاستراتيجية الوطنية للشمول المالي، البنك المركزي العراقي، ٢٠٢٥.</p>
      </section>
    </main>`, "Opening an account does not mean using it", "#F4F8F5", "#003F35"),
  },
  {
    iteration: 33,
    id: "45-ar-service-continuity-during-outage",
    title: "Arabic Iraq service-continuity interrupted type",
    exactCopy: serviceContinuityCopy,
    sourcePromptSummary: "Native interrupted-type service-continuity editorial built from project typography, canonical logo, and original HTML/CSS; no socket, lightning bolt, generator, device, dashboard, external asset, generated image, or professional reference pixel.",
    html: shell(`<main class="canvas" lang="ar" dir="rtl" style="background:#003F35;color:#F4F8F5">
      <section data-copy-region="headline" style="position:absolute;z-index:5;right:68px;top:68px;width:944px;height:1130px;text-align:right">
        <div style="position:absolute;right:0;top:0;font-size:34px;font-weight:700;line-height:1.3;color:#77FF70">استمرارية خدمة · ٤٥</div>
        <h1 style="position:absolute;right:0;top:112px;width:900px;font-size:86px;font-weight:700;line-height:1.04;color:#F4F8F5;margin:0">حين تنقطع الكهرباء</h1>

        <div aria-label="انقطاع" style="position:absolute;right:0;top:286px;width:944px;height:330px;overflow:hidden">
          <div style="position:absolute;inset:0;font-size:264px;font-weight:700;line-height:1.18;color:#F4F8F5;text-align:center;clip-path:inset(0 0 80% 0);transform:translateX(-34px)">انقطاع</div>
          <div style="position:absolute;inset:0;font-size:264px;font-weight:700;line-height:1.18;color:#F4F8F5;text-align:center;clip-path:inset(20% 0 60% 0);transform:translateX(42px)">انقطاع</div>
          <div style="position:absolute;inset:0;font-size:264px;font-weight:700;line-height:1.18;color:#F4F8F5;text-align:center;clip-path:inset(40% 0 40% 0);transform:translateX(-68px)">انقطاع</div>
          <div style="position:absolute;inset:0;font-size:264px;font-weight:700;line-height:1.18;color:#F4F8F5;text-align:center;clip-path:inset(60% 0 20% 0);transform:translateX(26px)">انقطاع</div>
          <div style="position:absolute;inset:0;font-size:264px;font-weight:700;line-height:1.18;color:#F4F8F5;text-align:center;clip-path:inset(80% 0 0 0);transform:translateX(-18px)">انقطاع</div>
        </div>

        <div aria-hidden="true" style="position:absolute;right:0;top:624px;width:944px;height:10px;background:#0EDB23"></div>
        <div style="position:absolute;right:0;top:678px;width:900px;font-size:92px;font-weight:700;line-height:1.04;color:#77FF70">هل تكمل خدمتك؟</div>
        <p style="position:absolute;right:0;top:842px;width:890px;font-size:40px;font-weight:400;line-height:1.42;color:#D8E9DE;margin:0">في مسح منشآت العراق ٢٠٢٢، أفادت ٤١.٣٪ من منشآت القطاع الخاص الرسمية بتعرّضها لانقطاعات كهربائية.</p>
        <p style="position:absolute;right:0;top:1056px;width:800px;font-size:34px;font-weight:700;line-height:1.42;color:#77FF70;margin:0">المصدر: مسح منشآت العراق، مجموعة البنك الدولي، ٢٠٢٢.</p>
      </section>
    </main>`, "Will the service continue when power is interrupted?", "#003F35", "#F4F8F5"),
  },
  {
    iteration: 34,
    id: "46-ar-market-beyond-storefronts",
    title: "Arabic Iraq market-research layered premises directory",
    exactCopy: marketBeyondStorefrontsCopy,
    sourcePromptSummary: "Native layered-premises editorial built from project typography, canonical logo, and original HTML/CSS paper geometry; no map, shop illustration, person, storefront photograph, dashboard, external asset, generated image, or professional reference pixel.",
    html: shell(`<main class="canvas" lang="ar" dir="rtl" style="background:radial-gradient(circle at 14% 18%,rgba(119,255,112,.12),transparent 27%),linear-gradient(160deg,#F4F8F5 0%,#EDF4EF 100%);color:#003F35">
      <section data-copy-region="headline" style="position:absolute;z-index:5;right:68px;top:68px;width:944px;height:1130px;text-align:right">
        <div style="position:absolute;right:0;top:0;font-size:34px;font-weight:700;line-height:1.3;color:#08783F">بحث سوق · ٤٦</div>
        <h1 style="position:absolute;right:0;top:102px;width:900px;font-size:82px;font-weight:700;line-height:1.04;color:#003F35;margin:0">
          <span style="display:block">لا تبحث عن السوق</span>
          <span style="display:block;color:#08783F;margin-top:8px">في الواجهات فقط</span>
        </h1>

        <div aria-label="طبقات أماكن العمل" style="position:absolute;right:0;top:330px;width:944px;height:470px">
          <div style="position:absolute;right:72px;top:0;width:680px;height:238px;background:#003F35;box-shadow:0 24px 42px rgba(0,63,53,.16);display:flex;align-items:center;justify-content:center;color:#F4F8F5;font-size:112px;font-weight:700;line-height:1">واجهة</div>
          <div style="position:absolute;right:418px;top:176px;width:480px;height:148px;background:#77FF70;box-shadow:0 18px 32px rgba(0,63,53,.16);transform:rotate(-6deg);display:flex;align-items:center;justify-content:center;color:#003F35;font-size:76px;font-weight:700;line-height:1">منزل</div>
          <div style="position:absolute;right:24px;top:276px;width:650px;height:148px;background:#F4F8F5;border:6px solid #0EDB23;box-shadow:0 18px 32px rgba(0,63,53,.12);transform:rotate(4deg);display:flex;align-items:center;justify-content:center;color:#08783F;font-size:66px;font-weight:700;line-height:1">مكان غير ثابت</div>
        </div>

        <div style="position:absolute;right:0;top:818px;width:900px;font-size:32px;font-weight:700;line-height:1.3;color:#08783F">بغداد · البصرة · النجف · السليمانية</div>
        <p style="position:absolute;right:0;top:882px;width:910px;font-size:36px;font-weight:400;line-height:1.44;color:#315548;margin:0">في مسح ٢٠٢١ لأربع مدن عراقية، تراوحت الأعمال غير المسجّلة العاملة من المنازل بين ١٣٪ و٣٥.٢٪، ومن أماكن غير ثابتة بين ٢.٤٪ و٣٠.٧٪ بحسب المدينة.</p>
        <p style="position:absolute;right:0;top:1072px;width:820px;font-size:34px;font-weight:700;line-height:1.42;color:#08783F;margin:0">المصدر: مسح منشآت القطاع غير الرسمي، مجموعة البنك الدولي، ٢٠٢١.</p>
      </section>
    </main>`, "Do not look for the market only in storefronts", "#F4F8F5", "#003F35"),
  },
  {
    iteration: 35,
    id: "47-ar-measurement-starts-with-record",
    title: "Arabic Iraq written-record archival binding",
    exactCopy: writtenRecordCopy,
    sourcePromptSummary: "Native archival-binding editorial built from project typography, canonical logo, and original HTML/SVG stitch geometry; no ledger table, receipt, dashboard, invented values, external asset, generated image, or professional reference pixel.",
    html: shell(`<main class="canvas" lang="ar" dir="rtl" style="background:linear-gradient(155deg,#F4F8F5 0%,#EAF3EC 100%);color:#003F35">
      <section data-copy-region="headline" style="position:absolute;z-index:5;right:68px;top:68px;width:944px;height:1130px;text-align:right">
        <aside aria-hidden="true" style="position:absolute;right:0;top:0;width:210px;height:1130px;background:#003F35;box-shadow:-18px 0 34px rgba(0,63,53,.12);border-left:8px solid #0EDB23">
          <svg viewBox="0 0 210 1130" style="position:absolute;inset:0;width:210px;height:1130px">
            <g fill="#F4F8F5">
              <circle cx="105" cy="150" r="27"/><circle cx="105" cy="318" r="27"/><circle cx="105" cy="486" r="27"/><circle cx="105" cy="654" r="27"/><circle cx="105" cy="822" r="27"/><circle cx="105" cy="990" r="27"/>
            </g>
            <path d="M 105 94 C 30 148, 180 242, 105 318 C 30 394, 180 410, 105 486 C 30 562, 180 578, 105 654 C 30 730, 180 746, 105 822 C 30 898, 180 914, 105 1038" fill="none" stroke="#77FF70" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </aside>

        <div style="position:absolute;right:260px;top:0;font-size:34px;font-weight:700;line-height:1.3;color:#08783F">أساس القياس · ٤٧</div>
        <h1 style="position:absolute;right:260px;top:112px;width:650px;font-size:96px;font-weight:700;line-height:1.02;color:#003F35;margin:0">
          <span style="display:block">القياس يبدأ</span>
          <span style="display:block;color:#08783F;margin-top:10px">بسجل مكتوب</span>
        </h1>

        <div style="position:absolute;right:260px;top:430px;width:650px;color:#003F35">
          <div style="display:flex;direction:rtl;align-items:center;gap:28px;margin-bottom:58px"><span style="font-size:62px;font-weight:700;line-height:1;width:180px">موازنة</span><span aria-hidden="true" style="display:block;width:410px;height:7px;background:#003F35"></span></div>
          <div style="display:flex;direction:rtl;align-items:center;gap:28px;margin-bottom:58px"><span style="font-size:62px;font-weight:700;line-height:1;width:180px;color:#08783F">ربح</span><span aria-hidden="true" style="display:block;width:410px;height:7px;background:#0EDB23"></span></div>
          <div style="display:flex;direction:rtl;align-items:center;gap:28px"><span style="font-size:62px;font-weight:700;line-height:1;width:180px">خسارة</span><span aria-hidden="true" style="display:block;width:410px;height:7px;background:#003F35"></span></div>
        </div>

        <p style="position:absolute;right:260px;top:812px;width:650px;font-size:38px;font-weight:400;line-height:1.44;color:#315548;margin:0">يشير ملف مسح القطاع غير الرسمي إلى مكاسب محتملة للسجلات المكتوبة في إعداد الموازنة والاحتفاظ بسجل للأرباح أو الخسائر.</p>
        <p style="position:absolute;right:260px;top:1042px;width:650px;font-size:32px;font-weight:700;line-height:1.42;color:#08783F;margin:0">المصدر: ملف مدن العراق، مسح منشآت القطاع غير الرسمي، البنك الدولي، ٢٠٢١.</p>
      </section>
    </main>`, "Measurement starts with a written record", "#F4F8F5", "#003F35"),
  },
  {
    iteration: 36,
    id: "30r-ar-name-costly-decision-time-built-from-decisions",
    title: "Arabic recurring-decision semantic typography rebuild",
    exactCopy: costlyDecisionRebuildCopy,
    sourcePromptSummary: "Native semantic Arabic typography rebuild built from live Ghroob text, canonical logo, and original SVG clipping: the word time is constructed from repeated decision words; no blank form line, clock, calendar, poll UI, external asset, generated image, or professional reference pixel.",
    html: shell(`<main class="canvas" lang="ar" dir="rtl" style="background:#77FF70;color:#003F35">
      <section data-copy-region="headline" style="position:absolute;z-index:5;right:68px;top:68px;width:944px;height:1130px;text-align:right">
        <div style="position:absolute;right:0;top:0;font-size:34px;font-weight:400;line-height:1.3;color:#003F35">سؤال تشغيلي · ٣٠</div>
        <h1 style="position:absolute;right:0;top:112px;width:900px;font-size:82px;font-weight:700;line-height:1.02;color:#003F35;margin:0">
          <span style="display:block">أي قرار يستهلك</span>
          <span style="display:block;margin-top:10px">وقت فريقك كل أسبوع؟</span>
        </h1>

        <svg aria-label="وقت مصنوع من قرارات متكررة" viewBox="0 0 944 460" style="position:absolute;right:0;top:340px;width:944px;height:460px;overflow:visible">
          <defs>
            <clipPath id="time-word-clip">
              <text x="472" y="352" text-anchor="middle" direction="rtl" style="font-family:Ghroob,Arial,sans-serif;font-size:410px;font-weight:700">وقت</text>
            </clipPath>
          </defs>
          <g clip-path="url(#time-word-clip)" style="font-family:Ghroob,Arial,sans-serif;font-size:52px;font-weight:700;direction:rtl">
            <rect x="0" y="0" width="944" height="460" fill="#003F35"/>
            <text x="900" y="60" fill="#F4F8F5">قرار · قرار · قرار · قرار · قرار</text>
            <text x="1010" y="118" fill="#0EDB23">قرار · قرار · قرار · قرار · قرار</text>
            <text x="860" y="176" fill="#F4F8F5">قرار · قرار · قرار · قرار · قرار</text>
            <text x="980" y="234" fill="#0EDB23">قرار · قرار · قرار · قرار · قرار</text>
            <text x="820" y="292" fill="#F4F8F5">قرار · قرار · قرار · قرار · قرار</text>
            <text x="940" y="350" fill="#0EDB23">قرار · قرار · قرار · قرار · قرار</text>
            <text x="880" y="408" fill="#F4F8F5">قرار · قرار · قرار · قرار · قرار</text>
          </g>
          <text x="472" y="352" text-anchor="middle" direction="rtl" fill="none" stroke="#003F35" stroke-width="5" style="font-family:Ghroob,Arial,sans-serif;font-size:410px;font-weight:700">وقت</text>
        </svg>

        <div style="position:absolute;right:0;top:838px;width:900px;font-size:80px;font-weight:700;line-height:1.06;color:#003F35">سمِّه بكلمتين.</div>
        <div aria-hidden="true" style="position:absolute;right:0;top:982px;width:450px;display:flex;direction:rtl;gap:28px;align-items:center">
          <span style="display:block;width:250px;height:12px;background:#003F35"></span>
          <span style="display:block;width:150px;height:12px;background:#003F35"></span>
        </div>
      </section>
    </main>`, "Name the recurring decision consuming team time", "#77FF70", "#003F35"),
  },
  {
    iteration: 37,
    id: "28r-ar-result-needs-provenance-registration",
    title: "Arabic provenance registration typography rebuild",
    exactCopy: resultProvenanceRebuildCopy,
    sourcePromptSummary: "Native editorial typography rebuild using live Ghroob text and original CSS/SVG registration geometry: source, version, and update layers converge to register the word knowledge; no mock document, database icon, chain diagram, external asset, generated image, or professional reference pixel.",
    html: shell(`<main class="canvas" lang="ar" dir="rtl" style="background:#003F35;color:#F4F8F5">
      <section data-copy-region="headline" style="position:absolute;z-index:5;right:68px;top:68px;width:944px;height:1130px;text-align:right">
        <div style="position:absolute;right:0;top:0;font-size:34px;font-weight:400;line-height:1.3;color:#77FF70">مبدأ ثقة · ٢٨</div>
        <h1 style="position:absolute;right:0;top:108px;width:900px;font-size:94px;font-weight:700;line-height:1.02;color:#F4F8F5;margin:0">
          <span style="display:block">النتيجة بلا مصدر</span>
          <span style="display:block;color:#77FF70;margin-top:8px">ليست معرفة</span>
        </h1>

        <div aria-label="طبقات التوثيق تسجّل كلمة معرفة" style="position:absolute;right:0;top:356px;width:944px;height:468px;overflow:hidden;border-top:2px solid rgba(244,248,245,.32);border-bottom:2px solid rgba(244,248,245,.32)">
          <div style="position:absolute;right:24px;top:20px;font-size:250px;font-weight:700;line-height:1;color:transparent;-webkit-text-stroke:3px rgba(244,248,245,.35);transform:translate(28px,-8px)">معرفة</div>
          <div style="position:absolute;right:24px;top:20px;font-size:250px;font-weight:700;line-height:1;color:transparent;-webkit-text-stroke:3px #0EDB23;transform:translate(14px,4px)">معرفة</div>
          <div style="position:absolute;right:24px;top:20px;font-size:250px;font-weight:700;line-height:1;color:#F4F8F5">معرفة</div>

          <div style="position:absolute;right:0;top:292px;width:944px;height:128px;display:grid;grid-template-columns:1.28fr .72fr 1fr;direction:rtl;gap:8px">
            <div style="background:#77FF70;color:#003F35;padding:24px 28px;font-size:38px;font-weight:700;line-height:1.05">مصدر البيانات</div>
            <div style="background:#0EDB23;color:#003F35;padding:24px 24px;font-size:38px;font-weight:700;line-height:1.05">إصدارها</div>
            <div style="border:3px solid #77FF70;color:#F4F8F5;padding:21px 24px;font-size:38px;font-weight:700;line-height:1.05">تاريخ تحديثها</div>
          </div>

          <svg aria-hidden="true" viewBox="0 0 944 468" style="position:absolute;inset:0;width:944px;height:468px;pointer-events:none">
            <line x1="72" y1="66" x2="872" y2="66" stroke="#77FF70" stroke-width="3" stroke-dasharray="12 12" opacity=".62"/>
            <circle cx="72" cy="66" r="14" fill="#003F35" stroke="#77FF70" stroke-width="4"/>
            <circle cx="872" cy="66" r="14" fill="#003F35" stroke="#77FF70" stroke-width="4"/>
            <line x1="472" y1="44" x2="472" y2="284" stroke="#77FF70" stroke-width="3" stroke-dasharray="12 12" opacity=".62"/>
            <circle cx="472" cy="66" r="7" fill="#77FF70"/>
          </svg>
        </div>

        <p style="position:absolute;right:0;top:874px;width:880px;font-size:44px;font-weight:400;line-height:1.4;color:#D7E7DF;margin:0"><span style="color:#77FF70;font-weight:700">١ —</span> سجّل مصدر البيانات، إصدارها، وتاريخ تحديثها.</p>
      </section>
    </main>`, "A result needs registered provenance", "#003F35", "#F4F8F5"),
  },
  {
    iteration: 38,
    id: "43r-ar-digital-payment-needs-acceptance-handoff",
    title: "Arabic digital payment acceptance handoff rebuild",
    exactCopy: paymentAcceptanceCopy,
    sourcePromptSummary: "Native Arabic typographic handoff rebuild using live Ghroob text and original SVG geometry: payment and acceptance are separated until one bright acceptance point closes the path; no terminal, card, QR code, app screen, currency, external asset, generated image, or professional reference pixel.",
    html: shell(`<main class="canvas" lang="ar" dir="rtl" style="background:#F4F8F5;color:#003F35">
      <section data-copy-region="headline" style="position:absolute;z-index:5;right:68px;top:68px;width:944px;height:1130px;text-align:right">
        <div style="position:absolute;right:0;top:0;font-size:34px;font-weight:400;line-height:1.3;color:#08783F">دفع رقمي · ٤٣</div>
        <h1 style="position:absolute;right:0;top:102px;width:900px;font-size:88px;font-weight:700;line-height:1.02;color:#003F35;margin:0">
          <span style="display:block">الدفع الرقمي</span>
          <span style="display:block;color:#08783F;margin-top:8px">لا يعمل وحده</span>
        </h1>

        <div aria-label="نقطة قبول تكمل المسار بين الدفع والقبول" style="position:absolute;right:0;top:330px;width:944px;height:490px;background:#003F35;overflow:hidden">
          <svg viewBox="0 0 944 490" aria-hidden="true" style="position:absolute;inset:0;width:944px;height:490px">
            <defs>
              <radialGradient id="acceptance-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0" stop-color="#F4F8F5" stop-opacity="1"/>
                <stop offset=".24" stop-color="#77FF70" stop-opacity="1"/>
                <stop offset=".62" stop-color="#0EDB23" stop-opacity=".44"/>
                <stop offset="1" stop-color="#0EDB23" stop-opacity="0"/>
              </radialGradient>
            </defs>
            <path d="M 820 247 C 710 247, 650 247, 548 247" fill="none" stroke="#77FF70" stroke-width="14" stroke-linecap="round"/>
            <path d="M 396 247 C 294 247, 234 247, 124 247" fill="none" stroke="#F4F8F5" stroke-width="14" stroke-linecap="round"/>
            <circle cx="472" cy="247" r="104" fill="url(#acceptance-glow)"/>
            <circle cx="472" cy="247" r="50" fill="#77FF70" stroke="#F4F8F5" stroke-width="6"/>
            <circle cx="472" cy="247" r="14" fill="#003F35"/>
            <circle cx="472" cy="247" r="74" fill="none" stroke="#77FF70" stroke-width="3" stroke-dasharray="8 12"/>
            <path d="M 472 96 L 472 168 M 472 326 L 472 398" stroke="#77FF70" stroke-width="3" stroke-dasharray="8 10"/>
          </svg>
          <div style="position:absolute;right:64px;top:134px;width:300px;font-size:122px;font-weight:700;line-height:1;color:#77FF70;text-align:right">دفع</div>
          <div style="position:absolute;left:64px;top:134px;width:300px;font-size:122px;font-weight:700;line-height:1;color:#F4F8F5;text-align:left">قبول</div>
          <div style="position:absolute;right:351px;top:40px;width:242px;text-align:center;font-size:30px;font-weight:400;line-height:1.2;color:#77FF70">نقطة</div>
          <div style="position:absolute;right:351px;bottom:34px;width:242px;text-align:center;font-size:30px;font-weight:400;line-height:1.2;color:#F4F8F5">تُكمل المسار</div>
        </div>

        <div style="position:absolute;right:0;top:842px;width:944px;background:#77FF70;color:#003F35;padding:22px 30px 26px;font-size:64px;font-weight:700;line-height:1.05">يحتاج نقطة قبول</div>
        <p style="position:absolute;right:0;top:962px;width:944px;font-size:34px;font-weight:400;line-height:1.38;color:#315548;margin:0">تصف الاستراتيجية الوطنية للشمول المالي نقص أجهزة الدفع لدى مقدّمي الخدمات بأنه العائق الرئيس للمدفوعات غير النقدية.</p>
        <p style="position:absolute;right:0;top:1088px;width:944px;font-size:32px;font-weight:700;line-height:1.35;color:#08783F;margin:0">المصدر: البنك المركزي العراقي، ٢٠٢٥.</p>
      </section>
    </main>`, "Digital payment needs an acceptance handoff", "#F4F8F5", "#003F35"),
  },
  {
    iteration: 39,
    id: "20r-ar-readiness-repetition-meets-clarity",
    title: "Arabic readiness repetition and clarity intersection rebuild",
    exactCopy: readinessQuestionsRebuildCopy,
    sourcePromptSummary: "Native Arabic diagnostic poster using live Ghroob text and original SVG geometry: a repetition loop intersects a direct clarity axis so the two questions become one visual test; no question cards, checklist, dashboard, external asset, generated image, or professional reference pixel.",
    html: shell(`<main class="canvas" lang="ar" dir="rtl" style="background:#77FF70;color:#003F35">
      <section data-copy-region="headline" style="position:absolute;z-index:5;right:68px;top:68px;width:944px;height:1130px;text-align:right">
        <div style="position:absolute;right:0;top:0;font-size:34px;font-weight:400;line-height:1.3;color:#003F35">اختبار جاهزية · ٢ من ٣</div>
        <h1 style="position:absolute;right:0;top:102px;width:900px;font-size:98px;font-weight:700;line-height:1;color:#003F35;margin:0">السؤالان الأولان</h1>

        <div aria-label="حلقة التكرار يقطعها محور وضوح القرار" style="position:absolute;right:0;top:286px;width:944px;height:658px;background:#F4F8F5;overflow:hidden;border:4px solid #003F35">
          <svg viewBox="0 0 944 658" aria-hidden="true" style="position:absolute;inset:0;width:944px;height:658px">
            <circle cx="472" cy="330" r="258" fill="none" stroke="#003F35" stroke-width="64"/>
            <circle cx="472" cy="330" r="258" fill="none" stroke="#0EDB23" stroke-width="10" stroke-dasharray="22 18" stroke-linecap="butt"/>
            <path d="M 72 512 L 872 146" fill="none" stroke="#77FF70" stroke-width="98" stroke-linecap="square"/>
            <path d="M 72 512 L 872 146" fill="none" stroke="#003F35" stroke-width="4"/>
            <circle cx="472" cy="330" r="44" fill="#003F35" stroke="#F4F8F5" stroke-width="8"/>
            <circle cx="472" cy="330" r="10" fill="#77FF70"/>
          </svg>

          <div style="position:absolute;z-index:2;right:282px;top:100px;width:380px;text-align:center;color:#003F35">
            <div style="font-size:34px;font-weight:400;line-height:1;color:#08783F">١</div>
            <div style="margin-top:12px;font-size:52px;font-weight:700;line-height:1.04">هل تتكرّر المهمة؟</div>
          </div>

          <div style="position:absolute;z-index:2;right:262px;top:430px;width:420px;text-align:center;color:#003F35">
            <div style="font-size:30px;font-weight:400;line-height:1;color:#08783F">٢</div>
            <div style="margin-top:12px;font-size:46px;font-weight:700;line-height:1.04">هل القرار واضح؟</div>
          </div>
        </div>

        <p style="position:absolute;right:0;top:984px;width:900px;font-size:48px;font-weight:700;line-height:1.34;color:#003F35;margin:0">إن تغيّر القرار كل مرة، وثّق القاعدة أولًا.</p>
      </section>
    </main>`, "Readiness begins where repetition meets clarity", "#77FF70", "#003F35"),
  },
  {
    iteration: 40,
    id: "21r-ar-readiness-three-commitments-converge-small",
    title: "Arabic readiness small-start convergence rebuild",
    exactCopy: readinessCloseRebuildCopy,
    sourcePromptSummary: "Native Arabic convergence poster using live Ghroob text and original SVG geometry: three broad operating commitments narrow into one small start point; no result card, giant numeral, checklist, funnel icon, external asset, generated image, or professional reference pixel.",
    html: shell(`<main class="canvas" lang="ar" dir="rtl" style="background:#F4F8F5;color:#003F35">
      <section data-copy-region="headline" style="position:absolute;z-index:5;right:68px;top:68px;width:944px;height:1130px;text-align:right">
        <div style="position:absolute;right:0;top:0;font-size:34px;font-weight:400;line-height:1.3;color:#08783F">اختبار جاهزية · ٣ من ٣</div>
        <h1 style="position:absolute;right:0;top:102px;width:900px;font-size:92px;font-weight:700;line-height:1.02;color:#003F35;margin:0">هل يمكن قياس النتيجة؟</h1>

        <div aria-label="ثلاثة التزامات تتقارب إلى بداية صغيرة" style="position:absolute;right:0;top:278px;width:944px;height:590px;background:#003F35;overflow:hidden">
          <svg viewBox="0 0 944 590" aria-hidden="true" style="position:absolute;inset:0;width:944px;height:590px">
            <polygon points="914,62 914,176 148,274 148,240" fill="#77FF70"/>
            <polygon points="914,236 914,350 148,308 148,274" fill="#0EDB23"/>
            <polygon points="914,410 914,524 148,342 148,308" fill="#F4F8F5"/>
            <line x1="914" y1="62" x2="148" y2="240" stroke="#003F35" stroke-width="3" opacity=".55"/>
            <line x1="914" y1="350" x2="148" y2="308" stroke="#003F35" stroke-width="3" opacity=".55"/>
            <rect x="108" y="256" width="80" height="80" fill="#77FF70" stroke="#F4F8F5" stroke-width="8"/>
            <rect x="132" y="280" width="32" height="32" fill="#003F35"/>
          </svg>

          <div style="position:absolute;right:48px;top:128px;width:200px;font-size:38px;font-weight:700;line-height:1;color:#003F35">مسار واحد</div>
          <div style="position:absolute;right:48px;top:264px;width:200px;font-size:38px;font-weight:700;line-height:1;color:#003F35">فريق واحد</div>
          <div style="position:absolute;right:48px;top:410px;width:200px;font-size:38px;font-weight:700;line-height:1;color:#003F35">مقياس واحد</div>
        </div>

        <div style="position:absolute;right:0;top:900px;font-size:36px;font-weight:400;line-height:1.2;color:#315548">إن كانت الإجابات نعم،</div>
        <div style="position:absolute;right:0;top:986px;font-size:94px;font-weight:700;line-height:1;color:#003F35">ابدأ صغيرًا.</div>
        <div style="position:absolute;right:0;top:1110px;font-size:36px;font-weight:700;line-height:1.3;color:#08783F">مسار واحد · فريق واحد · مقياس واحد</div>
      </section>
    </main>`, "Three commitments converge into one small start", "#F4F8F5", "#003F35"),
  },
  {
    iteration: 41,
    id: "22r-ar-decision-time-signal-to-decision-corridor",
    title: "Arabic signal-to-decision temporal corridor rebuild",
    exactCopy: decisionTimeRebuildCopy,
    sourcePromptSummary: "Native Arabic perspective corridor using live Ghroob text and original SVG geometry: a small signal at the vanishing point travels through expanding frames to a visible decision boundary, making elapsed decision time spatial rather than a basic timeline; no stopwatch, chart, dashboard, value, external asset, generated image, or professional reference pixel.",
    html: shell(`<main class="canvas" lang="ar" dir="rtl" style="background:#003F35;color:#F4F8F5">
      <section data-copy-region="headline" style="position:absolute;z-index:5;right:68px;top:68px;width:944px;height:1130px;text-align:right">
        <div style="position:absolute;right:0;top:0;font-size:34px;font-weight:400;line-height:1.3;color:#77FF70">مقياس تشغيلي · ٢٢</div>
        <h1 style="position:absolute;right:0;top:102px;width:900px;font-size:96px;font-weight:700;line-height:1.02;color:#F4F8F5;margin:0">
          <span style="display:block">قِس زمن القرار</span>
          <span style="display:block;color:#77FF70;margin-top:8px">لا عدد النقرات</span>
        </h1>

        <p style="position:absolute;right:0;top:332px;width:900px;font-size:40px;font-weight:400;line-height:1.35;color:#D7E7DF;margin:0">ابدأ من ظهور الإشارة، وانتهِ عند اتخاذ القرار.</p>

        <div aria-label="ممر زمني من الإشارة إلى القرار" style="position:absolute;right:0;top:430px;width:944px;height:650px;background:#F4F8F5;overflow:hidden">
          <svg viewBox="0 0 944 650" aria-hidden="true" style="position:absolute;inset:0;width:944px;height:650px">
            <polygon points="886,325 86,72 86,578" fill="#E2EEE7"/>
            <polygon points="886,325 86,150 86,500" fill="#C8DDD1"/>
            <polygon points="886,325 86,228 86,422" fill="#003F35"/>
            <line x1="886" y1="325" x2="86" y2="72" stroke="#77FF70" stroke-width="6"/>
            <line x1="886" y1="325" x2="86" y2="578" stroke="#77FF70" stroke-width="6"/>
            <line x1="718" y1="272" x2="718" y2="378" stroke="#0EDB23" stroke-width="5"/>
            <line x1="566" y1="224" x2="566" y2="426" stroke="#0EDB23" stroke-width="7"/>
            <line x1="402" y1="172" x2="402" y2="478" stroke="#0EDB23" stroke-width="9"/>
            <line x1="234" y1="119" x2="234" y2="531" stroke="#0EDB23" stroke-width="11"/>
            <line x1="86" y1="72" x2="86" y2="578" stroke="#003F35" stroke-width="24"/>
            <line x1="118" y1="325" x2="870" y2="325" stroke="#77FF70" stroke-width="14" stroke-linecap="round"/>
            <circle cx="886" cy="325" r="34" fill="#77FF70" stroke="#003F35" stroke-width="8"/>
            <circle cx="886" cy="325" r="8" fill="#003F35"/>
            <rect x="66" y="279" width="40" height="92" fill="#77FF70"/>
          </svg>

          <div style="position:absolute;right:14px;top:184px;width:170px;text-align:right;font-size:36px;font-weight:700;line-height:1;color:#003F35">إشارة</div>
          <div style="position:absolute;right:286px;top:264px;width:372px;text-align:center;font-size:44px;font-weight:700;line-height:1;color:#003F35;background:#77FF70;padding:20px 30px 23px">زمن القرار</div>
        </div>
        <div style="position:absolute;left:0;top:1102px;width:180px;text-align:left;direction:rtl;font-size:46px;font-weight:700;line-height:1;color:#F4F8F5">قرار</div>
      </section>
    </main>`, "Measure the corridor from signal to decision", "#003F35", "#F4F8F5"),
  },
];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });

try {
  for (const candidate of candidates) {
    const iterationRoot = `${runRoot}iteration-${String(candidate.iteration).padStart(2, "0")}/`;
    const sourceBytes = candidate.sourceImage ? await readFile(`${iterationRoot}${candidate.sourceImage}`) : null;
    await mkdir(`${iterationRoot}mobile`, { recursive: true });
    await page.setContent(candidate.html, { waitUntil: "load" });
    await page.evaluate(async () => document.fonts.ready);
    const technical = await page.evaluate((copy) => {
      const text = document.body.innerText;
      const region = document.querySelector<HTMLElement>("[data-copy-region='headline']");
      const bounds = region?.getBoundingClientRect();
      return {
        documentLanguage: document.documentElement.lang,
        documentDirection: document.documentElement.dir,
        fontLoadedRegular: document.fonts.check("400 40px Ghroob"),
        fontLoadedBold: document.fonts.check("700 88px Ghroob"),
        exactCopyPresent: copy.every((line) => text.includes(line)),
        copyRegionWithinCanvas: Boolean(bounds && bounds.left >= 0 && bounds.top >= 0 && bounds.right <= 1080 && bounds.bottom <= 1350),
        copyRegionBounds: bounds ? { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height } : null,
      };
    }, candidate.exactCopy);

    if (!technical.fontLoadedRegular || !technical.fontLoadedBold || !technical.exactCopyPresent || !technical.copyRegionWithinCanvas) {
      throw new Error(`Technical Arabic render preflight failed for ${candidate.id}: ${JSON.stringify(technical)}`);
    }

    const outputFile = `${candidate.id}.png`;
    const mobileFile = `mobile/${candidate.id}.png`;
    await page.screenshot({ path: `${iterationRoot}${outputFile}`, type: "png", animations: "disabled" });
    await writeFile(`${iterationRoot}${candidate.id}.html`, candidate.html, "utf8");
    await execFileAsync("magick", [`${iterationRoot}${outputFile}`, "-filter", "Lanczos", "-resize", "324x405!", `${iterationRoot}${mobileFile}`]);

    const [outputBytes, mobileBytes] = await Promise.all([
      readFile(`${iterationRoot}${outputFile}`),
      readFile(`${iterationRoot}${mobileFile}`),
    ]);
    const manifest = {
      schemaVersion: "1.0.0",
      iteration: candidate.iteration,
      generatedAt: new Date().toISOString(),
      status: "PIXEL_REVIEW_REQUIRED",
      publicationEligible: false,
      candidate: {
        id: candidate.id,
        title: candidate.title,
        language: "ar",
        canvas: { width: 1080, height: 1350 },
        mobileReview: { width: 324, height: 405 },
        exactCopy: candidate.exactCopy,
        file: outputFile,
        sha256: sha256(outputBytes),
        byteLength: outputBytes.byteLength,
        mobileFile,
        mobileSha256: sha256(mobileBytes),
        sourceImage: candidate.sourceImage ?? null,
        sourceImageSha256: sourceBytes ? sha256(sourceBytes) : null,
        sourcePromptSummary: candidate.sourcePromptSummary,
        rawProfessionalReferencePixelsSuppliedToGeneration: false,
        fontEvidence: {
          family: "Ghroob Arabic ITF",
          regularSha256: sha256(arabicRegular),
          boldSha256: sha256(arabicBold),
        },
        technicalPreflight: technical,
      },
    };
    await writeFile(`${iterationRoot}manifest.json`, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  }
} finally {
  await browser.close();
}

console.log(`Rendered ${candidates.length} continuation candidate(s).`);
