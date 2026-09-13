import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { renderCanonicalHorizontalLogo } from "../packages/engine/src/creative";

const execFileAsync = promisify(execFile);
const root = fileURLToPath(new URL("../", import.meta.url));
const loopRoot = `${root}artifacts/creative-rebuild/arabic-learning-loop-2026-08-29/`;

const sha256 = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");
const dataUri = (mime: string, bytes: Uint8Array) => `data:${mime};base64,${Buffer.from(bytes).toString("base64")}`;

const [arabicRegular, arabicBold] = await Promise.all([
  readFile(`${root}apps/web/src/app/fonts/GhroobArabicITF-Regular.otf`),
  readFile(`${root}apps/web/src/app/fonts/GhroobArabicITF-Bold.otf`),
]);

interface LearningCandidate {
  iteration: number;
  id: string;
  title: string;
  exactCopy: string[];
  sourceImage?: string;
  sourcePromptSummary: string;
  html: (sourceImageDataUri?: string) => string;
}

const logo = (fill: string) =>
  `<svg class="brand-logo" viewBox="0 0 414.84 85.88" aria-label="SOCIAL_MEDIA_PLUGIN">${renderCanonicalHorizontalLogo(fill, 0, 0, 414.84)}</svg>`;

function shell(content: string, title: string) {
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8"/>
  <title>${title}</title>
  <style>
    @font-face{font-family:Ghroob;src:url('${dataUri("font/otf", arabicRegular)}') format('opentype');font-weight:400}
    @font-face{font-family:Ghroob;src:url('${dataUri("font/otf", arabicBold)}') format('opentype');font-weight:700}
    *{box-sizing:border-box}
    html,body{margin:0;width:1080px;height:1350px;overflow:hidden;background:#F4F8F5;-webkit-font-smoothing:antialiased}
    .canvas{position:relative;width:1080px;height:1350px;overflow:hidden;background:#F4F8F5;color:#003F35;font-family:Ghroob,Arial,sans-serif;direction:rtl;text-align:right}
    .hero{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
    .brand-logo{position:absolute;right:68px;bottom:54px;width:158px;height:auto;z-index:10}
  </style>
</head>
<body>${content}</body>
</html>`;
}

const candidates: LearningCandidate[] = [
  {
    iteration: 1,
    id: "13-ar-decision-first",
    title: "Arabic decision-first editorial hero",
    exactCopy: [
      "مبدأ تشغيلي · ١٣",
      "لا تبدأ بالأداة",
      "ابدأ بالقرار",
      "حين يتّضح القرار، يصبح المسار قابلًا للأتمتة.",
    ],
    sourceImage: "decision-lens-source.png",
    sourcePromptSummary: "Several uncertain material paths pass through one optical decision block and resolve into one accountable route; textless, original, light editorial world.",
    html: (sourceImageDataUri) => shell(`<main class="canvas" lang="ar" dir="rtl">
      <img class="hero" src="${sourceImageDataUri}" alt=""/>
      <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(244,248,245,.98) 0%,rgba(244,248,245,.84) 29%,rgba(244,248,245,.04) 54%)"></div>
      <section data-copy-region="headline" style="position:absolute;z-index:5;right:68px;top:66px;width:760px">
        <div style="font-size:34px;font-weight:700;line-height:1.25;color:#08783F;margin:0 0 34px">مبدأ تشغيلي · ١٣</div>
        <h1 style="font-size:104px;font-weight:700;line-height:1.06;margin:0;letter-spacing:0">
          <span style="display:block;color:#003F35">لا تبدأ بالأداة</span>
          <span style="display:block;color:#08783F">ابدأ بالقرار</span>
        </h1>
        <p style="font-size:48px;font-weight:400;line-height:1.32;color:#315548;margin:34px 0 0;width:690px">حين يتّضح القرار، يصبح المسار قابلًا للأتمتة.</p>
      </section>
      <div aria-hidden="true" style="position:absolute;right:68px;top:52px;width:128px;height:6px;background:#0EDB23"></div>
      ${logo("#003F35")}
    </main>`, "Decision before tool"),
  },
  {
    iteration: 2,
    id: "14-ar-decision-first-refined",
    title: "Arabic decision-first editorial hero — refined",
    exactCopy: [
      "مبدأ تشغيلي · ١٤",
      "لا تبدأ بالأداة",
      "ابدأ بالقرار",
      "وضوح القرار يجعل المسار قابلًا للأتمتة.",
    ],
    sourceImage: "decision-lens-refined-source.png",
    sourcePromptSummary: "Exactly three clean, non-crossing inputs pass through a quieter frosted decision lens and become one accountable route; targeted original refinement with no reference pixels.",
    html: (sourceImageDataUri) => shell(`<main class="canvas" lang="ar" dir="rtl">
      <img class="hero" src="${sourceImageDataUri}" alt=""/>
      <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(244,248,245,.98) 0%,rgba(244,248,245,.86) 29%,rgba(244,248,245,.03) 53%)"></div>
      <section data-copy-region="headline" style="position:absolute;z-index:5;right:68px;top:66px;width:760px">
        <div style="font-size:34px;font-weight:700;line-height:1.25;color:#08783F;margin:0 0 34px">مبدأ تشغيلي · ١٤</div>
        <h1 style="font-size:104px;font-weight:700;line-height:1.06;margin:0;letter-spacing:0">
          <span style="display:block;color:#003F35">لا تبدأ بالأداة</span>
          <span style="display:block;color:#08783F">ابدأ بالقرار</span>
        </h1>
        <p style="font-size:48px;font-weight:400;line-height:1.32;color:#315548;margin:34px 0 0;width:650px">وضوح القرار يجعل المسار قابلًا للأتمتة.</p>
      </section>
      <div aria-hidden="true" style="position:absolute;right:68px;top:52px;width:128px;height:6px;background:#0EDB23"></div>
      ${logo("#003F35")}
    </main>`, "Decision before tool — refined"),
  },
  {
    iteration: 3,
    id: "15-ar-document-before-automation",
    title: "Arabic process-clarity modular editorial",
    exactCopy: [
      "مبدأ تشغيلي · ١٥",
      "العملية الغامضة",
      "لا تصلح للأتمتة",
      "وثّق الخطوات أولًا، ثم أتمت ما يستحق التكرار.",
      "قبل التوثيق",
      "بعد التوثيق",
      "وضوح",
    ],
    sourcePromptSummary: "Original native HTML/CSS modular system: a controlled RTL before/after field turns irregular process units into an aligned documented sequence; no generated or external pixels.",
    html: () => shell(`<main class="canvas" lang="ar" dir="rtl" style="background:linear-gradient(155deg,#F8FAF7 0%,#F4F8F5 64%,#EAF4EC 100%)">
      <section data-copy-region="headline" style="position:absolute;z-index:5;right:68px;top:66px;width:900px">
        <div style="font-size:34px;font-weight:700;line-height:1.25;color:#08783F;margin:0 0 30px">مبدأ تشغيلي · ١٥</div>
        <h1 style="font-size:94px;font-weight:700;line-height:1.04;margin:0;letter-spacing:0;width:860px">
          <span style="display:block;color:#003F35">العملية الغامضة</span>
          <span style="display:block;color:#08783F">لا تصلح للأتمتة</span>
        </h1>
        <p style="font-size:46px;font-weight:400;line-height:1.3;color:#315548;margin:30px 0 0;width:820px">وثّق الخطوات أولًا، ثم أتمت ما يستحق التكرار.</p>
      </section>
      <section aria-label="من الغموض إلى الوضوح" style="position:absolute;right:68px;top:586px;width:944px;height:620px;background:#E8F2E9;border:2px solid rgba(0,63,53,.18);overflow:hidden;direction:rtl">
        <div style="position:absolute;inset:0;background-image:linear-gradient(rgba(0,63,53,.075) 1px,transparent 1px),linear-gradient(90deg,rgba(0,63,53,.075) 1px,transparent 1px);background-size:52px 52px"></div>
        <div style="position:absolute;right:0;top:0;width:421px;height:100%;background:rgba(244,248,245,.44)"></div>
        <div style="position:absolute;left:0;top:0;width:421px;height:100%;background:rgba(119,255,112,.10)"></div>
        <div style="position:absolute;right:421px;top:0;width:102px;height:100%;background:#0EDB23"></div>
        <div style="position:absolute;right:421px;top:0;width:102px;height:100%;background:linear-gradient(180deg,rgba(255,255,255,.3),transparent 28%,rgba(0,63,53,.12))"></div>
        <div style="position:absolute;right:36px;top:30px;font-size:32px;font-weight:700;color:#536E65">قبل التوثيق</div>
        <div style="position:absolute;left:36px;top:30px;font-size:32px;font-weight:700;color:#003F35">بعد التوثيق</div>
        <div style="position:absolute;right:433px;top:32px;width:78px;font-size:27px;font-weight:700;line-height:1.1;text-align:center;color:#003F35;transform:rotate(-90deg);transform-origin:center">وضوح</div>

        <div style="position:absolute;right:58px;top:130px;width:134px;height:88px;border:5px solid #406B5D;transform:translate(12px,5px) rotate(-4deg)"></div>
        <div style="position:absolute;right:218px;top:122px;width:126px;height:132px;border:5px solid #003F35;transform:rotate(3deg)"></div>
        <div style="position:absolute;right:82px;top:290px;width:190px;height:78px;border:5px solid #08783F;transform:rotate(2deg)"></div>
        <div style="position:absolute;right:274px;top:326px;width:96px;height:142px;border:5px solid #406B5D;transform:rotate(-5deg)"></div>
        <div style="position:absolute;right:105px;top:437px;width:132px;height:106px;border:5px solid #003F35;transform:rotate(4deg)"></div>

        <div style="position:absolute;left:48px;top:122px;width:146px;height:126px;background:#003F35"></div>
        <div style="position:absolute;left:220px;top:122px;width:146px;height:126px;background:#08783F"></div>
        <div style="position:absolute;left:48px;top:274px;width:146px;height:126px;background:#08783F"></div>
        <div style="position:absolute;left:220px;top:274px;width:146px;height:126px;background:#003F35"></div>
        <div style="position:absolute;left:48px;top:426px;width:318px;height:126px;border:5px solid #003F35;background:rgba(244,248,245,.48)"></div>

        <div style="position:absolute;right:382px;top:300px;width:180px;height:20px;background:#003F35;clip-path:polygon(0 38%,78% 38%,78% 0,100% 50%,78% 100%,78% 62%,0 62%)"></div>
      </section>
      <div aria-hidden="true" style="position:absolute;right:68px;top:52px;width:128px;height:6px;background:#0EDB23"></div>
      ${logo("#003F35")}
    </main>`, "Document before automation"),
  },
  {
    iteration: 4,
    id: "16-ar-document-before-automation-refined",
    title: "Arabic process-clarity modular editorial — refined",
    exactCopy: [
      "مبدأ تشغيلي · ١٦",
      "العملية الغامضة",
      "لا تصلح للأتمتة",
      "وثّق الخطوات أولًا، ثم أتمت ما يستحق التكرار.",
      "قبل التوثيق",
      "بعد التوثيق",
      "وضوح",
    ],
    sourcePromptSummary: "Original native HTML/CSS modular system refined for correct right-to-left state direction, quieter clarity corridor, and exact documented grid; no generated or external pixels.",
    html: () => shell(`<main class="canvas" lang="ar" dir="rtl" style="background:linear-gradient(155deg,#F8FAF7 0%,#F4F8F5 64%,#EAF4EC 100%)">
      <section data-copy-region="headline" style="position:absolute;z-index:5;right:68px;top:66px;width:900px">
        <div style="font-size:34px;font-weight:700;line-height:1.25;color:#08783F;margin:0 0 30px">مبدأ تشغيلي · ١٦</div>
        <h1 style="font-size:94px;font-weight:700;line-height:1.04;margin:0;letter-spacing:0;width:860px">
          <span style="display:block;color:#003F35">العملية الغامضة</span>
          <span style="display:block;color:#08783F">لا تصلح للأتمتة</span>
        </h1>
        <p style="font-size:46px;font-weight:400;line-height:1.3;color:#315548;margin:30px 0 0;width:820px">وثّق الخطوات أولًا، ثم أتمت ما يستحق التكرار.</p>
      </section>
      <section aria-label="من الغموض إلى الوضوح" style="position:absolute;right:68px;top:586px;width:944px;height:620px;background:#E8F2E9;border:2px solid rgba(0,63,53,.18);overflow:hidden;direction:rtl">
        <div style="position:absolute;inset:0;background-image:linear-gradient(rgba(0,63,53,.075) 1px,transparent 1px),linear-gradient(90deg,rgba(0,63,53,.075) 1px,transparent 1px);background-size:52px 52px"></div>
        <div style="position:absolute;right:0;top:0;width:437px;height:100%;background:rgba(244,248,245,.44)"></div>
        <div style="position:absolute;left:0;top:0;width:437px;height:100%;background:rgba(119,255,112,.10)"></div>
        <div style="position:absolute;right:437px;top:0;width:70px;height:100%;background:#77FF70"></div>
        <div style="position:absolute;right:437px;top:0;width:70px;height:100%;background:linear-gradient(180deg,rgba(255,255,255,.38),transparent 28%,rgba(0,63,53,.08))"></div>
        <div style="position:absolute;right:36px;top:30px;font-size:32px;font-weight:700;color:#536E65">قبل التوثيق</div>
        <div style="position:absolute;left:36px;top:30px;font-size:32px;font-weight:700;color:#003F35">بعد التوثيق</div>
        <div style="position:absolute;right:433px;top:40px;width:78px;font-size:27px;font-weight:700;line-height:1.1;text-align:center;color:#003F35;transform:rotate(-90deg);transform-origin:center">وضوح</div>

        <div style="position:absolute;right:58px;top:130px;width:134px;height:88px;border:5px solid #406B5D;transform:translate(12px,5px) rotate(-4deg)"></div>
        <div style="position:absolute;right:234px;top:122px;width:126px;height:132px;border:5px solid #003F35;transform:rotate(3deg)"></div>
        <div style="position:absolute;right:82px;top:290px;width:190px;height:78px;border:5px solid #08783F;transform:rotate(2deg)"></div>
        <div style="position:absolute;right:286px;top:326px;width:96px;height:142px;border:5px solid #406B5D;transform:rotate(-5deg)"></div>
        <div style="position:absolute;right:105px;top:437px;width:132px;height:106px;border:5px solid #003F35;transform:rotate(4deg)"></div>

        <div style="position:absolute;left:52px;top:122px;width:156px;height:126px;background:#003F35"></div>
        <div style="position:absolute;left:234px;top:122px;width:156px;height:126px;background:#08783F"></div>
        <div style="position:absolute;left:52px;top:274px;width:156px;height:126px;background:#08783F"></div>
        <div style="position:absolute;left:234px;top:274px;width:156px;height:126px;background:#003F35"></div>
        <div style="position:absolute;left:52px;top:426px;width:338px;height:126px;border:5px solid #003F35;background:rgba(244,248,245,.48)"></div>

        <div style="position:absolute;right:382px;top:300px;width:180px;height:20px;background:#003F35;clip-path:polygon(100% 38%,22% 38%,22% 0,0 50%,22% 100%,22% 62%,100% 62%)"></div>
      </section>
      <div aria-hidden="true" style="position:absolute;right:68px;top:52px;width:128px;height:6px;background:#0EDB23"></div>
      ${logo("#003F35")}
    </main>`, "Document before automation — refined"),
  },
  {
    iteration: 5,
    id: "17-ar-design-for-exception",
    title: "Arabic exception-handling human editorial",
    exactCopy: [
      "مبدأ تشغيلي · ١٧",
      "صمّم للاستثناء",
      "لا للحالة المثالية",
      "المسار الذكي يعرف متى يتوقّف ويطلب قرارًا.",
    ],
    sourceImage: "human-exception-source.png",
    sourcePromptSummary: "A single real hand places one translucent green decision tile across a branching deep-green material path, creating a human stop-and-decide gesture in a calm regional editorial world; textless and generated without references.",
    html: (sourceImageDataUri) => shell(`<main class="canvas" lang="ar" dir="rtl">
      <img class="hero" src="${sourceImageDataUri}" alt=""/>
      <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(244,248,245,.98) 0%,rgba(244,248,245,.86) 30%,rgba(244,248,245,.08) 51%)"></div>
      <section data-copy-region="headline" style="position:absolute;z-index:5;right:68px;top:66px;width:900px">
        <div style="font-size:34px;font-weight:700;line-height:1.25;color:#08783F;margin:0 0 30px">مبدأ تشغيلي · ١٧</div>
        <h1 style="font-size:94px;font-weight:700;line-height:1.04;margin:0;letter-spacing:0;width:870px">
          <span style="display:block;color:#003F35">صمّم للاستثناء</span>
          <span style="display:block;color:#08783F">لا للحالة المثالية</span>
        </h1>
        <p style="font-size:46px;font-weight:400;line-height:1.3;color:#315548;margin:30px 0 0;width:820px">المسار الذكي يعرف متى يتوقّف ويطلب قرارًا.</p>
      </section>
      <div aria-hidden="true" style="position:absolute;right:68px;top:52px;width:128px;height:6px;background:#0EDB23"></div>
      ${logo("#003F35")}
    </main>`, "Design for the exception"),
  },
  {
    iteration: 6,
    id: "18-ar-intelligence-needs-context",
    title: "Arabic context-first typographic poster",
    exactCopy: [
      "مبدأ ذكاء · ١٨",
      "الذكاء بلا سياق",
      "مجرّد تخمين",
      "زوّد النظام بما يحتاجه ليقرّر، لا بما يسهل جمعه.",
      "السياق",
    ],
    sourcePromptSummary: "Original native HTML/CSS typographic composition: a dark field and one cropped Arabic word turn context into the dominant visual mass; no generated or external pixels.",
    html: () => shell(`<main class="canvas" lang="ar" dir="rtl" style="background:#003F35;color:#F4F8F5">
      <section data-copy-region="headline" style="position:absolute;z-index:5;right:68px;top:66px;width:900px">
        <div style="font-size:34px;font-weight:700;line-height:1.25;color:#77FF70;margin:0 0 30px">مبدأ ذكاء · ١٨</div>
        <h1 style="font-size:96px;font-weight:700;line-height:1.02;margin:0;letter-spacing:0;width:880px">
          <span style="display:block;color:#F4F8F5">الذكاء بلا سياق</span>
          <span style="display:block;color:#77FF70">مجرّد تخمين</span>
        </h1>
        <p style="font-size:45px;font-weight:400;line-height:1.3;color:#CBE2D2;margin:32px 0 0;width:850px">زوّد النظام بما يحتاجه ليقرّر، لا بما يسهل جمعه.</p>
      </section>
      <section aria-label="السياق" style="position:absolute;right:68px;top:690px;width:944px;height:520px;background:#77FF70;overflow:hidden;direction:rtl">
        <div style="position:absolute;right:-34px;top:46px;font-size:330px;font-weight:700;line-height:1;color:#003F35;white-space:nowrap;letter-spacing:-6px">السياق</div>
        <div style="position:absolute;right:36px;bottom:28px;width:872px;height:3px;background:#003F35"></div>
        <div style="position:absolute;right:36px;bottom:46px;font-size:28px;font-weight:700;color:#003F35">السياق</div>
        <div style="position:absolute;left:36px;top:34px;width:82px;height:82px;border:4px solid #003F35;border-radius:50%"></div>
        <div style="position:absolute;left:72px;top:34px;width:4px;height:82px;background:#003F35;transform:rotate(45deg);transform-origin:center"></div>
      </section>
      <div aria-hidden="true" style="position:absolute;right:68px;top:52px;width:128px;height:6px;background:#0EDB23"></div>
      ${logo("#F4F8F5")}
    </main>`, "Intelligence needs context"),
  },
  {
    iteration: 7,
    id: "19-ar-readiness-carousel-cover",
    title: "Arabic automation-readiness carousel — cover",
    exactCopy: [
      "اختبار جاهزية · ١ من ٣",
      "قبل الأتمتة",
      "اسأل ثلاثة أسئلة",
      "الإجابات الواضحة تكفي لبدء تجربة صغيرة.",
      "٣",
      "تابع",
    ],
    sourcePromptSummary: "Original native HTML/CSS carousel cover with one oversized Arabic numeral and an assertive pale-green field; no generated or external pixels.",
    html: () => shell(`<main class="canvas" lang="ar" dir="rtl" style="background:#77FF70;color:#003F35">
      <section data-copy-region="headline" style="position:absolute;z-index:5;right:68px;top:66px;width:900px">
        <div style="font-size:34px;font-weight:700;line-height:1.25;color:#08783F;margin:0 0 30px">اختبار جاهزية · ١ من ٣</div>
        <h1 style="font-size:102px;font-weight:700;line-height:1.02;margin:0;width:880px">
          <span style="display:block">قبل الأتمتة</span>
          <span style="display:block">اسأل ثلاثة أسئلة</span>
        </h1>
        <p style="font-size:46px;font-weight:400;line-height:1.3;color:#315548;margin:30px 0 0;width:820px">الإجابات الواضحة تكفي لبدء تجربة صغيرة.</p>
      </section>
      <div aria-hidden="true" style="position:absolute;right:68px;top:52px;width:128px;height:6px;background:#003F35"></div>
      <div style="position:absolute;right:8px;top:548px;font-size:680px;font-weight:700;line-height:1;color:#003F35;letter-spacing:-18px">٣</div>
      <div style="position:absolute;left:68px;bottom:72px;font-size:34px;font-weight:700;color:#003F35">تابع</div>
      <div aria-hidden="true" style="position:absolute;left:152px;bottom:86px;width:168px;height:4px;background:#003F35"></div>
      ${logo("#003F35")}
    </main>`, "Automation readiness — cover"),
  },
  {
    iteration: 8,
    id: "20-ar-readiness-carousel-questions",
    title: "Arabic automation-readiness carousel — questions one and two",
    exactCopy: [
      "اختبار جاهزية · ٢ من ٣",
      "السؤالان الأولان",
      "١",
      "هل تتكرّر المهمة؟",
      "٢",
      "هل القرار واضح؟",
      "إن تغيّر القرار كل مرة، وثّق القاعدة أولًا.",
    ],
    sourcePromptSummary: "Original native HTML/CSS carousel diagnostic frame with two high-contrast question fields and a stable sequence rail; no generated or external pixels.",
    html: () => shell(`<main class="canvas" lang="ar" dir="rtl" style="background:#F4F8F5;color:#003F35">
      <section data-copy-region="headline" style="position:absolute;z-index:5;right:68px;top:66px;width:900px">
        <div style="font-size:34px;font-weight:700;line-height:1.25;color:#08783F;margin:0 0 24px">اختبار جاهزية · ٢ من ٣</div>
        <h1 style="font-size:84px;font-weight:700;line-height:1.04;margin:0">السؤالان الأولان</h1>
      </section>
      <section style="position:absolute;right:68px;top:330px;width:944px;height:300px;background:#003F35;color:#F4F8F5;padding:44px 52px">
        <div style="position:absolute;left:48px;top:20px;font-size:210px;font-weight:700;line-height:1;color:#77FF70">١</div>
        <div style="font-size:70px;font-weight:700;line-height:1.08;width:650px;margin-top:54px">هل تتكرّر المهمة؟</div>
      </section>
      <section style="position:absolute;right:68px;top:660px;width:944px;height:300px;background:#DDF7DF;color:#003F35;padding:44px 52px;border:2px solid rgba(0,63,53,.15)">
        <div style="position:absolute;left:48px;top:20px;font-size:210px;font-weight:700;line-height:1;color:#08783F">٢</div>
        <div style="font-size:70px;font-weight:700;line-height:1.08;width:650px;margin-top:54px">هل القرار واضح؟</div>
      </section>
      <p style="position:absolute;right:68px;top:1000px;width:860px;font-size:42px;line-height:1.28;color:#315548;margin:0">إن تغيّر القرار كل مرة، وثّق القاعدة أولًا.</p>
      <div aria-hidden="true" style="position:absolute;right:68px;top:52px;width:128px;height:6px;background:#0EDB23"></div>
      ${logo("#003F35")}
    </main>`, "Automation readiness — questions one and two"),
  },
  {
    iteration: 9,
    id: "21-ar-readiness-carousel-close",
    title: "Arabic automation-readiness carousel — measurement and close",
    exactCopy: [
      "اختبار جاهزية · ٣ من ٣",
      "هل يمكن قياس النتيجة؟",
      "٣",
      "إن كانت الإجابات نعم،",
      "ابدأ صغيرًا.",
      "مسار واحد · فريق واحد · مقياس واحد",
    ],
    sourcePromptSummary: "Original native HTML/CSS carousel closing frame with the measurement question, one circular numeral, and a concise small-start action; no generated or external pixels.",
    html: () => shell(`<main class="canvas" lang="ar" dir="rtl" style="background:#003F35;color:#F4F8F5">
      <section data-copy-region="headline" style="position:absolute;z-index:5;right:68px;top:66px;width:900px">
        <div style="font-size:34px;font-weight:700;line-height:1.25;color:#77FF70;margin:0 0 30px">اختبار جاهزية · ٣ من ٣</div>
        <h1 style="font-size:96px;font-weight:700;line-height:1.03;margin:0;width:890px">هل يمكن قياس النتيجة؟</h1>
      </section>
      <div style="position:absolute;right:68px;top:350px;width:310px;height:310px;border:6px solid #77FF70;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:220px;font-weight:700;line-height:1;color:#77FF70">٣</div>
      <section style="position:absolute;right:68px;top:720px;width:944px;height:360px;background:#77FF70;color:#003F35;padding:48px 54px">
        <div style="font-size:54px;font-weight:400;line-height:1.2">إن كانت الإجابات نعم،</div>
        <div style="font-size:104px;font-weight:700;line-height:1.02;margin-top:18px">ابدأ صغيرًا.</div>
      </section>
      <p style="position:absolute;right:68px;top:1124px;width:700px;font-size:36px;font-weight:700;line-height:1.25;color:#CBE2D2;margin:0">مسار واحد · فريق واحد · مقياس واحد</p>
      <div aria-hidden="true" style="position:absolute;right:68px;top:52px;width:128px;height:6px;background:#0EDB23"></div>
      ${logo("#F4F8F5")}
    </main>`, "Automation readiness — measurement and close"),
  },
  {
    iteration: 10,
    id: "22-ar-measure-decision-time",
    title: "Arabic operational-metric editorial",
    exactCopy: [
      "مقياس تشغيلي · ٢٢",
      "قِس زمن القرار",
      "لا عدد النقرات",
      "ابدأ من ظهور الإشارة، وانتهِ عند اتخاذ القرار.",
      "إشارة",
      "قرار",
      "زمن القرار",
    ],
    sourcePromptSummary: "Original native HTML/CSS information graphic defining the signal-to-decision interval with two labeled endpoints and no fabricated values; no generated or external pixels.",
    html: () => shell(`<main class="canvas" lang="ar" dir="rtl" style="background:#F4F8F5;color:#003F35">
      <section data-copy-region="headline" style="position:absolute;z-index:5;right:68px;top:66px;width:900px">
        <div style="font-size:34px;font-weight:700;line-height:1.25;color:#08783F;margin:0 0 30px">مقياس تشغيلي · ٢٢</div>
        <h1 style="font-size:98px;font-weight:700;line-height:1.03;margin:0;width:880px">
          <span style="display:block">قِس زمن القرار</span>
          <span style="display:block;color:#08783F">لا عدد النقرات</span>
        </h1>
        <p style="font-size:46px;font-weight:400;line-height:1.3;color:#315548;margin:30px 0 0;width:850px">ابدأ من ظهور الإشارة، وانتهِ عند اتخاذ القرار.</p>
      </section>
      <section aria-label="زمن القرار" style="position:absolute;right:68px;top:654px;width:944px;height:520px;background:#003F35;color:#F4F8F5;overflow:hidden">
        <div style="position:absolute;right:92px;left:92px;top:258px;height:5px;background:#CBE2D2"></div>
        <div style="position:absolute;right:84px;top:226px;width:68px;height:68px;border:7px solid #77FF70;border-radius:50%;background:#003F35"></div>
        <div style="position:absolute;left:84px;top:226px;width:68px;height:68px;border-radius:50%;background:#77FF70"></div>
        <div style="position:absolute;right:70px;top:320px;width:120px;font-size:34px;font-weight:700;text-align:center;color:#F4F8F5">إشارة</div>
        <div style="position:absolute;left:70px;top:320px;width:120px;font-size:34px;font-weight:700;text-align:center;color:#F4F8F5">قرار</div>
        <div style="position:absolute;right:210px;left:210px;top:128px;height:86px;border-top:5px solid #77FF70;border-right:5px solid #77FF70;border-left:5px solid #77FF70"></div>
        <div style="position:absolute;right:250px;top:56px;width:444px;font-size:52px;font-weight:700;text-align:center;color:#77FF70">زمن القرار</div>
        ${[0,1,2,3,4,5,6].map((index) => `<div aria-hidden="true" style="position:absolute;right:${190 + index * 94}px;top:248px;width:3px;height:${index === 3 ? 34 : 24}px;background:#77FF70;transform:translateY(-50%)"></div>`).join("")}
        <div aria-hidden="true" style="position:absolute;right:106px;top:148px;width:92px;height:52px;border-bottom:5px solid #77FF70;transform:skewX(-32deg)"></div>
      </section>
      <div aria-hidden="true" style="position:absolute;right:68px;top:52px;width:128px;height:6px;background:#0EDB23"></div>
      ${logo("#003F35")}
    </main>`, "Measure decision time"),
  },
  {
    iteration: 11,
    id: "23-ar-design-around-your-team",
    title: "Arabic context-first Iraqi-modernist collage",
    exactCopy: [
      "مبدأ تصميم · ٢٣",
      "لا تنقل سير العمل",
      "صمّمه حول فريقك",
      "السياق المحلي جزء من النظام، لا ملاحظة جانبية.",
    ],
    sourceImage: "contextual-layer-collage-source.png",
    sourcePromptSummary: "An original textless physical collage of abstract deep-green Iraqi-modernist architectural masses reshaped by one translucent pale-green contextual layer; generated without reference images, landmarks, maps, flags, or copied artwork.",
    html: (sourceImageDataUri) => shell(`<main class="canvas" lang="ar" dir="rtl">
      <img class="hero" src="${sourceImageDataUri}" alt=""/>
      <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(244,248,245,.99) 0%,rgba(244,248,245,.90) 30%,rgba(244,248,245,.12) 51%)"></div>
      <section data-copy-region="headline" style="position:absolute;z-index:5;right:68px;top:66px;width:900px">
        <div style="font-size:34px;font-weight:700;line-height:1.25;color:#08783F;margin:0 0 30px">مبدأ تصميم · ٢٣</div>
        <h1 style="font-size:92px;font-weight:700;line-height:1.04;margin:0;width:880px">
          <span style="display:block;color:#003F35">لا تنقل سير العمل</span>
          <span style="display:block;color:#08783F">صمّمه حول فريقك</span>
        </h1>
        <p style="font-size:46px;font-weight:400;line-height:1.3;color:#315548;margin:30px 0 0;width:850px">السياق المحلي جزء من النظام، لا ملاحظة جانبية.</p>
      </section>
      <div aria-hidden="true" style="position:absolute;right:68px;top:52px;width:128px;height:6px;background:#0EDB23"></div>
      ${logo("#F4F8F5")}
    </main>`, "Design around your team"),
  },
  {
    iteration: 12,
    id: "24-ar-build-team-trust",
    title: "Arabic human-trust documentary portrait",
    exactCopy: [
      "مبدأ تبنّي · ٢٤",
      "لا تبنِ نظامًا",
      "لا يثق به فريقك",
      "أشرك من ينفّذ العمل قبل أن تعيد تصميمه.",
    ],
    sourceImage: "operations-lead-portrait-source.png",
    sourcePromptSummary: "A fictional Iraqi/MENA woman operations lead actively adjusts one blank process card under directional architectural light, with a quiet dark lower field for Arabic; generated without reference portraits or real identities.",
    html: (sourceImageDataUri) => shell(`<main class="canvas" lang="ar" dir="rtl" style="background:#003F35;color:#F4F8F5">
      <img class="hero" src="${sourceImageDataUri}" alt=""/>
      <div style="position:absolute;inset:0;background:linear-gradient(180deg,transparent 42%,rgba(0,63,53,.08) 53%,rgba(0,48,41,.94) 75%,#003F35 100%)"></div>
      <section data-copy-region="headline" style="position:absolute;z-index:5;right:68px;top:810px;width:900px">
        <div style="font-size:34px;font-weight:700;line-height:1.25;color:#77FF70;margin:0 0 26px">مبدأ تبنّي · ٢٤</div>
        <h1 style="font-size:90px;font-weight:700;line-height:1.03;margin:0;width:880px">
          <span style="display:block;color:#F4F8F5">لا تبنِ نظامًا</span>
          <span style="display:block;color:#77FF70">لا يثق به فريقك</span>
        </h1>
        <p style="font-size:44px;font-weight:400;line-height:1.3;color:#CBE2D2;margin:26px 0 0;width:850px">أشرك من ينفّذ العمل قبل أن تعيد تصميمه.</p>
      </section>
      ${logo("#F4F8F5")}
    </main>`, "Build team trust"),
  },
  {
    iteration: 13,
    id: "25-ar-decision-must-be-understood",
    title: "Arabic clarity-first cut-paper illustration",
    exactCopy: [
      "مبدأ وضوح · ٢٥",
      "إن لم يُفهَم القرار",
      "فلن يُنفّذ",
      "صُغْه بلغة واضحة، واختبره مع من سيعمل به.",
    ],
    sourceImage: "clarification-illustration-source.png",
    sourcePromptSummary: "Two anonymous coworkers clarify one blank decision page in an original cut-paper editorial illustration with a quiet dark left field; generated without reference illustrations, real identities, or external assets.",
    html: (sourceImageDataUri) => shell(`<main class="canvas" lang="ar" dir="rtl" style="background:#003F35;color:#F4F8F5">
      <style>.canvas .brand-logo{left:68px;right:auto}</style>
      <img class="hero" src="${sourceImageDataUri}" alt=""/>
      <div style="position:absolute;left:0;top:0;width:560px;height:100%;background:linear-gradient(90deg,rgba(0,63,53,.99) 0%,rgba(0,63,53,.98) 78%,rgba(0,63,53,.18) 100%)"></div>
      <section data-copy-region="headline" style="position:absolute;z-index:5;left:58px;top:108px;width:454px;direction:rtl;text-align:right">
        <div style="font-size:30px;font-weight:700;line-height:1.3;color:#77FF70;margin:0 0 34px">مبدأ وضوح · ٢٥</div>
        <h1 style="font-size:74px;font-weight:700;line-height:1.10;margin:0;width:454px">
          <span style="display:block;color:#F4F8F5">إن لم يُفهَم القرار</span>
          <span style="display:block;color:#77FF70;margin-top:12px">فلن يُنفّذ</span>
        </h1>
        <p style="font-size:40px;font-weight:400;line-height:1.42;color:#F4F8F5;margin:38px 0 0;width:440px">صُغْه بلغة واضحة، واختبره مع من سيعمل به.</p>
      </section>
      ${logo("#F4F8F5")}
    </main>`, "A decision must be understood"),
  },
  {
    iteration: 14,
    id: "26-ar-decision-needs-owner",
    title: "Arabic accountability material trace",
    exactCopy: [
      "مبدأ مسؤولية · ٢٦",
      "القرار بلا مالك",
      "يبقى مجرّد اقتراح",
      "سمِّ مسؤولًا واحدًا، وحدّد موعدًا للمراجعة.",
    ],
    sourceImage: "accountability-trace-source.png",
    sourcePromptSummary: "One original dark-green seal object and one crisp asymmetric green impression on tactile paper, with a quiet lower field; generated without reference images, official insignia, writing, people, or external assets.",
    html: (sourceImageDataUri) => shell(`<main class="canvas" lang="ar" dir="rtl" style="background:#F4F8F5;color:#003F35">
      <style>.canvas .brand-logo{left:68px;right:auto}</style>
      <img class="hero" src="${sourceImageDataUri}" alt=""/>
      <div style="position:absolute;inset:0;background:linear-gradient(180deg,transparent 36%,rgba(244,248,245,.08) 49%,rgba(244,248,245,.86) 65%,rgba(244,248,245,.98) 100%)"></div>
      <section data-copy-region="headline" style="position:absolute;z-index:5;right:68px;top:760px;width:870px;text-align:right">
        <div style="font-size:34px;font-weight:700;line-height:1.3;color:#08783F;margin:0 0 28px">مبدأ مسؤولية · ٢٦</div>
        <h1 style="font-size:88px;font-weight:700;line-height:1.05;margin:0;width:870px">
          <span style="display:block;color:#003F35">القرار بلا مالك</span>
          <span style="display:block;color:#08783F;margin-top:8px">يبقى مجرّد اقتراح</span>
        </h1>
        <p style="font-size:44px;font-weight:400;line-height:1.38;color:#315548;margin:32px 0 0;width:840px">سمِّ مسؤولًا واحدًا، وحدّد موعدًا للمراجعة.</p>
      </section>
      ${logo("#003F35")}
    </main>`, "A decision needs an owner"),
  },
  {
    iteration: 15,
    id: "27-ar-change-becomes-habit",
    title: "Arabic slow-transformation motion study",
    exactCopy: [
      "مبدأ تحوّل · ٢٧",
      "التغيير لا يبدأ بإعلان",
      "بل بعادة تتكرّر",
      "اختر سلوكًا واحدًا، واجعله جزءًا من العمل اليومي.",
    ],
    sourceImage: "change-habit-motion-source.png",
    sourcePromptSummary: "One translucent green membrane transforms from compressed pleats into a calm flowing fold around a dark central field; generated without reference images, people, products, arrows, writing, or external assets.",
    html: (sourceImageDataUri) => shell(`<main class="canvas" lang="ar" dir="rtl" style="background:#003F35;color:#F4F8F5">
      <img class="hero" src="${sourceImageDataUri}" alt=""/>
      <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 68% 52%,rgba(0,63,53,.58) 0%,rgba(0,63,53,.34) 38%,transparent 66%)"></div>
      <section data-copy-region="headline" style="position:absolute;z-index:5;right:68px;top:482px;width:870px;text-align:right">
        <div style="font-size:34px;font-weight:700;line-height:1.3;color:#77FF70;margin:0 0 28px">مبدأ تحوّل · ٢٧</div>
        <h1 style="font-size:78px;font-weight:700;line-height:1.08;margin:0;width:870px">
          <span style="display:block;color:#F4F8F5;white-space:nowrap">التغيير لا يبدأ بإعلان</span>
          <span style="display:block;color:#77FF70;margin-top:10px">بل بعادة تتكرّر</span>
        </h1>
        <p style="font-size:42px;font-weight:400;line-height:1.42;color:#CBE2D2;margin:34px 0 0;width:820px">اختر سلوكًا واحدًا، واجعله جزءًا من العمل اليومي.</p>
      </section>
      ${logo("#F4F8F5")}
    </main>`, "Change becomes a habit"),
  },
  {
    iteration: 16,
    id: "28-ar-result-needs-source",
    title: "Arabic provenance editorial footnote",
    exactCopy: [
      "مبدأ ثقة · ٢٨",
      "النتيجة بلا مصدر",
      "ليست معرفة",
      "١ — سجّل مصدر البيانات، إصدارها، وتاريخ تحديثها.",
    ],
    sourcePromptSummary: "Native Arabic editorial-footnote composition built only from project typography, logo, and original HTML/CSS geometry; no generated image or external asset.",
    html: () => shell(`<main class="canvas" lang="ar" dir="rtl" style="background:linear-gradient(90deg,#E7F0EA 0 228px,#F4F8F5 228px);color:#003F35">
      <style>.canvas .brand-logo{left:58px;right:auto}</style>
      <div aria-hidden="true" style="position:absolute;left:228px;top:0;width:2px;height:100%;background:#CBE2D2"></div>
      <div aria-hidden="true" style="position:absolute;left:58px;top:86px;width:108px;height:7px;background:#0EDB23"></div>
      <div aria-hidden="true" style="position:absolute;left:58px;top:116px;width:46px;height:46px;border:3px solid #08783F;border-radius:50%"></div>
      <section data-copy-region="headline" style="position:absolute;z-index:5;right:68px;top:180px;width:780px;text-align:right">
        <div style="font-size:34px;font-weight:700;line-height:1.3;color:#08783F;margin:0 0 74px">مبدأ ثقة · ٢٨</div>
        <h1 style="font-size:96px;font-weight:700;line-height:1.08;margin:0;width:780px">
          <span style="display:block;color:#003F35;white-space:nowrap">النتيجة بلا مصدر<sup style="display:inline-flex;width:44px;height:44px;border:4px solid #0EDB23;border-radius:50%;align-items:center;justify-content:center;font-size:.34em;line-height:1;vertical-align:super;color:#08783F;margin-right:10px">١</sup></span>
          <span style="display:block;color:#08783F;margin-top:12px">ليست معرفة</span>
        </h1>
        <div style="margin-top:126px;width:780px;border-top:7px solid #0EDB23;padding-top:34px">
          <p style="font-size:44px;font-weight:400;line-height:1.42;color:#315548;margin:0;width:760px"><strong style="font-weight:700;color:#08783F">١ —</strong> سجّل مصدر البيانات، إصدارها، وتاريخ تحديثها.</p>
        </div>
      </section>
      ${logo("#003F35")}
    </main>`, "A result needs provenance"),
  },
  {
    iteration: 17,
    id: "29-ar-knowledge-must-remain",
    title: "Arabic shared-knowledge archive still life",
    exactCopy: [
      "مبدأ معرفة · ٢٩",
      "لا تجعل المعرفة",
      "تغادر مع صاحبها",
      "حوّل الخبرة من ذاكرة فردية إلى نظام مشترك.",
    ],
    sourceImage: "knowledge-remains-source.png",
    sourcePromptSummary: "Seven blank dark-green folios, one intentional gap, and one continuous pale-green light plane in an original architectural archive still life; generated without reference images, writing, people, nostalgic motifs, or external assets.",
    html: (sourceImageDataUri) => shell(`<main class="canvas" lang="ar" dir="rtl" style="background:#003F35;color:#F4F8F5">
      <img class="hero" src="${sourceImageDataUri}" alt=""/>
      <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,46,39,.58) 0%,rgba(0,63,53,.22) 38%,transparent 57%)"></div>
      <section data-copy-region="headline" style="position:absolute;z-index:5;right:68px;top:76px;width:900px;text-align:right">
        <div style="font-size:34px;font-weight:700;line-height:1.3;color:#77FF70;margin:0 0 28px">مبدأ معرفة · ٢٩</div>
        <h1 style="font-size:92px;font-weight:700;line-height:1.05;margin:0;width:890px">
          <span style="display:block;color:#F4F8F5">لا تجعل المعرفة</span>
          <span style="display:block;color:#77FF70;margin-top:8px">تغادر مع صاحبها</span>
        </h1>
        <p style="font-size:44px;font-weight:400;line-height:1.38;color:#CBE2D2;margin:30px 0 0;width:850px">حوّل الخبرة من ذاكرة فردية إلى نظام مشترك.</p>
      </section>
      ${logo("#F4F8F5")}
    </main>`, "Knowledge must remain"),
  },
  {
    iteration: 18,
    id: "30-ar-name-costly-decision",
    title: "Arabic participatory decision prompt",
    exactCopy: [
      "سؤال تشغيلي · ٣٠",
      "أي قرار يستهلك",
      "وقت فريقك كل أسبوع؟",
      "سمِّه بكلمتين.",
    ],
    sourcePromptSummary: "Native centered Arabic question and one open answer line built only from project typography, logo, and original HTML/CSS; no generated image, fake poll UI, object, or external asset.",
    html: () => shell(`<main class="canvas" lang="ar" dir="rtl" style="background:radial-gradient(ellipse at 50% 58%,#07594B 0%,#003F35 54%,#00342C 100%);color:#F4F8F5">
      <style>.canvas .brand-logo{left:50%;right:auto;transform:translateX(-50%)}</style>
      <div aria-hidden="true" style="position:absolute;left:485px;top:74px;width:110px;height:7px;background:#0EDB23"></div>
      <section data-copy-region="headline" style="position:absolute;z-index:5;left:90px;top:214px;width:900px;text-align:center">
        <div style="font-size:34px;font-weight:700;line-height:1.3;color:#77FF70;margin:0 0 62px">سؤال تشغيلي · ٣٠</div>
        <h1 style="font-size:88px;font-weight:700;line-height:1.08;margin:0 auto;width:880px;text-align:center">
          <span style="display:block;color:#F4F8F5">أي قرار يستهلك</span>
          <span style="display:block;color:#77FF70;margin-top:10px">وقت فريقك كل أسبوع؟</span>
        </h1>
        <p style="font-size:52px;font-weight:400;line-height:1.35;color:#CBE2D2;margin:56px 0 0">سمِّه بكلمتين.</p>
        <div aria-label="مساحة للإجابة" style="position:relative;width:660px;height:82px;margin:62px auto 0;border-bottom:7px solid #77FF70"></div>
      </section>
      ${logo("#F4F8F5")}
    </main>`, "Name the costly decision"),
  },
  {
    iteration: 19,
    id: "31-ar-ask-test-measure",
    title: "Arabic kinetic three-verb poster",
    exactCopy: [
      "طريقة عمل · ٣١",
      "اسأل",
      "اختبر",
      "قِس",
      "ثم وسّع ما ينجح.",
    ],
    sourcePromptSummary: "Native kinetic Arabic typography built from three intact verbs using project Ghroob, logo, and original HTML/CSS placement; no generated image, distorted lettering, arrows, or external asset.",
    html: () => shell(`<main class="canvas" lang="ar" dir="rtl" style="background:linear-gradient(155deg,#F4F8F5 0%,#EDF5EF 100%);color:#003F35">
      <section data-copy-region="headline" style="position:absolute;z-index:5;right:40px;top:58px;width:1000px;height:1120px">
        <div style="position:absolute;right:28px;top:0;font-size:34px;font-weight:700;line-height:1.3;color:#08783F">طريقة عمل · ٣١</div>
        <div style="position:absolute;right:28px;top:132px;width:620px;font-size:190px;font-weight:700;line-height:1;color:#003F35;text-align:right">اسأل</div>
        <div style="position:absolute;right:216px;top:394px;width:650px;font-size:190px;font-weight:700;line-height:1;color:#08783F;text-align:right">اختبر</div>
        <div style="position:absolute;right:560px;top:666px;width:320px;font-size:190px;font-weight:700;line-height:1;color:#003F35;text-align:right">قِس</div>
        <p style="position:absolute;right:28px;top:930px;width:860px;font-size:52px;font-weight:400;line-height:1.35;color:#315548;margin:0;text-align:right">ثم وسّع ما ينجح.</p>
        <div aria-hidden="true" style="position:absolute;right:28px;top:1028px;width:160px;height:7px;background:#0EDB23"></div>
      </section>
      ${logo("#003F35")}
    </main>`, "Ask, test, measure"),
  },
  {
    iteration: 20,
    id: "32-ar-clear-governance-accelerates",
    title: "Arabic governance risograph registration",
    exactCopy: [
      "مبدأ حوكمة · ٣٢",
      "الحدود الواضحة",
      "تُسرّع القرار",
      "حدّد الصلاحية قبل أن تبدأ الأتمتة.",
    ],
    sourceImage: "governance-registration-source.png",
    sourcePromptSummary: "An original two-color risograph field with controlled off-registration at the perimeter and one crisp central paper zone; generated without reference images, writing, locks, shields, interfaces, or external assets.",
    html: (sourceImageDataUri) => shell(`<main class="canvas" lang="ar" dir="rtl" style="background:#F4F8F5;color:#003F35">
      <img class="hero" src="${sourceImageDataUri}" alt=""/>
      <section data-copy-region="headline" style="position:absolute;z-index:5;left:72px;top:350px;width:590px;text-align:right">
        <div style="font-size:32px;font-weight:700;line-height:1.3;color:#08783F;margin:0 0 34px">مبدأ حوكمة · ٣٢</div>
        <h1 style="font-size:80px;font-weight:700;line-height:1.07;margin:0;width:590px">
          <span style="display:block;color:#003F35">الحدود الواضحة</span>
          <span style="display:block;color:#08783F;margin-top:10px">تُسرّع القرار</span>
        </h1>
        <p style="font-size:40px;font-weight:400;line-height:1.42;color:#315548;margin:42px 0 0;width:570px">حدّد الصلاحية قبل أن تبدأ الأتمتة.</p>
      </section>
      ${logo("#003F35")}
    </main>`, "Clear governance accelerates decisions"),
  },
  {
    iteration: 21,
    id: "33-ar-decision-record-specimen",
    title: "Arabic decision-record catalogue specimen",
    exactCopy: [
      "مخرج عملي · ٣٣",
      "سجلّ قرار",
      "يوثّق السياق، المسؤول، وموعد المراجعة.",
    ],
    sourceImage: "decision-record-specimen-source.png",
    sourcePromptSummary: "One original palm-sized three-layer material specimen displayed as a contemporary catalogue artifact; generated without reference images, writing, screen cues, documents, seals, or external assets.",
    html: (sourceImageDataUri) => shell(`<main class="canvas" lang="ar" dir="rtl" style="background:#F4F8F5;color:#003F35">
      <style>.canvas .brand-logo{left:68px;right:auto}</style>
      <img class="hero" src="${sourceImageDataUri}" alt=""/>
      <section data-copy-region="headline" style="position:absolute;z-index:5;right:68px;top:1010px;width:850px;text-align:right">
        <div style="font-size:30px;font-weight:700;line-height:1.3;color:#08783F;margin:0 0 18px">مخرج عملي · ٣٣</div>
        <h1 style="font-size:74px;font-weight:700;line-height:1.05;color:#003F35;margin:0;width:820px">سجلّ قرار</h1>
        <p style="font-size:40px;font-weight:400;line-height:1.4;color:#315548;margin:20px 0 0;width:820px">يوثّق السياق، المسؤول، وموعد المراجعة.</p>
      </section>
      ${logo("#003F35")}
    </main>`, "Decision record specimen"),
  },
  {
    iteration: 22,
    id: "34-ar-ai-transformation-stat",
    title: "Arabic sourced AI-transformation statistic",
    exactCopy: [
      "إشارة عالمية · ٣٤",
      "٨٦٪",
      "من أصحاب العمل المشاركين في الاستطلاع يتوقّعون أن تُغيّر تقنيات الذكاء الاصطناعي ومعالجة المعلومات أعمالهم بحلول ٢٠٣٠.",
      "المصدر: المنتدى الاقتصادي العالمي، تقرير مستقبل الوظائف ٢٠٢٥.",
    ],
    sourcePromptSummary: "Native source-named Arabic single-stat composition built from project typography, logo, and original HTML/CSS; no chart, icon, stock image, report artwork, or external visual asset.",
    html: () => shell(`<main class="canvas" lang="ar" dir="rtl" style="background:linear-gradient(180deg,#F4F8F5 0%,#EDF4EF 100%);color:#003F35">
      <style>.canvas .brand-logo{left:68px;right:auto}</style>
      <section data-copy-region="headline" style="position:absolute;z-index:5;right:68px;top:68px;width:944px;height:1130px;text-align:right">
        <div style="font-size:34px;font-weight:700;line-height:1.3;color:#08783F">إشارة عالمية · ٣٤</div>
        <div dir="ltr" style="position:absolute;left:0;top:136px;width:944px;font-size:300px;font-weight:700;line-height:.95;color:#003F35;text-align:left;letter-spacing:-8px">٨٦٪</div>
        <div aria-hidden="true" style="position:absolute;left:4px;top:450px;width:300px;height:12px;background:#0EDB23"></div>
        <p style="position:absolute;right:0;top:604px;width:900px;font-size:48px;font-weight:400;line-height:1.45;color:#315548;margin:0">من أصحاب العمل المشاركين في الاستطلاع يتوقّعون أن تُغيّر تقنيات الذكاء الاصطناعي ومعالجة المعلومات أعمالهم بحلول ٢٠٣٠.</p>
        <p style="position:absolute;right:0;top:960px;width:900px;font-size:34px;font-weight:700;line-height:1.4;color:#08783F;margin:0">المصدر: المنتدى الاقتصادي العالمي، تقرير مستقبل الوظائف ٢٠٢٥.</p>
      </section>
      ${logo("#003F35")}
    </main>`, "86 percent expect AI-led transformation"),
  },
];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });

try {
  for (const candidate of candidates) {
    const iterationDirectory = `${loopRoot}iteration-${String(candidate.iteration).padStart(2, "0")}/`;
    await mkdir(`${iterationDirectory}mobile`, { recursive: true });
    const sourceBytes = candidate.sourceImage ? await readFile(`${iterationDirectory}${candidate.sourceImage}`) : null;
    const html = candidate.html(sourceBytes ? dataUri("image/png", sourceBytes) : undefined);
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map((image) => image.decode()));
    });

    const technical = await page.evaluate((copy) => {
      const text = document.body.innerText;
      const headline = document.querySelector<HTMLElement>("[data-copy-region='headline']");
      const bounds = headline?.getBoundingClientRect();
      return {
        documentLanguage: document.documentElement.lang,
        documentDirection: document.documentElement.dir,
        fontLoadedRegular: document.fonts.check("400 48px Ghroob"),
        fontLoadedBold: document.fonts.check("700 104px Ghroob"),
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
    await page.screenshot({ path: `${iterationDirectory}${outputFile}`, type: "png", animations: "disabled" });
    await writeFile(`${iterationDirectory}${candidate.id}.html`, html, "utf8");
    await execFileAsync("magick", [
      `${iterationDirectory}${outputFile}`,
      "-filter",
      "Lanczos",
      "-resize",
      "324x405!",
      `${iterationDirectory}${mobileFile}`,
    ]);

    const [outputBytes, mobileBytes] = await Promise.all([
      readFile(`${iterationDirectory}${outputFile}`),
      readFile(`${iterationDirectory}${mobileFile}`),
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
    await writeFile(`${iterationDirectory}manifest.json`, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  }
} finally {
  await browser.close();
}

console.log(`Rendered ${candidates.length} Arabic learning-loop candidate(s).`);
