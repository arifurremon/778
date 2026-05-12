"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  FileText,
  Store,
  Briefcase,
  BarChart3,
  ShieldCheck,
  LogOut,
  ChevronRight,
  ChevronDown,
  Menu,
  Settings,
  BadgeCheck,
  AlertTriangle,
  Package,
  MessageSquare,
  ClipboardList,
  Flag,
  TrendingUp,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Logo from "@/components/brand/logo";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAdminStore } from "@/hooks/admin/use-admin-store";
import { Menu as MenuIcon, X as CloseIcon } from "lucide-react";

// ────────────────────────────────────────────────────────────────────────────
// Navigation structure
// ────────────────────────────────────────────────────────────────────────────
interface NavChild {
  label: string;
  href: string;
  badge?: string;
}

interface NavGroup {
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  href?: string;      // if present, clicking goes here (no collapse)
  children?: NavChild[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    href: "/admin",
    icon: LayoutDashboard,
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
  },
  {
    label: "Users",
    icon: Users,
    color: "text-violet-400",
    bgColor: "bg-violet-400/10",
    children: [
      { label: "All Users", href: "/admin/users" },
      { label: "Verifications", href: "/admin/verifications" },
    ],
  },
  {
    label: "Content",
    icon: FileText,
    color: "text-emerald-400",
    bgColor: "bg-emerald-400/10",
    children: [
      { label: "All Posts", href: "/admin/posts" },
      { label: "Comments", href: "/admin/community/comments" },
    ],
  },
  {
    label: "Marketplace",
    icon: Store,
    color: "text-amber-400",
    bgColor: "bg-amber-400/10",
    children: [
      { label: "All Shops", href: "/admin/shops" },
      { label: "All Products", href: "/admin/shops/products" },
    ],
  },
  {
    label: "Services",
    icon: Briefcase,
    color: "text-cyan-400",
    bgColor: "bg-cyan-400/10",
    children: [
      { label: "All Providers", href: "/admin/services" },
      { label: "Pending Review", href: "/admin/verifications" },
    ],
  },
  {
    label: "Community",
    icon: MessageSquare,
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
    children: [
      { label: "Overview", href: "/admin/community" },
      { label: "Comments", href: "/admin/community/comments" },
    ],
  },
  {
    label: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
    color: "text-rose-400",
    bgColor: "bg-rose-400/10",
  },
  {
    label: "Settings",
    icon: Settings,
    color: "text-indigo-400",
    bgColor: "bg-indigo-400/10",
    children: [
      { label: "Overview", href: "/admin/settings" },
      { label: "Audit Log", href: "/admin/settings/audit-log" },
    ],
  },
];

// Determine which groups should start open based on pathname
function getInitialOpen(pathname: string): Set<string> {
  const open = new Set<string>();
  for (const group of NAV_GROUPS) {
    if (group.children?.some((c) => pathname.startsWith(c.href))) {
      open.add(group.label);
    }
  }
  return open;
}

// ────────────────────────────────────────────────────────────────────────────
// Components
// ────────────────────────────────────────────────────────────────────────────
interface NavGroupItemProps {
  group: NavGroup;
  pathname: string;
  openGroups: Set<string>;
  onToggle: (label: string) => void;
  onNavClick?: () => void;
  collapsed?: boolean;
}

