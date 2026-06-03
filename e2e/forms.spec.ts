import { test, expect } from "@playwright/test";
import { isDatabaseReady } from "./helpers/runtime";
import { loginWithCredentials } from "./helpers/auth";

test.describe("Public forms", () => {
  test("loads the about page inquiry form", async ({ page }) => {
    await page.goto("/about");
    await expect(page.getByRole("tab", { name: /Inquiry/i })).toBeVisible();
    await page.getByRole("tab", { name: /Inquiry/i }).click();

    await expect(page.getByText(/Inquiry Subject/i)).toBeVisible();
    await expect(page.getByText(/^Message$/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Send Inquiry/i })
    ).toBeVisible();
  });

  test("shows validation when submitting an empty inquiry form", async ({ page }) => {
    await page.goto("/about");
    await page.getByRole("tab", { name: /Inquiry/i }).click();
    await page.getByRole("button", { name: /Send Inquiry/i }).click();

    await expect(page.locator("input:invalid, textarea:invalid").first()).toBeVisible();
  });

  test("submits the about inquiry form successfully", async ({ page }) => {
    test.skip(
      !isDatabaseReady(),
      "Requires DATABASE_URL and a successful global setup seed"
    );

    await loginWithCredentials(page);
    await page.goto("/about");
    await page.getByRole("tab", { name: /Inquiry/i }).click();

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
