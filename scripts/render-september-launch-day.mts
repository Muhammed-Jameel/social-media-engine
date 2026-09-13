import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, type Page } from "@playwright/test";
import {
  finalCaption,
  septemberCreativePosts,
  type CarouselFrame,
  type SupportingStoryFrame,
} from "../apps/web/src/lib/september-creative-plan";

const root = fileURLToPath(new URL("../", import.meta.url));
const workspaceRoot = join(root, "..", "..");
const planRoot = join(root, "artifacts", "monthly-plans", "2026-09-structured-intelligence");
const outputRoot = join(planRoot, "launch-day");
const sourcePlateRoot = join(outputRoot, "source-plates-v3");
const coverRoot = join(planRoot, "covers");
const fontRoot = join(workspaceRoot, "marketing", "brand", "fonts", "final-2026");
const logoRoot = join(root, "apps", "web", "public", "brand");

const launchPosts = septemberCreativePosts.slice(0, 3);
if (launchPosts.length !== 3 || launchPosts.some((post) => post.format !== "carousel" || post.slides.length !== 6)) {
  throw new Error("Launch day must contain exactly three six-slide carousels.");
}
if (launchPosts.some((post) => post.supportingStories.length !== 2)) {
  throw new Error("Every launch-day post must contain exactly two supporting Stories.");
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/gu, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}

async function dataUri(path: string, mimeType: string): Promise<string> {
  return `data:${mimeType};base64,${(await readFile(path)).toString("base64")}`;
}

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

const [fontRegular, fontBold, latinBold, logoColor, logoPale] = await Promise.all([
  dataUri(join(fontRoot, "GhroobArabicITF-Regular.otf"), "font/otf"),
  dataUri(join(fontRoot, "GhroobArabicITF-ExtraBold.otf"), "font/otf"),
  dataUri(join(fontRoot, "DhRanclo-Bold.otf"), "font/otf"),
  dataUri(join(logoRoot, "aurendor-horizontal-color.svg"), "image/svg+xml"),
  dataUri(join(logoRoot, "aurendor-horizontal-pale.svg"), "image/svg+xml"),
]);

const sourcePlateFiles = launchPosts.flatMap((post) =>
  post.slides.map((slide) => `${post.key}-slide-${String(slide.sequence).padStart(2, "0")}.png`)
);
const sourcePlateBytes = await Promise.all(sourcePlateFiles.map((file) => readFile(join(sourcePlateRoot, file))));
const sourcePlateHashes = sourcePlateBytes.map((bytes) => sha256(bytes));
if (new Set(sourcePlateHashes).size !== sourcePlateHashes.length) {
  throw new Error("Every launch carousel slide must use a unique source image.");
}
const plateEntries = sourcePlateFiles.map((file, index) => [
  file.replace(/-slide-(\d{2})\.png$/u, "-$1"),
  `data:image/png;base64,${sourcePlateBytes[index]!.toString("base64")}`,
] as const);
const plates: Record<string, string> = Object.fromEntries(plateEntries);

function plateFor(postKey: string, sequence: number): string {
  const plate = plates[`${postKey}-${String(sequence).padStart(2, "0")}`];
  if (!plate) throw new Error(`Missing source plate for ${postKey} slide ${sequence}.`);
  return plate;
}

const fontCss = [
  `@font-face{font-family:Ghroob;src:url(${fontRegular}) format('opentype');font-weight:400}`,
  `@font-face{font-family:Ghroob;src:url(${fontBold}) format('opentype');font-weight:800}`,
  `@font-face{font-family:Ranclo;src:url(${latinBold}) format('opentype');font-weight:700}`,
].join("");

