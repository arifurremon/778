export interface CreateServicePayload {
  profession: string;
  category: string;
  location: string;
  experienceYears: number;
  fee: string;
  bio: string;
  qualifications: string[];
  payoutMethod?: "BKASH" | "NAGAD" | "BANK";
  registrationDetails?: Record<string, unknown>;
}

export interface ServiceRegistrationFormInput {
  category: string;
  specialization: string;
  experienceYears: string;
  serviceMode: "Home" | "Office" | "Remote";
  serviceAreas: string[];
  availability: string[];
  timeSlot: string;
  pricing: string;
  nidNumber: string;
  payoutMethod: "bKash" | "Nagad" | "Bank";
  payoutDetails: string;
  ethicsAgreed: boolean;
  termsAgreed: boolean;
  bmdcNumber?: string;
  degrees?: string;
  affiliation?: string;
  iebNumber?: string;
  expertise?: string;
  institution?: string;
  department?: string;
  subjects?: string;
  portfolio?: string;
  techStack?: string;
}

const PAYOUT_MAP = {
  bKash: "BKASH",
  Nagad: "NAGAD",
  Bank: "BANK",
} as const;

export function resolveServiceLocation(form: Pick<ServiceRegistrationFormInput, "serviceAreas">): string {
  return form.serviceAreas.join(", ");
}

export function parseExperienceYears(value: string): number {
  const parsed = parseInt(value.replace(/[^\d]/g, ""), 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function buildServiceBio(form: ServiceRegistrationFormInput): string {
  return [
    `${form.specialization} provides ${form.category} services in Chittagong.`,
    `Service mode: ${form.serviceMode}.`,
    `Coverage: ${form.serviceAreas.join(", ")}.`,
    `Available on ${form.availability.join(", ")} during ${form.timeSlot}.`,
  ].join(" ");
}

export function buildServiceQualifications(form: ServiceRegistrationFormInput): string[] {
  const qualifications = new Set<string>([
    form.category,
    form.specialization,
    `${parseExperienceYears(form.experienceYears)} years experience`,
  ]);

  if (form.degrees) {
    form.degrees
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((item) => qualifications.add(item));
  }

  if (form.bmdcNumber?.trim()) qualifications.add(`BMDC ${form.bmdcNumber.trim()}`);
  if (form.affiliation?.trim()) qualifications.add(form.affiliation.trim());
  if (form.iebNumber?.trim()) qualifications.add(`IEB ${form.iebNumber.trim()}`);
  if (form.expertise?.trim()) qualifications.add(form.expertise.trim());
  if (form.institution?.trim()) qualifications.add(form.institution.trim());
  if (form.department?.trim()) qualifications.add(form.department.trim());
  if (form.subjects?.trim()) qualifications.add(`Subjects: ${form.subjects.trim()}`);
  if (form.portfolio?.trim()) qualifications.add(`Portfolio: ${form.portfolio.trim()}`);
  if (form.techStack?.trim()) qualifications.add(`Tech stack: ${form.techStack.trim()}`);

  return Array.from(qualifications);
}

export function mapServiceRegistrationToApiPayload(
  form: ServiceRegistrationFormInput
): CreateServicePayload {
  return {
    profession: form.specialization.trim(),
    category: form.category,
    location: resolveServiceLocation(form),
    experienceYears: parseExperienceYears(form.experienceYears),
    fee: form.pricing.trim(),
    bio: buildServiceBio(form),
    qualifications: buildServiceQualifications(form),
    payoutMethod: PAYOUT_MAP[form.payoutMethod],
    registrationDetails: {
      serviceMode: form.serviceMode,
      serviceAreas: form.serviceAreas,
      availability: form.availability,
      timeSlot: form.timeSlot,
      nidNumber: form.nidNumber,
      payoutDetails: form.payoutDetails,
      ethicsAgreed: form.ethicsAgreed,
      termsAgreed: form.termsAgreed,
      bmdcNumber: form.bmdcNumber,
      degrees: form.degrees,
      affiliation: form.affiliation,
      iebNumber: form.iebNumber,
      expertise: form.expertise,
      institution: form.institution,
      department: form.department,
      subjects: form.subjects,
      portfolio: form.portfolio,
      techStack: form.techStack,
    },
  };
}
