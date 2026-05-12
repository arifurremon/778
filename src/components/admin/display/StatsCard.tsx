"use client";

import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: number; // percent change
  index?: number;
  className?: string;
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-primary",
  iconBg = "bg-primary/10",
  trend,
  index = 0,
  className,
}: StatCardProps) {
  const TrendIcon = trend !== undefined
    ? trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={cn(
        "bg-card/40 border border-border/50 rounded-2xl p-5 flex flex-col gap-4 hover:border-border transition-all duration-300 hover:shadow-lg hover:shadow-black/5 group",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110", iconBg)}>
          <Icon size={20} className={iconColor} />
        </div>
        {trend !== undefined && TrendIcon && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-bold rounded-full px-2 py-1",
              trend > 0 ? "text-emerald-400 bg-emerald-400/10" : trend < 0 ? "text-rose-400 bg-rose-400/10" : "text-muted-foreground bg-muted"
            )}
          >
            <TrendIcon size={12} />
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>

      <div>
        <div className="text-2xl font-black tracking-tight tabular-nums">
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
        <div className="text-xs font-semibold text-muted-foreground mt-0.5">{title}</div>
        {subtitle && (
          <div className="text-[10px] text-muted-foreground/60 font-medium mt-1 uppercase tracking-wide">{subtitle}</div>
        )}
      </div>
    </motion.div>
  );
}

interface PendingAlertProps {
  count: number;
  label: string;
  href: string;
  color?: string;
}

export function PendingAlert({ count, label, href, color = "amber" }: PendingAlertProps) {
  if (count === 0) return null;
  return (
    <a href={href} className="flex items-center gap-3 bg-amber-500/5 border border-amber-500/20 hover:border-amber-500/40 rounded-xl px-4 py-3 transition-all group">
      <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 text-sm font-black shrink-0">
        {count}
      </div>
      <span className="text-xs font-semibold text-amber-400 group-hover:text-amber-300 transition-colors">{label}</span>
      <svg className="ml-auto w-3.5 h-3.5 text-amber-400 opacity-50 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </a>
  );
}