const sharedCss = `
  *{box-sizing:border-box}
  html,body{margin:0;padding:0;overflow:hidden}
  body{font-family:Ghroob,Arial,sans-serif}
  .canvas{--deep:#002D27;--night:#071510;--neon:#55FF58;--paper:#F3F5F0;--ink:#003F35;--muted:#48655B;position:relative;overflow:hidden;direction:rtl;text-align:right;background:var(--paper);color:var(--ink)}
  .plate{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0}
  .grain{position:absolute;inset:0;z-index:2;pointer-events:none;opacity:.2;mix-blend-mode:multiply;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.95' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.12'/%3E%3C/svg%3E")}
  .wash{position:absolute;inset:0;z-index:1;pointer-events:none}
  .brand{position:absolute;left:68px;bottom:54px;width:214px;height:auto;z-index:10}
  .series{position:absolute;right:68px;top:56px;font:700 17px/1 Ranclo,Arial,sans-serif;direction:ltr;letter-spacing:.04em;z-index:10}
  .series b{color:var(--neon);font-size:25px;margin-right:8px}
  .chapter{font-size:22px;font-weight:800;color:#087E4B;margin-bottom:27px;display:flex;align-items:center;gap:13px}
  .chapter:before{content:"";height:4px;width:70px;background:#0EDB23;display:inline-block}
  h1{margin:0;font-size:91px;line-height:1.12;font-weight:800;letter-spacing:0;text-wrap:balance;overflow-wrap:anywhere}
  h1 em{display:block;color:#087E4B;font-style:normal}
  .body{font-size:36px;line-height:1.46;margin:31px 0 0;color:var(--muted);max-width:800px;text-wrap:balance}
  .footer-note{position:absolute;right:68px;bottom:58px;z-index:10;font-size:20px;color:var(--muted)}
  .image-caption{position:absolute;z-index:7;font:700 16px/1.1 Ranclo,Arial,sans-serif;direction:ltr;letter-spacing:.04em}
  .index-mark{position:absolute;z-index:8;font:700 132px/1 Ranclo,Arial,sans-serif;direction:ltr;color:rgba(0,63,53,.12)}
  .feed{width:1080px;height:1350px}
  .feed .copy{position:absolute;z-index:6;right:68px;left:68px}

  .layout-cover .plate{object-position:center center}
  .layout-cover .wash{background:linear-gradient(180deg,rgba(245,247,242,.98) 0%,rgba(245,247,242,.9) 31%,rgba(245,247,242,.03) 58%,rgba(0,0,0,.04) 100%)}
  .layout-cover .copy{top:130px;width:830px;margin-right:0}
  .layout-cover h1{font-size:106px;line-height:1.1}
  .layout-cover .body{font-size:40px;max-width:720px}
  .layout-cover .image-caption{left:68px;bottom:112px;color:#264A40}
  .dark.layout-cover{background:var(--night);color:var(--paper)}
  .dark.layout-cover .wash{background:linear-gradient(180deg,rgba(0,18,16,.82) 0%,rgba(0,18,16,.38) 42%,rgba(0,12,10,.02) 66%,rgba(0,12,10,.52) 100%)}
  .dark.layout-cover .copy{top:132px;right:auto;left:68px;width:670px}
  .dark.layout-cover h1,.dark.layout-cover .body{text-align:right;color:var(--paper)}
  .dark.layout-cover h1 em{color:var(--neon)}
  .dark.layout-cover .chapter{color:var(--neon)}
  .dark.layout-cover .image-caption{color:#C8D6CF}

  .layout-ledger{background:var(--paper);color:var(--ink)}
  .layout-ledger .plate{height:720px;top:auto;bottom:0;object-position:center bottom}
  .layout-ledger .wash{background:linear-gradient(180deg,var(--paper) 0%,var(--paper) 47%,rgba(243,245,240,.12) 66%,rgba(0,28,24,.08) 100%)}
  .layout-ledger .copy{top:118px;max-width:850px}
  .layout-ledger h1{font-size:86px;max-width:850px}
  .layout-ledger .body{max-width:790px}
  .layout-ledger .image-caption{right:68px;bottom:690px;color:#0B7B49}
  .layout-ledger .index-mark{left:58px;top:470px}

  .layout-immersive{background:var(--night);color:var(--paper)}
  .layout-immersive .plate{object-position:center center}
  .layout-immersive .wash{background:linear-gradient(180deg,rgba(0,18,15,.9) 0%,rgba(0,18,15,.54) 38%,rgba(0,15,13,.04) 67%,rgba(0,15,13,.8) 100%),linear-gradient(90deg,transparent 30%,rgba(0,25,21,.28) 100%)}
  .layout-immersive .copy{top:112px;max-width:850px;color:var(--paper)}
  .layout-immersive h1{font-size:87px}
  .layout-immersive h1 em{color:var(--neon)}
  .layout-immersive .body{color:#D8E2DC;max-width:760px}
  .layout-immersive .chapter{color:var(--neon)}
  .layout-immersive .image-caption{right:68px;bottom:112px;color:#D8E2DC}
  .layout-immersive .footer-note{color:#D8E2DC}
  .layout-immersive .index-mark{left:48px;bottom:86px;top:auto;color:rgba(85,255,88,.22)}

  .layout-window{background:var(--paper);color:var(--ink)}
  .layout-window .plate{top:328px;right:0;left:auto;width:100%;height:872px;object-position:center bottom}
  .layout-window .wash{background:linear-gradient(180deg,var(--paper) 0%,var(--paper) 27%,rgba(243,245,240,.02) 51%,rgba(243,245,240,.1) 79%,var(--paper) 93%)}
  .layout-window .copy{top:82px;max-width:900px}
  .layout-window h1{font-size:79px;max-width:900px}
  .layout-window .body{font-size:32px;max-width:810px;margin-top:24px}
  .layout-window .image-caption{left:68px;bottom:142px;color:#0B7B49}

  .layout-cta{background:var(--night);color:var(--paper)}
  .layout-cta .plate{object-position:center center;filter:brightness(.72) saturate(.86)}
  .layout-cta .wash{background:linear-gradient(180deg,rgba(0,22,18,.9) 0%,rgba(0,22,18,.55) 48%,rgba(0,18,15,.76) 100%)}
  .layout-cta .copy{top:168px;max-width:900px;color:var(--paper)}
  .layout-cta h1{font-size:103px;max-width:900px}
  .layout-cta h1 em{color:var(--neon)}
  .layout-cta .body{color:#D8E2DC}
  .layout-cta .cta-rule{position:absolute;right:68px;top:650px;width:270px;height:7px;background:var(--neon);z-index:6}
  .layout-cta .cta-copy{position:absolute;right:68px;top:688px;z-index:6;font-size:29px;color:#D8E2DC;max-width:620px;line-height:1.35}
  .layout-cta .footer-note{color:#D8E2DC}

`;

