"use client";

import { Briefcase, Command, MapPin, ShoppingBag, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardSearchMenuProps {
  onSelect: () => void;
  isMobile?: boolean;
}

const SEARCH_CATEGORIES = [
  { label: "Community Posts", icon: Users, color: "text-indigo-400" },
  { label: "Directory Spots", icon: MapPin, color: "text-blue-400" },
  { label: "Local Shops", icon: ShoppingBag, color: "text-emerald-400" },
  { label: "Expert Services", icon: Briefcase, color: "text-amber-400" },
] as const;

export function DashboardSearchMenu({ onSelect, isMobile }: DashboardSearchMenuProps) {
  return (
    <div className="space-y-6">
      <div className="px-2">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">
          Quick Categories
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SEARCH_CATEGORIES.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.label}
                type="button"
                onClick={onSelect}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary/5 border border-transparent hover:border-border/50 transition-all text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <div
                  className={cn(
                    "p-2 rounded-lg bg-card/50 border border-border/30",
                    category.color
                  )}
                >
                  <Icon size={14} />
                </div>
                <span className="text-xs font-bold">{category.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {!isMobile && (
        <div className="border-t border-border/10 p-3 bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
              <kbd className="px-1.5 py-0.5 rounded border border-border/50 bg-background font-sans">
                Enter
              </kbd>
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
