import { test, expect } from "@playwright/test";
import { isDatabaseReady } from "./helpers/runtime";
import { loginWithCredentials } from "./helpers/auth";

test.describe("Registration & navigation", () => {
  test("opens the registration tab on /register", async ({ page }) => {
    await page.goto("/register");
    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByRole("button", { name: /Create Account/i }).first()).toBeVisible();
    await expect(page.locator("#name")).toBeVisible();
    await expect(page.locator("#username")).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
  });

  test("shows validation errors when submitting an empty registration form", async ({ page }) => {
    await page.goto("/register");
    await page.getByRole("button", { name: /Create Account/i }).last().click();
    await expect(page.locator(".text-red-600").first()).toBeVisible({ timeout: 10_000 });
  });

  test("navigates between login and register via tabs", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /^Create Account$/i }).first().click();
    await expect(page.locator("#name")).toBeVisible();

    await page.getByRole("button", { name: /^Sign In$/i }).first().click();
    await expect(page.locator("#password")).toBeVisible();
  });

  test("loads the public about page", async ({ page }) => {
    const response = await page.goto("/about");
    expect(response?.ok()).toBeTruthy();
    await expect(page.locator("body")).toBeVisible();
  });

  test("redirects unauthenticated users from dashboard to login", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/\/login/, { timeout: 15_000 });
    expect(page.url()).toContain("/login");
  });

  test("authenticated user can open the community feed", async ({ page }) => {
    test.skip(
      !isDatabaseReady(),
      "Requires DATABASE_URL and a successful global setup seed"
    );

    await loginWithCredentials(page);
    await page.goto("/community");
    await expect(page).toHaveURL(/\/community/);
    await expect(page.locator("body")).toBeVisible();
  });
});
