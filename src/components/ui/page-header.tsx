import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export interface PageHeaderProps {
  eyebrow?: string;
  eyebrowIcon?: LucideIcon;
  /** Accent (default) or destructive (e.g. emergency) */
  eyebrowTone?: "accent" | "destructive";
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

export function PageHeader({
  eyebrow,
  eyebrowIcon: EyebrowIcon,
  eyebrowTone = "accent",
  title,
  subtitle,
  className,
  eyebrowClassName,
  titleClassName,
  subtitleClassName,
  children,
}: PageHeaderProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {eyebrow && (
        <div
          className={cn(
            "flex items-center gap-2 font-bold uppercase tracking-[0.2em] text-[10px]",
            eyebrowToneClass[eyebrowTone],
            eyebrowClassName
          )}
        >
          {EyebrowIcon && <EyebrowIcon size={12} aria-hidden />}
          {eyebrow}
        </div>
      )}
      <h1 className={cn("text-3xl font-bold tracking-tight", titleClassName)}>
        {title}
      </h1>
      {subtitle && (
        <div
          className={cn(
            "text-muted-foreground text-sm",
            subtitleClassName
          )}
        >
          {subtitle}
        </div>
      )}
      {children}
    </div>
  );
}
