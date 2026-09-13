import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { renderCanonicalHorizontalLogo } from "../packages/engine/src/creative";

const execFileAsync = promisify(execFile);
const root = fileURLToPath(new URL("../", import.meta.url));
const runRoot = `${root}artifacts/creative-rebuild/creative-20-learning-loop-2026-08-30/`;
const sha256 = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");
const dataUri = (mime: string, bytes: Uint8Array) =>
  `data:${mime};base64,${Buffer.from(bytes).toString("base64")}`;

const [arabicRegular, arabicBold] = await Promise.all([
  readFile(`${root}apps/web/src/app/fonts/GhroobArabicITF-Regular.otf`),
  readFile(`${root}apps/web/src/app/fonts/GhroobArabicITF-Bold.otf`),
]);

type Mode = "top" | "bottom" | "overlay" | "split";
interface Candidate {
  number: number;
  id: string;
  label: string;
  headline: string[];
  support: string;
  mechanism: string;
  mode: Mode;
  background: string;
  foreground: string;
  logoFill: string;
  art: string;
}

const palette = {
  deep: "#003F35",
  deep2: "#00302A",
  deep3: "#00221D",
  mid: "#0B594A",
  neon: "#0EDB23",
  pale: "#77FF70",
  paper: "#F4F8F5",
  ink: "#0B201B",
  line: "#CFDDD4",
};

function headlineMarkup(lines: string[]) {
  return lines.map((line, index) => `<span class="headline-line ${index === 1 ? "accent-line" : ""}">${line}</span>`).join("");
}

