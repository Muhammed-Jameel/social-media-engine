import { mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { septemberCreativePosts } from "../apps/web/src/lib/september-creative-plan";

const root = fileURLToPath(new URL("../", import.meta.url));
const workspaceRoot = join(root, "..", "..");
const outputRoot = join(root, "artifacts", "monthly-plans", "2026-09-structured-intelligence", "covers");
const fontRoot = join(workspaceRoot, "marketing", "brand", "fonts", "final-2026");
const productRoot = join(workspaceRoot, "marketing", "assets", "build-app-assets", "mockup-images");

const productImages: Record<string, string> = {
  "SEP-05": "client-dashboard-portrait.png",
  "SEP-08": "admin-media-portrait.png",
  "SEP-11": "admin-payments-portrait.png",
  "SEP-14": "admin-dashboard-portrait.png",
  "SEP-17": "admin-dashboard2-portrait.png",
  "SEP-20": "clinet-project-details-portrait.png",
};

const trackLabels: Record<string, string> = {
  brand_intro: "تعرّف على أورندور",
  ai_automation_service: "ذكاء وأتمتة",
  bunyan_pro: "BUNYAN PRO",
  value_first: "فائدة عملية",
};

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
  return "data:" + mimeType + ";base64," + (await readFile(path)).toString("base64");
}

function flowVisual(steps: string[]): string {
  return '<div class="flow">' + steps.map((step, index) =>
    '<div class="node"><b>' + String(index + 1).padStart(2, "0") + '</b><span>' + escapeHtml(step) + '</span></div>' +
    (index < steps.length - 1 ? '<div class="link"></div>' : "")
  ).join("") + "</div>";
}

function visualMarkup(post: (typeof septemberCreativePosts)[number], productImage: string | null): string {
  if (productImage) {
    return [
      '<div class="product">',
      '<div class="phone"><img src="', productImage, '" alt="" /></div>',
      '<div class="proof"><i></i> واجهة حقيقية · تحتاج مراجعة خصوصية</div>',
      "</div>",
    ].join("");
  }
  if (post.creativeMode === "typographic") {
    const words = post.hook.split(" ");
    return [
      '<div class="type-visual">',
      '<span>', escapeHtml(words.slice(0, 3).join(" ")), "</span>",
      '<span>', escapeHtml(words.slice(3, 7).join(" ")), "</span>",
      '<span>', escapeHtml(words.slice(7).join(" ")), "</span>",
      "</div>",
    ].join("");
  }
  if (post.creativeMode === "object_led") {
    return '<div class="objects"><i></i><i></i><i></i><b></b></div>';
  }
  if (post.creativeMode === "data_evidence") {
    return '<div class="evidence"><div><b>01</b><span>الادعاء</span></div><div><b>02</b><span>المصدر</span></div><div><b>03</b><span>التطابق</span></div></div>';
  }
  if (post.sequence <= 3) return flowVisual(["نفهم", "نبني", "نقيس"]);
  if (post.contentTrack === "ai_automation_service") return flowVisual(["حدث", "قاعدة", "مسؤول", "استثناء"]);
  return flowVisual(["سؤال", "فحص", "خطوة"]);
}

