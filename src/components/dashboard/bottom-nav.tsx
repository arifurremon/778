"use client";

import Link from "next/link";
import { 
  LayoutDashboard, 
  Users, 
  ShoppingBag, 
  Home,
  Menu
} from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface BottomNavProps {
  onMenuClick: () => void;
}

export function BottomNav({ onMenuClick }: BottomNavProps) {
  const pathname = usePathname();
  
  // Specific order: Home, Feed (Community), Shop, Neighbours, Menu
  const tabs = [
    { href: "/dashboard", icon: <LayoutDashboard size={20} />, label: "Home" },
    { href: "/community", icon: <Users size={20} />, label: "Feed" },
    { href: "/shops", icon: <ShoppingBag size={20} />, label: "Shop" },
    { href: "/neighbours", icon: <Home size={20} />, label: "Neighbours" },
  ];

  return (
    <div className="md:hidden fixed bottom-6 left-4 right-4 z-50">
      <div className="bg-background/60 backdrop-blur-3xl border border-white/10 dark:border-white/5 shadow-2xl h-16 rounded-[2rem] flex items-center justify-around px-2 relative overflow-hidden">
        {/* Subtle glow effect behind the dock */}
        <div className="absolute inset-0 bg-gradient-to-r from-accent/5 via-transparent to-primary/5 pointer-events-none" />
        
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="relative flex flex-col items-center justify-center gap-1 flex-1 h-full z-10 group"
            >
              <div className={cn(
                "flex items-center justify-center transition-all duration-500",
                isActive 
                  ? "text-accent -translate-y-1" 
                  : "text-muted-foreground group-hover:text-foreground"
              )}>
                {tab.icon}
              </div>
              <span className={cn(
                "text-[9px] font-black uppercase tracking-[0.1em] transition-all duration-500 absolute bottom-2",
                isActive ? "opacity-100 text-accent translate-y-0" : "opacity-0 translate-y-2 text-muted-foreground"
              )}>
                {tab.label}
              </span>
              {isActive && (
                <motion.div 
                  layoutId="bottom-nav-active"
                  className="absolute bottom-0 w-8 h-1 bg-accent rounded-t-full shadow-[0_0_10px_rgba(97,179,204,0.8)]"
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
        <button
          onClick={onMenuClick}
          className="relative flex flex-col items-center justify-center gap-1 flex-1 h-full text-muted-foreground group z-10"
        >
          <div className="flex items-center justify-center transition-all duration-300 group-active:scale-90 group-hover:text-foreground">
            <Menu size={20} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-[0.1em] opacity-60 absolute bottom-2 group-hover:opacity-100 group-hover:text-foreground transition-opacity">Menu</span>
        </button>
      </div>
    </div>
  );
}
