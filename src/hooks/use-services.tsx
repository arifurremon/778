
"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type BookingStatus = 'Pending' | 'Ongoing' | 'Completed' | 'Cancelled';
export type OngoingSubStatus = 'Confirmed' | 'On My Way' | 'Service Started';

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
  acceptBooking: (id: string) => void;
  declineBooking: (id: string) => void;
  updateOngoingStatus: (id: string, subStatus: OngoingSubStatus) => void;
  completeBooking: (id: string) => void;
  replyToReview: (id: string, text: string) => void;
  wallet: {
    balance: number;
    history: { id: string, amount: string, type: 'Credit' | 'Withdrawal', date: string, status: string }[];
  };
}

const ServicesContext = createContext<ServicesContextType | null>(null);

const MOCK_BOOKINGS: Booking[] = [
  {
    id: "b1",
    expertId: "me",
    clientName: "Sabbir Ahmed",
    clientAvatar: "https://picsum.photos/seed/c1/100",
    serviceType: "Heart Consultation",
    price: "৳1,000",
    status: 'Pending',
    timestamp: "Today, 4:30 PM",
    address: "House 12, Road 4, Panchlaish",
    notes: "Regular checkup for hypertension."
  },
  {
    id: "b2",
    expertId: "me",
    clientName: "Nusrat Jahan",
    clientAvatar: "https://picsum.photos/seed/c2/100",
    serviceType: "Pediatric Visit",
    price: "৳800",
    status: 'Ongoing',
    subStatus: 'On My Way',
    timestamp: "Today, 2:00 PM",
    address: "Agrabad C/A, Chattogram",
  }
];

const MOCK_REVIEWS: ServiceReview[] = [
  {
    id: "r1",
    expertId: "me",
    clientName: "Tanvir Hossain",
    rating: 5,
    comment: "Excellent service. The expert was very professional and punctual.",
    timestamp: "2 days ago",
  }
];

export function ServicesProvider({ children }: { children: React.ReactNode }) {
  const [bookings, setBookings] = useState<Booking[]>(MOCK_BOOKINGS);
  const [reviews, setReviews] = useState<ServiceReview[]>(MOCK_REVIEWS);
  const [wallet, setWallet] = useState({
    balance: 5400,
    history: [
      { id: 'w1', amount: '৳2,000', type: 'Withdrawal' as const, date: 'Oct 15, 2024', status: 'Completed' },
      { id: 'w2', amount: '৳1,000', type: 'Credit' as const, date: 'Oct 12, 2024', status: 'Settled' },
    ]
  });

  const acceptBooking = (id: string) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'Ongoing', subStatus: 'Confirmed' } : b));
  };

  const declineBooking = (id: string) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'Cancelled' } : b));
  };

  const updateOngoingStatus = (id: string, subStatus: OngoingSubStatus) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, subStatus } : b));
  };

  const completeBooking = (id: string) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'Completed', subStatus: undefined } : b));
    // Add to wallet balance logic would go here
  };

  const replyToReview = (id: string, reply: string) => {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, reply } : r));
  };

  return (
    <ServicesContext.Provider value={{ 
      bookings, 
      reviews, 
      acceptBooking, 
      declineBooking, 
      updateOngoingStatus, 
      completeBooking,
      replyToReview,
      wallet
    }}>
      {children}
    </ServicesContext.Provider>
  );
}

export const useServices = () => {
  const context = useContext(ServicesContext);
  if (!context) throw new Error("useServices must be used within ServicesProvider");
  return context;
};
