"use client";

import { api } from "@/lib/api";
import { signIn, signOut, useSession } from "next-auth/react";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

export type RegistrationStatus = 'None' | 'Pending' | 'Approved' | 'Rejected';
export type PrivacyLevel = 'Public' | 'Neighbours' | 'Only Me';

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
  email: string;
  username: string;
  name?: string;
  preferredName?: string;
  bio?: string;
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
  signup: (data: { email: string, pass: string, name: string, username: string, mobile: string, location: string, dob: string, profession?: string }) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status, update } = useSession();
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [timeoutReached, setTimeoutReached] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeoutReached(true);
      setIsProfileLoading(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      setUserProfile(null);
      setIsProfileLoading(false);
    } else if (status === 'authenticated' && session?.user) {
      api.get<any>('/api/user/profile')
        .then(data => {
          
          const mapRegStatus = (s: string) => {
            if (s === 'PENDING') return 'Pending';
            if (s === 'APPROVED') return 'Approved';
            if (s === 'REJECTED') return 'Rejected';
            return 'None';
          };
          
          setUserProfile({
            ...data,
            registrationStatus: mapRegStatus(data.registrationStatus),
            serviceRegistrationStatus: mapRegStatus(data.serviceRegistrationStatus),
            verificationRequestStatus: mapRegStatus(data.verificationRequestStatus),
            privacySettings: data.privacySettings ? {
              mobile: data.privacySettings.mobile,
              email: data.privacySettings.email,
              dob: data.privacySettings.dob,
            } : {
              mobile: 'PRIVATE',
              email: 'NEIGHBOURS',
              dob: 'NEIGHBOURS'
            },
            neighbours: [],
            neighbourRequestsSent: [],
            neighbourRequestsReceived: [],
            neighboursCount: data.neighboursCount || 0,
          } as any);
          setIsProfileLoading(false);
        })
        .catch(err => {
          console.error("Failed to load user profile:", err);
          setIsProfileLoading(false);
        });
    }
  }, [session, status]);

  const login = async (email: string, pass: string) => {
    const result = await Promise.race([
      signIn('credentials', { email, password: pass, redirect: false }),
      new Promise<any>((_, reject) => setTimeout(() => reject(new Error("Server response timeout. Please refresh or try again.")), 8000))
    ]);
    if (result?.error) {
      throw new Error(result.error);
    }
  };

  const signup = async (data: { email: string, pass: string, name: string, username: string, mobile: string, location: string, dob: string, profession?: string }) => {
    await api.post('/api/auth/register', { ...data, password: data.pass });
    await login(data.email, data.pass);
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
      updateUser 
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
