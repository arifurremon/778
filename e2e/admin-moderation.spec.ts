import { test, expect } from "@playwright/test";
import { E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD, isDatabaseReady } from "./helpers/runtime";
import { loginWithCredentials } from "./helpers/auth";

test.describe("Admin moderation (Phase 9 E2E)", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(!isDatabaseReady(), "Requires DATABASE_URL and E2E seed");
  });

  test("admin can access dashboard and admin API", async ({ page }) => {
    await loginWithCredentials(page, E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD);

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin/);

    const apiRes = await page.request.get("/api/admin");
    expect(apiRes.status()).toBe(200);
    const body = await apiRes.json();
    expect(typeof body.totalUsers).toBe("number");
  });

  test("admin can open posts moderation page", async ({ page }) => {
    await loginWithCredentials(page, E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD);
    await page.goto("/admin/posts/pending-moderation");
    await expect(page.getByRole("heading").first()).toBeVisible();
  });

  test("regular user cannot access admin API", async ({ page }) => {
    await loginWithCredentials(page);
    const apiRes = await page.request.get("/api/admin");
    expect(apiRes.status()).toBe(403);
  });
});
