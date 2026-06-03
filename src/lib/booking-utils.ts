import type { Booking, BookingStatus, OngoingSubStatus } from "@/hooks/use-services";
import { decimalToNumber, formatFeeBdt } from "@/lib/money/fee";

export type ApiBookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "ONGOING"
  | "COMPLETED"
  | "CANCELLED"
  | "REJECTED";

export type ApiBookingSubStatus = "CONFIRMED" | "ON_MY_WAY" | "SERVICE_STARTED";

export interface ApiServiceBooking {
  id: string;
  expertServiceId: string;
  clientId: string;
  scheduledDate: string | null;
  address: string | null;
  notes: string | null;
  fee: number;
  status: ApiBookingStatus;
  subStatus: ApiBookingSubStatus | null;
  createdAt: string;
  updatedAt: string;
  client?: {
    id: string;
    name: string | null;
    preferredName: string | null;
    profileImage: string | null;
    email?: string;
  };
  expertService?: {
    id: string;
    profession: string;
    category: string;
    userId: string;
  };
}

const UI_TO_API_STATUS: Partial<Record<BookingStatus, ApiBookingStatus>> = {
  Pending: "PENDING",
  Ongoing: "CONFIRMED",
  Completed: "COMPLETED",
  Cancelled: "CANCELLED",
};

const UI_TO_API_SUB_STATUS: Record<OngoingSubStatus, ApiBookingSubStatus> = {
  Confirmed: "CONFIRMED",
  "On My Way": "ON_MY_WAY",
  "Service Started": "SERVICE_STARTED",
};

const API_TO_UI_STATUS: Record<ApiBookingStatus, BookingStatus> = {
  PENDING: "Pending",
  CONFIRMED: "Ongoing",
  ONGOING: "Ongoing",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  REJECTED: "Cancelled",
};

const API_TO_UI_SUB_STATUS: Record<ApiBookingSubStatus, OngoingSubStatus> = {
  CONFIRMED: "Confirmed",
  ON_MY_WAY: "On My Way",
  SERVICE_STARTED: "Service Started",
};

export function mapApiBookingStatusToUi(status: ApiBookingStatus): BookingStatus {
  return API_TO_UI_STATUS[status] ?? "Pending";
}

export function mapApiBookingSubStatusToUi(
  subStatus: ApiBookingSubStatus | null | undefined
): OngoingSubStatus | undefined {
  if (!subStatus) return undefined;
  return API_TO_UI_SUB_STATUS[subStatus];
}

export function mapUiBookingStatusToApi(status: BookingStatus): ApiBookingStatus {
  return UI_TO_API_STATUS[status] ?? "PENDING";
}

export function mapUiBookingSubStatusToApi(
  subStatus: OngoingSubStatus
): ApiBookingSubStatus {
  return UI_TO_API_SUB_STATUS[subStatus];
}

export function mapApiServiceBooking(booking: ApiServiceBooking): Booking {
  const clientName =
    booking.client?.preferredName ||
    booking.client?.name ||
    "Client";

  return {
    id: booking.id,
    expertId: booking.expertServiceId,
    clientName,
    clientAvatar: booking.client?.profileImage ?? "/city_background.png",
    serviceType: booking.expertService?.profession ?? "Service",
    price: formatFeeBdt(booking.fee),
    status: mapApiBookingStatusToUi(booking.status),
    subStatus: mapApiBookingSubStatusToUi(booking.subStatus),
    timestamp: new Date(booking.createdAt).toLocaleString(),
    address: booking.address ?? undefined,
    notes: booking.notes ?? undefined,
  };
}

export const bookingSelect = {
  id: true,
  expertServiceId: true,
  clientId: true,
  scheduledDate: true,
  address: true,
  notes: true,
  fee: true,
  status: true,
  subStatus: true,
  createdAt: true,
  updatedAt: true,
  client: {
    select: {
      id: true,
      name: true,
      preferredName: true,
      profileImage: true,
      email: true,
    },
  },
  expertService: {
    select: {
      id: true,
      profession: true,
      category: true,
      userId: true,
    },
  },
} as const;

export function serializeServiceBooking<T extends {
  scheduledDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  fee: { toNumber(): number } | number | string;
}>(booking: T) {
  return {
    ...booking,
    fee: decimalToNumber(booking.fee),
    scheduledDate: booking.scheduledDate?.toISOString() ?? null,
    createdAt: booking.createdAt.toISOString(),
    updatedAt: booking.updatedAt.toISOString(),
  };
}
