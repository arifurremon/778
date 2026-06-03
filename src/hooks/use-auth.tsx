// Fixed: 8 — Resolved privacy settings type inconsistency between frontend types and database enums.
"use client";

import { api } from "@/lib/api";
import { signIn, signOut, useSession } from "next-auth/react";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

export type RegistrationStatus = 'None' | 'Pending' | 'Approved' | 'Rejected';
export type PrivacyLevel = 'Public' | 'Neighbours' | 'Only Me';

function mapPrivacyFromDB(s: string): PrivacyLevel {
  if (s === "PUBLIC") return "Public";
  if (s === "NEIGHBOURS") return "Neighbours";
  if (s === "PRIVATE") return "Only Me";
  return "Public";
}

function mapRegStatus(s: string): RegistrationStatus {
  if (s === "PENDING") return "Pending";
  if (s === "APPROVED") return "Approved";
  if (s === "REJECTED") return "Rejected";
  return "None";
}

function mapProfileFromApi(data: Record<string, unknown>): User {
  const privacySettings = data.privacySettings as
    | { mobile: string; email: string; dob: string }
    | undefined;

  return {
    ...(data as unknown as User),
    registrationStatus: mapRegStatus(String(data.registrationStatus ?? "NONE")),
    serviceRegistrationStatus: mapRegStatus(String(data.serviceRegistrationStatus ?? "NONE")),
    verificationRequestStatus: mapRegStatus(String(data.verificationRequestStatus ?? "NONE")),
    privacySettings: privacySettings
      ? {
          mobile: mapPrivacyFromDB(privacySettings.mobile),
          email: mapPrivacyFromDB(privacySettings.email),
          dob: mapPrivacyFromDB(privacySettings.dob),
        }
      : {
          mobile: "Only Me",
          email: "Neighbours",
          dob: "Neighbours",
        },
    neighbours: [],
    neighbourRequestsSent: [],
    neighbourRequestsReceived: [],
    neighboursCount: (data.neighboursCount as number | undefined) || 0,
  };
}

export interface ShopDetails {
  businessName: string;
  categories: string[];
  customCategory?: string;
  isOffline: boolean;
  address?: string;
  hasTradeLicense: boolean;
  tradeLicenseNumber?: string;
  nidNumber: string;
  declaresAdultContent: boolean;
  deliveryAreas: string[];
  outsideCity: boolean;
  deliveryMethod: 'Self' | 'Third-party';
  codAvailable: boolean;
  deliveryTimeline: string;
  payoutMethod: 'bKash' | 'Nagad' | 'Bank';
  payoutDetails: string;
  agreedToTerms: boolean;
  businessPhone: string;
  businessEmail: string;
  description: string;
}

export interface ServiceDetails {
  category: string;
  specialization: string;
  experienceYears: string;
  serviceMode: 'Home' | 'Office' | 'Remote';
  serviceAreas: string[];
  availability: string[];
  timeSlot: string;
  pricing: string;
  nidNumber: string;
  payoutMethod: 'bKash' | 'Nagad' | 'Bank';
  payoutDetails: string;
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

export interface User {
  id?: string;
  email: string;
  username: string;
  name?: string;
  preferredName?: string;
  bio?: string;
  profession?: string;
  mobile?: string;
  location?: string;
  dob?: string;
  profileImage?: string;
  isVerified?: boolean;
  isSeller?: boolean;
  isServiceProvider?: boolean;
  registrationStatus?: RegistrationStatus;
  serviceRegistrationStatus?: RegistrationStatus;
  verificationRequestStatus?: RegistrationStatus;
  verificationReason?: string;
  shopDetails?: ShopDetails;
  serviceDetails?: ServiceDetails;
  isAdmin?: boolean;
  joinDate?: string;
  nameChangeCount: number;
  showShopBadge?: boolean;
  showExpertBadge?: boolean;
  showFullAge?: boolean;
  showBirthdayOnly?: boolean;
  privacySettings: {
    mobile: PrivacyLevel;
    email: PrivacyLevel;
    dob: PrivacyLevel;
  };
  neighbours: string[];
  neighbourRequestsSent: string[];
  neighbourRequestsReceived: string[];
  neighboursCount?: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (data: { email: string, pass: string, name: string, username: string, mobile: string, location: string, dob: string, profession?: string }) => Promise<any>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "CredentialsSignin": "Invalid email or password. Please try again.",
  "AccessDenied": "Access denied. Your account may be suspended.",
  "Verification": "Please verify your email before signing in.",
  "EmailNotVerified": "Please verify your email address before signing in. Check your inbox for the verification link.",
  "Default": "An authentication error occurred. Please try again."
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status, update } = useSession();
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [timeoutReached, setTimeoutReached] = useState(false);

  useEffect(() => {
    if (status !== "loading") {
      setTimeoutReached(true);
      return;
    }
    const timer = setTimeout(() => {
      setTimeoutReached(true);
      setIsProfileLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, [status]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      setUserProfile(null);
      setIsProfileLoading(false);
    } else if (status === 'authenticated' && session?.user) {
      api.get<Record<string, unknown>>('/api/user/profile')
        .then((data) => {
          setUserProfile(mapProfileFromApi(data));
          setIsProfileLoading(false);
        })
        .catch(err => {
          console.error("Failed to load user profile:", err);
          setIsProfileLoading(false);
        });
    }
  }, [session, status]);

  const refreshProfile = async () => {
    if (status !== "authenticated" || !session?.user) return;
    const data = await api.get<Record<string, unknown>>("/api/user/profile");
    setUserProfile(mapProfileFromApi(data));
    await update();
  };

  const login = async (email: string, pass: string) => {
    const result = await Promise.race([
      signIn('credentials', { email, password: pass, redirect: false }),
      new Promise<any>((_, reject) => setTimeout(() => reject(new Error("Server is waking up or busy. Please try again.")), 15000))
    ]);

    if (result === undefined || result === null) {
      throw new Error(AUTH_ERROR_MESSAGES["Default"]);
    }

    if (result.error) {
      const message = AUTH_ERROR_MESSAGES[result.error] || AUTH_ERROR_MESSAGES["Default"];
      throw new Error(message);
    }
  };

  const signup = async (data: { email: string, pass: string, name: string, username: string, mobile: string, location: string, dob: string, profession?: string }) => {
    const res = await api.post<any>('/api/auth/register', { ...data, password: data.pass });
    return res;
  };

  const logout = () => {
    signOut({ callbackUrl: '/' });
  };

  const updateUser = async (updates: Partial<User>) => {
    const apiUpdates: Record<string, unknown> = { ...updates };
    
    if (updates.privacySettings) {
      const mapPrivacyToDB = (s: string) => {
        if (s === 'Public') return 'PUBLIC';
        if (s === 'Neighbours') return 'NEIGHBOURS';
        if (s === 'Only Me') return 'PRIVATE';
        return s;
      };
      apiUpdates.privacySettings = {
        mobile: mapPrivacyToDB(updates.privacySettings.mobile),
        email: mapPrivacyToDB(updates.privacySettings.email),
        dob: mapPrivacyToDB(updates.privacySettings.dob)
      };
    }
    
    await api.patch('/api/user/profile', apiUpdates);
    await update(); // refresh next-auth session
    setUserProfile(prev => prev ? { ...prev, ...updates } : null);
  };

  return (
    <AuthContext.Provider value={{ 
      user: userProfile, 
      isLoading: !timeoutReached && (status === "loading" || isProfileLoading), 
      login, 
      signup, 
      logout, 
      updateUser,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
