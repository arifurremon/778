"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageSquare, Search, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMessages } from "@/hooks/use-messages";
import { useNotifications } from "@/hooks/use-notifications";
import Logo from "@/components/brand/logo";
import { SiteFooter } from "@/components/legal/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { BottomNav } from "./bottom-nav";
import { getDashboardGreeting } from "./dashboard-nav-config";
import { DashboardNotificationCenter } from "./dashboard-notification-center";
import { DashboardSearchMenu } from "./dashboard-search-menu";
import { DashboardSidebar } from "./dashboard-sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { logout, user } = useAuth();
  const { totalUnread } = useMessages();
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile();

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const [greeting, setGreeting] = useState("Welcome,");

  const {
    notifications,
    unreadCount: unreadNotificationsCount,
    markAllAsRead,
    markAsRead,
  } = useNotifications();

  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setGreeting(getDashboardGreeting());
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handleSearchSubmit = (event?: React.FormEvent) => {
    event?.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchFocused(false);
      setShowSearchOverlay(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-background text-foreground overflow-hidden flex">
      <aside className="hidden md:flex w-72 flex-col border-r border-border h-full bg-background shrink-0 z-40">
        <DashboardSidebar
          pathname={pathname}
          user={user ?? undefined}
          onLogoutClick={() => setIsLogoutDialogOpen(true)}
        />
      </aside>

      <div className="flex-1 flex flex-col relative h-full overflow-hidden bg-muted/20">
        <header className="h-16 border-b border-border flex items-center justify-between px-4 md:px-8 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full shrink-0">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="md:hidden block">
              <Logo width={100} className="cursor-pointer" />
            </Link>

            <div className="hidden md:flex flex-col text-left shrink-0">
              <h2 className="text-lg font-bold tracking-tight">
                {greeting} {user?.preferredName || user?.name?.split(" ")[0]}
              </h2>
            </div>
          </div>

          <div className="hidden md:block flex-1 max-w-md mx-8 relative" ref={searchRef}>
            <form onSubmit={handleSearchSubmit}>
              <div className="relative group">
                <Search
                  className={cn(
                    "absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
                    isSearchFocused ? "text-primary" : "text-muted-foreground"
                  )}
                />
                <Input
                  placeholder={
                    typeof window !== "undefined" && window.innerWidth >= 1024
                      ? "Search Chattala..."
                      : "Search..."
                  }
                  className="pl-10 h-10 bg-muted/50 border-transparent hover:border-border focus:border-primary focus:bg-background rounded-full w-full font-medium transition-all"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                />
              </div>
            </form>

            <AnimatePresence>
              {isSearchFocused && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-2xl shadow-xl overflow-hidden z-50 p-2"
                >
                  <DashboardSearchMenu onSelect={() => handleSearchSubmit()} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSearchOverlay(true)}
              className="rounded-full w-10 h-10 md:hidden text-muted-foreground hover:text-foreground"
            >
              <Search size={20} strokeWidth={2} />
            </Button>

            <Link href="/messages">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "rounded-full w-10 h-10 relative",
                  pathname === "/messages"
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <MessageSquare
                  size={20}
                  strokeWidth={pathname === "/messages" ? 2.5 : 2}
                  className={pathname === "/messages" ? "fill-current" : ""}
                />
                {totalUnread > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full animate-pulse" />
                )}
              </Button>
            </Link>

            <DashboardNotificationCenter
              notifications={notifications}
              unreadCount={unreadNotificationsCount}
              isMobile={isMobile}
              onMarkAllAsRead={markAllAsRead}
              onMarkAsRead={markAsRead}
            />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto scrollbar-hide px-0 md:px-0">
          <div className="max-w-7xl mx-auto w-full">
            <div className="pb-32 md:pb-10 min-h-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={pathname}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  {children}
                </motion.div>
              </AnimatePresence>
              <SiteFooter />
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showSearchOverlay && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex flex-col"
            >
              <div className="p-4 border-b border-border/50 bg-background flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  onClick={() => setShowSearchOverlay(false)}
                >
                  <X size={20} />
                </Button>
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent" />
                  <Input
                    autoFocus
                    placeholder="Search Chattala..."
                    className="pl-10 h-12 bg-card/20 border-border/50 rounded-2xl w-full font-bold focus:ring-accent"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    onKeyDown={(event) => event.key === "Enter" && handleSearchSubmit()}
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <DashboardSearchMenu onSelect={() => handleSearchSubmit()} isMobile />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetContent side="left" className="p-0 border-r border-border w-72">
            <DashboardSidebar
              pathname={pathname}
              user={user ?? undefined}
              onNavigate={() => setIsMobileMenuOpen(false)}
              onLogoutClick={() => {
                setIsMobileMenuOpen(false);
                setIsLogoutDialogOpen(true);
              }}
            />
          </SheetContent>
        </Sheet>

        <BottomNav onMenuClick={() => setIsMobileMenuOpen(true)} />
      </div>

      <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <AlertDialogContent className="bg-background border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-bold tracking-tight">
              Sign Out Confirmation
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-sm font-bold">
              Are you sure you want to end your session? You will need to sign in again to access
              your dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border-border/50 font-bold uppercase text-[10px] tracking-widest">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-destructive hover:bg-destructive/90 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest"
            >
              Confirm Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
