
"use client";

import { api } from "@/lib/api";
import {
  mapApiServiceBooking,
  mapUiBookingSubStatusToApi,
  type ApiServiceBooking,
} from "@/lib/booking-utils";
import React, { createContext, useCallback, useContext, useRef, useState } from "react";

export type BookingStatus = "Pending" | "Ongoing" | "Completed" | "Cancelled";
export type OngoingSubStatus = "Confirmed" | "On My Way" | "Service Started";

export interface Booking {
  id: string;
  expertId: string;
  clientName: string;
  clientAvatar: string;
  serviceType: string;
  price: string;
  status: BookingStatus;
  subStatus?: OngoingSubStatus;
  timestamp: string;
  address?: string;
  notes?: string;
}

export interface ServiceReview {
  id: string;
  expertId: string;
  clientName: string;
  rating: number;
  comment: string;
  timestamp: string;
  reply?: string;
}

interface ServicesContextType {
  bookings: Booking[];
  reviews: ServiceReview[];
  isLoading: boolean;
  error: string | null;
  acceptBooking: (id: string) => Promise<void>;
  declineBooking: (id: string) => Promise<void>;
  updateOngoingStatus: (id: string, subStatus: OngoingSubStatus) => Promise<void>;
  completeBooking: (id: string) => Promise<void>;
  replyToReview: (id: string, text: string) => void;
  wallet: {
    balance: number;
    history: { id: string; amount: string; type: "Credit" | "Withdrawal"; date: string; status: string }[];
  };
  initializeServices: () => Promise<void>;
  refreshServices: () => Promise<void>;
}

const ServicesContext = createContext<ServicesContextType | null>(null);

const EMPTY_WALLET = {
  balance: 0,
  history: [] as ServicesContextType["wallet"]["history"],
};

export function ServicesProvider({ children }: { children: React.ReactNode }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<ServiceReview[]>([]);
  const [wallet] = useState(EMPTY_WALLET);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchPromiseRef = useRef<Promise<void> | null>(null);

  const loadExpertBookings = useCallback(async (force = false) => {
    if (fetchPromiseRef.current && !force) {
      return fetchPromiseRef.current;
    }

    const fetchTask = (async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await api.get<{ bookings: ApiServiceBooking[] }>(
          "/api/bookings/expert?limit=50"
        );
        setBookings(response.bookings.map(mapApiServiceBooking));
      } catch (err) {
        setBookings([]);
        setError(err instanceof Error ? err.message : "Failed to load expert bookings.");
      } finally {
        setIsLoading(false);
        fetchPromiseRef.current = null;
      }
    })();

    fetchPromiseRef.current = fetchTask;
    return fetchTask;
  }, []);

  const initializeServices = useCallback(async () => {
    await loadExpertBookings(false);
  }, [loadExpertBookings]);

  const refreshServices = useCallback(async () => {
    await loadExpertBookings(true);
  }, [loadExpertBookings]);

  const patchBooking = async (
    id: string,
    body: { status?: string; subStatus?: string }
  ) => {
    const response = await api.patch<{ booking: ApiServiceBooking }>(
      `/api/bookings/${id}`,
      body
    );
    const mapped = mapApiServiceBooking(response.booking);
    setBookings((prev) => prev.map((booking) => (booking.id === id ? mapped : booking)));
  };

  const acceptBooking = async (id: string) => {
    await patchBooking(id, { status: "CONFIRMED", subStatus: "CONFIRMED" });
  };

  const declineBooking = async (id: string) => {
    await patchBooking(id, { status: "REJECTED" });
  };

  const updateOngoingStatus = async (id: string, subStatus: OngoingSubStatus) => {
    await patchBooking(id, { subStatus: mapUiBookingSubStatusToApi(subStatus) });
  };

  const completeBooking = async (id: string) => {
    await patchBooking(id, { status: "COMPLETED" });
  };

  const replyToReview = (id: string, reply: string) => {
    setReviews((prev) => prev.map((review) => (review.id === id ? { ...review, reply } : review)));
  };

  return (
    <ServicesContext.Provider
      value={{
        bookings,
        reviews,
        isLoading,
        error,
        acceptBooking,
        declineBooking,
        updateOngoingStatus,
        completeBooking,
        replyToReview,
        wallet,
        initializeServices,
        refreshServices,
      }}
    >
      {children}
    </ServicesContext.Provider>
  );
}

export const useServices = () => {
  const context = useContext(ServicesContext);
  if (!context) throw new Error("useServices must be used within ServicesProvider");
  return context;
};
