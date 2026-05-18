import type { Post } from '@/hooks/use-community';
import type { Provider } from '@/types';

export interface MockShop {
	id: string;
	name: string;
	image: string;
	category: string;
	location: string;
	rating: number;
	reviews?: number;
	isVerified?: boolean;
	trustScore?: number;
	description?: string;
	address?: string;
	phone?: string;
	website?: string;
	logo?: string;
	owner?: {
		id: string;
		name: string;
		email: string;
		profileImage?: string | null;
	};
	createdAt?: string | Date;
	verificationHistory?: Array<{
		id: string;
		action: string;
		reason?: string;
		adminName: string;
		createdAt: string;
	}>;
	auditLogs?: Array<{
		id: string;
		action: string;
		details: Record<string, unknown>;
		createdAt: string;
	}>;
	products?: Array<{
		id: string;
		name: string;
		price: number;
		stock: number;
		status: 'active' | 'hidden';
		createdAt: string;
	}>;
}

export interface MockProduct {
	id: string;
	name: string;
	image: string;
	price: string | number;
	originalPrice?: string | number;
	category: string;
	type?: string;
	shopId: string;
	inStock?: boolean;
}

export const MOCK_SHOPS: MockShop[] = [];
export const MOCK_PRODUCTS: MockProduct[] = [];
export const MOCK_SERVICES: unknown[] = [];
export const MOCK_SERVICE_CATEGORIES: string[] = [];
export const MOCK_NOTIFICATIONS: unknown[] = [];
export const MOCK_MESSAGES: unknown[] = [];
export const MOCK_ACTIVITY: unknown[] = [];
export const MOCK_POSTS: Post[] = [];
export const MOCK_SEARCH_RESULTS: { posts: Post[]; shops: MockShop[]; services: Provider[] } = { posts: [], shops: [], services: [] };
export const CHITTAGONG_AREAS: string[] = [];
export const MOCK_PROVIDERS: Provider[] = [];
export const INITIAL_POSTS: Post[] = [];

