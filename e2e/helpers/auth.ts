import { expect, type Page } from "@playwright/test";
import { E2E_USER_EMAIL, E2E_USER_PASSWORD } from "./runtime";

export async function fillLoginForm(
  page: Page,
  email = E2E_USER_EMAIL,
  password = E2E_USER_PASSWORD
) {
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
}

export async function submitLogin(page: Page) {
  await page.locator("form").getByRole("button", { name: /Sign In/i }).click();
}

export async function loginWithCredentials(page: Page) {
  await page.goto("/login");
  await expect(page.locator("form #email")).toBeVisible();
  await fillLoginForm(page);
  await submitLogin(page);
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
}
