import type { Role } from "@prisma/client";
import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  Compass,
  Home,
  LayoutDashboard,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Store,
  Users,
} from "lucide-react";
import { isAdminRole } from "@/lib/rbac";

export type DashboardNavZone = "core" | "discover" | "workspace" | "system";

export interface DashboardNavItemConfig {
  icon: LucideIcon;
  label: string;
  href: string;
  zone: DashboardNavZone;
  sellerOnly?: boolean;
  expertOnly?: boolean;
  adminOnly?: boolean;
}

export interface DashboardNavUser {
  isSeller?: boolean;
  isServiceProvider?: boolean;
  role?: Role;
}

export const DASHBOARD_NAV_ITEMS: DashboardNavItemConfig[] = [
  { icon: LayoutDashboard, label: "Overview", href: "/dashboard", zone: "core" },
  { icon: Users, label: "Community", href: "/community", zone: "core" },
  { icon: Home, label: "Neighbours", href: "/neighbours", zone: "core" },
  { icon: Search, label: "Directory", href: "/directory", zone: "discover" },
  { icon: ShoppingBag, label: "Marketplace", href: "/shops", zone: "discover" },
  { icon: Briefcase, label: "Services", href: "/services", zone: "discover" },
  { icon: Store, label: "Seller Hub", href: "/seller", zone: "workspace", sellerOnly: true },
  { icon: ShieldCheck, label: "Expert Hub", href: "/expert", zone: "workspace", expertOnly: true },
  { icon: ShieldAlert, label: "Admin Center", href: "/admin", zone: "workspace", adminOnly: true },
  { icon: Compass, label: "Vision & Legacy", href: "/about", zone: "system" },
];

export function filterVisibleNavItems(
  items: DashboardNavItemConfig[],
  user?: DashboardNavUser | null
): DashboardNavItemConfig[] {
  return items.filter((item) => {
    if (item.sellerOnly && !user?.isSeller) return false;
    if (item.expertOnly && !user?.isServiceProvider) return false;
    if (item.adminOnly && !isAdminRole(user?.role)) return false;
    return true;
  });
}

export function getDashboardGreeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return "Good Morning,";
  if (hour >= 12 && hour < 17) return "Good Afternoon,";
  if (hour >= 17 && hour < 20) return "Good Evening,";
  return "Good Night,";
}

export function hasWorkspaceNav(user?: DashboardNavUser | null): boolean {
  return Boolean(
    user?.isSeller || user?.isServiceProvider || isAdminRole(user?.role)
  );
}

export function getNavItemsByZone(
  items: DashboardNavItemConfig[],
  zone: DashboardNavZone,
  labels?: string[]
) {
  return items.filter((item) => {
    if (item.zone !== zone) return false;
    if (labels && !labels.includes(item.label)) return false;
    return true;
  });
}