function shell(candidate: Candidate) {
  const logo = `<svg class="brand-logo" viewBox="0 0 414.84 85.88" aria-label="AURENDOR">${renderCanonicalHorizontalLogo(candidate.logoFill, 0, 0, 414.84)}</svg>`;
  const text = `<header class="copy-block">
    <div class="label">${candidate.label} · ${String(candidate.number).padStart(2, "0")}</div>
    <h1>${headlineMarkup(candidate.headline)}</h1>
    <p>${candidate.support}</p>
  </header>`;
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head><meta charset="utf-8"/><title>${candidate.id}</title><style>
@font-face{font-family:Ghroob;src:url('${dataUri("font/otf", arabicRegular)}') format('opentype');font-weight:400}
@font-face{font-family:Ghroob;src:url('${dataUri("font/otf", arabicBold)}') format('opentype');font-weight:700}
*{box-sizing:border-box} html,body{margin:0;width:1080px;height:1350px;overflow:hidden;background:${candidate.background}}
.canvas{position:relative;width:1080px;height:1350px;overflow:hidden;background:${candidate.background};color:${candidate.foreground};font-family:Ghroob,Arial,sans-serif;direction:rtl;text-align:right}
.safe{position:absolute;right:68px;top:68px;width:944px;height:1130px}
.label{font-size:32px;font-weight:400;line-height:1.25;color:${candidate.background === palette.deep || candidate.background === palette.deep2 || candidate.background === palette.deep3 ? palette.pale : palette.mid}}
h1{margin:24px 0 0;font-size:94px;font-weight:700;line-height:1.01;max-width:930px}
.headline-line{display:block}.accent-line{color:${candidate.background === palette.pale ? palette.deep : candidate.background === palette.deep || candidate.background === palette.deep2 || candidate.background === palette.deep3 ? palette.pale : palette.mid}}
.copy-block p{margin:28px 0 0;max-width:880px;font-size:38px;font-weight:400;line-height:1.42;color:${candidate.background === palette.deep || candidate.background === palette.deep2 || candidate.background === palette.deep3 ? "#D7E7DF" : "#315548"}}
.art{position:absolute;overflow:hidden}
.mode-top .copy-block{position:absolute;right:0;top:0;width:944px}.mode-top .art{right:0;top:430px;width:944px;height:640px}
.mode-bottom .art{right:0;top:0;width:944px;height:690px}.mode-bottom .copy-block{position:absolute;right:0;top:740px;width:944px}
.mode-overlay .art{right:0;top:0;width:944px;height:900px}.mode-overlay .copy-block{position:absolute;right:0;top:720px;width:900px;padding:54px 58px;background:${candidate.background};z-index:3}.mode-overlay h1{font-size:82px}.mode-overlay .copy-block p{font-size:34px;margin-top:20px}
.mode-split .copy-block{position:absolute;right:0;top:0;width:520px}.mode-split h1{font-size:82px;line-height:1.04}.mode-split .copy-block p{font-size:35px}.mode-split .art{left:0;top:0;width:386px;height:1040px}
.brand-logo{position:absolute;left:68px;bottom:54px;width:158px;height:auto;z-index:12}
.hairline{stroke:${palette.neon};stroke-width:4}.paper{fill:${palette.paper}}.deep{fill:${palette.deep}}.pale{fill:${palette.pale}}
</style></head>
<body><main class="canvas mode-${candidate.mode}" lang="ar" dir="rtl"><section class="safe" data-copy-region="safe">${text}<div class="art" aria-hidden="true">${candidate.art}</div></section>${logo}</main></body></html>`;
}

const svg = (body: string, viewBox = "0 0 944 640") => `<svg viewBox="${viewBox}" width="100%" height="100%" preserveAspectRatio="none">${body}</svg>`;

const candidates: Candidate[] = [
  {
    number: 1,
    id: "c20-01-remove-ambiguity",
    label: "وضوح قبل الذكاء",
    headline: ["احذف الغموض", "قبل أن تضيف الذكاء"],
    support: "القاعدة الواضحة تصنع نظامًا أذكى من طبقة تقنية فوق مسار مرتبك.",
    mechanism: "A dark obstruction is extracted from a pale sentence field.",
    mode: "top", background: palette.paper, foreground: palette.deep, logoFill: palette.deep,
    art: svg(`<rect width="944" height="640" fill="#DCEAE2"/><path d="M0 104h944v120H0zM0 416h944v120H0z" fill="#003F35"/><path d="M0 248h944v144H0z" fill="#77FF70"/><rect x="346" y="190" width="252" height="262" rx="4" fill="#00221D" transform="rotate(-8 472 321)"/><path d="M368 214l208-29v214l-208 29z" fill="#0EDB23" opacity=".18"/><path d="M472 92v462" stroke="#F4F8F5" stroke-width="4" stroke-dasharray="12 14"/><path d="M428 80l44-56 44 56" fill="none" stroke="#0EDB23" stroke-width="10"/>`),
  },
  {
    number: 2,
    id: "c20-02-service-before-screen",
    label: "تجربة خدمة",
    headline: ["الخدمة تبدأ", "قبل الشاشة"],
    support: "ما يحدث قبل الدخول يحدد إن كانت الواجهة ستختصر الطريق أم تخفي تعقيده.",
    mechanism: "A service path enters from beyond the canvas through an architectural threshold.",
    mode: "bottom", background: palette.deep, foreground: palette.paper, logoFill: palette.paper,
    art: svg(`<rect width="944" height="690" fill="#00221D"/><path d="M944 690H148V0h796z" fill="#003F35"/><path d="M770 690H286V286c0-134 108-242 242-242s242 108 242 242z" fill="#F4F8F5"/><path d="M692 690H364V310c0-91 73-164 164-164s164 73 164 164z" fill="#77FF70"/><path d="M0 560h528v78H0z" fill="#0EDB23"/><path d="M528 560l164-106v78L528 638z" fill="#0EDB23"/><rect x="492" y="520" width="72" height="118" fill="#003F35"/>`, "0 0 944 690"),
  },
  {
    number: 3,
    id: "c20-03-silence-is-data",
    label: "بحث نوعي",
    headline: ["الصمت في المقابلة", "معلومة"],
    support: "لا تملأ الفراغ سريعًا؛ أحيانًا يكشف التردد ما لا تقوله الإجابة الجاهزة.",
    mechanism: "Two speech masses are separated by a deliberately measured void.",
    mode: "overlay", background: palette.paper, foreground: palette.deep, logoFill: palette.deep,
    art: svg(`<rect width="944" height="900" fill="#003F35"/><path d="M944 128H574v240H412l70 84H944z" fill="#77FF70"/><path d="M0 520h370v240h162l-70 84H0z" fill="#F4F8F5"/><rect x="438" y="92" width="68" height="680" fill="#00221D"/><path d="M448 170h48M448 242h48M448 598h48M448 670h48" stroke="#0EDB23" stroke-width="5"/>`, "0 0 944 900"),
  },
  {
    number: 4,
    id: "c20-04-name-uncertainty",
    label: "قرار مسؤول",
    headline: ["سمِّ عدم اليقين", "قبل أن تخفيه"],
    support: "حين يصبح الشك مرئيًا، يعرف الفريق ما يحتاج إلى اختبار لا إلى تبرير.",
    mechanism: "An irregular translucent membrane is peeled away from a bright, bounded core.",
    mode: "overlay", background: palette.deep, foreground: palette.paper, logoFill: palette.paper,
    art: svg(`<defs><linearGradient id="veil2" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#F4F8F5" stop-opacity=".82"/><stop offset=".55" stop-color="#A8CAB8" stop-opacity=".42"/><stop offset="1" stop-color="#77FF70" stop-opacity=".08"/></linearGradient><filter id="soft"><feGaussianBlur stdDeviation="18"/></filter></defs><rect width="944" height="900" fill="#00221D"/><path d="M176 120h592l94 144-82 446H202L88 520z" fill="#0EDB23" opacity=".22" filter="url(#soft)"/><path d="M238 202h468l70 104-62 320H270l-74-150z" fill="#77FF70"/><path d="M52 64L892 0l-62 622-202-84-132 228-126-194-210 94z" fill="url(#veil2)"/><path d="M496 766l132-228 202 84" fill="none" stroke="#F4F8F5" stroke-width="8"/><path d="M612 526l54-6-22 50z" fill="#0EDB23"/>`, "0 0 944 900"),
  },
  {
    number: 5,
    id: "c20-05-old-data-late-decision",
    label: "بيانات تشغيلية",
    headline: ["البيانات القديمة", "تؤخّر القرار"],
    support: "صلاحية المعلومة جزء من دقتها؛ سجّل زمنها قبل أن تبني عليها فعلًا.",
    mechanism: "A once-solid signal erodes into dated sediment before reaching the decision edge.",
    mode: "bottom", background: palette.paper, foreground: palette.deep, logoFill: palette.deep,
    art: svg(`<defs><linearGradient id="age" x1="1" y1="0" x2="0" y2="0"><stop stop-color="#003F35"/><stop offset=".46" stop-color="#477565"/><stop offset="1" stop-color="#D5E3DB"/></linearGradient><pattern id="grain" width="34" height="34" patternUnits="userSpaceOnUse"><path d="M0 17h34" stroke="#F4F8F5" stroke-width="4" opacity=".34"/></pattern></defs><rect width="944" height="690" fill="#E6EFEA"/><path d="M82 126h704l90 218-90 220H82l118-110-72-110 72-108z" fill="url(#age)"/><path d="M82 126h704l90 218-90 220H82" fill="none" stroke="#003F35" stroke-width="6"/><path d="M170 148h316v392H170z" fill="url(#grain)" opacity=".82"/><path d="M508 126v438" stroke="#F4F8F5" stroke-width="7" stroke-dasharray="8 16" opacity=".62"/><path d="M786 126l90 218-90 220" fill="#77FF70"/><path d="M826 220v248" stroke="#003F35" stroke-width="16"/>`, "0 0 944 690"),
  },
  {
    number: 6,
    id: "c20-06-test-riskiest-assumption",
    label: "فرضية حرجة",
    headline: ["اختبر الافتراض الأخطر", "أولًا"],
    support: "ابدأ بما قد يُسقط القرار كله، لا بما يسهل إثباته.",
    mechanism: "A single fraying support carries a much larger decision mass, making the riskiest assumption unmistakable.",
    mode: "top", background: palette.deep, foreground: palette.paper, logoFill: palette.paper,
    art: svg(`<defs><filter id="blockshadow"><feDropShadow dx="0" dy="24" stdDeviation="18" flood-color="#001712" flood-opacity=".7"/></filter></defs><rect width="944" height="640" fill="#00221D"/><path d="M186 94h572v246H186z" fill="#F4F8F5" filter="url(#blockshadow)"/><path d="M186 340h572l-70 72H256z" fill="#9DB8A8"/><path d="M448 412h48v150h-48z" fill="#77FF70"/><path d="M448 462l-26 40 26 20-30 40M496 450l30 34-30 26 32 40" fill="none" stroke="#0EDB23" stroke-width="8"/><path d="M122 562h700" stroke="#F4F8F5" stroke-width="12"/><path d="M372 94v246M572 94v246" stroke="#CFDDD4" stroke-width="3"/>`),
  },
  {
    number: 7,
    id: "c20-07-simple-interface-cutaway",
    label: "تصميم خدمة",
    headline: ["الواجهة البسيطة", "تخفي قرارات كثيرة"],
    support: "البساطة الجيدة نتيجة عمل منظم خلفها، لا نقصًا في التفاصيل.",
    mechanism: "A pristine facade is physically lifted to expose a dense, crafted operational weave beneath it.",
    mode: "bottom", background: palette.paper, foreground: palette.deep, logoFill: palette.deep,
    art: svg(`<defs><pattern id="weave" width="72" height="72" patternUnits="userSpaceOnUse"><path d="M0 18h72M0 54h72M18 0v72M54 0v72" stroke="#77FF70" stroke-width="8"/><path d="M18 18h36v36H18z" fill="#174F45"/></pattern><filter id="lift"><feDropShadow dx="-18" dy="24" stdDeviation="18" flood-color="#00221D" flood-opacity=".55"/></filter></defs><rect width="944" height="690" fill="#003F35"/><rect x="84" y="72" width="776" height="546" fill="url(#weave)"/><path d="M84 72h776v366L570 618H84z" fill="#F4F8F5" filter="url(#lift)"/><path d="M570 438h290L570 618z" fill="#C5D9CD"/><path d="M84 72h776v366L570 618H84z" fill="none" stroke="#003F35" stroke-width="5"/><path d="M164 172h448M164 250h356" stroke="#9DB8A8" stroke-width="18"/><path d="M570 618V438h290" fill="none" stroke="#0EDB23" stroke-width="10"/>`, "0 0 944 690"),
  },
  {
    number: 8,
    id: "c20-08-listening-is-not-waiting",
    label: "إنصات فعّال",
    headline: ["الاستماع", "ليس انتظار دورك للكلام"],
    support: "اترك مساحة للفكرة أن تكتمل قبل أن تحوّل الحوار إلى ردّ.",
    mechanism: "A dominant response block is interrupted by an open listening interval.",
    mode: "top", background: palette.pale, foreground: palette.deep, logoFill: palette.deep,
    art: svg(`<rect width="944" height="640" fill="#003F35"/><path d="M944 86H554v160H944zM944 286H646v160H944z" fill="#F4F8F5"/><path d="M0 446h364v128H0z" fill="#77FF70"/><rect x="416" y="46" width="86" height="548" fill="#00221D"/><path d="M434 102h50M434 176h50M434 402h50M434 476h50" stroke="#0EDB23" stroke-width="6"/><path d="M392 320h134" stroke="#77FF70" stroke-width="4"/>`),
  },
  {
    number: 9,
    id: "c20-09-write-what-changed",
    label: "تقرير أثر",
    headline: ["اكتب ما تغيّر", "لا ما أنجزته"],
    support: "النشاط يصف جهدك؛ التغيّر يصف ما أصبح مختلفًا للناس أو للعمل.",
    mechanism: "An editorial proof transforms an activity line into an outcome line.",
    mode: "bottom", background: palette.paper, foreground: palette.deep, logoFill: palette.deep,
    art: svg(`<rect width="944" height="690" fill="#003F35"/><rect x="94" y="86" width="756" height="518" fill="#F4F8F5"/><path d="M170 208h542M170 290h468M170 372h540" stroke="#9DB8A8" stroke-width="22"/><path d="M148 180l620 224" stroke="#B42318" stroke-width="15"/><path d="M168 496h448" stroke="#0EDB23" stroke-width="30"/><path d="M630 470l84 41-84 41z" fill="#0EDB23"/><path d="M94 86h756v518" fill="none" stroke="#77FF70" stroke-width="5"/>`, "0 0 944 690"),
  },
  {
    number: 10,
    id: "c20-10-automation-by-deletion",
    label: "تبسيط مسار",
    headline: ["أفضل أتمتة", "قد تبدأ بحذف خطوة"],
    support: "لا تسرّع خطوة لا يحتاجها أحد؛ أزلها أولًا ثم أتمت ما بقي.",
    mechanism: "A redundant loop of material is cut out, leaving one direct, continuous route.",
    mode: "top", background: palette.paper, foreground: palette.deep, logoFill: palette.deep,
    art: svg(`<defs><filter id="cutshadow"><feDropShadow dx="0" dy="20" stdDeviation="12" flood-color="#003F35" flood-opacity=".35"/></filter></defs><rect width="944" height="640" fill="#E4EEE8"/><path d="M84 438C84 202 266 126 438 126s318 112 318 266c0 104-74 168-178 168H84" fill="none" stroke="#003F35" stroke-width="92"/><path d="M84 438h662" fill="none" stroke="#77FF70" stroke-width="92"/><path d="M84 438h662" fill="none" stroke="#003F35" stroke-width="5"/><g transform="rotate(-10 566 300)" filter="url(#cutshadow)"><path d="M438 126h250v292H438z" fill="#F4F8F5" stroke="#003F35" stroke-width="7"/><path d="M472 182h182M472 248h140M472 314h182" stroke="#9DB8A8" stroke-width="16"/></g><path d="M756 392h110" stroke="#0EDB23" stroke-width="18"/>`),
  },
  {
    number: 11,
    id: "c20-11-quality-at-the-edge",
    label: "جودة نظام",
    headline: ["الجودة تظهر", "عند الحافة"],
    support: "اختبر الانتقال، والانقطاع، والاستثناء؛ هناك يكشف النظام حقيقته.",
    mechanism: "A focal surface is perfect only at its exposed boundary.",
    mode: "overlay", background: palette.paper, foreground: palette.deep, logoFill: palette.deep,
    art: svg(`<rect width="944" height="900" fill="#D8E6DE"/><path d="M0 0h744v900H0z" fill="#003F35"/><path d="M744 0h200v900H744z" fill="#F4F8F5"/><path d="M726 0h36v900H726z" fill="#77FF70"/><path d="M640 86h86v124h-86zM640 260h86v86h-86zM640 396h86v176h-86zM640 622h86v106h-86z" fill="#00221D"/><path d="M762 88h118M762 260h72M762 396h142M762 622h96" stroke="#003F35" stroke-width="8"/>`, "0 0 944 900"),
  },
  {
    number: 12,
    id: "c20-12-learning-leaves-report",
    label: "تعلّم مؤسسي",
    headline: ["التعلّم لا يدخل", "من باب التقرير"],
    support: "يتحوّل الدرس إلى قدرة حين يغادر الصفحة ويغيّر الممارسة.",
    mechanism: "A rigid report sheet folds into a route that exits its frame.",
    mode: "split", background: palette.paper, foreground: palette.deep, logoFill: palette.deep,
    art: svg(`<rect width="386" height="1040" fill="#003F35"/><path d="M54 74h278v438H54z" fill="#F4F8F5"/><path d="M96 146h190M96 218h152M96 290h190" stroke="#9DB8A8" stroke-width="16"/><path d="M54 512l278-102v194L54 706z" fill="#77FF70"/><path d="M54 706l278-102v194L54 900z" fill="#0EDB23"/><path d="M54 900l278-102v242H54z" fill="#F4F8F5"/><path d="M54 512l278-102M54 706l278-102M54 900l278-102" stroke="#003F35" stroke-width="5"/>`, "0 0 386 1040"),
  },
  {
    number: 13,
    id: "c20-13-user-sees-one-service",
    label: "استمرارية خدمة",
    headline: ["المستخدم لا يرى", "هيكلك التنظيمي"],
    support: "هو يرى خدمة واحدة؛ صمّم انتقالاتها كما لو أن الحدود الداخلية غير موجودة.",
    mechanism: "Departmental blocks recede behind one uninterrupted service ribbon.",
    mode: "bottom", background: palette.deep, foreground: palette.paper, logoFill: palette.paper,
    art: svg(`<rect width="944" height="690" fill="#00221D"/><path d="M58 78h230v230H58zM357 78h230v230H357zM656 78h230v230H656zM58 382h230v230H58zM357 382h230v230H357zM656 382h230v230H656z" fill="#174F45"/><path d="M0 466C176 466 170 204 346 204s170 262 346 262 170-262 346-262" fill="none" stroke="#77FF70" stroke-width="74"/><path d="M0 466C176 466 170 204 346 204s170 262 346 262 170-262 346-262" fill="none" stroke="#0EDB23" stroke-width="8"/><path d="M58 78h828v534" fill="none" stroke="#F4F8F5" stroke-width="4" opacity=".22"/>`, "0 0 944 690"),
  },
  {
    number: 14,
    id: "c20-14-reversible-decision",
    label: "سرعة قرار",
    headline: ["القرار القابل للعكس", "لا يحتاج موكبًا"],
    support: "خفّف مراسم القرار عندما تستطيع الرجوع؛ واحتفظ بالثقل لما لا يمكن عكسه.",
    mechanism: "A compact hinged plane demonstrates return without ceremony.",
    mode: "top", background: palette.pale, foreground: palette.deep, logoFill: palette.deep,
    art: svg(`<rect width="944" height="640" fill="#003F35"/><path d="M164 116h616v408H164z" fill="#F4F8F5"/><path d="M472 116v408" stroke="#003F35" stroke-width="14"/><path d="M472 116l292 98v310H472z" fill="#77FF70"/><path d="M472 116l292 98-292 104z" fill="#0EDB23" opacity=".5"/><path d="M450 196h44M450 278h44M450 360h44M450 442h44" stroke="#F4F8F5" stroke-width="10"/><path d="M212 204h176v232H212z" fill="#003F35"/>`),
  },
  {
    number: 15,
    id: "c20-15-record-reason-first",
    label: "ذاكرة قرار",
    headline: ["سجّل سبب القرار", "قبل نتيجته"],
    support: "النتيجة اللاحقة قد تعيد كتابة الذاكرة؛ السبب المسجّل يحفظ منطق اللحظة.",
    mechanism: "A later result sheet has a precise window cut through it, preserving the reason layer beneath.",
    mode: "overlay", background: palette.deep, foreground: palette.paper, logoFill: palette.paper,
    art: svg(`<defs><filter id="shadow2"><feDropShadow dx="0" dy="28" stdDeviation="20" flood-color="#001712" flood-opacity=".65"/><mask id="window"><rect width="944" height="900" fill="white"/><path d="M300 348h344v230H300z" fill="black"/></mask></defs><rect width="944" height="900" fill="#00221D"/><rect x="116" y="112" width="712" height="590" fill="#174F45"/><path d="M188 220h568M188 312h430M188 404h516M188 496h382" stroke="#77FF70" stroke-width="18"/><rect x="172" y="236" width="656" height="486" fill="#F4F8F5" mask="url(#window)" filter="url(#shadow2)"/><path d="M300 348h344v230H300z" fill="none" stroke="#0EDB23" stroke-width="12"/><path d="M230 286h536M230 644h430" stroke="#9DB8A8" stroke-width="16"/>`, "0 0 944 900"),
  },
  {
    number: 16,
    id: "c20-16-make-repetition-visible",
    label: "إشارة تشغيلية",
    headline: ["ما يتكرر بصمت", "يستحق أن يُرى"],
    support: "التكرار غير المرئي يستهلك الوقت؛ ارفعه إلى السطح قبل أن يصبح عادة مكلفة.",
    mechanism: "A hidden repeat is exposed by one clean material lift.",
    mode: "split", background: palette.deep, foreground: palette.paper, logoFill: palette.paper,
    art: svg(`<defs><pattern id="repeat" width="58" height="58" patternUnits="userSpaceOnUse"><rect width="58" height="58" fill="#00302A"/><rect x="8" y="8" width="42" height="42" fill="#0B594A"/></pattern></defs><rect width="386" height="1040" fill="url(#repeat)"/><path d="M0 250L386 82v666L0 916z" fill="#F4F8F5"/><path d="M0 250L386 82" stroke="#77FF70" stroke-width="12"/><path d="M0 916l386-168" stroke="#003F35" stroke-width="8"/><path d="M70 360h246v370H70z" fill="#77FF70"/><path d="M104 394h178v302H104z" fill="url(#repeat)"/>`, "0 0 386 1040"),
  },
  {
    number: 17,
    id: "c20-17-question-changes-measure",
    label: "منطق قياس",
    headline: ["إذا تغيّر السؤال", "تغيّر القياس"],
    support: "لا تورّث المقياس من تقرير سابق؛ اربطه بالقرار الذي تريد تحسينه الآن.",
    mechanism: "The measuring surface changes orientation with the question.",
    mode: "bottom", background: palette.paper, foreground: palette.deep, logoFill: palette.deep,
    art: svg(`<rect width="944" height="690" fill="#DCE8E1"/><path d="M94 104h756v178H94z" fill="#003F35"/><path d="M94 408h756v178H94z" fill="#77FF70"/><path d="M214 104v178M334 104v178M454 104v178M574 104v178M694 104v178" stroke="#77FF70" stroke-width="8"/><g transform="rotate(-11 472 497)"><path d="M94 408h756v178H94z" fill="#77FF70"/><path d="M214 408v178M334 408v178M454 408v178M574 408v178M694 408v178" stroke="#003F35" stroke-width="8"/></g><path d="M472 282v104" stroke="#0EDB23" stroke-width="14"/>`, "0 0 944 690"),
  },
  {
    number: 18,
    id: "c20-18-impact-before-launch",
    label: "تصميم أثر",
    headline: ["الأثر لا يبدأ", "عند الإطلاق"],
    support: "يبنيه ما سبق الإطلاق: فهم المشكلة، وتجربة الفرضية، والاستعداد للتعلّم.",
    mechanism: "A cast shadow arrives before the launch object crosses the boundary.",
    mode: "top", background: palette.paper, foreground: palette.deep, logoFill: palette.deep,
    art: svg(`<rect width="944" height="640" fill="#003F35"/><path d="M0 510h944v130H0z" fill="#00221D"/><path d="M118 510L530 138l248 372z" fill="#0EDB23" opacity=".22"/><path d="M530 138l134 98v274H396V236z" fill="#F4F8F5"/><path d="M530 138v372" stroke="#77FF70" stroke-width="12"/><path d="M396 510h268" stroke="#0EDB23" stroke-width="18"/><path d="M118 510h278" stroke="#77FF70" stroke-width="8" stroke-dasharray="18 16"/>`),
  },
  {
    number: 19,
    id: "c20-19-ownerless-does-not-improve",
    label: "ملكية واضحة",
    headline: ["ما لا يملكه أحد", "لن يتحسّن"],
    support: "سمِّ مالك المشكلة وحدّد مساحة قراره قبل أن تطلب نتيجة أفضل.",
    mechanism: "A loose issue label sits outside a crafted ownership slot.",
    mode: "overlay", background: palette.paper, foreground: palette.deep, logoFill: palette.deep,
    art: svg(`<rect width="944" height="900" fill="#E2ECE6"/><rect x="120" y="126" width="704" height="556" fill="#003F35"/><path d="M238 250h468v310H238z" fill="#00221D" stroke="#77FF70" stroke-width="8"/><path d="M310 322h324v166H310z" fill="none" stroke="#F4F8F5" stroke-width="5" stroke-dasharray="16 12"/><g transform="translate(-126 84) rotate(-8 472 405)"><rect x="310" y="322" width="324" height="166" fill="#77FF70" stroke="#003F35" stroke-width="8"/><path d="M374 378h196M374 430h124" stroke="#003F35" stroke-width="16"/></g>`, "0 0 944 900"),
  },
  {
    number: 20,
    id: "c20-20-evidence-must-change-decision",
    label: "دليل قابل للاستخدام",
    headline: ["الدليل الذي لا يغيّر قرارًا", "مجرّد أرشيف"],
    support: "صمّم الدليل ليدخل لحظة القرار، لا ليزداد عدد الملفات.",
    mechanism: "One evidence sheet escapes a compressed archive and becomes a decision surface.",
    mode: "split", background: palette.paper, foreground: palette.deep, logoFill: palette.deep,
    art: svg(`<rect width="386" height="1040" fill="#003F35"/><path d="M46 154h294v720H46z" fill="#00221D" stroke="#77FF70" stroke-width="6"/><path d="M82 220h222v86H82zM82 346h222v86H82zM82 472h222v86H82zM82 598h222v86H82zM82 724h222v86H82z" fill="#174F45" stroke="#9DB8A8" stroke-width="3"/><g transform="translate(-84 -180) rotate(-9 193 641)"><path d="M82 598h222v320H82z" fill="#F4F8F5" stroke="#0EDB23" stroke-width="8"/><path d="M118 664h150M118 730h112M118 796h150" stroke="#003F35" stroke-width="14"/></g><path d="M46 874h294" stroke="#0EDB23" stroke-width="14"/>`, "0 0 386 1040"),
  },
];

