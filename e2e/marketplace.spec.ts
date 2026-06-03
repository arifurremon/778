import { test, expect } from "@playwright/test";
import { isDatabaseReady } from "./helpers/runtime";
import { loginWithCredentials } from "./helpers/auth";

test.describe("Marketplace smoke tests", () => {
  test.beforeEach(({ }, testInfo) => {
    test.skip(
      !isDatabaseReady(),
      "Requires DATABASE_URL and a successful global setup seed"
    );
  });

  test("loads the shops marketplace page", async ({ page }) => {
    await loginWithCredentials(page);
    await page.goto("/shops");

    await expect(page).toHaveURL(/\/shops/);
    await expect(page.getByText(/Chattala Marketplace/i)).toBeVisible();
    await expect(
      page.getByPlaceholder(/Search products or shops/i)
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Merchant Account/i })
    ).toBeVisible();
  });

  test("loads the services marketplace page", async ({ page }) => {
    await loginWithCredentials(page);
    await page.goto("/services");

    await expect(page).toHaveURL(/\/services/);
    await expect(page.getByText(/Professional/i)).toBeVisible();
    await expect(page.getByText(/Services/i)).toBeVisible();
    await expect(
      page.getByPlaceholder(/Search by name or skill/i)
    ).toBeVisible();
  });

  test("shows shop category filters on the marketplace", async ({ page }) => {
    await loginWithCredentials(page);
    await page.goto("/shops");

    await expect(page.getByRole("button", { name: /All/i }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Grocery/i })).toBeVisible();
  });
});
