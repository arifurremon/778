import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export interface PageHeaderProps {
  eyebrow?: string;
  eyebrowIcon?: LucideIcon;
  title: ReactNode;
  subtitle?: ReactNode;
  className?: string;
  children?: ReactNode;
}

/**
 * Consistent page title block used across consumer-facing routes.
 */
export function PageHeader({
  eyebrow,
  eyebrowIcon: EyebrowIcon,
  title,
  subtitle,
  className,
  children,
}: PageHeaderProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {eyebrow && (
        <div className="flex items-center gap-2 text-accent font-bold uppercase tracking-[0.2em] text-[10px]">
          {EyebrowIcon && <EyebrowIcon size={12} aria-hidden />}
          {eyebrow}
        </div>
      )}
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      {subtitle && (
        <div className="text-muted-foreground text-sm">{subtitle}</div>
      )}
      {children}
    </div>
  );
}
