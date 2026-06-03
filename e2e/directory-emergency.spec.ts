import { test, expect } from "@playwright/test";
import { isDatabaseReady } from "./helpers/runtime";
import { loginWithCredentials } from "./helpers/auth";

test.describe("Directory & emergency pages", () => {
  test.beforeEach(({ }, testInfo) => {
    test.skip(
      !isDatabaseReady(),
      "Requires DATABASE_URL and a successful global setup seed"
    );
  });

  test("loads the directory with tabs and search", async ({ page }) => {
    await loginWithCredentials(page);
    await page.goto("/directory");

    await expect(page).toHaveURL(/\/directory/);
    await expect(page.getByText(/Chattala/i)).toBeVisible();
    await expect(page.getByText(/Directory/i)).toBeVisible();
    await expect(page.getByRole("tab", { name: /Spots/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Heritage/i })).toBeVisible();
    await expect(page.getByPlaceholder(/Search in/i)).toBeVisible();
  });

  test("switches directory tabs", async ({ page }) => {
    await loginWithCredentials(page);
    await page.goto("/directory");

    await page.getByRole("tab", { name: /Transport/i }).click();
    await expect(page.getByPlaceholder(/Search in transport/i)).toBeVisible();

    await page.getByRole("tab", { name: /News/i }).click();
    await expect(page.getByPlaceholder(/Search in news/i)).toBeVisible();
  });

  test("loads emergency contacts with category filters", async ({ page }) => {
    await loginWithCredentials(page);
    await page.goto("/emergency");

    await expect(page).toHaveURL(/\/emergency/);
    await expect(page.getByText(/Essential/i)).toBeVisible();
    await expect(page.getByText(/Contacts/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Police/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Fire Service/i })).toBeVisible();
    await expect(
      page.getByPlaceholder(/Search by station or service/i)
    ).toBeVisible();
  });

  test("filters emergency contacts by category", async ({ page }) => {
    await loginWithCredentials(page);
    await page.goto("/emergency");

    await page.getByRole("button", { name: /Ambulance/i }).click();
    await expect(page.getByRole("button", { name: /Ambulance/i })).toBeVisible();
  });
});
