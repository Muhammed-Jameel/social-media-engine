import { expect, test, type Page } from "@playwright/test";

async function expectNoDocumentOverflow(page: Page): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));

  expect(
    dimensions,
    `document exceeds the ${dimensions.viewport}px mobile viewport`,
  ).toEqual({
    viewport: dimensions.viewport,
    document: dimensions.viewport,
    body: dimensions.viewport,
  });
}

test("owner console stays usable without horizontal document overflow on mobile", async ({ page }) => {
  const runtimeErrors: string[] = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") runtimeErrors.push(message.text());
  });

  await page.goto("/");
  await expect(page.locator(".mobile-header")).toBeVisible();
  await expect(page.locator(".sidebar")).toBeHidden();
  await expect(page.getByRole("heading", { level: 1, name: "The month, under control." })).toBeVisible();
  await expectNoDocumentOverflow(page);

  await page.goto("/content");
  await expect(page.getByRole("heading", { level: 1, name: "Every artifact. Every decision." })).toBeVisible();
  await expectNoDocumentOverflow(page);

  const highRiskCard = page.locator("article.content-card").filter({ hasText: "W3-P5" });
  await highRiskCard.locator("a.content-media").click();
  await expect(page.getByRole("alert").filter({ hasText: "Approval must be deliberate." })).toBeVisible();
  await expectNoDocumentOverflow(page);

  await page.goto("/analytics");
  await expect(page.locator(".evidence-label")).toContainText("Synthetic demo");
  await expectNoDocumentOverflow(page);

  await expect(page.locator('[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay')).toHaveCount(0);
  expect(runtimeErrors, "browser runtime errors").toEqual([]);
});
