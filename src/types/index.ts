
export interface UserProfile {
  id: string;
  name: string;
  username: string;
  profileImage?: string | null;
  isVerified: boolean;
  isSeller: boolean;
  isServiceProvider: boolean;
}

export interface Provider {
  id: string;
  name: string;
  image?: string;
  profession: string;
  category?: string;
  bio?: string;
  qualifications?: string[];
  portfolio?: string[];
  rating: number;
  reviews: number;
  location: string;
  experience: number;
  type: 'appointment' | 'request';
  fee: string;
}

export interface Post {
  id: string;
  content: string;
  images: string[];
  checkInLocation?: string | null;
  visibility: 'PUBLIC' | 'NEIGHBOURS' | 'PRIVATE';
  helpfulCount: number;
  notHelpfulCount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  author: UserProfile;
  _count?: {
    comments: number;
  };
}
