
"use client";

import Link from "next/link";
import { 
  LayoutDashboard, 
  Users, 
  ShoppingBag, 
  UserCircle,
  Menu
} from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  onMenuClick: () => void;
}

export function BottomNav({ onMenuClick }: BottomNavProps) {
  const pathname = usePathname();
  
  // Specific order: Overview, Community (Social), Me (Center), Shops, Menu
  const tabs = [
    { href: "/dashboard", icon: <LayoutDashboard size={20} />, label: "Overview" },
    { href: "/community", icon: <Users size={20} />, label: "Social" },
    { href: "/profile", icon: <UserCircle size={20} />, label: "Me" },
    { href: "/shops", icon: <ShoppingBag size={20} />, label: "Shops" },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border h-16 flex items-center justify-center">
      <div className="flex items-center justify-around w-full max-w-md h-full px-2">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center justify-center gap-1 flex-1 h-full"
            >
              <div className={cn(
                "flex items-center justify-center transition-all duration-300",
                isActive 
                  ? "bg-primary text-white px-5 py-1.5 rounded-2xl scale-105 shadow-lg shadow-primary/20" 
                  : "text-muted-foreground hover:text-foreground"
              )}>
                {tab.icon}
              </div>
              <span className={cn(
                "text-[9px] font-bold uppercase tracking-[0.1em] transition-opacity",
                isActive ? "text-primary" : "text-muted-foreground opacity-60"
              )}>
                {tab.label}
              </span>
            </Link>
          );
        })}
        <button
          onClick={onMenuClick}
          className="flex flex-col items-center justify-center gap-1 flex-1 h-full text-muted-foreground group"
        >
          <div className="flex items-center justify-center p-1.5 transition-all group-active:scale-90">
            <Menu size={20} />
          </div>
          <span className="text-[9px] font-bold uppercase tracking-[0.1em] opacity-60">Menu</span>
        </button>
      </div>
    </div>
  );
}
