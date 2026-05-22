"use client";

import Link from "next/link";
import { 
  Home,
  Users,
  Store,
  MapPin,
  Menu
} from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  onMenuClick: () => void;
}

export function BottomNav({ onMenuClick }: BottomNavProps) {
  const pathname = usePathname();
  
  const tabs = [
    { href: "/dashboard", icon: Home, label: "Home" },
    { href: "/community", icon: Users, label: "Feed" },
    { href: "/shops", icon: Store, label: "Shop" },
    { href: "/neighbours", icon: MapPin, label: "Nearby" },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border">
      <div className="flex items-center justify-between px-2 h-[60px] pb-safe">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center justify-center flex-1 h-full gap-1 active:scale-95 transition-transform"
            >
              <div className={cn(
                "flex items-center justify-center transition-colors",
                isActive ? "text-foreground" : "text-muted-foreground/70"
              )}>
                <Icon 
                  size={24} 
                  strokeWidth={isActive ? 2 : 1.5}
                  className={cn("transition-all duration-200", isActive && "fill-current")}
                />
              </div>
            </Link>
          );
        })}
        <button
          onClick={onMenuClick}
          className="flex flex-col items-center justify-center flex-1 h-full gap-1 text-muted-foreground/70 active:scale-95 transition-transform hover:text-foreground"
        >
          <div className="flex items-center justify-center">
            <Menu size={24} strokeWidth={1.5} />
          </div>
        </button>
      </div>
    </div>
  );
}
