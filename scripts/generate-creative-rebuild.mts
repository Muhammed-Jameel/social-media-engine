import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { renderCanonicalHorizontalLogo } from "../packages/engine/src/creative";

const execFileAsync = promisify(execFile);
const root = fileURLToPath(new URL("../", import.meta.url));
const outputDirectory = fileURLToPath(new URL("../artifacts/creative-rebuild/benchmarks-v2/", import.meta.url));
const mobileDirectory = `${outputDirectory}mobile`;
const mechanismDirectory = `${outputDirectory}mechanism-sketches`;
const comparisonDirectory = fileURLToPath(new URL("../artifacts/creative-rebuild/comparisons/round3/", import.meta.url));
const assetDirectory = fileURLToPath(new URL("../artifacts/creative-rebuild/assets/generated/", import.meta.url));

await Promise.all([
  mkdir(outputDirectory, { recursive: true }),
  mkdir(mobileDirectory, { recursive: true }),
  mkdir(mechanismDirectory, { recursive: true }),
  mkdir(comparisonDirectory, { recursive: true }),
]);

const [
  latinFont,
  plexRegularFont,
  plexSemiboldFont,
  arabicRegularFont,
  arabicBoldFont,
  contextImage,
  ragImage,
  custodyRelayImage,
  statusActionImage,
  evidenceRivetImage,
  complexityCoreImage,
] = await Promise.all([
  readFile(`${root}apps/web/src/app/fonts/DhRanclo-Bold.otf`),
  readFile(`${root}node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff2`),
  readFile(`${root}node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-600-normal.woff2`),
  readFile(`${root}apps/web/src/app/fonts/GhroobArabicITF-Regular.otf`),
  readFile(`${root}apps/web/src/app/fonts/GhroobArabicITF-Bold.otf`),
  readFile(`${assetDirectory}context-handoff-round3.png`),
  readFile(`${assetDirectory}rag-evidence-retrieval.png`),
  readFile(`${assetDirectory}custody-relay-round3.png`),
  readFile(`${assetDirectory}status-to-next-action.png`),
  readFile(`${assetDirectory}evidence-rivet-round3.png`),
  readFile(`${assetDirectory}complexity-core-round3.png`),
]);

const dataUri = (mime: string, bytes: Uint8Array) => `data:${mime};base64,${Buffer.from(bytes).toString("base64")}`;
const assets = {
  context: dataUri("image/png", contextImage),
  rag: dataUri("image/png", ragImage),
  custodyRelay: dataUri("image/png", custodyRelayImage),
  statusAction: dataUri("image/png", statusActionImage),
  evidenceRivet: dataUri("image/png", evidenceRivetImage),
  complexityCore: dataUri("image/png", complexityCoreImage),
};

const logo = (fill: string, className = "brand-logo") =>
  `<svg class="${className}" viewBox="0 0 414.84 85.88" aria-label="AURENDOR">${renderCanonicalHorizontalLogo(fill, 0, 0, 414.84)}</svg>`;

interface BenchmarkDefinition {
  id: string;
  title: string;
  language: "ar" | "en" | "bilingual";
  purpose: string;
  visualFamily: string;
  imageryMode: string;
  anthropomorphismLevel: number;
  twoSecondTakeaway: string;
  selectedRoute: string;
  routesConsidered: Array<{ route: string; family: string; decision: "selected" | "rejected"; reason: string }>;
  referenceIds: string[];
  principleIds: string[];
  copy: string[];
  html: string;
  assetProvenance: string[];
}

function shell(content: string, title: string, background = "#F4F8F5") {
  const documentLanguage = content.includes('lang="ar"') ? "ar" : "en";
  const documentDirection = documentLanguage === "ar" ? ' dir="rtl"' : "";
  return `<!doctype html><html lang="${documentLanguage}"${documentDirection}><head><meta charset="utf-8"><title>${title}</title><style>
    @font-face{font-family:Ranclo;src:url('${dataUri("font/otf", latinFont)}') format('opentype');font-weight:700}
    @font-face{font-family:Plex;src:url('${dataUri("font/woff2", plexRegularFont)}') format('woff2');font-weight:400}
    @font-face{font-family:Plex;src:url('${dataUri("font/woff2", plexSemiboldFont)}') format('woff2');font-weight:600}
    @font-face{font-family:Ghroob;src:url('${dataUri("font/otf", arabicRegularFont)}') format('opentype');font-weight:400}
    @font-face{font-family:Ghroob;src:url('${dataUri("font/otf", arabicBoldFont)}') format('opentype');font-weight:700}
    *{box-sizing:border-box} html,body{margin:0;width:1080px;height:1350px;overflow:hidden;background:${background};-webkit-font-smoothing:antialiased}
    .canvas{position:relative;width:1080px;height:1350px;overflow:hidden;background:${background};color:#003F35}
    .ar{font-family:Ghroob,Arial,sans-serif;direction:rtl;text-align:right;font-feature-settings:'kern' 1;line-height:.96}
    .en{font-family:Plex,sans-serif;line-height:.96;letter-spacing:-1px}
    .ranclo{font-family:Ranclo,sans-serif}
    .reading{font-family:Plex,sans-serif;letter-spacing:0}
    .brand-logo{position:absolute;width:185px!important;height:auto;z-index:20}
    .micro{font-family:Plex,sans-serif;font-size:36px;line-height:1.2;letter-spacing:1.2px;text-transform:uppercase;font-weight:600}
    .ar .micro{font-family:Ghroob,sans-serif;font-size:36px;font-weight:700;letter-spacing:0;text-transform:none}
    .ar .micro.latin{font-family:Plex,sans-serif;font-size:36px;letter-spacing:1.2px;text-transform:uppercase}
    .hairline{height:5px;background:#0EDB23}
    .safe{position:absolute;inset:48px;pointer-events:none;border:0 solid transparent}
    img.hero{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
  </style></head><body>${content}</body></html>`;
}

const sharedRoutes = (selected: string, selectedFamily: string): BenchmarkDefinition["routesConsidered"] => [
  { route: selected, family: selectedFamily, decision: "selected", reason: "The communication idea survives without copy and changes the feed silhouette." },
  { route: "Type as operating diagram", family: "editorial-statement", decision: "rejected", reason: "Clear but less materially specific for this message." },
  { route: "Evidence-led product proof", family: "product-system-story", decision: "rejected", reason: "Requires current first-party UI evidence not present in this controlled benchmark." },
  { route: "Behavior-led object character", family: "character-narrative", decision: "rejected", reason: "Human-like behavior would add personality but not enough comprehension here." },
];

