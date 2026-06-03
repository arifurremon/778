import { test, expect } from "@playwright/test";
import bcrypt from "bcryptjs";
import { isDatabaseReady } from "./helpers/runtime";
import { loginWithCredentials } from "./helpers/auth";
import { createE2ePrismaClient } from "./helpers/prisma";

test.describe("Booking lifecycle (Phase 9 E2E)", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(!isDatabaseReady(), "Requires DATABASE_URL and E2E seed");
  });

  test("client creates booking and expert confirms via API", async ({ page }) => {
    const prisma = createE2ePrismaClient();
    const expertEmail = `expert-e2e-${Date.now()}@chattala.test`;
    const expertPassword = "ExpertE2e123!";
    const expertHash = await bcrypt.hash(expertPassword, 10);

    const expertUser = await prisma.user.create({
      data: {
        email: expertEmail,
        username: `exp_${Date.now()}`.slice(0, 20),
        password: expertHash,
        name: "E2E Expert",
        emailVerified: new Date(),
        mobile: "01712345671",
        location: "Panchlaish",
        dob: new Date("1990-03-01"),
        profession: "Electrician",
        policyAcceptedAt: new Date(),
        policyVersion: "1.0.0",
      },
    });

    const service = await prisma.expertService.create({
      data: {
        userId: expertUser.id,
        profession: "Electrician",
        category: "Home Services",
        location: "Chattogram",
        experienceYears: 5,
        fee: "500",
        bio: "Professional electrician for E2E booking lifecycle tests.",
        qualifications: ["Licensed"],
        isVerified: true,
      },
    });

    try {
      await loginWithCredentials(page);

      const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:9002";
      const origin = baseURL.replace(/\/$/, "");

      const createRes = await page.request.post(`/api/services/${service.id}/bookings`, {
        headers: {
          "Content-Type": "application/json",
          origin,
          "x-csrf-token": "e2e-csrf-token",
        },
        data: {
          address: "Panchlaish, Chattogram",
          notes: "E2E booking test",
        },
      });

      expect(createRes.status()).toBe(201);
      const booking = await createRes.json();
      expect(booking.id).toBeTruthy();

      await page.goto("/login");
      await loginWithCredentials(page, expertEmail, expertPassword);

      const patchRes = await page.request.patch(`/api/bookings/${booking.id}`, {
        headers: {
          "Content-Type": "application/json",
          origin,
          "x-csrf-token": "e2e-csrf-token",
        },
        data: { status: "CONFIRMED" },
      });

      expect(patchRes.ok()).toBeTruthy();
      const updated = await patchRes.json();
      expect(updated.status).toBe("CONFIRMED");
    } finally {
      await prisma.serviceBooking.deleteMany({ where: { expertServiceId: service.id } });
      await prisma.expertService.delete({ where: { id: service.id } });
      await prisma.user.delete({ where: { id: expertUser.id } });
      await prisma.$disconnect();
    }
  });

  test("client can list their bookings after login", async ({ page }) => {
    await loginWithCredentials(page);
    const listRes = await page.request.get("/api/bookings");
    expect(listRes.ok()).toBeTruthy();
    const body = await listRes.json();
    expect(Array.isArray(body.bookings)).toBe(true);
  });
});
