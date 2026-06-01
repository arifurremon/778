import { POST as rejectShop } from "@/app/api/admin/shops/[id]/reject/route";
import { POST as verifyShop } from "@/app/api/admin/shops/[id]/verify/route";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    shop: {
      findUnique: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(db)),
    user: { update: vi.fn() },
    activityLog: { create: vi.fn() }
  },
}));

// Mock shop.update inside transaction
(db as any).shop = { ...db.shop, update: vi.fn() };

vi.mock("@/lib/admin-auth", () => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/lib/audit-log", () => ({
  logAdminAction: vi.fn(),
}));

describe("Shop Moderation API Endpoints", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/admin/shops/[id]/verify", () => {
    it("should successfully verify a shop and send notifications", async () => {
      (requireAdmin as any).mockResolvedValue({ session: { user: { id: "admin-1" } } });
      (db.shop.findUnique as any).mockResolvedValue({ 
        id: "shop-1", 
        name: "Test Shop", 
        userId: "user-1",
        user: { email: "owner@test.com", name: "Owner" }
      });

      const req = new NextRequest("http://localhost:3000/api/admin/shops/shop-1/verify", {
        method: "POST",
        headers: { origin: "http://localhost:3000", "x-csrf-token": "test-csrf-token" },
      });
      const res = await verifyShop(req, { params: Promise.resolve({ id: "shop-1" }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(db.$transaction).toHaveBeenCalled();
      expect(sendEmail).toHaveBeenCalledWith(
        "owner@test.com",
        expect.stringContaining("Verified"),
        expect.any(String)
      );
    });
  });

  describe("POST /api/admin/shops/[id]/reject", () => {
    it("should fail if rejection reason is less than 20 characters", async () => {
      (requireAdmin as any).mockResolvedValue({ session: { user: { id: "admin-1" } } });
      
      const req = new NextRequest("http://localhost:3000/api/admin/shops/shop-1/reject", {
        method: "POST",
        headers: { origin: "http://localhost:3000", "x-csrf-token": "test-csrf-token" },
        body: JSON.stringify({ reason: "Too short" })
      });
      
      const res = await rejectShop(req, { params: Promise.resolve({ id: "shop-1" }) });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.errors[0].message).toContain("20 characters");
    });

    it("should succeed if rejection reason is valid", async () => {
      (requireAdmin as any).mockResolvedValue({ session: { user: { id: "admin-1" } } });
      (db.shop.findUnique as any).mockResolvedValue({ 
        id: "shop-1", 
        name: "Test Shop", 
        userId: "user-1",
        user: { email: "owner@test.com" }
      });

      const validReason = "Your shop does not meet our quality standards for photography and description.";
      const req = new NextRequest("http://localhost:3000/api/admin/shops/shop-1/reject", {
        method: "POST",
        headers: { origin: "http://localhost:3000", "x-csrf-token": "test-csrf-token" },
        body: JSON.stringify({ reason: validReason })
      });
      
      const res = await rejectShop(req, { params: Promise.resolve({ id: "shop-1" }) });
      expect(res.status).toBe(200);
      expect(db.$transaction).toHaveBeenCalled();
    });
  });

  it("should return 404 if shop to verify does not exist", async () => {
    (requireAdmin as any).mockResolvedValue({ session: { user: { id: "admin-1" } } });
    (db.shop.findUnique as any).mockResolvedValue(null);

    const res = await verifyShop(new NextRequest("http://localhost:3000/api/admin/shops/none/verify", { method: "POST", headers: { origin: "http://localhost:3000", "x-csrf-token": "test-csrf-token" } }), { params: Promise.resolve({ id: "none" }) });
    expect(res.status).toBe(404);
  });

  it("should handle email service failure gracefully", async () => {
    (requireAdmin as any).mockResolvedValue({ session: { user: { id: "admin-1" } } });
    (db.shop.findUnique as any).mockResolvedValue({ id: "s1", user: { email: "e" } });
    (sendEmail as any).mockRejectedValue(new Error("SMTP Error"));

    const res = await verifyShop(new NextRequest("http://localhost:3000/api/admin/shops/s1/verify", { method: "POST", headers: { origin: "http://localhost:3000", "x-csrf-token": "test-csrf-token" } }), { params: Promise.resolve({ id: "s1" }) });
    expect(res.status).toBe(200); // API should still succeed
  });
});