const benchmarks: BenchmarkDefinition[] = [
  {
    id: "01-ar-context-handoff",
    title: "Arabic conceptual hero — context handoff",
    language: "ar",
    purpose: "education",
    visualFamily: "conceptual-hero",
    imageryMode: "conceptual-photomanipulation",
    anthropomorphismLevel: 1,
    twoSecondTakeaway: "More tools do not create one system.",
    selectedRoute: "Broken tracks become one accountable material path",
    routesConsidered: sharedRoutes("Broken tracks become one accountable material path", "conceptual-hero"),
    referenceIds: ["ref_51e708951ea61f18", "ref_6dd0a9246092f4d5", "ref_8871f98455278188"],
    principleIds: ["STORY_ONE_VERB", "COMP_FOCAL_DOMINANCE", "AR_COMPOSE_RTL_FIRST"],
    copy: ["لا تحتاج شركتك", "إلى مزيد من الأدوات", "بل تحتاج إلى سياق يظلّ متصلًا من القرار إلى التنفيذ."],
    assetProvenance: ["Original AURENDOR image generation: context-handoff-round3.png; contact geometry rebuilt after round-two pixel critique; no reference pixels supplied."],
    html: shell(`<main class="canvas ar" lang="ar" dir="rtl">
      <img class="hero" src="${assets.context}" alt=""/>
      <section style="position:absolute;z-index:5;right:64px;top:76px;width:900px">
        <h1 style="font-size:91px;font-weight:700;margin:0;color:#003F35;line-height:.92;white-space:nowrap">لا تحتاج شركتك<br/>إلى مزيد من الأدوات</h1>
        <p style="font-size:50px;font-weight:400;line-height:1.14;margin:30px 0 0 auto;width:720px;color:#2A4F43"><span style="color:#0A6B46;font-weight:700">بل تحتاج إلى سياق يظلّ متصلًا</span><br/>من القرار إلى التنفيذ.</p>
      </section>
      ${logo("#003F35", "brand-logo")}
      <style>.brand-logo{left:70px;bottom:62px;width:164px}</style>
    </main>`, "Context handoff"),
  },
  {
    id: "02-ar-rag-evidence",
    title: "Arabic RAG education — evidence archive",
    language: "ar",
    purpose: "service-explanation",
    visualFamily: "product-system-story",
    imageryMode: "bespoke-3d",
    anthropomorphismLevel: 1,
    twoSecondTakeaway: "Retrieval is valuable when evidence returns attached.",
    selectedRoute: "One cited fragment returns from a material archive",
    routesConsidered: sharedRoutes("One cited fragment returns from a material archive", "product-system-story"),
    referenceIds: ["ref_4afce40fe49062b6", "ref_a549cc94cfd3fc44", "ref_79573233e0b609f3"],
    principleIds: ["IMAGE_UI_AS_PROOF", "COMP_SEMANTIC_DEPTH", "COLOR_MATERIAL_LIGHT_BEFORE_GLOW"],
    copy: ["الإجابة وحدها", "لا تكفي", "المهم أن تعود ومعها أدلّتها.", "RAG · مسار الدليل · ٠٢"],
    assetProvenance: ["Original AURENDOR image generation: rag-evidence-retrieval.png; physical ledges, source slip, eyelet, cord, and floor contact rebuilt after round-two pixel critique; no reference pixels supplied."],
    html: shell(`<main class="canvas ar" lang="ar" dir="rtl" style="background:#061F19;color:#F4F8F5">
      <img class="hero" src="${assets.rag}" alt=""/>
      <div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(4,28,22,.98) 0%,rgba(4,28,22,.82) 34%,rgba(4,28,22,.08) 62%)"></div>
      <section style="position:absolute;z-index:5;left:68px;top:76px;width:470px">
        <div class="micro" style="color:#77FF70;text-align:right;margin-bottom:34px"><span class="latin" style="direction:ltr;unicode-bidi:isolate;display:inline-block">RAG</span> · مسار الدليل · ٠٢</div>
        <h1 style="font-size:86px;font-weight:700;margin:0;text-align:right;line-height:.92">الإجابة وحدها<br/>لا تكفي</h1>
        <p style="font-size:54px;line-height:1.12;margin:34px 0 0;color:#C9DDCE;text-align:right">المهم أن تعود<br/><span style="color:#77FF70;font-weight:700">ومعها أدلّتها.</span></p>
      </section>
      ${logo("#F4F8F5")}
      <style>.brand-logo{left:70px;bottom:62px;width:164px}</style>
    </main>`, "RAG evidence", "#061F19"),
  },
  {
    id: "03-ar-automation-relay",
    title: "Arabic behavior-led anthropomorphism — automation relay",
    language: "ar",
    purpose: "education",
    visualFamily: "character-narrative",
    imageryMode: "bespoke-3d",
    anthropomorphismLevel: 3,
    twoSecondTakeaway: "Reliable automation is a controlled relay, not magic.",
    selectedRoute: "Discrete Relay — one released baton is verified before a physically blocked receiving bay",
    routesConsidered: sharedRoutes("Discrete Relay — one released baton is verified before a physically blocked receiving bay", "character-narrative"),
    referenceIds: ["ref_2ca843f06643d5f6", "ref_79573233e0b609f3", "ref_7ea2e6edfd24a465"],
    principleIds: ["ANTHRO_BEHAVIOR_BEFORE_FACE", "ANTHRO_CAPABILITY_BOUNDARY_VISIBLE", "STORY_STATE_TRANSFORMATION"],
    copy: ["الأتمتة الموثوقة", "تُسلِّم المسؤولية بوضوح", "خطوة محددة · انتقال واضح · إيقاف ممكن"],
    assetProvenance: ["Original AURENDOR image generation: custody-relay-round3.png; continuous track abandoned for three discrete stations, exactly one baton, and a physically blocking manual stop; no reference pixels supplied."],
    html: shell(`<main class="canvas ar" lang="ar" dir="rtl" style="background:#071B17;color:#F4F8F5">
      <img class="hero" src="${assets.custodyRelay}" alt=""/>
      <div style="position:absolute;inset:0;background:linear-gradient(135deg,rgba(4,20,17,.98) 0%,rgba(4,20,17,.78) 29%,rgba(4,20,17,.04) 54%)"></div>
      <section style="position:absolute;z-index:5;left:58px;top:72px;width:730px;text-align:right">
        <h1 style="font-size:68px;font-weight:700;margin:0;line-height:1.08;white-space:nowrap">الأتمتة الموثوقة<br/><span style="color:#77FF70">تُسلِّم المسؤولية بوضوح</span></h1>
        <p style="font-size:38px;line-height:1.16;margin:28px 0 0;color:#C8D8CE;white-space:nowrap">خطوة محددة · انتقال واضح · إيقاف ممكن</p>
      </section>
      ${logo("#F4F8F5")}
      <style>.brand-logo{left:60px;bottom:58px;width:164px}</style>
    </main>`, "Discrete custody relay", "#071B17"),
  },
  {
    id: "04-ar-decision-question",
    title: "Arabic thought leadership — decision question",
    language: "ar",
    purpose: "thought-leadership",
    visualFamily: "editorial-statement",
    imageryMode: "typography-led",
    anthropomorphismLevel: 0,
    twoSecondTakeaway: "Automation cannot repair an ambiguous decision.",
    selectedRoute: "An operating path physically collides with an unresolved Arabic question",
    routesConsidered: sharedRoutes("An operating path physically collides with an unresolved Arabic question", "editorial-statement"),
    referenceIds: ["ref_f5cec23c32415d6e", "ref_8684a4138ac5fc7a", "ref_6dd0a9246092f4d5"],
    principleIds: ["TYPE_DISPLAY_AS_COMPOSITION", "AR_SEMANTIC_LINE_BREAKS", "COLOR_SEMANTIC_NOT_SKIN"],
    copy: ["الأتمتة لا تُصلِح", "قرارًا غامضًا", "حدِّد القرار قبل أن تبني المسار."],
    assetProvenance: ["Native typography and vector geometry; original AURENDOR composition."],
    html: shell(`<main class="canvas ar" lang="ar" dir="rtl" style="background:#003F35;color:#F4F8F5">
      <div style="position:absolute;left:-72px;top:250px;font-family:Ghroob;font-size:820px;font-weight:700;line-height:.8;color:transparent;-webkit-text-stroke:10px rgba(119,255,112,.32);transform:rotate(-5deg)">؟</div>
      <svg style="position:absolute;inset:0;width:1080px;height:1350px" viewBox="0 0 1080 1350" aria-label="مسار يصطدم بنقطة السؤال ثم يلتزم بمخرج قرار محدد">
        <path d="M1010 700H250" fill="none" stroke="#BDD5C3" stroke-width="12" stroke-linecap="round"/>
        <path d="M250 700V1018" fill="none" stroke="#77FF70" stroke-width="12" stroke-linecap="round"/>
        <path d="m250 672 28 28-28 28-28-28Z" fill="#77FF70" stroke="#003F35" stroke-width="8"/>
        <path d="M112 1018H388V1170H112Z" fill="#F4F8F5" stroke="#77FF70" stroke-width="10"/>
        <path d="M250 1018V1070" stroke="#003F35" stroke-width="18"/>
        <path d="M112 1018h58l22 22 22-22h174" fill="none" stroke="#77FF70" stroke-width="10"/>
      </svg>
      <div style="position:absolute;left:112px;top:1064px;width:276px;z-index:3;text-align:center;font:700 50px/1.04 Ghroob;color:#003F35">قرار محدّد<br/><span style="font-size:36px;color:#0A6B46">ومخرج ملتزم</span></div>
      <section style="position:absolute;right:70px;top:82px;width:660px;z-index:4">
        <div class="micro" style="color:#77FF70;text-align:right;margin-bottom:68px">ملاحظة ميدانية · ٠٤</div>
        <h1 style="font-size:108px;font-weight:700;line-height:.9;margin:0">الأتمتة لا تُصلِح<br/><span style="color:#77FF70">قرارًا غامضًا</span></h1>
        <p style="font-size:54px;line-height:1.16;color:#D7E4DA;margin:44px 0 0">حدِّد القرار قبل أن تبني المسار.</p>
      </section>
      ${logo("#F4F8F5")}
      <style>.brand-logo{right:70px;bottom:62px;width:166px}</style>
    </main>`, "Decision question", "#003F35"),
  },
  {
    id: "05-en-before-after",
    title: "English case pattern — before and after",
    language: "en",
    purpose: "case-study",
    visualFamily: "before-after",
    imageryMode: "abstract-system",
    anthropomorphismLevel: 0,
    twoSecondTakeaway: "A visible operating path replaces fragmented follow-up.",
    selectedRoute: "A person physically binds scattered status fragments into one owned next action",
    routesConsidered: sharedRoutes("A person physically binds scattered status fragments into one owned next action", "before-after"),
    referenceIds: ["ref_51e708951ea61f18", "ref_4afce40fe49062b6", "ref_7ea2e6edfd24a465"],
    principleIds: ["STORY_TENSION_THEN_RESOLUTION", "COMP_SYSTEM_VARIATION_NOT_TEMPLATE", "HIER_EVIDENCE_SUBORDINATED_NOT_HIDDEN"],
    copy: ["STOP CHASING STATUS.", "SEE THE NEXT ACTION.", "Illustrative operating pattern — not a client result."],
    assetProvenance: ["Original AURENDOR image generation: status-to-next-action.png; illustrative pattern explicitly labelled; no reference pixels supplied."],
    html: shell(`<main class="canvas en" style="background:#F4F8F5">
      <img class="hero" src="${assets.statusAction}" alt=""/>
      <div style="position:absolute;inset:0;background:linear-gradient(145deg,rgba(244,248,245,.98) 0%,rgba(244,248,245,.92) 29%,rgba(244,248,245,0) 53%)"></div>
      <section style="position:absolute;left:68px;top:70px;width:570px">
        <div class="micro reading" style="color:#46705B;margin-bottom:42px">ILLUSTRATIVE PATTERN · 05</div>
        <h1 class="reading" style="font-size:94px;font-weight:600;line-height:.92;letter-spacing:-3px;margin:0;color:#003F35">STOP CHASING<br/>STATUS.</h1>
        <h2 class="reading" style="font-size:64px;font-weight:600;line-height:.98;letter-spacing:-2px;margin:34px 0 0;color:#0A6B46">SEE THE<br/>NEXT ACTION.</h2>
      </section>
      <div class="reading" style="position:absolute;left:68px;bottom:62px;width:420px;font-size:32px;line-height:1.16;color:#38594A;background:rgba(244,248,245,.92);padding:10px 14px">Illustrative pattern —<br/>not a client result.</div>
      ${logo("#003F35")}
      <style>.brand-logo{right:70px;bottom:58px}</style>
    </main>`, "Before after"),
  },
  {
    id: "06-ar-operating-pattern",
    title: "Arabic data story — four places to one action",
    language: "ar",
    purpose: "statistic",
    visualFamily: "data-story",
    imageryMode: "typography-led",
    anthropomorphismLevel: 0,
    twoSecondTakeaway: "Fragmented checking becomes one next action.",
    selectedRoute: "The denominator physically collapses from four places into one path",
    routesConsidered: sharedRoutes("The denominator physically collapses from four places into one path", "data-story"),
    referenceIds: ["ref_4afce40fe49062b6", "ref_8ef6ff7e70837523", "ref_f5cec23c32415d6e"],
    principleIds: ["HIER_THREE_BEATS_MAX", "TYPE_STEEP_SCALE_CONTRAST", "AR_COMPOSE_RTL_FIRST"],
    copy: ["٤ أماكن لتعرف ما الذي حدث", "١ مسار يريك الخطوة التالية", "مثال توضيحي · وليس من نتائج عملائنا"],
    assetProvenance: ["Native Arabic typography and vector data marks; illustrative, not a measured performance claim."],
    html: shell(`<main class="canvas ar" lang="ar" dir="rtl" style="background:#EAF1EC">
      <div style="position:absolute;right:0;top:0;width:52%;height:100%;background:#003F35"></div>
      <div class="micro" style="position:absolute;right:70px;top:68px;color:#77FF70">نمط تشغيلي · ٠٦</div>
      <section style="position:absolute;right:64px;top:175px;width:430px;color:#F4F8F5">
        <div style="font-size:330px;font-weight:700;line-height:.72;color:#77FF70">٤</div>
        <h1 style="font-size:66px;line-height:1.04;margin:24px 0 0">أماكن لتعرف<br/>ما الذي حدث</h1>
      </section>
      <section style="position:absolute;left:62px;top:175px;width:435px;color:#003F35">
        <div style="font-size:345px;font-weight:700;line-height:.72">١</div>
        <h2 style="font-size:64px;line-height:1.05;margin:24px 0 0">مسار يريك<br/><span style="color:#0A6B46">الخطوة التالية</span></h2>
      </section>
      <svg style="position:absolute;left:398px;top:700px;width:340px;height:260px" viewBox="0 0 340 260" aria-label="أربعة مسارات محززة تدخل بوابة وتخرج في علامة إجراء واحدة">
        <g fill="none" stroke="#77FF70" stroke-width="11" stroke-linecap="square"><path d="M330 34H248L220 96"/><path d="M330 92H252L220 118"/><path d="M330 168H252L220 142"/><path d="M330 226H248L220 164"/></g>
        <rect x="184" y="82" width="42" height="96" rx="6" fill="#003F35" stroke="#77FF70" stroke-width="9"/>
        <path d="M184 130H82" fill="none" stroke="#0EDB23" stroke-width="18" stroke-linecap="square"/>
        <path d="M18 96H96V164H18l18-34Z" fill="#0A6B46" stroke="#0EDB23" stroke-width="9"/>
        <circle cx="205" cy="130" r="10" fill="#0EDB23"/>
      </svg>
      <div style="position:absolute;left:64px;bottom:128px;width:410px;font:42px/1.12 Ghroob;color:#526B5F;direction:rtl;text-align:right">مثال توضيحي<br/>وليس من نتائج عملائنا</div>
      ${logo("#003F35")}
      <style>.brand-logo{left:64px;bottom:58px;width:164px}</style>
    </main>`, "Operating pattern", "#EAF1EC"),
  },
  {
    id: "07-en-evidence-ledger",
    title: "English product principle — evidence ledger",
    language: "en",
    purpose: "product-introduction",
    visualFamily: "product-system-story",
    imageryMode: "abstract-system",
    anthropomorphismLevel: 1,
    twoSecondTakeaway: "Every important decision carries its evidence.",
    selectedRoute: "Provenance Rivet — one decision block and its evidence wafer are physically pinned into one object",
    routesConsidered: sharedRoutes("Provenance Rivet — one decision block and its evidence wafer are physically pinned into one object", "product-system-story"),
    referenceIds: ["ref_a549cc94cfd3fc44", "ref_4afce40fe49062b6", "ref_7ea2e6edfd24a465"],
    principleIds: ["IMAGE_UI_AS_PROOF", "STORY_CONTEXTUAL_MICRODETAILS", "HIER_EVIDENCE_SUBORDINATED_NOT_HIDDEN"],
    copy: ["THE DECISION", "KEEPS ITS EVIDENCE", "Context · source · owner · next action"],
    assetProvenance: ["Original AURENDOR image generation: evidence-rivet-round3.png; floating record route abandoned for an interlocked mineral block, evidence wafer, and glass provenance rivet; no reference pixels supplied."],
    html: shell(`<main class="canvas en" style="background:#071B17;color:#F4F8F5">
      <img class="hero" src="${assets.evidenceRivet}" alt=""/>
      <section style="position:absolute;left:68px;top:70px;width:650px;z-index:5">
        <div class="micro reading" style="color:#77FF70;margin-bottom:38px">PRODUCT PRINCIPLE · 07</div>
        <h1 class="reading" style="font-size:92px;font-weight:600;line-height:.91;letter-spacing:-3px;margin:0">THE DECISION<br/><span style="color:#77FF70">KEEPS ITS EVIDENCE.</span></h1>
      </section>
      <div class="reading" style="position:absolute;left:68px;bottom:146px;font-size:38px;line-height:1.16;color:#B9D0C0"><span style="color:#77FF70;font-weight:600">SOURCE · DECISION · OWNER · NEXT</span><br/>One physical record. One accountable chain.</div>
      ${logo("#F4F8F5")}
      <style>.brand-logo{left:68px;bottom:58px}</style>
    </main>`, "Evidence ledger", "#003F35"),
  },
  {
    id: "08-en-field-notes",
    title: "English announcement — field notes series",
    language: "en",
    purpose: "announcement",
    visualFamily: "announcement",
    imageryMode: "typography-led",
    anthropomorphismLevel: 0,
    twoSecondTakeaway: "AURENDOR is opening a serious field-notes series.",
    selectedRoute: "A filing aperture reveals one charged note inside a quiet editorial field",
    routesConsidered: sharedRoutes("A filing aperture reveals one charged note inside a quiet editorial field", "announcement"),
    referenceIds: ["ref_f5cec23c32415d6e", "ref_7ea2e6edfd24a465", "ref_8684a4138ac5fc7a"],
    principleIds: ["TYPE_DISPLAY_AS_COMPOSITION", "COMP_PURPOSEFUL_CROP", "HIER_LOGO_QUIET_AUTHORITY"],
    copy: ["FIELD NOTES", "OPERATING INTELLIGENCE, WITHOUT THE THEATER", "A new AURENDOR series"],
    assetProvenance: ["Native typography and vector aperture; original AURENDOR composition."],
    html: shell(`<main class="canvas en" style="background:#F4F8F5">
      <div style="position:absolute;left:0;top:0;width:365px;height:100%;background:#DDE8E0"></div>
      <div style="position:absolute;left:110px;top:126px;width:840px;height:970px;border:34px solid #003F35;box-shadow:18px 18px 0 #0EDB23">
        <div style="position:absolute;left:-34px;top:240px;background:#F4F8F5;width:905px;padding:28px 0 34px">
          <div class="reading" style="font-size:156px;font-weight:600;letter-spacing:-8px;color:#003F35;white-space:nowrap;transform:translateX(-12px)">FIELD NOTES</div>
        </div>
        <div class="reading" style="position:absolute;left:34px;top:34px;width:300px;height:152px;padding:22px 24px;background:#E9F1EB;border-left:18px solid #0EDB23;color:#003F35">
          <div style="font-size:38px;font-weight:600;line-height:1">ISSUE 01</div>
          <div style="font-size:36px;line-height:1.06;margin-top:16px;color:#48685A">OBSERVATION<br/>→ HYPOTHESIS</div>
        </div>
        <div class="reading" style="position:absolute;left:36px;right:38px;bottom:55px;font-size:58px;font-weight:600;line-height:1.02;letter-spacing:-2px;color:#003F35">OPERATING INTELLIGENCE,<br/><span style="color:#0A6B46">WITHOUT THE THEATER.</span></div>
      </div>
      <div class="reading" style="position:absolute;left:110px;bottom:86px;font-size:42px;color:#546E61">A new AURENDOR series</div>
      ${logo("#003F35")}
      <style>.brand-logo{right:72px;bottom:58px;width:164px}</style>
    </main>`, "Field notes"),
  },
  {
    id: "09-ar-carousel-decision",
    title: "Arabic carousel 1/3 — locate the decision",
    language: "ar",
    purpose: "education",
    visualFamily: "arabic-educational-carousel",
    imageryMode: "typography-led",
    anthropomorphismLevel: 0,
    twoSecondTakeaway: "Find the decision before automating.",
    selectedRoute: "An off-centre decision fork commits one path and physically blocks the alternative",
    routesConsidered: sharedRoutes("An off-centre decision fork commits one path and physically blocks the alternative", "arabic-educational-carousel"),
    referenceIds: ["ref_4afce40fe49062b6", "ref_8871f98455278188", "ref_8ef6ff7e70837523"],
    principleIds: ["AR_COMPOSE_RTL_FIRST", "COMP_SYSTEM_VARIATION_NOT_TEMPLATE", "STORY_ONE_VERB"],
    copy: ["قبل أن تؤتمت،", "اسأل: أين القرار؟", "القرار الذي يغيّر سير العمل", "١ من ٣"],
    assetProvenance: ["Native Arabic typography and vector mechanism; original AURENDOR carousel system."],
    html: shell(`<main class="canvas ar" lang="ar" dir="rtl" style="background:#F4F8F5">
      <div class="micro" style="position:absolute;right:70px;top:70px;color:#0A6B46">قبل الأتمتة · ١ من ٣</div>
      <section style="position:absolute;right:70px;top:160px;width:820px"><h1 style="font-size:114px;line-height:.9;margin:0">قبل أن تؤتمت،<br/><span style="color:#0A6B46">اسأل: أين القرار؟</span></h1></section>
      <svg style="position:absolute;left:64px;bottom:192px;width:952px;height:520px" viewBox="0 0 952 520" aria-label="مسار يدخل من اليمين ويتفرع عند القرار إلى خيار مرفوض وخيار مختار">
        <path d="M940 252H610" fill="none" stroke="#003F35" stroke-width="22" stroke-linecap="round"/>
        <path d="M610 252C518 252 487 144 388 128H172" fill="none" stroke="#AABCB1" stroke-width="18" stroke-linecap="round"/>
        <path d="M610 252C518 252 487 366 388 388H176" fill="none" stroke="#0EDB23" stroke-width="26" stroke-linecap="round"/>
        <path d="M166 82V174" fill="none" stroke="#71887B" stroke-width="18" stroke-linecap="square"/>
        <path d="M66 346H176V430H66l22-42Z" fill="#0A6B46" stroke="#0EDB23" stroke-width="10"/>
        <circle cx="176" cy="388" r="15" fill="#F4F8F5" stroke="#0A6B46" stroke-width="9"/>
        <path d="M610 198 664 252 610 306 556 252Z" fill="#F4F8F5" stroke="#003F35" stroke-width="16"/>
        <circle cx="610" cy="252" r="17" fill="#0EDB23"/>
        <g fill="#003F35"><circle cx="812" cy="252" r="17"/><circle cx="732" cy="252" r="17"/></g>
      </svg>
      <div style="position:absolute;right:70px;bottom:142px;font:52px/1.1 Ghroob;color:#3F6253">القرار الذي يغيّر سير العمل</div>
      ${logo("#003F35")}
      <style>.brand-logo{left:70px;bottom:58px;width:164px}</style>
    </main>`, "Carousel decision"),
  },
  {
    id: "10-ar-carousel-boundaries",
    title: "Arabic carousel 2/3 — inputs and outputs",
    language: "ar",
    purpose: "education",
    visualFamily: "arabic-educational-carousel",
    imageryMode: "abstract-system",
    anthropomorphismLevel: 1,
    twoSecondTakeaway: "Name the input and output of automation.",
    selectedRoute: "A translucent processing boundary exposes what enters and exits",
    routesConsidered: sharedRoutes("A translucent processing boundary exposes what enters and exits", "process-explainer"),
    referenceIds: ["ref_4afce40fe49062b6", "ref_3991533a0cc6d024", "ref_7ea2e6edfd24a465"],
    principleIds: ["COMP_SEMANTIC_DEPTH", "HIER_THREE_BEATS_MAX", "AR_SEMANTIC_LINE_BREAKS"],
    copy: ["ما الذي يدخل؟", "طلب جديد", "ما الذي يخرج؟", "ملف مراجعة موثّق", "حدِّد المدخلات والمخرجات قبل أن تبني المسار", "٢ من ٣"],
    assetProvenance: ["Native Arabic typography and vector boundary; original AURENDOR carousel system."],
    html: shell(`<main class="canvas ar" lang="ar" dir="rtl" style="background:#003F35;color:#F4F8F5">
      <div class="micro" style="position:absolute;right:70px;top:70px;color:#77FF70">قبل الأتمتة · ٢ من ٣</div>
      <div style="position:absolute;left:70px;top:190px;width:940px;height:650px">
        <div style="position:absolute;right:0;top:0;width:315px;height:520px;background:#F4F8F5;color:#003F35;padding:48px 42px;border:3px solid #B6C9BD">
          <div style="font-size:70px;font-weight:700;line-height:.98">ما الذي<br/>يدخل؟</div>
          <div style="position:absolute;z-index:4;right:34px;left:34px;bottom:34px;border-top:5px solid #0A6B46;padding:18px 8px 8px;font-size:42px;line-height:1.12;font-weight:700;background:#F4F8F5">طلب جديد</div>
        </div>
        <div style="position:absolute;left:0;top:55px;width:340px;height:540px;background:#0A5B49;color:#F4F8F5;padding:48px 42px;border:3px solid #77A892">
          <div style="font-size:70px;font-weight:700;line-height:.98">ما الذي<br/>يخرج؟</div>
          <div style="position:absolute;right:42px;left:42px;bottom:42px;border-top:8px solid #77FF70;padding-top:18px;font-size:44px;font-weight:700">ملف مراجعة<br/>موثّق</div>
        </div>
        <div style="position:absolute;left:405px;top:18px;width:150px;height:558px;background:rgba(225,242,231,.18);border:5px solid rgba(119,255,112,.76);transform:skewY(-5deg);box-shadow:inset 20px 0 0 rgba(244,248,245,.08)"></div>
        <svg style="position:absolute;inset:0;width:940px;height:650px" viewBox="0 0 940 650" aria-label="ثلاثة أجزاء من طلب جديد تعبر حدًا واضحًا وتخرج في سجل واحد موثّق">
          <g fill="#D7E2DA" stroke="#003F35" stroke-width="5"><path d="M860 276h-150v54H860Z"/><path d="M850 354H690v54h160Z"/><path d="M880 432H720v54h160Z"/></g>
          <g fill="none" stroke="#B9CFC1" stroke-width="12" stroke-linecap="round"><path d="M710 303C620 303 584 356 545 372"/><path d="M690 381H545"/><path d="M720 459C620 459 584 405 545 389"/></g>
          <path d="M545 381H405" fill="none" stroke="#77FF70" stroke-width="20" stroke-linecap="round"/>
          <path d="M405 381H270" fill="none" stroke="#F4F8F5" stroke-width="20" stroke-linecap="round"/>
          <path d="m304 349-38 32 38 32" fill="none" stroke="#77FF70" stroke-width="12"/>
        </svg>
      </div>
      <section style="position:absolute;right:70px;top:850px;width:860px"><h1 style="font-size:82px;line-height:.96;margin:0">حدِّد المدخلات والمخرجات<br/><span style="color:#77FF70">قبل أن تبني المسار</span></h1></section>
      ${logo("#F4F8F5")}
      <style>.brand-logo{left:70px;bottom:58px;width:164px}</style>
    </main>`, "Carousel boundaries", "#003F35"),
  },
  {
    id: "11-ar-carousel-stop",
    title: "Arabic carousel 3/3 — human stop",
    language: "ar",
    purpose: "education",
    visualFamily: "arabic-educational-carousel",
    imageryMode: "abstract-system",
    anthropomorphismLevel: 2,
    twoSecondTakeaway: "A reliable system has a visible human stop.",
    selectedRoute: "The operating path visibly yields to one human stop",
    routesConsidered: sharedRoutes("The operating path visibly yields to one human stop", "process-explainer"),
    referenceIds: ["ref_2ca843f06643d5f6", "ref_4afce40fe49062b6", "ref_8ef6ff7e70837523"],
    principleIds: ["ANTHRO_CAPABILITY_BOUNDARY_VISIBLE", "STORY_TENSION_THEN_RESOLUTION", "AR_COMPOSE_RTL_FIRST"],
    copy: ["ومن المسؤول", "عن إيقاف النظام؟", "نقطة إيقاف بشرية", "الموثوقية تبدأ حين يستطيع الإنسان إيقاف النظام.", "٣ من ٣"],
    assetProvenance: ["Native Arabic typography and vector stop mechanism; original AURENDOR carousel system."],
    html: shell(`<main class="canvas ar" lang="ar" dir="rtl" style="background:#EAF1EC">
      <div class="micro" style="position:absolute;right:70px;top:70px;color:#0A6B46">قبل الأتمتة · ٣ من ٣</div>
      <section style="position:absolute;right:70px;top:160px;width:880px"><h1 style="font-size:112px;line-height:.9;margin:0">ومن المسؤول<br/><span style="color:#0A6B46">عن إيقاف النظام؟</span></h1></section>
      <svg style="position:absolute;left:65px;top:500px;width:950px;height:500px" viewBox="0 0 950 500" aria-label="مسار يدخل من اليمين ويتوقف فعليًا عند ذراع تحكم بشرية">
        <path d="M930 252H374" stroke="#0EDB23" stroke-width="28" stroke-linecap="round"/>
        <path d="M315 252H18" stroke="#AABCB1" stroke-width="22" stroke-linecap="round"/>
        <g fill="#003F35"><path d="m795 224 28 28-28 28-28-28Z"/><path d="m652 224 28 28-28 28-28-28Z"/><path d="m509 224 28 28-28 28-28-28Z"/></g>
        <rect x="310" y="104" width="128" height="296" rx="26" fill="#003F35"/>
        <rect x="345" y="126" width="58" height="252" rx="24" fill="#F4F8F5"/>
        <circle cx="374" cy="166" r="52" fill="#0EDB23" stroke="#003F35" stroke-width="16"/>
        <circle cx="374" cy="252" r="18" fill="#F4F8F5" stroke="#003F35" stroke-width="10"/>
        <path d="M365 175 198 54" fill="none" stroke="#003F35" stroke-width="34" stroke-linecap="round"/>
        <rect x="112" y="16" width="132" height="72" rx="24" fill="#F4F8F5" stroke="#003F35" stroke-width="14" transform="rotate(7 178 52)"/>
        <path d="M344 198V310" stroke="#0EDB23" stroke-width="34" stroke-linecap="square"/>
      </svg>
      <div style="position:absolute;right:430px;top:920px;font:52px/1.1 Ghroob;color:#0A6B46">نقطة إيقاف بشرية</div>
      <p style="position:absolute;right:70px;bottom:158px;font-size:54px;line-height:1.12;color:#315548;margin:0">الموثوقية تبدأ<br/>حين يستطيع الإنسان إيقاف النظام.</p>
      ${logo("#003F35")}
      <style>.brand-logo{left:70px;bottom:58px;width:164px}</style>
    </main>`, "Carousel stop", "#EAF1EC"),
  },
  {
    id: "12-en-complexity-answerable",
    title: "English brand breath — make complexity answerable",
    language: "en",
    purpose: "brand-building",
    visualFamily: "conceptual-hero",
    imageryMode: "bespoke-3d",
    anthropomorphismLevel: 0,
    twoSecondTakeaway: "AURENDOR makes complexity answerable.",
    selectedRoute: "Calibrated Core — one precise sample preserves every layer of the complex whole",
    routesConsidered: sharedRoutes("Calibrated Core — one precise sample preserves every layer of the complex whole", "conceptual-hero"),
    referenceIds: ["ref_f5cec23c32415d6e", "ref_8684a4138ac5fc7a", "ref_7ea2e6edfd24a465"],
    principleIds: ["STORY_ONE_VERB", "COMP_FOCAL_DOMINANCE", "COLOR_MATERIAL_LIGHT_BEFORE_GLOW"],
    copy: ["MAKE COMPLEXITY", "ANSWERABLE."],
    assetProvenance: ["Original AURENDOR image generation: complexity-core-round3.png; generic network route abandoned for one physically calibrated sample that preserves every layer; no reference pixels supplied."],
    html: shell(`<main class="canvas en" style="background:#003F35;color:#F4F8F5">
      <img class="hero" src="${assets.complexityCore}" alt="" style="transform:translateX(150px);width:calc(100% - 40px);object-position:center"/>
      <div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(3,35,29,.98) 0%,rgba(3,35,29,.84) 30%,rgba(3,35,29,.12) 58%),linear-gradient(180deg,rgba(3,35,29,.4),transparent 45%)"></div>
      <section style="position:absolute;left:64px;top:72px;width:620px;z-index:3">
        <h1 class="reading" style="font-size:88px;font-weight:600;line-height:.91;letter-spacing:-3px;margin:0">MAKE<br/>COMPLEXITY<br/><span style="color:#77FF70">ANSWERABLE.</span></h1>
      </section>
      ${logo("#F4F8F5")}
      <style>.brand-logo{left:68px;bottom:58px}</style>
    </main>`, "Make complexity answerable", "#003F35"),
  },
];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
const restartIds = new Set(["03-ar-automation-relay", "05-en-before-after", "07-en-evidence-ledger", "12-en-complexity-answerable"]);
const rendered: Array<BenchmarkDefinition & {
  file: string;
  mobileFile: string;
  sha256: string;
  byteLength: number;
  mechanismSketch?: string;
  mobileMechanismSketch?: string;
}> = [];

