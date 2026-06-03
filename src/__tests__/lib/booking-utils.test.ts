import { describe, expect, it } from "vitest";
import {
  mapApiBookingStatusToUi,
  mapApiBookingSubStatusToUi,
  mapApiServiceBooking,
  mapUiBookingSubStatusToApi,
} from "@/lib/booking-utils";

describe("booking-utils", () => {
  it("maps API booking statuses to dashboard labels", () => {
    expect(mapApiBookingStatusToUi("PENDING")).toBe("Pending");
    expect(mapApiBookingStatusToUi("CONFIRMED")).toBe("Ongoing");
    expect(mapApiBookingStatusToUi("REJECTED")).toBe("Cancelled");
  });

  it("maps sub-status values both ways", () => {
    expect(mapApiBookingSubStatusToUi("ON_MY_WAY")).toBe("On My Way");
    expect(mapUiBookingSubStatusToApi("Service Started")).toBe("SERVICE_STARTED");
  });

  it("maps API booking payloads for expert dashboard cards", () => {
    const mapped = mapApiServiceBooking({
      id: "booking-1",
      expertServiceId: "service-1",
      clientId: "client-1",
      scheduledDate: null,
      address: "Panchlaish",
      notes: "Need consultation",
      fee: "৳1,500",
      status: "PENDING",
      subStatus: null,
      createdAt: "2026-01-01T10:00:00.000Z",
      updatedAt: "2026-01-01T10:00:00.000Z",
      client: {
        id: "client-1",
        name: "Rahim",
        preferredName: null,
        profileImage: null,
      },
      expertService: {
        id: "service-1",
        profession: "Heart Specialist",
        category: "Doctor",
        userId: "expert-1",
      },
    });

    expect(mapped.clientName).toBe("Rahim");
    expect(mapped.serviceType).toBe("Heart Specialist");
    expect(mapped.status).toBe("Pending");
    expect(mapped.address).toBe("Panchlaish");
  });
});
