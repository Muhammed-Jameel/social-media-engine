import { expect, test, type Page } from "@playwright/test";

function observeRuntimeErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return errors;
}

async function expectHealthyConsolePage(page: Page, runtimeErrors: string[]): Promise<void> {
  await expect(page.locator("body")).not.toHaveText("");
  await expect(page.locator("#main-content")).toBeVisible();
  await expect(page.locator('[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay')).toHaveCount(0);
  expect(runtimeErrors, "browser runtime errors").toEqual([]);
}

test("dashboard identifies the demo environment and all 33 imported items", async ({ page }) => {
  const runtimeErrors = observeRuntimeErrors(page);

  await page.goto("/");

  await expect(page).toHaveTitle(/SOCIAL_MEDIA_PLUGIN Content OS/);
  await expect(page.getByRole("heading", { level: 1, name: "The month, under control." })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "Demonstration environment." })).toContainText(
    "Analytics are synthetic and no provider action can publish.",
  );

  const septemberMetric = page.locator(".metric-card").filter({ hasText: "September system" });
  await expect(septemberMetric).toContainText("imported content items");
  await expect(septemberMetric.locator(":scope > strong")).toHaveText("33");
  await expectHealthyConsolePage(page, runtimeErrors);
});

test("creative production is visibly held behind a read-only release gate", async ({ page }) => {
  const runtimeErrors = observeRuntimeErrors(page);

  await page.goto("/");
  const banner = page.getByRole("alert", { name: "Creative production release gate" });
  await expect(banner).toContainText("Creative production frozen.");
  await expect(banner).toContainText("POST_PRODUCTION claims are blocked");
  await expect(banner).toContainText("BENCHMARKING");

  await banner.getByRole("link", { name: "View gate" }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Creative quality release gate" })).toBeVisible();
  await expect(page.locator(".creative-gate-panel")).toContainText("No console toggle");
  await expect(page.getByRole("button", { name: /release creative/i })).toHaveCount(0);
  await expectHealthyConsolePage(page, runtimeErrors);
});

test("W3-P5 remains a high-risk hard fail requiring deliberate review", async ({ page }) => {
  const runtimeErrors = observeRuntimeErrors(page);

  await page.goto("/content");
  await expect(page.getByRole("heading", { level: 1, name: "Every artifact. Every decision." })).toBeVisible();
  await expect(page.locator(".filter-bar")).toContainText("33 results");

  const highRiskCard = page.locator("article.content-card").filter({ hasText: "W3-P5" });
  await expect(highRiskCard).toHaveCount(1);
  await expect(highRiskCard).toContainText("High risk");
  await highRiskCard.locator("a.content-media").click();

  await expect(page.locator(".page-header .eyebrow")).toContainText("W3-P5");
  const hardFail = page.getByRole("alert").filter({ hasText: "Approval must be deliberate." });
  await expect(hardFail).toBeVisible();
  await expect(hardFail).toContainText("3 imported QA signal(s) remain unresolved.");
  await expect(hardFail).toContainText("Bulk approval cannot clear this boundary.");
  await expectHealthyConsolePage(page, runtimeErrors);
});

test("analytics labels every demonstration as synthetic evidence", async ({ page }) => {
  const runtimeErrors = observeRuntimeErrors(page);

  await page.goto("/analytics");

  await expect(page.getByRole("heading", { level: 1, name: "Evidence before optimization." })).toBeVisible();
  await expect(page.locator(".evidence-label")).toHaveText(/Synthetic demo/);
  await expect(page.locator(".evidence-callout")).toContainText("Synthetic 8-week demonstration");
  await expect(page.locator(".evidence-callout")).toContainText("must not be used as proof of SOCIAL_MEDIA_PLUGIN performance");
  await expect(page.getByRole("table")).toContainText("Directional demo only");
  await expectHealthyConsolePage(page, runtimeErrors);
});

test("health endpoint reports demo mode with publishing disabled", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toBe("no-store");

  const health = (await response.json()) as Record<string, unknown>;
  expect(health).toMatchObject({
    status: "ok",
    service: "social-content-os",
    mode: "demo",
    publicationCapability: "dry-run-only",
    publishingEnabled: false,
    publishingFlagRequested: false,
    environmentPauseRequested: false,
  });
  expect(health.database).toMatch(/^(pglite|postgres)$/);
  expect(Number.isNaN(Date.parse(String(health.checkedAt)))).toBe(false);
});
