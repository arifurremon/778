import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export interface AppEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: ReactNode;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  /** Extra actions or links below the description */
  footer?: ReactNode;
  className?: string;
}

/**
 * Shared empty state for consumer routes (community, search, profile, etc.).
 */
export function AppEmptyState({
  icon: Icon,
  title,
  description,
  action,
  footer,
  className,
}: AppEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-12 text-center bg-muted/10 rounded-2xl border border-dashed border-border/50",
        className
      )}
      role="status"
    >
      <div
        className="w-16 h-16 rounded-2xl bg-muted/40 flex items-center justify-center text-muted-foreground/60 mb-6"
        aria-hidden
      >
        <Icon size={32} />
      </div>
      <h3 className="text-xl font-bold tracking-tight text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground mt-2 max-w-[320px] leading-relaxed">
        {description}
      </p>
      {action &&
        (action.href ? (
          <Button
            asChild
            className="mt-8 font-bold px-8 rounded-xl shadow-lg shadow-primary/20"
          >
            <Link href={action.href}>{action.label}</Link>
          </Button>
        ) : (
          <Button
            type="button"
            onClick={action.onClick}
            className="mt-8 font-bold px-8 rounded-xl shadow-lg shadow-primary/20"
          >
            {action.label}
          </Button>
        ))}
      {footer}
    </div>
  );
}
