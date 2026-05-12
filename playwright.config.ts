import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E configuration for The Chattala Platform.
 *
 * Runs against the local Next.js dev server on port 9002.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  reporter: "html",
  timeout: 30_000,

  use: {
    baseURL: "http://localhost:9002",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: "npm run dev",
    url: "http://localhost:9002",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
