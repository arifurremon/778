import { test, expect } from "@playwright/test";

test.describe("Public health endpoint", () => {
  test("GET /api/health is reachable without auth", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBeLessThan(600);

    const body = await response.json();
    expect(body.timestamp).toBeTruthy();
    expect(body.checks.database).toBeTruthy();
    expect(body.checks.redis).toBeTruthy();
    expect(["healthy", "degraded", "unhealthy"]).toContain(body.status);
  });

  test("status page renders live health section", async ({ page }) => {
    await page.goto("/status");
    await expect(page.getByRole("heading", { name: /The Chattala Platform/i })).toBeVisible();
    await expect(page.getByText(/Database/i)).toBeVisible({ timeout: 15_000 });
  });

  test("footer links to status page", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.getByRole("link", { name: /Status/i })).toBeVisible();
  });
});