function NavGroupItem({ group, pathname, openGroups, onToggle, onNavClick, collapsed }: NavGroupItemProps) {
  const Icon = group.icon;
  const isOpen = openGroups.has(group.label);

  // Direct link (no children)
  if (group.href) {
    const isActive = pathname === group.href;
    return (
      <Link href={group.href} onClick={onNavClick}>
        <div className={cn(
          "group relative flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-all duration-200",
          isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
          collapsed && "px-0 justify-center"
        )}>
          <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all",
            isActive ? `${group.bgColor} ${group.color}` : "bg-muted/50 text-muted-foreground"
          )}>
            <Icon size={14} />
          </div>
          {!collapsed && <span className="font-semibold text-sm">{group.label}</span>}
          {isActive && !collapsed && (
            <motion.div layoutId="adminActiveNav"
              className="absolute right-3 w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_8px_rgba(97,179,204,0.8)]"
            />
          )}
        </div>
      </Link>
    );
  }

  // Collapsible group
  const anyChildActive = group.children?.some((c) => pathname.startsWith(c.href));

  return (
    <div>
      <button
        onClick={() => onToggle(group.label)}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-all duration-200",
          anyChildActive ? "text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
          collapsed && "px-0 justify-center"
        )}
      >
        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all",
          anyChildActive ? `${group.bgColor} ${group.color}` : "bg-muted/50 text-muted-foreground"
        )}>
          <Icon size={14} />
        </div>
        {!collapsed && <span className="font-semibold text-sm flex-1 text-left">{group.label}</span>}
        {!collapsed && (
          <ChevronDown
            size={13}
            className={cn("text-muted-foreground/50 transition-transform duration-200", isOpen && "rotate-180")}
          />
        )}
      </button>

      <AnimatePresence>
        {isOpen && group.children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="ml-10 mt-0.5 space-y-0.5 border-l border-border/30 pl-3 pb-1">
              {group.children.map((child) => {
                const isChildActive = pathname === child.href || pathname.startsWith(child.href + "/");
                return (
                  <Link key={child.href} href={child.href} onClick={onNavClick}>
                    <div className={cn(
                      "px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer",
                      isChildActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    )}>
                      {child.label}
                    </div>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarContent({ onNavClick, collapsed, onToggle }: { onNavClick?: () => void; collapsed?: boolean; onToggle?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => getInitialOpen(pathname));

  const handleToggle = (label: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  };

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  return (
    <div className="flex flex-col h-full bg-card/10 backdrop-blur-xl">
      {/* Header */}
      <div className={cn(
        "px-5 pt-5 pb-4 border-b border-border/50 shrink-0 flex flex-col",
        collapsed && "px-0 items-center"
      )}>
        <div className="flex items-center justify-between w-full">
          <Link href="/admin" onClick={onNavClick}>
            {collapsed ? (
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Logo width={24} className="cursor-pointer" />
              </div>
            ) : (
              <Logo width={100} className="cursor-pointer mb-3" />
            )}
          </Link>
          {!collapsed && onToggle && (
            <Button variant="ghost" size="icon" onClick={onToggle} className="h-8 w-8">
              <Menu size={14} />
            </Button>
          )}
        </div>
        {!collapsed && (
          <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-rose-400">
            <ShieldCheck size={10} />
            Admin Command Center
          </div>
        )}
        {collapsed && onToggle && (
          <Button variant="ghost" size="icon" onClick={onToggle} className="h-8 w-8 mt-4">
            <Menu size={14} />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-hide px-2 py-3 space-y-0.5">
        {NAV_GROUPS.map((group) => (
          <NavGroupItem
            key={group.label}
            group={group}
            pathname={pathname}
            openGroups={openGroups}
            onToggle={handleToggle}
            onNavClick={onNavClick}
            collapsed={collapsed}
          />
        ))}

        <div className="h-px bg-border/30 my-2 mx-2" />

        <Link href="/dashboard" onClick={onNavClick}>
          <div className={cn(
            "flex items-center gap-3 px-4 py-2.5 rounded-xl text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all duration-200 cursor-pointer",
            collapsed && "px-0 justify-center"
          )}>
            <div className="w-7 h-7 rounded-lg bg-muted/50 flex items-center justify-center">
              <LayoutDashboard size={14} />
            </div>
            {!collapsed && <span className="font-semibold text-sm">Main Dashboard</span>}
          </div>
        </Link>

        <button
          onClick={handleSignOut}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200 cursor-pointer",
            collapsed && "px-0 justify-center"
          )}
        >
          <div className="w-7 h-7 rounded-lg bg-muted/50 flex items-center justify-center">
            <LogOut size={14} />
          </div>
          {!collapsed && <span className="font-semibold text-sm">Sign Out</span>}
        </button>
      </nav>

      {/* Admin User Footer */}
      <div className={cn("shrink-0 p-3 border-t border-border/50 bg-background/20", collapsed && "p-2")}>
        <div className={cn("flex items-center gap-2.5 px-2 py-2 rounded-xl", collapsed && "justify-center px-0")}>
          <Avatar className="w-8 h-8 border-2 border-rose-400/30 shrink-0">
            <AvatarImage src={session?.user?.profileImage ?? session?.user?.image ?? ""} />
            <AvatarFallback className="text-xs font-bold bg-rose-500/10 text-rose-400">
              {session?.user?.name?.[0] ?? "A"}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-black uppercase truncate tracking-tight">
                {session?.user?.name}
              </p>
              <p className="text-[9px] text-rose-400 font-bold uppercase tracking-widest">Super Admin</p>
            </div>
          )}
          {!collapsed && <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Layout
// ────────────────────────────────────────────────────────────────────────────

// Build breadcrumb from pathname
function useBreadcrumb(pathname: string): { label: string; href?: string }[] {
  const parts = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; href?: string }[] = [{ label: "Admin", href: "/admin" }];
  let built = "";
  for (const part of parts.slice(1)) {
    built += `/${part}`;
    const label = part.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    crumbs.push({ label, href: `/admin${built}` });
  }
  return crumbs;
}

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const breadcrumbs = useBreadcrumb(pathname);
  const { isSidebarCollapsed, toggleSidebar } = useAdminStore();

  return (
    <div className="h-screen w-screen bg-background text-foreground overflow-hidden flex">
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden md:flex flex-col border-r border-border h-full bg-card/5 shrink-0 overflow-hidden transition-all duration-300",
        isSidebarCollapsed ? "w-20" : "w-64"
      )}>
        <SidebarContent collapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Topbar */}
        <header className="h-14 border-b border-border flex items-center justify-between px-4 md:px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-50 shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost" size="icon"
              className="md:hidden rounded-xl h-8 w-8"
              onClick={() => setIsMobileOpen(true)}
            >
              <Menu size={18} />
            </Button>
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1 text-sm">
              {breadcrumbs.map((crumb, i) => (
                <span key={crumb.label} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight size={12} className="text-muted-foreground/40" />}
                  {i < breadcrumbs.length - 1 ? (
                    <Link href={crumb.href!} className="text-muted-foreground hover:text-foreground transition-colors text-xs font-medium">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-xs font-bold text-foreground">{crumb.label}</span>
                  )}
                </span>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 rounded-lg px-2.5 py-1">
              <AlertTriangle size={11} className="text-rose-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400">Admin</span>
            </div>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-[11px] font-bold rounded-xl h-7 px-3">
                Exit
              </Button>
            </Link>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide bg-background/50">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="min-h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile Sheet */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetContent side="left" className="p-0 border-r border-border w-60">
          <SheetHeader className="hidden">
            <SheetTitle>Admin Navigation</SheetTitle>
          </SheetHeader>
          <SidebarContent onNavClick={() => setIsMobileOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
