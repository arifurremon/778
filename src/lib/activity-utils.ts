import type { ActivityType as PrismaActivityType } from "@prisma/client";

export type ActivityTab = "all" | "likes" | "comments" | "saved" | "system";

export interface ApiActivityLog {
  id: string;
  type: PrismaActivityType;
  description: string;
  contextUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface ActivityItem {
  id: string;
  type: ActivityTab;
  description: string;
  timestamp: string;
  href: string;
  context: string;
  isRead: boolean;
}

const LIKES_TYPES: PrismaActivityType[] = [
  "LIKE",
  "COMMENT_LIKE",
  "POST_DISLIKE",
  "COMMENT_DISLIKE",
];

const COMMENTS_TYPES: PrismaActivityType[] = ["COMMENT"];
const SAVED_TYPES: PrismaActivityType[] = ["SAVED"];

export function mapActivityTypeToTab(type: PrismaActivityType): ActivityTab {
  if (LIKES_TYPES.includes(type)) return "likes";
  if (COMMENTS_TYPES.includes(type)) return "comments";
  if (SAVED_TYPES.includes(type)) return "saved";
  return "system";
}

export function buildActivityTabFilter(tab: ActivityTab): PrismaActivityType[] | null {
  switch (tab) {
    case "likes":
      return LIKES_TYPES;
    case "comments":
      return COMMENTS_TYPES;
    case "saved":
      return SAVED_TYPES;
    case "system":
      return [
        "SYSTEM",
        "POPULAR",
        "CONNECTION_REQUEST",
        "CONNECTION_ACCEPTED",
      ];
    default:
      return null;
  }
}

export function deriveActivityContext(description: string, contextUrl: string | null): string {
  if (contextUrl?.includes("/community")) return "Community";
  if (contextUrl?.includes("/shops")) return "Marketplace";
  if (contextUrl?.includes("/neighbours")) return "Connections";
  if (contextUrl?.includes("/profile")) return "Profile";
  if (contextUrl?.includes("/seller")) return "Seller Hub";
  if (contextUrl?.includes("/expert")) return "Expert Services";

  const trimmed = description.trim();
  if (trimmed.length <= 48) return trimmed;
  return `${trimmed.slice(0, 45)}...`;
}

export function mapApiActivityLog(activity: ApiActivityLog): ActivityItem {
  return {
    id: activity.id,
    type: mapActivityTypeToTab(activity.type),
    description: activity.description,
    timestamp: new Date(activity.createdAt).toLocaleString(),
    href: activity.contextUrl ?? "/activity",
    context: deriveActivityContext(activity.description, activity.contextUrl),
    isRead: activity.isRead,
  };
}

export const activitySelect = {
  id: true,
  type: true,
  description: true,
  contextUrl: true,
  isRead: true,
  createdAt: true,
} as const;

export function serializeActivityLog<T extends { createdAt: Date }>(activity: T) {
  return {
    ...activity,
    createdAt: activity.createdAt.toISOString(),
  };
}
