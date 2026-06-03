export interface CreateShopPayload {
  name: string;
  description: string;
  category: string;
  location: string;
  payoutMethod?: "BKASH" | "NAGAD" | "BANK";
  registrationDetails?: Record<string, unknown>;
}

export interface ShopRegistrationFormInput {
  businessName: string;
  description: string;
  categories: string[];
  customCategory?: string;
  businessEmail: string;
  businessPhone: string;
  isOffline: boolean;
  address?: string;
  deliveryAreas: string[];
  outsideCity?: boolean;
  deliveryMethod: "Self" | "Third-party";
  codAvailable: boolean;
  deliveryTimeline: string;
  nidNumber: string;
  hasTradeLicense: boolean;
  tradeLicenseNumber?: string;
  declaresAdultContent: boolean;
  payoutMethod: "bKash" | "Nagad" | "Bank";
  payoutDetails: string;
}

const PAYOUT_MAP = {
  bKash: "BKASH",
  Nagad: "NAGAD",
  Bank: "BANK",
} as const;

export function resolveShopCategory(form: Pick<ShopRegistrationFormInput, "categories" | "customCategory">): string {
  if (form.categories.includes("Others") && form.customCategory?.trim()) {
    return form.customCategory.trim();
  }
  return form.categories.join(", ");
}

export function resolveShopLocation(
  form: Pick<ShopRegistrationFormInput, "isOffline" | "address" | "deliveryAreas">
): string {
  if (form.isOffline && form.address?.trim()) {
    return form.address.trim();
  }
  return form.deliveryAreas.join(", ");
}

export function mapShopRegistrationToApiPayload(form: ShopRegistrationFormInput): CreateShopPayload {
  return {
    name: form.businessName.trim(),
    description: form.description.trim(),
    category: resolveShopCategory(form),
    location: resolveShopLocation(form),
    payoutMethod: PAYOUT_MAP[form.payoutMethod],
    registrationDetails: {
      businessEmail: form.businessEmail,
      businessPhone: form.businessPhone,
      deliveryAreas: form.deliveryAreas,
      deliveryMethod: form.deliveryMethod,
      codAvailable: form.codAvailable,
      deliveryTimeline: form.deliveryTimeline,
      nidNumber: form.nidNumber,
      hasTradeLicense: form.hasTradeLicense,
      tradeLicenseNumber: form.tradeLicenseNumber,
      declaresAdultContent: form.declaresAdultContent,
      payoutDetails: form.payoutDetails,
      isOffline: form.isOffline,
      address: form.address,
      outsideCity: form.outsideCity,
    },
  };
}