const emphasizedTitles: Record<string, string[]> = {
  "SEP-01": ["أورندور", "طريقة عملك", "تُبطئ فريقك", "مسار واحد واضح", "قياسه وتحسينه", "وضوح أكبر في عملك؟"],
  "SEP-02": ["معك", "كما يحدث فعلًا", "يُتخذ القرار", "المناسب فقط", "قبل أن نتوسع", "أوضح أولًا؟"],
  "SEP-03": ["نبني معك؟", "العمل المتكرر", "موثوقة", "حول فريقك", "Bunyan Pro", "أقرب إليك؟"],
};

function titleHtml(postKey: string, slide: CarouselFrame): string {
  const target = emphasizedTitles[postKey]?.[slide.sequence - 1];
  const escaped = escapeHtml(slide.title);
  if (!target) return escaped;
  const escapedTarget = escapeHtml(target);
  return escaped.includes(escapedTarget) ? escaped.replace(escapedTarget, `<em>${escapedTarget}</em>`) : escaped;
}

function layoutFor(sequence: number): string {
  if (sequence === 1) return "layout-cover";
  if (sequence === 2) return "layout-ledger";
  if (sequence === 3) return "layout-immersive";
  if (sequence === 4) return "layout-window";
  if (sequence === 5) return "layout-immersive";
  return "layout-cta";
}

function chapterFor(postKey: string): string {
  if (postKey === "SEP-01") return "من نحن";
  if (postKey === "SEP-02") return "كيف نعمل";
  return "ماذا نقدم";
}

function metaphorFor(postKey: string, sequence: number): string {
  const labels: Record<string, string[]> = {
    "SEP-01": ["CLARITY, BUILT IN", "IRAQI TECHNOLOGY", "FIND THE FRICTION", "ONE OPERATING PATH", "BUILD · TEST · MEASURE", "START WITH THE REAL WORK"],
    "SEP-02": ["HOW WE WORK", "01 · OBSERVE", "02 · DECIDE", "03 · BUILD", "04 · MEASURE", "MAP THE FIRST PATH"],
    "SEP-03": ["FOUR CAPABILITIES", "01 · AUTOMATION", "02 · KNOWLEDGE", "03 · SYSTEMS", "04 · BUNYAN PRO", "CHOOSE BY THE PROBLEM"],
  };
  return labels[postKey]?.[sequence - 1] ?? "AURENDOR";
}