await mkdir(`${runRoot}production`, { recursive: true });
await mkdir(`${runRoot}mobile`, { recursive: true });
await mkdir(`${runRoot}html`, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
const manifestRecords: unknown[] = [];

try {
  for (const candidate of candidates) {
    const html = shell(candidate);
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(async () => document.fonts.ready);
    const exactCopy = [candidate.label, ...candidate.headline, candidate.support];
    const preflight = await page.evaluate((copy) => {
      const text = document.body.innerText;
      const safe = document.querySelector<HTMLElement>("[data-copy-region='safe']")?.getBoundingClientRect();
      return {
        language: document.documentElement.lang,
        direction: document.documentElement.dir,
        regularLoaded: document.fonts.check("400 38px Ghroob"),
        boldLoaded: document.fonts.check("700 94px Ghroob"),
        exactCopyPresent: copy.every((line) => text.includes(line)),
        safeWithinCanvas: Boolean(safe && safe.left >= 0 && safe.top >= 0 && safe.right <= 1080 && safe.bottom <= 1350),
        safeBounds: safe ? { x: safe.x, y: safe.y, width: safe.width, height: safe.height } : null,
      };
    }, exactCopy);
    if (!preflight.regularLoaded || !preflight.boldLoaded || !preflight.exactCopyPresent || !preflight.safeWithinCanvas) {
      throw new Error(`Preflight failed for ${candidate.id}: ${JSON.stringify(preflight)}`);
    }
    const productionPath = `${runRoot}production/${candidate.id}.png`;
    const mobilePath = `${runRoot}mobile/${candidate.id}.png`;
    await page.screenshot({ path: productionPath, type: "png", animations: "disabled" });
    await writeFile(`${runRoot}html/${candidate.id}.html`, html, "utf8");
    await execFileAsync("magick", [productionPath, "-filter", "Lanczos", "-resize", "324x405!", mobilePath]);
    const [productionBytes, mobileBytes] = await Promise.all([readFile(productionPath), readFile(mobilePath)]);
    manifestRecords.push({
      number: candidate.number,
      id: candidate.id,
      label: candidate.label,
      exactCopy,
      mechanism: candidate.mechanism,
      mode: candidate.mode,
      production: { file: `production/${candidate.id}.png`, sha256: sha256(productionBytes), byteLength: productionBytes.byteLength, width: 1080, height: 1350 },
      mobile: { file: `mobile/${candidate.id}.png`, sha256: sha256(mobileBytes), byteLength: mobileBytes.byteLength, width: 324, height: 405 },
      html: `html/${candidate.id}.html`,
      preflight,
      rawProfessionalReferencePixelsSuppliedToGeneration: false,
      publicationEligible: false,
    });
  }
} finally {
  await browser.close();
}

await writeFile(`${runRoot}manifest.json`, `${JSON.stringify({
  schemaVersion: "1.0.0",
  generatedAt: new Date().toISOString(),
  status: "PIXEL_REVIEW_REQUIRED",
  publicationEligible: false,
  count: candidates.length,
  fontEvidence: { family: "Ghroob Arabic ITF", regularSha256: sha256(arabicRegular), boldSha256: sha256(arabicBold) },
  records: manifestRecords,
}, null, 2)}\n`, "utf8");

console.log(`Rendered ${candidates.length} creative-loop candidates.`);
