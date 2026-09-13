import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { renderCanonicalHorizontalLogo } from "../packages/engine/src/creative";

const execFileAsync = promisify(execFile);
const root = fileURLToPath(new URL("../", import.meta.url));
const runRoot = `${root}artifacts/creative-rebuild/image-led-20-loop-2026-08-30/`;
const sourceRoot = `${runRoot}source-images/`;
const sha256 = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");
const dataUri = (mime: string, bytes: Uint8Array) => `data:${mime};base64,${Buffer.from(bytes).toString("base64")}`;

const [arabicRegular, arabicBold] = await Promise.all([
  readFile(`${root}apps/web/src/app/fonts/GhroobArabicITF-Regular.otf`),
  readFile(`${root}apps/web/src/app/fonts/GhroobArabicITF-Bold.otf`),
]);

type Layout = "cinematic" | "image-top" | "side-panel" | "framed";
interface Candidate {
  number: number;
  id: string;
  source: string;
  label: string;
  headline: string[];
  support: string;
  layout: Layout;
  focal: string;
  imagePosition: string;
  theme: "dark" | "light";
  accentTreatment: "edge" | "index" | "rule" | "window";
}

const candidates: Candidate[] = [
  { number: 1, id: "img20-01-remove-ambiguity", source: "01-remove-ambiguity.png", label: "وضوح قبل الذكاء", headline: ["احذف الغموض", "قبل أن تضيف الذكاء"], support: "القاعدة الواضحة تصنع نظامًا أذكى من طبقة تقنية فوق مسار مرتبك.", layout: "cinematic", focal: "فكرة واحدة · فعل واضح", imagePosition: "center center", theme: "dark", accentTreatment: "edge" },
  { number: 2, id: "img20-02-service-before-screen", source: "02-service-before-screen.png", label: "تجربة خدمة", headline: ["الخدمة تبدأ", "قبل الشاشة"], support: "ما يحدث قبل الدخول يحدد إن كانت الواجهة ستختصر الطريق أم تخفي تعقيده.", layout: "side-panel", focal: "قبل الواجهة", imagePosition: "center center", theme: "dark", accentTreatment: "window" },
  { number: 3, id: "img20-03-silence-is-data", source: "03-silence-is-data.png", label: "بحث نوعي", headline: ["الصمت في المقابلة", "معلومة"], support: "لا تملأ الفراغ سريعًا؛ أحيانًا يكشف التردد ما لا تقوله الإجابة الجاهزة.", layout: "cinematic", focal: "اترك الصمت يعمل", imagePosition: "center center", theme: "dark", accentTreatment: "index" },
  { number: 4, id: "img20-04-name-uncertainty", source: "04-name-uncertainty.png", label: "قرار مسؤول", headline: ["سمِّ عدم اليقين", "قبل أن تخفيه"], support: "حين يصبح الشك مرئيًا، يعرف الفريق ما يحتاج إلى اختبار لا إلى تبرير.", layout: "image-top", focal: "وضوح الشك", imagePosition: "center center", theme: "light", accentTreatment: "edge" },
  { number: 5, id: "img20-05-old-data", source: "05-old-data.png", label: "بيانات تشغيلية", headline: ["البيانات القديمة", "تؤخّر القرار"], support: "صلاحية المعلومة جزء من دقتها؛ سجّل زمنها قبل أن تبني عليها فعلًا.", layout: "framed", focal: "عمر المعلومة", imagePosition: "center center", theme: "light", accentTreatment: "rule" },
  { number: 6, id: "img20-06-risky-assumption", source: "06-risky-assumption.png", label: "فرضية حرجة", headline: ["اختبر الافتراض الأخطر", "أولًا"], support: "ابدأ بما قد يُسقط القرار كله، لا بما يسهل إثباته.", layout: "side-panel", focal: "اختبر نقطة السقوط", imagePosition: "center center", theme: "dark", accentTreatment: "window" },
  { number: 7, id: "img20-07-simple-interface", source: "07-simple-interface.png", label: "تصميم خدمة", headline: ["الواجهة البسيطة", "تخفي قرارات كثيرة"], support: "البساطة الجيدة نتيجة عمل منظم خلفها، لا نقصًا في التفاصيل.", layout: "image-top", focal: "البساطة لها بنية", imagePosition: "center center", theme: "light", accentTreatment: "edge" },
  { number: 8, id: "img20-08-listening", source: "08-listening.png", label: "إنصات فعّال", headline: ["الاستماع", "ليس انتظار دورك للكلام"], support: "اترك مساحة للفكرة أن تكتمل قبل أن تحوّل الحوار إلى ردّ.", layout: "cinematic", focal: "مساحة للفكرة", imagePosition: "center center", theme: "dark", accentTreatment: "index" },
  { number: 9, id: "img20-09-what-changed", source: "09-what-changed.png", label: "تقرير أثر", headline: ["اكتب ما تغيّر", "لا ما أنجزته"], support: "النشاط يصف جهدك؛ التغيّر يصف ما أصبح مختلفًا للناس أو للعمل.", layout: "side-panel", focal: "من الجهد إلى الأثر", imagePosition: "center center", theme: "dark", accentTreatment: "rule" },
  { number: 10, id: "img20-10-delete-step", source: "10-delete-step.png", label: "تبسيط مسار", headline: ["أفضل أتمتة", "قد تبدأ بحذف خطوة"], support: "لا تسرّع خطوة لا يحتاجها أحد؛ أزلها أولًا ثم أتمت ما بقي.", layout: "framed", focal: "الحذف قرار تصميم", imagePosition: "center center", theme: "light", accentTreatment: "window" },
  { number: 11, id: "img20-11-quality-edge", source: "11-quality-edge.png", label: "جودة نظام", headline: ["الجودة تظهر", "عند الحافة"], support: "اختبر الانتقال، والانقطاع، والاستثناء؛ هناك يكشف النظام حقيقته.", layout: "cinematic", focal: "دقّة عند الحد", imagePosition: "center center", theme: "dark", accentTreatment: "edge" },
  { number: 12, id: "img20-12-learning-practice", source: "12-learning-practice.png", label: "تعلّم مؤسسي", headline: ["التعلّم لا يدخل", "من باب التقرير"], support: "يتحوّل الدرس إلى قدرة حين يغادر الصفحة ويغيّر الممارسة.", layout: "side-panel", focal: "من الصفحة إلى الممارسة", imagePosition: "center center", theme: "dark", accentTreatment: "index" },
  { number: 13, id: "img20-13-one-service", source: "13-one-service.png", label: "استمرارية خدمة", headline: ["المستخدم لا يرى", "هيكلك التنظيمي"], support: "هو يرى خدمة واحدة؛ صمّم انتقالاتها كما لو أن الحدود الداخلية غير موجودة.", layout: "image-top", focal: "رحلة واحدة", imagePosition: "center center", theme: "light", accentTreatment: "rule" },
  { number: 14, id: "img20-14-reversible-decision", source: "14-reversible-decision.png", label: "سرعة قرار", headline: ["القرار القابل للعكس", "لا يحتاج موكبًا"], support: "خفّف مراسم القرار عندما تستطيع الرجوع؛ واحتفظ بالثقل لما لا يمكن عكسه.", layout: "framed", focal: "ارجع دون كلفة كبيرة", imagePosition: "center center", theme: "light", accentTreatment: "window" },
  { number: 15, id: "img20-15-record-reason", source: "15-record-reason.png", label: "ذاكرة قرار", headline: ["سجّل سبب القرار", "قبل نتيجته"], support: "النتيجة اللاحقة قد تعيد كتابة الذاكرة؛ السبب المسجّل يحفظ منطق اللحظة.", layout: "cinematic", focal: "احفظ منطق اللحظة", imagePosition: "center center", theme: "dark", accentTreatment: "edge" },
  { number: 16, id: "img20-16-repetition-visible", source: "16-repetition-visible.png", label: "إشارة تشغيلية", headline: ["ما يتكرر بصمت", "يستحق أن يُرى"], support: "التكرار غير المرئي يستهلك الوقت؛ ارفعه إلى السطح قبل أن يصبح عادة مكلفة.", layout: "framed", focal: "اكشف النمط", imagePosition: "center center", theme: "light", accentTreatment: "index" },
  { number: 17, id: "img20-17-question-measure", source: "17-question-measure.png", label: "منطق قياس", headline: ["إذا تغيّر السؤال", "تغيّر القياس"], support: "لا تورّث المقياس من تقرير سابق؛ اربطه بالقرار الذي تريد تحسينه الآن.", layout: "side-panel", focal: "السياق يختار المقياس", imagePosition: "center center", theme: "dark", accentTreatment: "rule" },
  { number: 18, id: "img20-18-impact-before-launch", source: "18-impact-before-launch.png", label: "تصميم أثر", headline: ["الأثر لا يبدأ", "عند الإطلاق"], support: "يبنيه ما سبق الإطلاق: فهم المشكلة، وتجربة الفرضية، والاستعداد للتعلّم.", layout: "cinematic", focal: "ما قبل الظهور", imagePosition: "center center", theme: "dark", accentTreatment: "window" },
  { number: 19, id: "img20-19-ownership", source: "19-ownership.png", label: "ملكية واضحة", headline: ["ما لا يملكه أحد", "لن يتحسّن"], support: "سمِّ مالك المشكلة وحدّد مساحة قراره قبل أن تطلب نتيجة أفضل.", layout: "side-panel", focal: "مسؤولية لها اسم", imagePosition: "center center", theme: "dark", accentTreatment: "edge" },
  { number: 20, id: "img20-20-evidence-action", source: "20-evidence-action.png", label: "دليل قابل للاستخدام", headline: ["الدليل الذي لا يغيّر قرارًا", "مجرّد أرشيف"], support: "صمّم الدليل ليدخل لحظة القرار، لا ليزداد عدد الملفات.", layout: "cinematic", focal: "من التخزين إلى الفعل", imagePosition: "center center", theme: "dark", accentTreatment: "index" },
];

