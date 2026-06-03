/**
 * Integration Tests — Service bookings API
 */
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { testUsers } from "../fixtures/seed";
import { prismaMock, resetPrismaMock } from "../helpers/prisma-mock";

vi.mock("@/lib/error-handler", () => ({
  logErrorToSentry: vi.fn(),
}));

vi.mock("@/lib/notification-service", () => ({
  sendNotification: vi.fn().mockResolvedValue(undefined),
  NotificationType: {
    SERVICE_BOOKED: "SERVICE_BOOKED",
    SERVICE_UPDATED: "SERVICE_UPDATED",
  },
}));

const mockAuth = vi.fn().mockResolvedValue(null);
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

import { POST as createBooking } from "@/app/api/services/[expertId]/bookings/route";
import { PATCH as patchBooking } from "@/app/api/bookings/[bookingId]/route";
import { sendNotification } from "@/lib/notification-service";

function makePostRequest(expertId: string, body: Record<string, unknown>): NextRequest {
  return new NextRequest(`http://localhost:3000/api/services/${expertId}/bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      origin: "http://localhost:3000",
      "x-csrf-token": "test-csrf-token",
    },
    body: JSON.stringify(body),
  });
}

function makePatchRequest(bookingId: string, body: Record<string, unknown>): NextRequest {
  return new NextRequest(`http://localhost:3000/api/bookings/${bookingId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      origin: "http://localhost:3000",
      "x-csrf-token": "test-csrf-token",
    },
    body: JSON.stringify(body),
  });
}

function mockActiveUser(userId: string) {
  mockAuth.mockResolvedValue({ user: { id: userId, name: "Test User" } });
  prismaMock.user.findUnique.mockResolvedValue({
    id: userId,
    role: "USER",
    deletedAt: null,
    suspendedAt: null,
  });
}

const sampleService = {
  id: "service-1",
  userId: "expert-1",
  profession: "Heart Specialist",
  fee: { toNumber: () => 1500 },
  isVerified: true,
};

const sampleBooking = {
  id: "booking-1",
  expertServiceId: "service-1",
  clientId: testUsers.regular.id,
  scheduledDate: null,
  address: "Panchlaish",
  notes: "Need help",
  fee: { toNumber: () => 1500 },
  status: "PENDING",
  subStatus: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  client: {
    id: testUsers.regular.id,
    name: testUsers.regular.name,
    preferredName: null,
    profileImage: null,
    email: testUsers.regular.email,
  },
  expertService: {
    id: "service-1",
    profession: "Heart Specialist",
    category: "Doctor",
    userId: "expert-1",
  },
};

describe("Service booking API — Integration", () => {
  beforeEach(() => {
    resetPrismaMock();
    mockAuth.mockResolvedValue(null);
    vi.mocked(sendNotification).mockClear();
  });

  it("creates a booking and notifies the expert", async () => {
    mockActiveUser(testUsers.regular.id);
    prismaMock.expertService.findUnique.mockResolvedValue(sampleService);
    prismaMock.serviceBooking.create.mockResolvedValue(sampleBooking);

    const res = await createBooking(
      makePostRequest("service-1", {
        address: "Panchlaish, Chattogram",
        notes: "Need consultation",
      }),
      { params: Promise.resolve({ expertId: "service-1" }) }
    );

    expect(res.status).toBe(201);
    expect(prismaMock.serviceBooking.create).toHaveBeenCalled();
    expect(sendNotification).toHaveBeenCalled();
  });

  it("prevents booking your own service", async () => {
    mockActiveUser("expert-1");
    prismaMock.expertService.findUnique.mockResolvedValue(sampleService);

    const res = await createBooking(
      makePostRequest("service-1", { address: "Panchlaish, Chattogram" }),
      { params: Promise.resolve({ expertId: "service-1" }) }
    );

    expect(res.status).toBe(400);
  });

  it("lets an expert accept a pending booking", async () => {
    mockActiveUser("expert-1");
    prismaMock.serviceBooking.findUnique.mockResolvedValue({
      id: "booking-1",
      status: "PENDING",
      subStatus: null,
      clientId: testUsers.regular.id,
      expertService: { userId: "expert-1", profession: "Heart Specialist" },
    });
    prismaMock.serviceBooking.update.mockResolvedValue({
      ...sampleBooking,
      status: "CONFIRMED",
      subStatus: "CONFIRMED",
    });

    const res = await patchBooking(
      makePatchRequest("booking-1", { status: "CONFIRMED", subStatus: "CONFIRMED" }),
      { params: Promise.resolve({ bookingId: "booking-1" }) }
    );

    expect(res.status).toBe(200);
    expect(prismaMock.serviceBooking.update).toHaveBeenCalled();
  });
});
