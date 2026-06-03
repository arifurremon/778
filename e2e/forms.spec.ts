import { test, expect } from "@playwright/test";
import { isDatabaseReady } from "./helpers/runtime";
import { loginWithCredentials } from "./helpers/auth";
import { openAboutInquiryTab } from "./helpers/about";

test.describe("About inquiry form", () => {
  test.beforeEach(({ }, testInfo) => {
    test.skip(
      !isDatabaseReady(),
      "Requires DATABASE_URL and a successful global setup seed"
    );
  });

  test.beforeEach(async ({ page }) => {
    await loginWithCredentials(page);
    await openAboutInquiryTab(page);
  });

  test("loads the inquiry form fields", async ({ page }) => {
    await expect(page.getByText(/Inquiry Subject/i)).toBeVisible();
    await expect(page.getByText(/^Message$/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Send Inquiry/i })).toBeVisible();
  });

  test("shows validation when submitting an empty inquiry form", async ({ page }) => {
    await page.getByRole("button", { name: /Send Inquiry/i }).click();
    await expect(page.locator("input:invalid, textarea:invalid").first()).toBeVisible();
  });

  test("submits the inquiry form successfully", async ({ page }) => {
    await page
      .locator("form")
      .filter({ hasText: "Inquiry Subject" })
      .locator("input")
      .nth(2)
      .fill("E2E Contact Test");
    await page
      .locator("form")
      .filter({ hasText: "Inquiry Subject" })
      .locator("textarea")
      .fill("This is an automated Playwright inquiry form submission.");

    await page.getByRole("button", { name: /Send Inquiry/i }).click();

    await expect(page.getByText(/Message Sent/i)).toBeVisible({ timeout: 15_000 });
  });
});
