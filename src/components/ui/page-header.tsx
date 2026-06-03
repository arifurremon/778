import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export interface PageHeaderProps {
  eyebrow?: string;
  eyebrowIcon?: LucideIcon;
  /** Decorative element before eyebrow text (e.g. dashboard hero line) */
  eyebrowPrefix?: ReactNode;
  /** Accent (default) or destructive (e.g. emergency) */
  eyebrowTone?: "accent" | "destructive";
  /** Default page title or large dashboard hero */
  size?: "default" | "hero";
  title: ReactNode;
  subtitle?: ReactNode;
  className?: string;
  eyebrowClassName?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  children?: ReactNode;
}

/**
 * Consistent page title block used across consumer-facing routes.
 */
const eyebrowToneClass = {
  accent: "text-accent",
  destructive: "text-destructive",
} as const;

const titleSizeClass = {
  default: "text-3xl font-bold tracking-tight",
  hero: "text-3xl md:text-5xl font-black tracking-tight leading-[1.1]",
} as const;

const subtitleSizeClass = {
  default: "text-muted-foreground text-sm",
  hero: "text-base md:text-lg font-bold text-muted-foreground max-w-2xl leading-relaxed",
} as const;

export function PageHeader({
  eyebrow,
  eyebrowIcon: EyebrowIcon,
  eyebrowPrefix,
  eyebrowTone = "accent",
  size = "default",
  title,
  subtitle,
  className,
  eyebrowClassName,
  titleClassName,
  subtitleClassName,
  children,
}: PageHeaderProps) {
  return (
    <div className={cn(size === "hero" ? "space-y-4" : "space-y-2", className)}>
      {eyebrow && (
        <div
          className={cn(
            "flex items-center gap-2 font-bold uppercase text-[10px]",
            size === "hero" ? "tracking-[0.3em]" : "tracking-[0.2em]",
            eyebrowToneClass[eyebrowTone],
            eyebrowClassName
          )}
        >
          {eyebrowPrefix}
          {EyebrowIcon && <EyebrowIcon size={12} aria-hidden />}
          {eyebrow}
        </div>
      )}
      <h1 className={cn(titleSizeClass[size], titleClassName)}>{title}</h1>
      {subtitle && (
        <div className={cn(subtitleSizeClass[size], subtitleClassName)}>
          {subtitle}
        </div>
      )}
      {children}
    </div>
  );
}
