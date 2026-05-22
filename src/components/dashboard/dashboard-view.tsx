
"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LogOut, 
  LayoutDashboard, 
  Search, 
  Users, 
  ShoppingBag, 
  ShieldAlert, 
  Bell, 
  MapPin,
  Briefcase,
  Store,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  Settings,
  Compass,
  X,
  History,
  Command,
  Flame,
  Heart,
  MessageCircle,
  Check,
  Home
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useMessages } from "@/hooks/use-messages";
import { useNotifications } from "@/hooks/use-notifications";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Logo from "@/components/brand/logo";
import { BottomNav } from "./bottom-nav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";

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
  
  const { notifications, unreadCount: unreadNotificationsCount, markAllAsRead, markAsRead } = useNotifications();
  
  const searchRef = useRef<HTMLDivElement>(null);

  const NAV_ITEMS = [
    { icon: <LayoutDashboard size={18} />, label: "Overview", href: "/dashboard" },
    { icon: <Users size={18} />, label: "Community", href: "/community" },
    { icon: <Home size={18} />, label: "Neighbours", href: "/neighbours" },
    { icon: <Search size={18} />, label: "Directory", href: "/directory" },
    { icon: <ShoppingBag size={18} />, label: "Marketplace", href: "/shops" },
    { icon: <Briefcase size={18} />, label: "Services", href: "/services" },
    { icon: <Store size={18} />, label: "Seller Hub", href: "/seller", sellerOnly: true },
    { icon: <ShieldCheck size={18} />, label: "Expert Hub", href: "/expert", expertOnly: true },
    { icon: <ShieldAlert size={18} />, label: "Emergency", href: "/emergency" },
    { icon: <Compass size={18} />, label: "Vision & Legacy", href: "/about" },
    { icon: <ShieldAlert size={18} />, label: "Admin Center", href: "/admin", adminOnly: true },
  ];

  const visibleNavItems = NAV_ITEMS.filter(item => {
    if (item.sellerOnly && !user?.isSeller) return false;
    if (item.expertOnly && !user?.isServiceProvider) return false;
    if (item.adminOnly && !user?.isAdmin) return false;
    return true;
  });

  const [greeting, setGreeting] = useState("Welcome,");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting('Good Morning,');
    else if (hour >= 12 && hour < 17) setGreeting('Good Afternoon,');
    else if (hour >= 17 && hour < 20) setGreeting('Good Evening,');
    else setGreeting('Good Night,');
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/');
  };


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchFocused(false);
      setShowSearchOverlay(false);
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-card/40 backdrop-blur-3xl rounded-3xl border border-white/10 dark:border-white/5 shadow-2xl relative overflow-hidden">
      {/* Subtle glow effect behind sidebar */}
      <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="px-8 pt-8 mb-8 shrink-0 relative z-10">
        <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="transition-opacity hover:opacity-90 block hover:scale-105 duration-300">
          <Logo width={120} className="cursor-pointer" />
        </Link>
      </div>
      
      <nav className="flex-1 overflow-y-auto scrollbar-hide px-4 space-y-6 relative z-10 pb-4">
        {/* Zone 1: Core Daily Needs */}
        <div className="space-y-1">
          <div className="px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 opacity-70">Core</div>
          {visibleNavItems.filter(i => ['Overview', 'Community', 'Neighbours'].includes(i.label)).map((item) => (
            <NavItem key={item.href} icon={item.icon} label={item.label} active={pathname === item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)} />
          ))}
        </div>

        {/* Zone 2: Discover & Utility */}
        <div className="space-y-1">
          <div className="px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 opacity-70">Discover</div>
          {visibleNavItems.filter(i => ['Directory', 'Marketplace', 'Services'].includes(i.label)).map((item) => (
            <NavItem key={item.href} icon={item.icon} label={item.label} active={pathname === item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)} />
          ))}
        </div>

        {/* Zone 3: Workspaces */}
        {(user?.isSeller || user?.isServiceProvider || user?.isAdmin) && (
          <div className="space-y-1">
            <div className="px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 opacity-70">Workspace</div>
            {visibleNavItems.filter(i => ['Seller Hub', 'Expert Hub', 'Admin Center'].includes(i.label)).map((item) => (
              <NavItem key={item.href} icon={item.icon} label={item.label} active={pathname === item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)} />
            ))}
          </div>
        )}

        {/* Zone 4: Critical */}
        <div className="space-y-1">
          <div className="px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 opacity-70">System</div>
          {visibleNavItems.filter(i => i.label === 'Vision & Legacy').map((item) => (
            <NavItem key={item.href} icon={item.icon} label={item.label} active={pathname === item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)} />
          ))}
          <NavItem icon={<Settings size={18} />} label="Settings" active={pathname === '/settings'} href="/settings" onClick={() => setIsMobileMenuOpen(false)} />
          
          <Link href="/emergency" onClick={() => setIsMobileMenuOpen(false)} className="block mt-4">
            <div className={cn(
              "group relative flex items-center gap-4 px-4 py-4 rounded-2xl cursor-pointer transition-all duration-500 overflow-hidden",
              pathname === '/emergency' ? "bg-red-500/20 text-red-500 shadow-sm scale-[1.02]" : "bg-red-500/5 text-red-500 hover:bg-red-500/10 hover:scale-[1.02]"
            )}>
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent pointer-events-none" />
              <div className="relative z-10">
                <ShieldAlert size={18} className="group-hover:scale-110 transition-transform duration-500" />
                <span className="absolute inset-0 bg-red-500 blur-md opacity-40 rounded-full animate-pulse" />
              </div>
              <span className="font-black text-sm tracking-tight flex-1 relative z-10">SOS Emergency</span>
              {pathname === '/emergency' && <motion.div layoutId="activeNav" className="ml-auto w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] relative z-10" />}
            </div>
          </Link>
          
          <button 
            onClick={() => {
              setIsMobileMenuOpen(false);
              setIsLogoutDialogOpen(true);
            }}
            className="w-full mt-2 group flex items-center gap-4 px-4 py-3.5 rounded-2xl cursor-pointer transition-all duration-300 text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:scale-[1.02]"
          >
            <LogOut size={18} className="group-hover:scale-110 transition-transform duration-500" />
            <span className="font-bold text-sm tracking-tight">Sign Out</span>
          </button>
        </div>
      </nav>

      <div className="mt-auto shrink-0 p-4 border-t border-border/10 bg-background/20 relative z-10 backdrop-blur-md">
        <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="flex items-center gap-3 px-3 cursor-pointer hover:bg-white/10 p-3 rounded-2xl transition-colors border border-transparent hover:border-white/5">
             <Avatar className="w-10 h-10 border border-border/50 bg-background shadow-sm">
               <AvatarImage src={user?.profileImage} />
               <AvatarFallback className="text-[10px] font-bold">{user?.name?.[0]}</AvatarFallback>
             </Avatar>
             <div className="flex-1 min-w-0 text-left">
               <p className="text-xs font-black uppercase truncate tracking-tight">{user?.name}</p>
               <div className="text-[10px] text-muted-foreground uppercase tracking-wider truncate font-bold flex items-center gap-1">
                 <MapPin size={10} className="text-accent" /> {user?.location || 'Chittagong'}
               </div>
             </div>
          </div>
        </Link>
      </div>
    </div>
  );

  const NotificationCenter = () => {
    const list = (
      <div className="flex flex-col h-full max-h-[450px]">
        <div className="p-4 border-b border-border/50 flex items-center justify-between shrink-0">
          <h3 className="text-sm font-black uppercase tracking-widest">Notifications</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={markAllAsRead}
            className="text-[10px] font-black uppercase tracking-widest text-accent hover:bg-accent/5 h-8 px-3 rounded-lg"
          >
            Mark all as read
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hide py-2">
          {notifications.length === 0 ? (
            <div className="py-20 text-center space-y-2">
              <Bell className="w-10 h-10 text-muted-foreground/20 mx-auto" />
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">No new alerts</p>
            </div>
          ) : (
            notifications.map((n) => {
              const isLike = n.type === 'LIKE' || n.type === 'COMMENT_LIKE';
              const isComment = n.type === 'COMMENT';
              const isConnection = n.type === 'CONNECTION_REQUEST' || n.type === 'CONNECTION_ACCEPTED';
              const isPopular = n.type === 'POPULAR';

              return (
                <div 
                  key={n.id}
                  onClick={() => {
                    if (n.isRead === false) markAsRead(n.id);
                    if (n.contextUrl) router.push(n.contextUrl);
                  }}
                  className={cn(
                    "px-4 py-4 flex gap-4 transition-colors relative cursor-pointer group",
                    !n.isRead ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/50"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-border/30",
                    isPopular ? "bg-rose-500/10 text-rose-500" :
                    isLike ? "bg-blue-500/10 text-blue-500" :
                    isComment ? "bg-emerald-500/10 text-emerald-500" :
                    isConnection ? "bg-purple-500/10 text-purple-500" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {isPopular ? <Flame size={18} className="fill-current" /> :
                     isLike ? <Heart size={18} className="fill-current" /> :
                     isComment ? <MessageCircle size={18} className="fill-current" /> :
                     isConnection ? <Users size={18} className="fill-current" /> :
                     <Bell size={18} />}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className={cn("text-xs leading-relaxed font-bold", !n.isRead ? "text-foreground" : "text-muted-foreground")}>
                      {n.description}
                    </p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {!n.isRead && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </div>
              );
            })
          )}
        </div>
        <div className="p-4 border-t border-border/50 bg-muted/20 shrink-0">
          <Link href="/activity" className="w-full">
            <Button variant="link" className="w-full text-[10px] font-black uppercase tracking-widest text-muted-foreground h-auto p-0">
              View Activity History
            </Button>
          </Link>
        </div>
      </div>
    );

    if (isMobile) {
      return (
        <Sheet>
          <SheetTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn(
                "rounded-full transition-all duration-300 relative w-11 h-11",
                "bg-card/30 border border-border/50 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <Bell size={18} />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-background animate-in zoom-in shadow-lg">
                  {unreadNotificationsCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-[2.5rem] p-0 border-t-0 bg-background overflow-hidden max-h-[85vh]">
            <div className="w-12 h-1.5 bg-muted/30 rounded-full mx-auto mt-4 mb-2" />
            <SheetHeader className="hidden">
              <SheetTitle>Notifications</SheetTitle>
            </SheetHeader>
            {list}
          </SheetContent>
        </Sheet>
      );
    }

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn(
              "rounded-full transition-all duration-300 relative w-11 h-11",
              "bg-card/30 border border-border/50 text-muted-foreground hover:bg-muted/50 hover:text-foreground data-[state=open]:bg-primary data-[state=open]:text-white data-[state=open]:shadow-lg"
            )}
          >
            <Bell size={18} />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-background animate-in zoom-in shadow-lg">
                {unreadNotificationsCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-0 bg-card/95 backdrop-blur-xl border-border/50 rounded-2xl shadow-2xl overflow-hidden mt-2">
          {list}
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <div className="h-screen w-screen bg-background text-foreground overflow-hidden flex bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent/5 via-background to-background">
      {/* Fixed Desktop Sidebar */}
      <aside className="hidden md:flex w-[280px] flex-col h-full shrink-0 overflow-hidden p-4 pr-0 relative z-40">
        <SidebarContent />
      </aside>

      {/* Main View Area */}
      <div className="flex-1 flex flex-col relative h-full overflow-hidden">
        {/* Universal Header */}
        <div className="px-4 md:px-6 pt-4 pb-2 shrink-0 z-50 sticky top-0">
          <header className="h-16 md:h-20 rounded-full border border-white/10 dark:border-white/5 flex items-center justify-between px-4 md:px-8 bg-card/40 backdrop-blur-2xl shadow-lg w-full relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-accent/5 via-transparent to-primary/5 pointer-events-none" />
            
            <div className="flex items-center gap-4 relative z-10">
              <Link href="/dashboard" className="md:hidden block transition-transform hover:scale-105 active:scale-95 duration-300">
                <Logo width={100} className="cursor-pointer" />
              </Link>
              
              {/* Desktop Welcome Section */}
              <div className="hidden md:flex flex-col text-left shrink-0">
                <h2 className="text-xl font-bold tracking-tight">
                  {greeting} <span className="text-accent">{user?.preferredName || user?.name?.split(' ')[0]}</span>
                </h2>
              </div>
            </div>

            {/* Desktop Center Search Bar (Visible on md and up) */}
            <div className="hidden md:block flex-1 max-w-sm lg:max-w-md mx-4 lg:mx-8 relative z-10" ref={searchRef}>
              <form onSubmit={handleSearchSubmit}>
                <div className="relative group">
                  <Search className={cn(
                    "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
                    isSearchFocused ? 'text-accent' : 'text-muted-foreground'
                  )} />
                  <Input 
                    placeholder={typeof window !== 'undefined' && window.innerWidth >= 1024 ? "Search shops, services, or residents..." : "Search..."}
                    className="pl-12 h-12 bg-background/50 border-white/10 dark:border-white/5 focus:ring-accent rounded-full w-full font-bold shadow-inner"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                  />
                </div>
              </form>

              <AnimatePresence>
                {isSearchFocused && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 5, scale: 0.95 }}
                    className="absolute top-full left-0 right-0 mt-4 bg-card/80 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-50 p-2"
                  >
                    <SearchMenuContent onSelect={handleSearchSubmit} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="flex items-center gap-2 md:gap-3 relative z-10">
               {/* Mobile Search Icon */}
               <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowSearchOverlay(true)}
                  className={cn(
                    "rounded-full transition-all duration-300 relative w-10 h-10 md:hidden",
                    showSearchOverlay 
                      ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105" 
                      : "bg-background/50 border border-white/10 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
               >
                 <Search size={18} />
               </Button>

               <Link href="/messages">
                 <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn(
                    "rounded-full transition-all duration-300 relative w-10 h-10 md:w-11 md:h-11",
                    pathname === '/messages' 
                      ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105" 
                      : "bg-background/50 border border-white/10 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                  )}
                 >
                   <MessageSquare size={18} />
                   {totalUnread > 0 && (
                     <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-accent-foreground rounded-full border-2 border-background text-[10px] font-black flex items-center justify-center animate-in zoom-in select-none shadow-lg">
                       {totalUnread}
                     </span>
                   )}
                 </Button>
               </Link>

               <NotificationCenter />
            </div>
          </header>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto scrollbar-hide px-4 md:px-6">
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
            </div>
          </div>
        </div>

        {/* Mobile Search Overlay (Native Command Palette Style) */}
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
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <SearchMenuContent onSelect={handleSearchSubmit} isMobile />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Side Drawer */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetContent side="left" className="p-0 border-r border-border w-72">
            <SidebarContent />
          </SheetContent>
        </Sheet>

        {/* Mobile Bottom Nav */}
        <BottomNav onMenuClick={() => setIsMobileMenuOpen(true)} />
      </div>

      <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <AlertDialogContent className="bg-background border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-bold tracking-tight">Sign Out Confirmation</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-sm font-bold">
              Are you sure you want to end your session? You will need to sign in again to access your dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border-border/50 font-bold uppercase text-[10px] tracking-widest">Cancel</AlertDialogCancel>
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

function NavItem({ icon, label, active = false, href, badge, onClick }: { icon: React.ReactNode, label: string, active?: boolean, href: string, badge?: number, onClick?: () => void }) {
  return (
    <Link href={href} onClick={onClick}>
      <div 
        className={`group relative flex items-center gap-4 px-4 py-3.5 rounded-2xl cursor-pointer transition-all duration-500 overflow-hidden ${active ? 'bg-primary/10 text-primary shadow-sm scale-[1.02]' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground hover:scale-[1.02]'}`}
      >
        {active && (
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
        )}
        <span className={`transition-transform duration-500 group-hover:scale-110 relative z-10 ${active ? 'text-accent' : ''}`}>{icon}</span>
        <span className="font-bold text-sm tracking-tight flex-1 relative z-10">{label}</span>
        {badge !== undefined && (
          <span className="bg-accent text-accent-foreground text-[10px] font-black px-1.5 py-0.5 rounded-full relative z-10 shadow-md">
            {badge}
          </span>
        )}
        {active && <motion.div layoutId="activeNav" className="ml-auto w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_8px_rgba(97,179,204,0.8)] relative z-10" />}
      </div>
    </Link>
  );
}

function SearchMenuContent({ onSelect, isMobile }: { onSelect: () => void, isMobile?: boolean }) {
  const categories = [
    { label: "Community Posts", icon: <Users size={14} />, color: "text-indigo-400" },
    { label: "Directory Spots", icon: <MapPin size={14} />, color: "text-blue-400" },
    { label: "Local Shops", icon: <ShoppingBag size={14} />, color: "text-emerald-400" },
    { label: "Expert Services", icon: <Briefcase size={14} />, color: "text-amber-400" }
  ];

  return (
    <div className="space-y-6">
      <div className="px-2">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">Quick Categories</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {categories.map((cat) => (
            <button 
              key={cat.label}
              onClick={onSelect}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary/5 border border-transparent hover:border-border/50 transition-all text-left"
            >
              <div className={cn("p-2 rounded-lg bg-card/50 border border-border/30", cat.color)}>
                {cat.icon}
              </div>
              <span className="text-xs font-bold">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-2 pb-2">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3">Recent Searches</h3>
        <div className="space-y-1">
          {["Panchlaish Doctors", "Mezban in Chawkbazar", "GEC Circle Traffic"].map(item => (
            <button 
              key={item}
              onClick={onSelect}
              className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-primary/5 text-muted-foreground hover:text-foreground transition-colors group"
            >
              <History size={14} className="opacity-40 group-hover:opacity-100" />
              <span className="text-xs font-medium">{item}</span>
            </button>
          ))}
        </div>
      </div>

      {!isMobile && (
        <div className="border-t border-border/10 p-3 bg-muted/20 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                <kbd className="px-1.5 py-0.5 rounded border border-border/50 bg-background font-sans">Enter</kbd>
                <span>to search</span>
              </div>
           </div>
           <div className="flex items-center gap-1 text-[10px] font-bold text-accent">
             <Command size={10} />
             <span>Universal Search Engine</span>
           </div>
        </div>
      )}
    </div>
  );
}