function carouselHtml(post: (typeof launchPosts)[number], slide: CarouselFrame): string {
  const layout = layoutFor(slide.sequence);
  const dark = post.key === "SEP-02" || layout === "layout-immersive" || layout === "layout-cta";
  const body = slide.body ? `<p class="body">${escapeHtml(slide.body)}</p>` : "";
  const ctaDetail = slide.role === "cta" ? '<div class="cta-rule"></div><div class="cta-copy">صف لنا المسار أو التحدي باختصار، ونبدأ بفهم ما يحدث اليوم.</div>' : "";
  return [
    '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><style>', fontCss, sharedCss,
    '@page{size:1080px 1350px;margin:0}html,body{width:1080px;height:1350px}', '</style></head><body>',
    `<main class="canvas feed ${post.key} seq-${slide.sequence} ${layout} ${dark ? "dark" : "light"}">`,
    `<img class="plate" src="${plateFor(post.key, slide.sequence)}" alt=""/>`, '<div class="wash"></div><div class="grain"></div>',
    `<img class="brand" src="${dark ? logoPale : logoColor}" alt=""/>`,
    `<div class="series"><b>0${post.sequence}</b>/ 03 · ${String(slide.sequence).padStart(2, "0")} / 06</div>`,
    '<section class="copy" data-safe>', `<div class="chapter">${chapterFor(post.key)}</div>`, `<h1>${titleHtml(post.key, slide)}</h1>`, body, '</section>',
    `<div class="image-caption">${metaphorFor(post.key, slide.sequence)}</div>`,
    slide.sequence > 1 && slide.sequence < 6 ? `<div class="index-mark">0${slide.sequence}</div>` : "", ctaDetail,
    `<div class="footer-note">${slide.sequence < 6 ? "اسحب للمتابعة ←" : "احفظ المنشور وشاركه مع فريقك"}</div>`,
    '</main></body></html>',
  ].join("");
}

const storyCss = `
  @page{size:1080px 1920px;margin:0}html,body{width:1080px;height:1920px}
  .story{width:1080px;height:1920px;background:var(--night);color:var(--paper)}
  .story .plate{object-position:center center;filter:brightness(.67) saturate(.86)}
  .story .wash{background:linear-gradient(180deg,rgba(0,20,17,.9) 0%,rgba(0,20,17,.52) 45%,rgba(0,16,14,.66) 72%,rgba(0,14,12,.92) 100%)}
  .story .brand{left:70px;bottom:280px;width:220px}.story .series{top:278px;right:70px;color:#D8E2DC}
  .story-copy{position:absolute;top:420px;right:70px;left:70px;z-index:6}.story-copy .chapter{color:var(--neon)}
  .story-copy h1{font-size:99px;line-height:1.13;max-width:900px;color:var(--paper)}.story-copy h1 em{color:var(--neon)}
  .story-copy .body{font-size:39px;color:#D7E0DB;max-width:760px}
  .interaction{position:absolute;right:70px;left:70px;top:1110px;z-index:7;padding-top:24px;border-top:5px solid var(--neon)}
  .interaction-label{font-size:21px;color:#B9CAC1;margin-bottom:14px}.interaction-prompt{font-size:43px;font-weight:800;line-height:1.18;color:var(--paper);max-width:850px}
  .native-zone{margin-top:28px;width:100%;min-height:142px;border:2px dashed rgba(244,248,245,.7);display:flex;align-items:center;justify-content:center;padding:22px;font-size:28px;color:#D8E2DC}
  .native-zone.open{border-style:solid;background:rgba(85,255,88,.92);color:#002D27;font-size:34px;font-weight:800}
  .story-footer{position:absolute;right:70px;bottom:278px;z-index:8;font-size:20px;color:#D8E2DC}
`;

function storyInteraction(story: SupportingStoryFrame): string {
  if (story.interaction.type === "open_post") {
    return `<div class="interaction-label">المنشور المرتبط</div><div class="interaction-prompt">${escapeHtml(story.exactText)}</div><div class="native-zone open">${escapeHtml(story.interaction.prompt)} ←</div>`;
  }
  const options = story.interaction.options?.join(" · ");
  const label = story.interaction.type === "question" ? "سؤال للجمهور" : story.interaction.type === "poll" ? "تصويت" : "اختبار سريع";
  return `<div class="interaction-label">${label}</div><div class="interaction-prompt">${escapeHtml(story.interaction.prompt)}</div><div class="native-zone">${escapeHtml(options ? `أضف الملصق هنا: ${options}` : "أضف ملصق الإجابة هنا")}</div>`;
}