try {
  for (const benchmark of benchmarks) {
    await page.setContent(benchmark.html, { waitUntil: "load" });
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map((image) => image.decode()));
    });
    const file = `${benchmark.id}.png`;
    const path = `${outputDirectory}${file}`;
    await page.screenshot({ path, type: "png", animations: "disabled" });
    await writeFile(`${outputDirectory}${benchmark.id}.html`, benchmark.html, "utf8");
    const bytes = await readFile(path);
    const mobileFile = `mobile/${benchmark.id}.png`;
    await execFileAsync("magick", [path, "-filter", "Lanczos", "-resize", "324x405!", `${outputDirectory}${mobileFile}`]);
    let mechanismSketch: string | undefined;
    let mobileMechanismSketch: string | undefined;
    if (restartIds.has(benchmark.id)) {
      await page.evaluate(() => {
        document.querySelectorAll(".brand-logo").forEach((element) => element.remove());
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) walker.currentNode.textContent = "";
        document.documentElement.style.filter = "grayscale(1)";
      });
      mechanismSketch = `mechanism-sketches/${benchmark.id}.png`;
      mobileMechanismSketch = `mechanism-sketches/${benchmark.id}-mobile.png`;
      await page.screenshot({ path: `${outputDirectory}${mechanismSketch}`, type: "png", animations: "disabled" });
      await execFileAsync("magick", [
        `${outputDirectory}${mechanismSketch}`,
        "-filter",
        "Lanczos",
        "-resize",
        "324x405!",
        `${outputDirectory}${mobileMechanismSketch}`,
      ]);
    }
    rendered.push({
      ...benchmark,
      file,
      mobileFile,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      byteLength: bytes.byteLength,
      ...(mechanismSketch ? { mechanismSketch, mobileMechanismSketch } : {}),
    });
  }
} finally {
  await browser.close();
}

