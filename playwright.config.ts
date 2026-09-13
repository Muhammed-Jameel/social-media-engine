import { defineConfig, devices } from "@playwright/test";
import { resolve } from "node:path";

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3100";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 45_000,
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "pnpm db:migrate && pnpm db:seed && pnpm seed:e2e && pnpm --filter @social-media-plugin/web dev",
        url: baseURL,
        reuseExistingServer: false,
        timeout: 120_000,
        env: {
          NODE_ENV: "development",
          DEMO_MODE: "true",
          DRY_RUN: "true",
          PRODUCTION_PUBLISHING_ENABLED: "false",
          E2E_FIXTURE_MODE: "true",
          PGLITE_DATA_DIR: resolve(process.cwd(), ".data/e2e-pglite"),
          PORT: "3100",
        },
      },
  projects: [
    {
      name: "desktop",
      testIgnore: /responsive\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile",
      testMatch: /responsive\.spec\.ts/,
      use: { ...devices["iPhone 13"], browserName: "chromium" },
    },
  ],
});