const css = [
  "@page{size:1080px 1350px;margin:0}",
  "*{box-sizing:border-box}",
  "html,body{margin:0;width:1080px;height:1350px;overflow:hidden}",
  "body{background:#003f35}",
  ".cover{--deep:#003f35;--deep2:#00302a;--deep3:#00221d;--neon:#0edb23;--pale:#95ff73;--paper:#f4f8f5;--ink:#0b201b;position:relative;width:1080px;height:1350px;overflow:hidden;font-family:Ghroob,Arial,sans-serif;color:var(--paper);background:radial-gradient(circle at 15% 8%,rgba(119,255,112,.18),transparent 26%),linear-gradient(145deg,var(--deep),var(--deep3));padding:76px 76px 66px}",
  ".theme-1,.theme-4{color:var(--ink);background:linear-gradient(90deg,rgba(0,63,53,.045) 1px,transparent 1px),linear-gradient(rgba(0,63,53,.045) 1px,transparent 1px),var(--paper);background-size:48px 48px}",
  ".theme-2{background:linear-gradient(160deg,#00221d 8%,#005044 62%,#00352e)}",
  ".theme-3{background:radial-gradient(circle at 92% 84%,rgba(119,255,112,.16),transparent 24%),linear-gradient(160deg,#003f35,#004c41 72%,#00221d)}",
  ".cover:before{content:'';position:absolute;inset:26px;border:1px solid rgba(149,255,115,.28);border-radius:38px}",
  ".theme-1:before,.theme-4:before{border-color:rgba(0,63,53,.18)}",
  ".top{display:flex;align-items:center;justify-content:space-between;direction:ltr;position:relative;z-index:4}",
  ".brand{font-family:Ranclo,Arial,sans-serif;font-size:30px}",
  ".counter{font-family:Ranclo,Arial,sans-serif;font-size:17px;opacity:.8}",
  ".counter b{color:var(--neon);font-size:25px;margin-right:10px}.theme-1 .counter b,.theme-4 .counter b{color:var(--deep)}",
  ".copy{position:relative;z-index:5;width:830px;margin:76px 0 0 auto;direction:rtl;text-align:right}",
  ".track{display:inline-flex;padding:7px 17px 8px;border-radius:999px;color:var(--deep3);background:var(--pale);font-size:23px;font-weight:700}.theme-1 .track,.theme-4 .track{color:var(--paper);background:var(--deep)}",
  "h1{margin:26px 0 0;font-size:79px;line-height:1.04;font-weight:800;text-wrap:balance}",
  ".hook{margin:24px 0 0;max-width:760px;font-size:31px;line-height:1.35;opacity:.82}",
  ".tags{margin-top:22px;display:flex;gap:10px;direction:rtl}.tags span{font-family:Ranclo,Ghroob,Arial,sans-serif;font-size:16px;padding:7px 12px;border:1px solid currentColor;border-radius:999px;opacity:.7}",
  ".visual{position:absolute;z-index:2;left:76px;right:76px;bottom:112px;height:470px}",
  ".flow{height:100%;display:flex;direction:ltr;align-items:center;justify-content:center;gap:18px}",
  ".node{width:170px;height:170px;border-radius:50%;border:2px solid rgba(149,255,115,.65);background:rgba(0,48,42,.82);display:flex;flex-direction:column;justify-content:center;align-items:center;box-shadow:0 22px 60px rgba(0,0,0,.2)}",
  ".theme-1 .node,.theme-4 .node{background:#fff;border-color:rgba(0,63,53,.28);box-shadow:0 22px 54px rgba(0,63,53,.11)}",
  ".node b{font-family:Ranclo,Arial,sans-serif;font-size:19px;color:var(--neon)}.theme-1 .node b,.theme-4 .node b{color:var(--deep)}.node span{font-size:29px;margin-top:8px;font-weight:700}",
  ".link{width:34px;height:2px;background:var(--neon)}",
  ".product{height:100%;position:relative}.product:before{content:'';position:absolute;width:640px;height:330px;border-radius:50%;left:42px;bottom:0;background:var(--neon);opacity:.22;filter:blur(60px)}",
  ".phone{position:absolute;width:360px;height:480px;right:80px;bottom:-52px;border-radius:42px 42px 0 0;overflow:hidden;background:#fff;border:10px solid #d8e5dc;box-shadow:0 36px 90px rgba(0,0,0,.34);transform:rotate(2.5deg)}",
  ".phone img{width:100%;height:100%;object-fit:cover;object-position:top;display:block}",
  ".proof{position:absolute;left:56px;bottom:88px;width:390px;min-height:120px;padding:28px 30px;border-radius:30px;background:rgba(244,248,245,.12);border:1px solid rgba(244,248,245,.28);font-size:26px;line-height:1.35;direction:rtl}.theme-1 .proof,.theme-4 .proof{color:var(--paper);background:var(--deep)}",
  ".proof i{display:inline-block;width:10px;height:10px;border-radius:50%;background:var(--neon);margin-left:8px}",
  ".type-visual{height:100%;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;gap:8px;direction:rtl;transform:rotate(-5deg)}",
  ".type-visual span{display:block;padding:6px 22px 12px;background:var(--pale);color:var(--deep3);font-size:55px;font-weight:800;line-height:1.06}.type-visual span:nth-child(2){margin-right:84px;background:transparent;color:inherit;border:2px solid currentColor}.type-visual span:nth-child(3){margin-right:26px;background:var(--neon)}",
  ".objects{position:relative;height:100%}.objects i{position:absolute;border-radius:50%;box-shadow:inset 0 -22px 40px rgba(0,0,0,.18),0 30px 70px rgba(0,0,0,.2)}.objects i:nth-child(1){width:260px;height:260px;background:var(--pale);left:70px;bottom:35px}.objects i:nth-child(2){width:210px;height:210px;background:var(--deep);border:2px solid var(--pale);left:344px;bottom:96px}.objects i:nth-child(3){width:170px;height:170px;background:var(--neon);right:88px;bottom:150px}.objects b{position:absolute;left:96px;right:96px;height:4px;background:var(--pale);bottom:52px;transform:rotate(-8deg);opacity:.65}",
  ".evidence{height:100%;display:flex;align-items:center;justify-content:center;gap:22px}.evidence div{width:256px;height:278px;border-radius:34px;padding:34px;display:flex;flex-direction:column;justify-content:space-between;background:#fff;color:var(--deep);box-shadow:0 28px 70px rgba(0,0,0,.18)}.evidence div:nth-child(2){transform:translateY(-38px);background:var(--pale)}.evidence b{font-family:Ranclo,Arial,sans-serif;font-size:28px}.evidence span{font-size:42px;font-weight:800}",
  ".planning{position:absolute;z-index:8;left:76px;bottom:50px;font-family:Ranclo,Arial,sans-serif;font-size:15px;opacity:.62;direction:ltr}",
  ".pin{position:absolute;right:76px;bottom:48px;z-index:8;font-size:19px;opacity:.72}",
].join("");

