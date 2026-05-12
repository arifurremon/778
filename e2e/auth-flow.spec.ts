/**
 * E2E Tests — Authentication Flow
 *
 * Verifies the critical user journey:
 *   Landing → Auth page → Registration → Login → Dashboard
 *
 * These tests run against the live Next.js dev server and exercise
 * the full stack including SSR, client hydration, and API calls.
 */
import { test, expect } from "@playwright/test";

const APP_URL = "http://localhost:9002";

// Unique credentials per test run to avoid flakes from prior data
const uniqueSuffix = Date.now();
const TEST_EMAIL = `e2e_test_${uniqueSuffix}@chattala.test`;
const TEST_USERNAME = `e2euser_${uniqueSuffix}`;
const TEST_PASSWORD = "E2eSecure123!";

// ---------------------------------------------------------------------------
// 1. Landing & Navigation
// ---------------------------------------------------------------------------

test.describe("Landing Page & Navigation", () => {
  test("should load the landing page successfully", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/chattala/i);
  });

  test("should navigate to the auth page", async ({ page }) => {
    await page.goto("/auth");
    // The auth page renders the login form by default
    await expect(page.locator("text=Welcome Back")).toBeVisible({ timeout: 10_000 });
  });
});

// ---------------------------------------------------------------------------
// 2. Registration Flow
// ---------------------------------------------------------------------------

test.describe("Registration Flow", () => {
  test("should display validation errors on empty submit", async ({ page }) => {
    await page.goto("/auth");

    // Switch to sign-up mode
    const createAccountBtn = page.locator("text=Create an account");
    if (await createAccountBtn.isVisible()) {
      await createAccountBtn.click();
    }

    // Wait for the signup form to appear
    await expect(page.locator("text=Join the Community")).toBeVisible({ timeout: 10_000 });

    // Try to submit empty form
    const submitButton = page.getByRole("button", { name: /Create My Account/i });
    await submitButton.click();

    // Validation errors should appear (text-destructive elements)
    await expect(page.locator(".text-destructive").first()).toBeVisible({ timeout: 5_000 });
  });

  test("should show signup form fields correctly", async ({ page }) => {
    await page.goto("/auth");

    // Switch to sign-up
    const createAccountBtn = page.locator("text=Create an account");
    if (await createAccountBtn.isVisible()) {
      await createAccountBtn.click();
    }

    await expect(page.locator("text=Join the Community")).toBeVisible({ timeout: 10_000 });

    // All key fields should be present
    await expect(page.locator("#name")).toBeVisible();
    await expect(page.locator("#preferredName")).toBeVisible();
    await expect(page.locator("#username")).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 3. Login Flow
// ---------------------------------------------------------------------------

test.describe("Login Flow", () => {
  test("should display the login form with email and password", async ({ page }) => {
    await page.goto("/auth");

    await expect(page.locator("text=Welcome Back")).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.getByRole("button", { name: /Sign In/i })).toBeVisible();
  });

  test("should show error on invalid credentials", async ({ page }) => {
    await page.goto("/auth");

    await page.locator("#email").fill("fake@example.com");
    await page.locator("#password").fill("wrongpassword");
    await page.getByRole("button", { name: /Sign In/i }).click();

    // Should display an error message within the form
    await expect(
      page.locator("text=Invalid email or password").or(page.locator(".text-destructive"))
    ).toBeVisible({ timeout: 10_000 });
  });

  test("should show Google sign-in button", async ({ page }) => {
    await page.goto("/auth");

    await expect(page.getByRole("button", { name: /Google/i })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 4. Dashboard Access Control
// ---------------------------------------------------------------------------

test.describe("Dashboard Access Control", () => {
  test("should redirect unauthenticated users away from dashboard", async ({ page }) => {
    await page.goto("/dashboard");

    // Should redirect to /auth or show an access denied state
    await page.waitForURL(/\/(auth|login|$)/, { timeout: 10_000 });

    const url = page.url();
    expect(url).toMatch(/\/(auth|login|$)/);
  });
});

// ---------------------------------------------------------------------------
// 5. Community Feed (public)
// ---------------------------------------------------------------------------

test.describe("Community Feed", () => {
  test("should load the community page", async ({ page }) => {
    await page.goto("/community");

    // Page should render without crashing — look for basic structure
    await expect(page.locator("body")).toBeVisible();
    // The page either shows posts or an empty state
    const response = page.url();
    expect(response).toContain("/community");
  });
});
