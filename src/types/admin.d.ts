import type { Role } from "@prisma/client";

export interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  username: string | null;
  profileImage: string | null;
  role: Role;
  isSeller: boolean;
  isServiceProvider: boolean;
  emailVerified: Date | null;
  createdAt: Date;
  suspendedAt?: Date | null;
  _count?: {
    posts: number;
    comments: number;
  };
}

export interface AdminPost {
  id: string;
  content: string;
  media: string[];
  authorId: string;
  author: {
    name: string | null;
    profileImage: string | null;
  };
  visibility: 'PUBLIC' | 'NEIGHBOURS' | 'PRIVATE';
  moderationStatus: 'PENDING' | 'APPROVED' | 'HIDDEN' | 'FLAGGED';
  adminNotes?: string | null;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    likes: number;
    comments: number;
  };
}

export interface AdminShop {
  id: string;
  name: string;
  category: string;
  address: string;
  ownerId: string;
  owner: {
    name: string | null;
    email: string;
  };
  isVerified: boolean;
  verifiedAt?: Date | null;
  rejectedAt?: Date | null;
  rejectionReason?: string | null;
  createdAt: Date;
  _count?: {
    products: number;
  };
}

export interface AdminService {
  id: string;
  title: string;
  description: string;
  category: string;
  serviceAreas: string[];
  providerId: string;
  provider: {
    name: string | null;
    email: string;
  };
  isVerified: boolean;
  verifiedAt?: Date | null;
  rejectedAt?: Date | null;
  rejectionReason?: string | null;
  pricing: Record<string, unknown>;
  createdAt: Date;
}

export interface DashboardStats {
  totalUsers: number;
  totalPosts: number;
  totalShops: number;
  totalServices: number;
  pendingVerifications: number;
  activeReports: number;
  growthRate: number;
  revenue?: number;
}

export interface AuditLogEntry {
  id: string;
  adminId: string;
  admin: {
    name: string | null;
    email: string;
    profileImage: string | null;
  };
  action: string;
  entityType: string;
  entityId: string;
  details: Record<string, any>;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export interface AdminSettings {
  id: string;
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  supportPhone: string;
  maintenanceMode: boolean;
  registrationOpen: boolean;
  emailVerificationReq: boolean;
  featuresEnabled: Record<string, boolean>;
  defaultPostVisibility: string;
  updatedAt: Date;
  updatedBy?: string | null;
}