await mkdir(outputRoot, { recursive: true });
const [fontRegular, fontBold, latinBold] = await Promise.all([
  dataUri(join(fontRoot, "GhroobArabicITF-Regular.otf"), "font/otf"),
  dataUri(join(fontRoot, "GhroobArabicITF-ExtraBold.otf"), "font/otf"),
  dataUri(join(fontRoot, "DhRanclo-Bold.otf"), "font/otf"),
]);
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });

try {
  for (const post of septemberCreativePosts) {
    const productFile = productImages[post.key];
    const productImage = productFile ? await dataUri(join(productRoot, productFile), "image/png") : null;
    const theme = String(((post.sequence - 1) % 4) + 1);
    const formatLabel = post.format === "reel" ? "REEL · 9:16 PLAN" : "CAROUSEL · 4:5 PLAN";
    const html = [
      '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><style>',
      "@font-face{font-family:Ghroob;src:url(", fontRegular, ") format('opentype');font-weight:400}",
      "@font-face{font-family:Ghroob;src:url(", fontBold, ") format('opentype');font-weight:800}",
      "@font-face{font-family:Ranclo;src:url(", latinBold, ") format('opentype');font-weight:700}",
      css,
      "</style></head><body>",
      '<main class="cover theme-', theme, " mode-", escapeHtml(post.creativeMode), '">',
      '<div class="top"><span class="brand">social-media-plugin</span><span class="counter"><b>',
      String(post.sequence).padStart(2, "0"), "</b>/ 20</span></div>",
      '<section class="copy"><span class="track">', escapeHtml(trackLabels[post.contentTrack] ?? post.contentTrack), "</span>",
      "<h1>", escapeHtml(post.title), "</h1>",
      '<p class="hook">', escapeHtml(post.hook), "</p>",
      '<div class="tags"><span>', escapeHtml(formatLabel), "</span><span>", escapeHtml(post.creativeMode.replaceAll("_", " ")), "</span></div></section>",
      '<section class="visual">', visualMarkup(post, productImage), "</section>",
      '<div class="planning">PLANNING COVER · NOT A PUBLISHABLE ASSET</div>',
      post.pinCandidate ? '<div class="pin">منشور افتتاحي مثبّت</div>' : "",
      "</main></body></html>",
    ].join("");
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    const fontReady = await page.evaluate(() => document.fonts.check("800 72px Ghroob"));
    if (!fontReady) throw new Error("Ghroob Arabic font did not load for " + post.key);
    await page.screenshot({
      path: join(outputRoot, post.key + ".png"),
      type: "png",
      clip: { x: 0, y: 0, width: 1080, height: 1350 },
      animations: "disabled",
    });
  }
} finally {
  await browser.close();
}

console.log("Rendered " + septemberCreativePosts.length + " truthful September planning covers to " + outputRoot + ".");