const renderedById = new Map(rendered.map((item) => [item.id, `${outputDirectory}${item.file}`]));
const selectFiles = (ids: string[]) => ids.map((id) => {
  const file = renderedById.get(id);
  if (!file) throw new Error(`Missing rendered candidate ${id}`);
  return file;
});
const allFiles = rendered.map((item) => `${outputDirectory}${item.file}`);
const feedVisibleIds = [
  "01-ar-context-handoff",
  "04-ar-decision-question",
  "08-en-field-notes",
  "06-ar-operating-pattern",
  "09-ar-carousel-decision",
  "02-ar-rag-evidence",
  "05-en-before-after",
  "12-en-complexity-answerable",
  "07-en-evidence-ledger",
  "03-ar-automation-relay",
];
const feedFiles = selectFiles(feedVisibleIds);
const carouselFiles = selectFiles(["09-ar-carousel-decision", "10-ar-carousel-boundaries", "11-ar-carousel-stop"]);
const restartMechanismFiles = ["03-ar-automation-relay", "05-en-before-after", "07-en-evidence-ledger", "12-en-complexity-answerable"].map(
  (id) => `${outputDirectory}mechanism-sketches/${id}-mobile.png`,
);
await execFileAsync("magick", ["montage", ...feedFiles.slice(0, 3), "-tile", "3x1", "-geometry", "324x405+22+22", "-background", "#DCE7E0", `${comparisonDirectory}feed-3.png`]);
await execFileAsync("magick", ["montage", ...feedFiles.slice(0, 9), "-tile", "3x3", "-geometry", "270x338+22+22", "-background", "#DCE7E0", `${comparisonDirectory}feed-9.png`]);
await execFileAsync("magick", ["montage", ...feedFiles, "-tile", "3x4", "-geometry", "270x338+22+22", "-background", "#DCE7E0", `${comparisonDirectory}feed-visible-10.png`]);
await execFileAsync("magick", ["montage", ...allFiles, "-tile", "3x4", "-geometry", "270x338+22+22", "-background", "#DCE7E0", `${comparisonDirectory}benchmark-suite-12.png`]);
await execFileAsync("magick", ["montage", ...carouselFiles, "-tile", "3x1", "-geometry", "324x405+22+22", "-background", "#DCE7E0", `${comparisonDirectory}carousel-sequence-09-11.png`]);
await execFileAsync("magick", ["montage", ...restartMechanismFiles, "-tile", "4x1", "-geometry", "324x405+18+18", "-background", "#DCE7E0", `${comparisonDirectory}restart-mechanisms-mobile.png`]);
await execFileAsync("magick", ["montage", `${root}artifacts/creative-benchmarks/01-ar-system-light.png`, renderedById.get("01-ar-context-handoff")!, "-tile", "2x1", "-geometry", "432x540+28+28", "-background", "#DCE7E0", `${comparisonDirectory}old-vs-new-identical-brief.png`]);

