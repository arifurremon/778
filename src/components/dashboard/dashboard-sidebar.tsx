"use client";

import Link from "next/link";
import { LogOut, MapPin, Settings, ShieldAlert } from "lucide-react";
import Logo from "@/components/brand/logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  DASHBOARD_NAV_ITEMS,
  filterVisibleNavItems,
  getNavItemsByZone,
  hasWorkspaceNav,
  type DashboardNavUser,
} from "./dashboard-nav-config";
import { DashboardNavItem } from "./dashboard-nav-item";

interface DashboardSidebarProps {
  pathname: string;
  user?: DashboardNavUser & {
    name?: string | null;
    profileImage?: string | null;
    location?: string | null;
  };
  onNavigate?: () => void;
  onLogoutClick?: () => void;
}

export function DashboardSidebar({
  pathname,
  user,
  onNavigate,
  onLogoutClick,
}: DashboardSidebarProps) {
  const visibleNavItems = filterVisibleNavItems(DASHBOARD_NAV_ITEMS, user);
  const closeMenu = onNavigate ?? (() => undefined);

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      <div className="px-6 pt-8 mb-8 shrink-0">
        <Link
          href="/dashboard"
          onClick={closeMenu}
          className="transition-opacity hover:opacity-90 block"
        >
          <Logo width={120} className="cursor-pointer" />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-hide px-4 space-y-6 relative z-10 pb-4">
        <div className="space-y-1">
          <div className="px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 opacity-70">
            Core
          </div>
          {getNavItemsByZone(visibleNavItems, "core").map((item) => (
            <DashboardNavItem
              key={item.href}
              icon={item.icon}
              label={item.label}
              active={pathname === item.href}
              href={item.href}
              onClick={closeMenu}
            />
          ))}
        </div>

        <div className="space-y-1">
          <div className="px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 opacity-70">
            Discover
          </div>
          {getNavItemsByZone(visibleNavItems, "discover").map((item) => (
            <DashboardNavItem
              key={item.href}
              icon={item.icon}
              label={item.label}
              active={pathname === item.href}
              href={item.href}
              onClick={closeMenu}
            />
          ))}
        </div>

        {hasWorkspaceNav(user) && (
          <div className="space-y-1">
            <div className="px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 opacity-70">
              Workspace
            </div>
            {getNavItemsByZone(visibleNavItems, "workspace").map((item) => (
              <DashboardNavItem
                key={item.href}
                icon={item.icon}
                label={item.label}
                active={pathname === item.href}
                href={item.href}
                onClick={closeMenu}
              />
            ))}
          </div>
        )}

        <div className="space-y-1">
          <div className="px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 opacity-70 mt-4">
            System
          </div>
          {getNavItemsByZone(visibleNavItems, "system").map((item) => (
            <DashboardNavItem
              key={item.href}
              icon={item.icon}
              label={item.label}
              active={pathname === item.href}
              href={item.href}
              onClick={closeMenu}
            />
          ))}
          <DashboardNavItem
            icon={Settings}
            label="Settings"
            active={pathname === "/settings"}
            href="/settings"
            onClick={closeMenu}
          />

          <Link href="/emergency" onClick={closeMenu} className="block mt-4 px-2">
            <div
              className={cn(
                "group flex items-center gap-4 px-4 py-3 rounded-lg cursor-pointer transition-colors",
                pathname === "/emergency"
                  ? "bg-red-500 text-white font-bold"
                  : "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-500 dark:hover:bg-red-500/20 font-medium"
              )}
            >
              <ShieldAlert size={18} className={pathname === "/emergency" ? "fill-white/20" : ""} />
              <span className="text-sm tracking-tight flex-1">Emergency SOS</span>
            </div>
          </Link>

          <div className="px-2 mt-2">
            <button
              type="button"
              onClick={() => {
                closeMenu();
                onLogoutClick?.();
              }}
              className="w-full group flex items-center gap-4 px-4 py-3 rounded-lg cursor-pointer transition-colors text-muted-foreground hover:bg-muted hover:text-foreground font-medium"
            >
              <LogOut size={18} />
              <span className="text-sm tracking-tight">Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="mt-auto shrink-0 p-4 border-t border-border bg-background">
        <Link href="/profile" onClick={closeMenu}>
          <div className="flex items-center gap-3 px-2 cursor-pointer hover:bg-muted p-2 rounded-lg transition-colors">
            <Avatar className="w-10 h-10 border border-border">
              <AvatarImage src={user?.profileImage ?? undefined} />
              <AvatarFallback className="text-xs font-bold">{user?.name?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-bold truncate tracking-tight">{user?.name}</p>
              <div className="text-[11px] text-muted-foreground truncate flex items-center gap-1 font-medium">
                <MapPin size={10} /> {user?.location || "Chittagong"}
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
