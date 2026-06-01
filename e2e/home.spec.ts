import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("loads the landing page with auth shell", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.ok()).toBeTruthy();

    await expect(page).toHaveTitle(/The Chattala/i);
    await expect(page.locator("form #email")).toBeVisible();
    await expect(page.getByRole("button", { name: /Create Account/i }).first()).toBeVisible();
  });

  test("shows login form fields on the homepage", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.getByRole("button", { name: /Sign In/i }).last()).toBeVisible();
  });
});
