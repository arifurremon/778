"use client";

import Link from "next/link";
import React from "react";
import type { LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardNavItemProps {
  icon: React.ComponentType<LucideProps>;
  label: string;
  active?: boolean;
  href: string;
  badge?: number;
  onClick?: () => void;
}

export function DashboardNavItem({
  icon: Icon,
  label,
  active = false,
  href,
  badge,
  onClick,
}: DashboardNavItemProps) {
  return (
    <Link href={href} onClick={onClick}>
      <div className="px-2">
        <div
          className={cn(
            "group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors relative",
            active
              ? "bg-muted text-foreground font-bold"
              : "text-muted-foreground hover:bg-muted hover:text-foreground font-medium"
          )}
        >
          {active && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-foreground rounded-r-full" />
          )}
          <span className="relative flex items-center justify-center">
            <Icon
              size={18}
              className={active ? "fill-current" : undefined}
              strokeWidth={active ? 2.5 : undefined}
            />
          </span>
          <span className="text-sm tracking-tight flex-1">{label}</span>
          {badge !== undefined && (
            <span className="bg-primary text-primary-foreground text-[10px] font-black px-1.5 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
