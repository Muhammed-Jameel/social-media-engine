const fs = await import("node:fs");
const { chromium } = await import("@playwright/test");

type HealthApiResponse = {
  publishingEnabled: boolean;
  ownerAuthConfigured: boolean;
};

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors: string[] = [];
  const base = "http://127.0.0.1:3010";

  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto(`${base}/analytics`);
  await page.getByRole("heading", { name: "What happened after publication?" }).waitFor();
  const text = await page.locator("main").innerText();
  if (
    text.includes("Synthetic demo") ||
    !text.includes("Unavailable") ||
    !text.includes("28") ||
    !text.includes("17")
  ) {
    throw new Error("Live metric evidence missing or synthetic content mixed");
  }

  await page.screenshot({ path: "artifacts/social-learning/qa/analytics-desktop.png", fullPage: true });
  await page.getByRole("link", { name: "Download observations CSV" }).waitFor();

  const csv = await page.request.get(`${base}/api/social-learning/export`);
  if (csv.status() !== 200 || !(await csv.text()).includes("observedAt")) {
    throw new Error("CSV export failed");
  }

  await page.goto(`${base}/analytics?platform=instagram`);
  const rows = await page.locator(".data-table").first().locator("tbody tr").count();
  if (rows !== 2) throw new Error("Platform filter failed");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "artifacts/social-learning/qa/analytics-mobile.png" });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);

  await page.goto(`${base}/publishing`);
  await page.getByRole("heading", { name: "September automatic publishing & learning" }).waitFor();
  const publicationText = await page.locator("main").innerText();
  if (!publicationText.includes("Automatic dispatch blocked by production setup")) {
    throw new Error("Publishing gate state misleading");
  }

  const healthResponse = await page.request.get(`${base}/api/health`);
  const health = (await healthResponse.json()) as HealthApiResponse;
  if (health.publishingEnabled !== false || health.ownerAuthConfigured !== false) {
    throw new Error("Missing-auth live gate wrong");
  }

  const result = {
    errors,
    overflow,
    csvStatus: csv.status(),
    instagramRows: rows,
    health,
    liveMetricsVisible: true,
    publishingBlockedVisible: true,
  };

  fs.writeFileSync("artifacts/social-learning/qa/browser-proof.json", JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
  await browser.close();

  if (errors.length || overflow) process.exit(1);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