function decor(candidate: Candidate) {
  if (candidate.accentTreatment === "edge") return `<div class="accent-edge"></div>`;
  if (candidate.accentTreatment === "index") return `<div class="accent-index">${String(candidate.number).padStart(2, "0")}</div>`;
  if (candidate.accentTreatment === "rule") return `<div class="accent-rule"></div>`;
  return `<div class="accent-window"><span></span></div>`;
}

function shell(candidate: Candidate, sourceBytes: Uint8Array) {
  const sourceUri = dataUri("image/png", sourceBytes);
  const dark = candidate.theme === "dark";
  const logoFill = dark ? "#F4F8F5" : "#003F35";
  const logo = `<svg class="brand-logo" viewBox="0 0 414.84 85.88" aria-label="SOCIAL_MEDIA_PLUGIN">${renderCanonicalHorizontalLogo(logoFill, 0, 0, 414.84)}</svg>`;
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"/><title>${candidate.id}</title><style>
@font-face{font-family:Ghroob;src:url('${dataUri("font/otf", arabicRegular)}') format('opentype');font-weight:400}
@font-face{font-family:Ghroob;src:url('${dataUri("font/otf", arabicBold)}') format('opentype');font-weight:700}
*{box-sizing:border-box}html,body{margin:0;width:1080px;height:1350px;overflow:hidden;background:${dark ? "#003F35" : "#F4F8F5"}}
.canvas{position:relative;width:1080px;height:1350px;overflow:hidden;font-family:Ghroob,Arial,sans-serif;direction:rtl;text-align:right;background:${dark ? "#003F35" : "#F4F8F5"};color:${dark ? "#F4F8F5" : "#003F35"}}
.photo{position:absolute;object-fit:cover;object-position:${candidate.imagePosition};filter:saturate(.84) contrast(1.04)}
.copy{position:absolute;z-index:6}.label{font-size:31px;line-height:1.2;font-weight:700;color:${dark ? "#77FF70" : "#0B594A"}}
h1{margin:22px 0 0;font-size:88px;line-height:1.02;font-weight:700;max-width:900px;text-shadow:${dark ? "0 4px 28px rgba(0,20,16,.42)" : "none"}}
h1 span{display:block}h1 span+span{color:${dark ? "#77FF70" : "#0B594A"}}
.support{margin:25px 0 0;max-width:790px;font-size:34px;line-height:1.45;font-weight:400;color:${dark ? "#E1ECE6" : "#315548"}}
.focal{position:absolute;z-index:7;font-size:28px;font-weight:700;line-height:1.2;padding:12px 18px 15px;color:#003F35;background:#77FF70}
.brand-logo{position:absolute;left:68px;bottom:50px;width:158px;height:auto;z-index:12}
.cinematic .photo{inset:0;width:1080px;height:1350px}.cinematic:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,34,29,.93) 0%,rgba(0,34,29,.56) 35%,rgba(0,34,29,.05) 65%,rgba(0,34,29,.66) 100%)}
.cinematic .copy{right:68px;top:70px;width:900px}.cinematic .focal{right:68px;bottom:72px}
.image-top{background:#F4F8F5}.image-top .photo{left:0;top:0;width:1080px;height:790px}.image-top:after{content:"";position:absolute;left:0;top:610px;width:1080px;height:200px;background:linear-gradient(180deg,rgba(244,248,245,0),#F4F8F5)}
.image-top .copy{right:68px;top:760px;width:944px}.image-top h1{font-size:82px}.image-top .support{font-size:32px}.image-top .focal{right:68px;top:700px}
.side-panel .photo{inset:0;width:1080px;height:1350px}.side-panel:after{content:"";position:absolute;right:0;top:0;width:620px;height:1350px;background:linear-gradient(270deg,rgba(0,34,29,.96) 0%,rgba(0,34,29,.84) 58%,rgba(0,34,29,0) 100%)}
.side-panel .copy{right:68px;top:100px;width:560px}.side-panel h1{font-size:78px;line-height:1.04}.side-panel .support{max-width:510px;font-size:32px}.side-panel .focal{right:68px;bottom:100px}
.framed{background:#F4F8F5}.framed .photo{left:48px;top:330px;width:984px;height:850px}.framed .copy{right:68px;top:58px;width:944px}.framed h1{font-size:72px;margin-top:13px}.framed .support{display:block;margin-top:14px;font-size:27px;line-height:1.34;max-width:820px}.framed .focal{right:68px;bottom:86px}
.accent-edge{position:absolute;z-index:8;right:48px;top:48px;width:8px;height:246px;background:#0EDB23}.accent-edge:after{content:"";position:absolute;right:0;top:0;width:112px;height:8px;background:#0EDB23}
.accent-index{position:absolute;z-index:8;left:60px;top:54px;font-family:Arial,sans-serif;font-size:104px;font-weight:700;color:#77FF70;opacity:.78;direction:ltr}
.accent-rule{position:absolute;z-index:8;left:48px;bottom:170px;width:320px;height:8px;background:#0EDB23}
.accent-window{position:absolute;z-index:8;left:50px;top:50px;width:118px;height:118px;border:6px solid #77FF70}.accent-window span{position:absolute;right:-6px;bottom:-6px;width:38px;height:38px;background:#0EDB23}
</style></head><body><main class="canvas ${candidate.layout}" lang="ar" dir="rtl" data-copy-region="canvas"><img class="photo" src="${sourceUri}" alt=""/>${decor(candidate)}<header class="copy"><div class="label">${candidate.label} · ${String(candidate.number).padStart(2, "0")}</div><h1>${candidate.headline.map((line) => `<span>${line}</span>`).join("")}</h1><p class="support">${candidate.support}</p></header><div class="focal">${candidate.focal}</div>${logo}</main></body></html>`;
}

await mkdir(`${runRoot}production`, { recursive: true });
await mkdir(`${runRoot}mobile`, { recursive: true });
await mkdir(`${runRoot}html`, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
const records: unknown[] = [];
try {
  for (const candidate of candidates) {
    const sourceBytes = await readFile(`${sourceRoot}${candidate.source}`);
    const html = shell(candidate, sourceBytes);
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(async () => document.fonts.ready);
    const exactCopy = [candidate.label, ...candidate.headline, candidate.support, candidate.focal];
    const preflight = await page.evaluate((copy) => ({
      language: document.documentElement.lang,
      direction: document.documentElement.dir,
      regularLoaded: document.fonts.check("400 34px Ghroob"),
      boldLoaded: document.fonts.check("700 88px Ghroob"),
      exactCopyPresent: copy.every((line) => document.body.innerText.includes(line)),
      canvas: document.querySelector<HTMLElement>("[data-copy-region='canvas']")?.getBoundingClientRect().toJSON(),
    }), exactCopy);
    if (!preflight.regularLoaded || !preflight.boldLoaded || !preflight.exactCopyPresent) throw new Error(`Preflight failed for ${candidate.id}: ${JSON.stringify(preflight)}`);
    const productionPath = `${runRoot}production/${candidate.id}.png`;
    const mobilePath = `${runRoot}mobile/${candidate.id}.png`;
    await page.screenshot({ path: productionPath, type: "png", animations: "disabled" });
    await writeFile(`${runRoot}html/${candidate.id}.html`, html, "utf8");
    await execFileAsync("magick", [productionPath, "-filter", "Lanczos", "-resize", "324x405!", mobilePath]);
    const [productionBytes, mobileBytes] = await Promise.all([readFile(productionPath), readFile(mobilePath)]);
    records.push({ number: candidate.number, id: candidate.id, source: candidate.source, sourceSha256: sha256(sourceBytes), exactCopy, layout: candidate.layout, production: { file: `production/${candidate.id}.png`, width: 1080, height: 1350, sha256: sha256(productionBytes) }, mobile: { file: `mobile/${candidate.id}.png`, width: 324, height: 405, sha256: sha256(mobileBytes) }, preflight, generatedImageSource: true, generatedTextInSource: false, publicationEligible: false });
  }
} finally { await browser.close(); }
await writeFile(`${runRoot}manifest.json`, `${JSON.stringify({ schemaVersion: "1.0.0", status: "FINAL_IMAGE_LED_COHORT", count: records.length, targetCount: 20, publicationEligible: false, records }, null, 2)}\n`, "utf8");
console.log(`Rendered ${records.length} image-led candidates; target cohort is 20.`);
