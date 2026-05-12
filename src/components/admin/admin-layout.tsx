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
  Menu,
  X,
  Bell,
  Settings,
  BadgeCheck,
  AlertTriangle,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Logo from "@/components/brand/logo";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const NAV_ITEMS = [
  {
    label: "Overview",
    href: "/admin",
    icon: LayoutDashboard,
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: Users,
    color: "text-violet-400",
    bgColor: "bg-violet-400/10",
  },
  {
    label: "Posts",
    href: "/admin/posts",
    icon: FileText,
    color: "text-emerald-400",
    bgColor: "bg-emerald-400/10",
  },
  {
    label: "Shops",
    href: "/admin/shops",
    icon: Store,
    color: "text-amber-400",
    bgColor: "bg-amber-400/10",
  },
  {
    label: "Services",
    href: "/admin/services",
    icon: Briefcase,
    color: "text-cyan-400",
    bgColor: "bg-cyan-400/10",
  },
  {
    label: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
    color: "text-rose-400",
    bgColor: "bg-rose-400/10",
  },
  {
    label: "Verifications",
    href: "/admin/verifications",
    icon: BadgeCheck,
    color: "text-teal-400",
    bgColor: "bg-teal-400/10",
  },
];

interface NavItemProps {
  item: (typeof NAV_ITEMS)[0];
  active: boolean;
  onClick?: () => void;
}

function NavItem({ item, active, onClick }: NavItemProps) {
  const Icon = item.icon;
  return (
    <Link href={item.href} onClick={onClick}>
      <div
        className={cn(
          "group relative flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200",
          active
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        )}
      >
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all",
            active ? item.bgColor + " " + item.color : "bg-muted/50 text-muted-foreground group-hover:" + item.color
          )}
        >
          <Icon size={16} />
        </div>
        <span className="font-semibold text-sm tracking-tight">{item.label}</span>
        {active && (
          <motion.div
            layoutId="adminActiveNav"
            className="absolute right-3 w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_8px_rgba(97,179,204,0.8)]"
          />
        )}
      </div>
    </Link>
  );
}

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  return (
    <div className="flex flex-col h-full bg-card/10 backdrop-blur-xl">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-border/50 shrink-0">
        <Link href="/admin" onClick={onNavClick}>
          <Logo width={110} className="cursor-pointer mb-4" />
        </Link>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-rose-400">
          <ShieldCheck size={11} />
          Admin Command Center
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-hide px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            active={pathname === item.href}
            onClick={onNavClick}
          />
        ))}

        <div className="h-px bg-border/30 my-3 mx-2" />

        <Link href="/dashboard" onClick={onNavClick}>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all duration-200 cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
              <LayoutDashboard size={16} />
            </div>
            <span className="font-semibold text-sm">Main Dashboard</span>
          </div>
        </Link>

        <Link href="/settings" onClick={onNavClick}>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all duration-200 cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
              <Settings size={16} />
            </div>
            <span className="font-semibold text-sm">Settings</span>
          </div>
        </Link>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
            <LogOut size={16} />
          </div>
          <span className="font-semibold text-sm">Sign Out</span>
        </button>
      </nav>

      {/* Admin User Footer */}
      <div className="shrink-0 p-4 border-t border-border/50 bg-background/20">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl">
          <Avatar className="w-9 h-9 border-2 border-rose-400/30">
            <AvatarImage src={session?.user?.profileImage ?? session?.user?.image ?? ""} />
            <AvatarFallback className="text-xs font-bold bg-rose-500/10 text-rose-400">
              {session?.user?.name?.[0] ?? "A"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black uppercase truncate tracking-tight">
              {session?.user?.name}
            </p>
            <p className="text-[10px] text-rose-400 font-bold uppercase tracking-widest">Super Admin</p>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const currentSection = NAV_ITEMS.find((item) => pathname === item.href);

  return (
    <div className="h-screen w-screen bg-background text-foreground overflow-hidden flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border h-full bg-card/5 shrink-0 overflow-hidden">
        <SidebarContent />
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Topbar */}
        <header className="h-16 border-b border-border flex items-center justify-between px-4 md:px-8 bg-background/80 backdrop-blur-sm sticky top-0 z-50 shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile menu */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden rounded-xl"
              onClick={() => setIsMobileOpen(true)}
            >
              <Menu size={20} />
            </Button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm">
              <Link href="/admin" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                Admin
              </Link>
              {currentSection && (
                <>
                  <ChevronRight size={14} className="text-muted-foreground/50" />
                  <span className="font-bold text-foreground">{currentSection.label}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-1.5">
              <AlertTriangle size={12} className="text-rose-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400">Admin Mode</span>
            </div>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-xs font-bold rounded-xl">
                Exit Admin
              </Button>
            </Link>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide bg-background/50">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="min-h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetContent side="left" className="p-0 border-r border-border w-64">
          <SheetHeader className="hidden">
            <SheetTitle>Admin Navigation</SheetTitle>
          </SheetHeader>
          <SidebarContent onNavClick={() => setIsMobileOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
