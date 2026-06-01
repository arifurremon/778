import { test, expect } from "@playwright/test";
import {
  E2E_USER_EMAIL,
  E2E_USER_PASSWORD,
  isDatabaseReady,
} from "./helpers/runtime";
import { fillLoginForm, submitLogin } from "./helpers/auth";

test.describe("Email / password login (Credentials)", () => {
  test.beforeEach(({ }, testInfo) => {
    test.skip(
      !isDatabaseReady(),
      "Requires DATABASE_URL and a successful global setup seed"
    );
  });

  test("displays the login form on /login", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.locator("form").getByRole("button", { name: /Sign In/i })).toBeVisible();
  });

  test("shows an error for invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await fillLoginForm(page, "not-a-real-user@chattala.test", "WrongPassword1!");
    await submitLogin(page);

    await expect(
      page.getByText(/invalid email or password/i).or(page.locator(".text-red-700"))
    ).toBeVisible({ timeout: 15_000 });
  });

  test("signs in with valid credentials and reaches the dashboard", async ({ page }) => {
    await page.goto("/login");
    await fillLoginForm(page, E2E_USER_EMAIL, E2E_USER_PASSWORD);
    await submitLogin(page);

    await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
