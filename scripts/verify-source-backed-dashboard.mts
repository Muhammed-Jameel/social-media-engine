import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium, type Page } from "@playwright/test";

const root = fileURLToPath(new URL("../", import.meta.url));
const evidenceRoot = `${root}artifacts/creative-rebuild/source-backed-cohort-2026-08-31/dashboard-verification/`;
const url = process.env.AURENDOR_DASHBOARD_URL ?? "http://localhost:3000/plans/2026-09";
const expectedTitle = "الدفع الرقمي يكتمل عند نقطة القبول";
const expectedAlt = "قطعة دفع خضراء تسير في مسار حجري وتتوقف أمام تجويف فارغ يرمز إلى نقطة قبول غير متاحة.";
const expectedPublicFile = "month1-12-sb01.png";
const expectedSecondTitle = "أي قرار يستهلك وقت فريقك كل أسبوع؟";
const expectedSecondAlt = "قطعة قرار خضراء بجانب خمس فتحات حجرية متكررة ترمز إلى قرار يعود كل أسبوع.";
const expectedSecondPublicFile = "month1-16-sb05.png";

await mkdir(evidenceRoot, { recursive: true });
const browser = await chromium.launch({ headless: true });

async function verifyViewport(name: "desktop" | "mobile", width: number, height: number) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  const page: Page = await context.newPage();
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  const response = await page.goto(url, { waitUntil: "networkidle" });
  const card = page.locator("article.month-plan-card").filter({ hasText: expectedTitle });
  await card.waitFor({ state: "visible" });
  await card.scrollIntoViewIfNeeded();
  const image = card.getByAltText(expectedAlt);
  await image.waitFor({ state: "visible" });
  await image.evaluate(async (node: HTMLImageElement) => {
    if (!node.complete) await node.decode();
  });
  const secondCard = page.locator("article.month-plan-card").filter({ hasText: expectedSecondTitle });
  await secondCard.waitFor({ state: "visible" });
  const secondImage = secondCard.getByAltText(expectedSecondAlt);
  await secondImage.waitFor({ state: "attached" });
  await secondImage.evaluate(async (node: HTMLImageElement) => {
    node.scrollIntoView({ block: "center" });
    if (!node.complete) await node.decode();
  });

  const dom = await page.evaluate(({ title, alt, secondTitle, secondAlt }) => {
    const cards = [...document.querySelectorAll<HTMLElement>("article.month-plan-card")];
    const target = cards.find((candidate) => candidate.innerText.includes(title));
    const heading = target?.querySelector<HTMLElement>("h3");
    const imageNode = target?.querySelector<HTMLImageElement>(`img[alt="${CSS.escape(alt)}"]`);
    const secondTarget = cards.find((candidate) => candidate.innerText.includes(secondTitle));
    const secondHeading = secondTarget?.querySelector<HTMLElement>("h3");
    const secondImageNode = secondTarget?.querySelector<HTMLImageElement>(`img[alt="${CSS.escape(secondAlt)}"]`);
    const verticalPosition = window.scrollY;
    window.scrollTo(9999, verticalPosition);
    const actualHorizontalScroll = window.scrollX;
    window.scrollTo(0, verticalPosition);
    return {
      meaningfulBodyText: document.body.innerText.trim().length,
      titleMatches: cards.filter((candidate) => candidate.innerText.includes(title)).length,
      targetDirection: target ? getComputedStyle(target.querySelector<HTMLElement>(".month-plan-card-body")!).direction : null,
      headingLetterSpacing: heading ? getComputedStyle(heading).letterSpacing : null,
      imageLoaded: Boolean(imageNode?.complete && imageNode.naturalWidth > 0 && imageNode.naturalHeight > 0),
      imageCurrentSrc: imageNode?.currentSrc ?? null,
      imageNaturalSize: imageNode ? { width: imageNode.naturalWidth, height: imageNode.naturalHeight } : null,
      imageAspectRatio: imageNode?.naturalHeight ? imageNode.naturalWidth / imageNode.naturalHeight : null,
      secondCard: {
        titleMatches: cards.filter((candidate) => candidate.innerText.includes(secondTitle)).length,
        direction: secondTarget ? getComputedStyle(secondTarget.querySelector<HTMLElement>(".month-plan-card-body")!).direction : null,
        headingLetterSpacing: secondHeading ? getComputedStyle(secondHeading).letterSpacing : null,
        imageLoaded: Boolean(secondImageNode?.complete && secondImageNode.naturalWidth > 0 && secondImageNode.naturalHeight > 0),
        imageCurrentSrc: secondImageNode?.currentSrc ?? null,
        imageAspectRatio: secondImageNode?.naturalHeight ? secondImageNode.naturalWidth / secondImageNode.naturalHeight : null,
      },
      horizontalOverflow: document.documentElement.scrollWidth - window.innerWidth,
      actualHorizontalScroll,
      overflowOffenders: [...document.querySelectorAll<HTMLElement>("body *")]
        .map((node) => ({
          tag: node.tagName.toLowerCase(),
          className: typeof node.className === "string" ? node.className : "",
          text: node.innerText?.trim().slice(0, 80) ?? "",
          rect: node.getBoundingClientRect().toJSON(),
        }))
        .filter((entry) => entry.rect.right > window.innerWidth + 1 || entry.rect.left < -1)
        .sort((left, right) => (right.rect.right - window.innerWidth) - (left.rect.right - window.innerWidth))
        .slice(0, 12),
      overflowContainers: [document.querySelector<HTMLElement>(".mobile-nav"), document.querySelector<HTMLElement>(".calendar-table-wrap"), document.querySelector<HTMLElement>(".panel:has(.calendar-table-wrap)"), document.querySelector<HTMLElement>(".main-content"), document.querySelector<HTMLElement>(".main-frame")]
        .filter((node): node is HTMLElement => Boolean(node))
        .map((node) => ({
          tag: node.tagName.toLowerCase(),
          className: node.className,
          rect: node.getBoundingClientRect().toJSON(),
          clientWidth: node.clientWidth,
          scrollWidth: node.scrollWidth,
          overflowX: getComputedStyle(node).overflowX,
          minWidth: getComputedStyle(node).minWidth,
          maxWidth: getComputedStyle(node).maxWidth,
        })),
      errorOverlay: Boolean(document.querySelector("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")),
    };
  }, { title: expectedTitle, alt: expectedAlt, secondTitle: expectedSecondTitle, secondAlt: expectedSecondAlt });

  await card.screenshot({ path: `${evidenceRoot}${name}-sep12-card.png`, animations: "disabled" });
  await secondCard.screenshot({ path: `${evidenceRoot}${name}-sep16-card.png`, animations: "disabled" });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${evidenceRoot}${name}-page.png`, fullPage: false, animations: "disabled" });
  const passed = response?.status() === 200
    && dom.meaningfulBodyText > 500
    && dom.titleMatches === 1
    && dom.targetDirection === "rtl"
    && (dom.headingLetterSpacing === "normal" || dom.headingLetterSpacing === "0px")
    && dom.imageLoaded
    && Boolean(dom.imageCurrentSrc?.includes(expectedPublicFile))
    && dom.imageAspectRatio !== null
    && Math.abs(dom.imageAspectRatio - 0.8) < 0.01
    && dom.secondCard.titleMatches === 1
    && dom.secondCard.direction === "rtl"
    && (dom.secondCard.headingLetterSpacing === "normal" || dom.secondCard.headingLetterSpacing === "0px")
    && dom.secondCard.imageLoaded
    && Boolean(dom.secondCard.imageCurrentSrc?.includes(expectedSecondPublicFile))
    && dom.secondCard.imageAspectRatio !== null
    && Math.abs(dom.secondCard.imageAspectRatio - 0.8) < 0.01
    && dom.actualHorizontalScroll === 0
    && !dom.errorOverlay
    && pageErrors.length === 0
    && consoleErrors.length === 0;

  await context.close();
  return { name, viewport: { width, height }, httpStatus: response?.status() ?? null, dom, pageErrors, consoleErrors, passed };
}

try {
  const results = [
    await verifyViewport("desktop", 1440, 1000),
    await verifyViewport("mobile", 390, 844),
  ];
  const report = { schemaVersion: "1.0.0", verifiedAt: new Date().toISOString(), url, publicationEligible: false, allPassed: results.every((result) => result.passed), results };
  await writeFile(`${evidenceRoot}verification.json`, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  if (!report.allPassed) throw new Error(`Dashboard verification failed: ${JSON.stringify(report)}`);
  console.log("Verified source-backed Month 1 update in desktop and mobile dashboard viewports.");
} finally {
  await browser.close();
}