function storyHtml(post: (typeof launchPosts)[number], story: SupportingStoryFrame): string {
  const lead: Record<string, string> = { "SEP-01": "كلما كبر العمل، هل أصبحت الخطوة التالية أقل وضوحًا؟", "SEP-02": "قبل اختيار الأداة، افهم أين يضيع وقت الفريق.", "SEP-03": "المشكلة هي التي تحدد المسار، لا اسم التقنية." };
  const headline = story.sequence === 1 ? lead[post.key] ?? story.exactText : "المنشور الآن على الصفحة";
  const emphasis = story.sequence === 1 ? headline.split(" ").slice(-2).join(" ") : "الصفحة";
  const escapedHeadline = escapeHtml(headline);
  const headlineHtml = escapedHeadline.includes(escapeHtml(emphasis)) ? escapedHeadline.replace(escapeHtml(emphasis), `<em>${escapeHtml(emphasis)}</em>`) : escapedHeadline;
  return [
    '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><style>', fontCss, sharedCss, storyCss, '</style></head><body>',
    `<main class="canvas story ${post.key}">`, `<img class="plate" src="${plateFor(post.key, story.sequence === 1 ? 3 : 6)}" alt=""/>`, '<div class="wash"></div><div class="grain"></div>',
    `<img class="brand" src="${logoPale}" alt=""/>`, `<div class="series"><b>0${post.sequence}</b>/ 03 · STORY 0${story.sequence}</div>`,
    '<section class="story-copy" data-safe>', `<div class="chapter">${story.sequence === 1 ? "قبل المنشور" : "بعد المنشور"}</div>`, `<h1>${headlineHtml}</h1>`,
    `<p class="body">${story.sequence === 1 ? "شاركنا تجربتك لنقدّم محتوى أقرب إلى تحديات العمل الفعلية." : "ست شرائح موجزة تشرح الفكرة وتضع الخطوة التالية في سياق واضح."}</p>`, '</section>',
    `<section class="interaction" data-safe>${storyInteraction(story)}</section>`, `<div class="story-footer">${post.key} · AURENDOR LAUNCH 2026</div>`, '</main></body></html>',
  ].join("");
}

async function validateAndCapture(page: Page, html: string, path: string, width: number, height: number): Promise<void> {
  await page.setViewportSize({ width, height });
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(async () => document.fonts.ready);
  const validation = await page.evaluate(({ canvasWidth, canvasHeight }) => {
    const fontsReady = document.fonts.check("400 40px Ghroob") && document.fonts.check("800 88px Ghroob");
    const outOfBounds = [...document.querySelectorAll<HTMLElement>("[data-safe]")].filter((element) => {
      const rect = element.getBoundingClientRect();
      return rect.left < 48 || rect.right > canvasWidth - 48 || rect.top < 48 || rect.bottom > canvasHeight - 48;
    }).map((element) => element.className);
    return { fontsReady, outOfBounds };
  }, { canvasWidth: width, canvasHeight: height });
  if (!validation.fontsReady) throw new Error(`Brand fonts failed to load for ${path}.`);
  if (validation.outOfBounds.length > 0) throw new Error(`Safe-area failure for ${path}: ${validation.outOfBounds.join(", ")}`);
  await page.screenshot({ path, type: "png", clip: { x: 0, y: 0, width, height }, animations: "disabled" });
}

interface RenderedRecord { postKey: string; kind: "carousel_slide" | "story_frame"; sequence: number; file: string; width: number; height: number; sha256: string; byteLength: number; ownerApproval: "PENDING" }

await Promise.all([mkdir(outputRoot, { recursive: true }), mkdir(coverRoot, { recursive: true })]);
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
const records: RenderedRecord[] = [];

try {
  for (const post of launchPosts) {
    const postRoot = join(outputRoot, post.key);
    await mkdir(postRoot, { recursive: true });
    for (const slide of post.slides) {
      const file = join(postRoot, `slide-${String(slide.sequence).padStart(2, "0")}.png`);
      await validateAndCapture(page, carouselHtml(post, slide), file, 1080, 1350);
      const bytes = await readFile(file);
      records.push({ postKey: post.key, kind: "carousel_slide", sequence: slide.sequence, file: relative(root, file), width: 1080, height: 1350, sha256: sha256(bytes), byteLength: bytes.byteLength, ownerApproval: "PENDING" });
    }
    await copyFile(join(postRoot, "slide-01.png"), join(coverRoot, `${post.key}.png`));
    for (const story of post.supportingStories) {
      const file = join(postRoot, `story-${String(story.sequence).padStart(2, "0")}.png`);
      await validateAndCapture(page, storyHtml(post, story), file, 1080, 1920);
      const bytes = await readFile(file);
      records.push({ postKey: post.key, kind: "story_frame", sequence: story.sequence, file: relative(root, file), width: 1080, height: 1920, sha256: sha256(bytes), byteLength: bytes.byteLength, ownerApproval: "PENDING" });
    }
  }
} finally { await browser.close(); }

