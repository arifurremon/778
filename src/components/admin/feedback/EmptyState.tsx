import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-12 text-center bg-muted/10 rounded-2xl border border-dashed border-border/50",
      className
    )}>
      <div className="w-16 h-16 rounded-2xl bg-muted/40 flex items-center justify-center text-muted-foreground/60 mb-6 group-hover:scale-110 transition-transform">
        <Icon size={32} />
      </div>
      
      <h3 className="text-xl font-black tracking-tight text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground mt-2 max-w-[300px] leading-relaxed">
        {description}
      </p>

      {action && (
        <Button 
          onClick={action.onClick}
          className="mt-8 font-bold px-8 rounded-xl shadow-lg shadow-primary/20"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
