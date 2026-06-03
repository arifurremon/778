import { test, expect } from "@playwright/test";
import bcrypt from "bcryptjs";
import {
  E2E_USER_EMAIL,
  isDatabaseReady,
} from "./helpers/runtime";
import { fillLoginForm, loginWithCredentials, submitLogin } from "./helpers/auth";
import { createE2ePrismaClient } from "./helpers/prisma";
import { CURRENT_POLICY_VERSION } from "../src/lib/legal/policy";

test.describe("Compliance & Privacy (Phase 3)", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(
      !isDatabaseReady(),
      "Requires DATABASE_URL and a successful global setup seed"
    );
  });

  test("privacy page is public and versioned", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.getByRole("heading", { name: /Privacy Policy/i })).toBeVisible();
    await expect(page.getByText(`Version ${CURRENT_POLICY_VERSION}`)).toBeVisible();
    await expect(page.getByRole("link", { name: /Terms/i }).first()).toBeVisible();
  });

  test("terms page is public and versioned", async ({ page }) => {
    await page.goto("/terms");
    await expect(page.getByRole("heading", { name: /Terms of Service/i })).toBeVisible();
    await expect(page.getByText(`Version ${CURRENT_POLICY_VERSION}`)).toBeVisible();
  });

  test("register page links policies and shows acceptance checkbox", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("link", { name: /Terms of Service/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Privacy Policy/i })).toBeVisible();
    await expect(page.locator("#acceptTermsAndPrivacy")).toBeVisible();
  });

  test("authenticated user can export their data", async ({ page }) => {
    await loginWithCredentials(page);

    const response = await page.request.get("/api/user/export");
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.profile.email).toBe(E2E_USER_EMAIL);
    expect(body.exportedAt).toBeTruthy();
    expect(body.exportVersion).toBe(CURRENT_POLICY_VERSION);
  });

  test("delete account flow anonymizes a disposable user", async ({ page }) => {
    const prisma = createE2ePrismaClient();
    const email = `delete-e2e-${Date.now()}@chattala.test`;
    const username = `del_${Date.now()}`.slice(0, 20);
    const password = "DeleteTest123!";
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: passwordHash,
        name: "Delete Test User",
        emailVerified: new Date(),
        mobile: "01712345679",
        location: "Panchlaish",
        dob: new Date("1995-06-15"),
        profession: "Not specified",
        policyAcceptedAt: new Date(),
        policyVersion: CURRENT_POLICY_VERSION,
      },
    });

    try {
      await page.goto("/login");
      await fillLoginForm(page, email, password);
      await submitLogin(page);
      await page.waitForURL(/\/dashboard/, { timeout: 30_000 });

      await page.goto("/settings/delete-account");
      await page.getByRole("button", { name: /Delete My Account/i }).click();
      await page.getByRole("button", { name: /Yes, delete account/i }).click();

      await expect(page).toHaveURL(/\//, { timeout: 30_000 });

      const deletedUser = await prisma.user.findUnique({ where: { id: user.id } });
      expect(deletedUser?.deletedAt).toBeTruthy();
      expect(deletedUser?.email).toContain("deleted_");
      expect(deletedUser?.name).toBe("Deleted User");
    } finally {
      await prisma.user.deleteMany({ where: { id: user.id } });
      await prisma.$disconnect();
    }
  });
});