const sourcePlates = sourcePlateFiles;
const manifest = {
  schemaVersion: "2.0.0", campaign: "AURENDOR launch day — tactile image-led direction", generatedAt: new Date().toISOString(), posts: 3,
  carouselSlides: records.filter((record) => record.kind === "carousel_slide").length,
  storyFrames: records.filter((record) => record.kind === "story_frame").length,
  externalAssets: [], generatedOriginalAssets: sourcePlates.map((file) => `artifacts/monthly-plans/2026-09-structured-intelligence/launch-day/source-plates-v3/${file}`),
  ownedAssets: ["apps/web/public/brand/aurendor-horizontal-color.svg", "apps/web/public/brand/aurendor-horizontal-pale.svg", "marketing/brand/fonts/final-2026/GhroobArabicITF-Regular.otf", "marketing/brand/fonts/final-2026/GhroobArabicITF-ExtraBold.otf", "marketing/brand/fonts/final-2026/DhRanclo-Bold.otf"],
  productionNotes: ["Eighteen original source plates were generated specifically for AURENDOR: one unique image for every carousel slide, with approved prior work used only as style reference.", "All visible copy and logos are applied by the deterministic renderer; generated plates contain no text, logo, or people.", "The red-marked visual patterns were excluded: no flat diagram language, split explainers, neon fields, or generic dashboard cards.", "All Arabic is rendered with the canonical Ghroob font, increased line height, and checked inside the canvas safe area.", "Story files use relevant scenes from the carousel family and reserve space for native platform interaction/link stickers.", "Files require owner approval before publication."],
  records,
};

await writeFile(join(outputRoot, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");
await writeFile(join(outputRoot, "DESIGN-ASSET-PLAN.md"), [
  "# AURENDOR launch-day design asset plan", "", "Direction: tactile, cinematic, image-led editorial design. Every carousel uses six distinct but thematically connected physical metaphors rather than repeated crops of one image.", "",
  "1. Eighteen original source plates — one unique generated image per carousel slide; text-free, logo-free, and people-free.",
  "2. Official AURENDOR horizontal marks — source: `apps/web/public/brand`; used small and consistently.",
  "3. Ghroob Arabic ITF — canonical AURENDOR typeface for all Arabic copy; exact RTL text remains editable in the renderer.",
  "4. Dh Ranclo Bold — canonical Latin display face for restrained metadata only.", "", "No stock assets or third-party design elements are used. The source plates are project-bound generated originals; the original generator outputs remain preserved in the Codex generated-images folder.", "", "Rejected patterns deliberately excluded: flat vector explainers, split cards, bright full-green canvases, decorative node diagrams, fake dashboards, and people used as attention devices.", "",
].join("\n"), "utf8");

const contentPackage = [
  "# AURENDOR launch-day content package", "", "Three Arabic announcement carousels scheduled across launch day. Every carousel contains six 1080×1350 slides and two supporting 1080×1920 Story backgrounds.", "", "## Publishing order", "",
  ...launchPosts.flatMap((post) => [
    `### ${post.key} — ${post.title}`, "", `- Publish: ${post.publishAt}`, `- Platforms: ${post.platforms.join(", ")}`, `- Purpose: ${post.pillar}`, `- Asset folder: \`${relative(root, join(outputRoot, post.key))}\``, "", "Caption:", "", finalCaption(post), "", "Slides:", "", ...post.slides.map((slide) => `1. **${slide.sequence}. ${slide.title}**${slide.body ? ` — ${slide.body}` : ""}`), "", "Supporting Stories:", "", ...post.supportingStories.map((story) => `1. **Story ${story.sequence} · ${story.timing}** — ${story.exactText} · Native sticker: ${story.interaction.type} (${story.interaction.prompt})`), "",
  ]),
  "## Platform handoff", "", "- Target Instagram, Facebook, TikTok, X, and LinkedIn.", "- Upload carousel slides in numeric order; do not mix files between SEP folders.", "- Add the native question, poll, quiz, or linked-post sticker inside the reserved Story area where supported.", "- Verify Arabic shaping and line breaks in every platform preview.", "- Do not publish until the owner approves the exact caption and asset hashes shown in Content.", "",
].join("\n");
await writeFile(join(outputRoot, "CONTENT-PACKAGE.md"), contentPackage, "utf8");

console.log(JSON.stringify({ outputRoot, posts: 3, carouselSlides: manifest.carouselSlides, storyFrames: manifest.storyFrames, assets: records.length }, null, 2));