const manifest = {
  schemaVersion: "2.1.0",
  generatedAt: new Date().toISOString(),
  iteration: 3,
  supersedes: "../benchmarks-v2-round2/",
  status: "ROUND_3_PIXEL_CRITIQUE_REQUIRED",
  publicationEligible: false,
  currentReleaseGate: "BLOCKED",
  generator: "scripts/generate-creative-rebuild.mts",
  renderer: "Chromium actual-pixel capture with embedded approved font files",
  canvas: { width: 1080, height: 1350 },
  mobileReview: { width: 324, height: 405 },
  antiCopy: {
    corpusPixelsSentToGenerator: false,
    creatorOrStudioNamesInPrompts: false,
    referenceUse: "Retrieved principles and critic anchors only",
    originalityReviewRequired: true,
  },
  fontEvidence: [
    {
      family: "Ghroob Arabic ITF",
      role: "Arabic display, support, and Arabic metadata",
      files: [
        { file: "apps/web/src/app/fonts/GhroobArabicITF-Regular.otf", sha256: createHash("sha256").update(arabicRegularFont).digest("hex") },
        { file: "apps/web/src/app/fonts/GhroobArabicITF-Bold.otf", sha256: createHash("sha256").update(arabicBoldFont).digest("hex") },
      ],
      rights: "Project-provided approved brand font files; embedded in the controlled renderer.",
    },
    {
      family: "Dh Ranclo",
      role: "Available brand display accent; intentionally unused in round 3 after mobile legibility review",
      files: [{ file: "apps/web/src/app/fonts/DhRanclo-Bold.otf", sha256: createHash("sha256").update(latinFont).digest("hex") }],
      rights: "Project-provided approved brand font file; embedded in the controlled renderer.",
    },
    {
      family: "IBM Plex Sans",
      role: "Latin reading, evidence, labels, and qualifications",
      package: "@fontsource/ibm-plex-sans@5.3.0",
      license: "OFL-1.1",
      files: [
        { file: "ibm-plex-sans-latin-400-normal.woff2", sha256: createHash("sha256").update(plexRegularFont).digest("hex") },
        { file: "ibm-plex-sans-latin-600-normal.woff2", sha256: createHash("sha256").update(plexSemiboldFont).digest("hex") },
      ],
    },
  ],
  generatedAssetEvidence: [
    { file: "context-handoff-round3.png", sha256: createHash("sha256").update(contextImage).digest("hex"), rawReferencePixelsSupplied: false },
    { file: "rag-evidence-retrieval.png", sha256: createHash("sha256").update(ragImage).digest("hex"), rawReferencePixelsSupplied: false },
    { file: "custody-relay-round3.png", sha256: createHash("sha256").update(custodyRelayImage).digest("hex"), rawReferencePixelsSupplied: false },
    { file: "status-to-next-action.png", sha256: createHash("sha256").update(statusActionImage).digest("hex"), rawReferencePixelsSupplied: false },
    { file: "evidence-rivet-round3.png", sha256: createHash("sha256").update(evidenceRivetImage).digest("hex"), rawReferencePixelsSupplied: false },
    { file: "complexity-core-round3.png", sha256: createHash("sha256").update(complexityCoreImage).digest("hex"), rawReferencePixelsSupplied: false },
  ],
  creativeProcess: {
    routesRequiredPerBrief: 4,
    selectedRoutesHaveRejectionRationale: true,
    professionalPixelCriticsRequired: { Arabic: 4, English: 3 },
    professionalThreshold: 145,
    maximum: 160,
  },
  creatives: rendered.map((item) => {
    const artifact = { ...item };
    Reflect.deleteProperty(artifact, "html");
    return artifact;
  }),
  restartEvidence: {
    "03-ar-automation-relay": { mechanism: "three discrete stations release, verify, and physically stop exactly one short baton without a shared rail", textlessTest: "PENDING_UNPRIMED_REVIEW", failIf: "reads as a camera, product lineup, generic conveyor, or continuous fixture" },
    "05-en-before-after": { mechanism: "repeated status fragments are physically committed into one owned next-action record", textlessTest: "PENDING_UNPRIMED_REVIEW", failIf: "reads as a shredder or generic chaos-to-order" },
    "07-en-evidence-ledger": { mechanism: "one mineral decision block and one evidence wafer interlock around a single glass provenance rivet", textlessTest: "PENDING_UNPRIMED_REVIEW", failIf: "reads as stationery, a generic folder, or two loose objects" },
    "12-en-complexity-answerable": { mechanism: "one calibrated core preserves the exact layer order of the dense block from which it was sampled", textlessTest: "PENDING_UNPRIMED_REVIEW", failIf: "reads as a generic network, database, funnel, or decorative product stack" },
  },
  comparisons: {
    oldVsNewIdenticalBrief: "../comparisons/round3/old-vs-new-identical-brief.png",
    feed3: "../comparisons/round3/feed-3.png",
    feed9: "../comparisons/round3/feed-9.png",
    feedVisible10: "../comparisons/round3/feed-visible-10.png",
    benchmarkSuite12: "../comparisons/round3/benchmark-suite-12.png",
    carouselSequence: "../comparisons/round3/carousel-sequence-09-11.png",
    restartMechanismsMobile: "../comparisons/round3/restart-mechanisms-mobile.png",
    feedExcludesCarouselInteriorSlides: ["10-ar-carousel-boundaries", "11-ar-carousel-stop"],
    professionalAnchorPixelsCopied: false,
    professionalAnchorReview: "Recorded separately by reference ID against the read-only local corpus.",
  },
  knownLimitations: [
    "These are controlled benchmark candidates, not approved posts or measured campaign results.",
    "Six focal assets are original image generations and require artifact, contact, edge, and originality review at actual pixels.",
    "Native vector and typographic scenes still require independent professional comparison; deterministic metadata cannot establish aesthetics.",
    "No current candidate may enter the golden set or release production until current-hash critics and feed review pass.",
  ],
};
await writeFile(`${outputDirectory}manifest.json`, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

console.log(`Rendered ${rendered.length} benchmark candidates, 4 mechanism sketches, and 7 comparison sheets.`);
