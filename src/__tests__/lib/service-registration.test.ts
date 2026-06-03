import { describe, expect, it } from "vitest";
import {
  buildServiceBio,
  buildServiceQualifications,
  mapServiceRegistrationToApiPayload,
  parseExperienceYears,
  resolveServiceLocation,
} from "@/lib/service-registration";

const baseForm = {
  category: "Doctor",
  specialization: "Heart Specialist",
  experienceYears: "8",
  serviceMode: "Home" as const,
  serviceAreas: ["Panchlaish", "Agrabad"],
  availability: ["Sat", "Sun"],
  timeSlot: "4 PM - 8 PM",
  pricing: "1500",
  nidNumber: "1234567890",
  payoutMethod: "bKash" as const,
  payoutDetails: "01712345678",
  ethicsAgreed: true,
  termsAgreed: true,
  bmdcNumber: "A-12345",
  degrees: "MBBS, FCPS",
  affiliation: "Chittagong Medical College",
};

describe("service-registration helpers", () => {
  it("parses experience years from string input", () => {
    expect(parseExperienceYears("5 years")).toBe(5);
    expect(parseExperienceYears("invalid")).toBe(0);
  });

  it("joins service areas into a location string", () => {
    expect(resolveServiceLocation({ serviceAreas: ["Panchlaish", "Halishahar"] })).toBe(
      "Panchlaish, Halishahar"
    );
  });

  it("builds a bio long enough for API validation", () => {
    expect(buildServiceBio(baseForm).length).toBeGreaterThanOrEqual(20);
  });

  it("builds category-specific qualifications", () => {
    const qualifications = buildServiceQualifications(baseForm);
    expect(qualifications).toContain("Heart Specialist");
    expect(qualifications.some((item) => item.includes("BMDC"))).toBe(true);
    expect(qualifications).toContain("MBBS");
  });

  it("maps the wizard form to the services API payload", () => {
    const payload = mapServiceRegistrationToApiPayload(baseForm);

    expect(payload).toEqual({
      profession: "Heart Specialist",
      category: "Doctor",
      location: "Panchlaish, Agrabad",
      experienceYears: 8,
      fee: "1500",
      bio: buildServiceBio(baseForm),
      qualifications: buildServiceQualifications(baseForm),
      payoutMethod: "BKASH",
      registrationDetails: expect.objectContaining({
        serviceMode: "Home",
        nidNumber: "1234567890",
        payoutDetails: "01712345678",
        bmdcNumber: "A-12345",
      }),
    });
  });
});
