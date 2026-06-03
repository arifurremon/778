import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { isDatabaseReady } from "./helpers/runtime";
import { loginWithCredentials } from "./helpers/auth";

test.describe("Accessibility — WCAG 2.1 AA smoke (Phase 9.7)", () => {
  test("home page has no critical/serious a11y violations", async ({ page }) => {
    await page.goto("/");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const critical = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );
    expect(critical).toEqual([]);
  });

  test("login page has no critical/serious a11y violations", async ({ page }) => {
    await page.goto("/login");
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const critical = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );
    expect(critical).toEqual([]);
  });

  test("register page has no critical/serious a11y violations", async ({ page }) => {
    await page.goto("/register");
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const critical = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );
    expect(critical).toEqual([]);
  });

  test("shops browse page has no critical/serious a11y violations", async ({ page }) => {
    test.skip(!isDatabaseReady(), "Requires auth seed for protected /shops");
    await loginWithCredentials(page);
    await page.goto("/shops");
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const critical = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );
    expect(critical).toEqual([]);
  });

  test("settings page has no critical/serious a11y violations", async ({ page }) => {
    test.skip(!isDatabaseReady(), "Requires DATABASE_URL");
    await loginWithCredentials(page);
    await page.goto("/settings");
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const critical = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );
    expect(critical).toEqual([]);
  });
});
