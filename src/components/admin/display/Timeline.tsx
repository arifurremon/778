import React from 'react';
import { cn } from '@/lib/utils';
import { Circle } from 'lucide-react';

export interface TimelineItemProps {
  title: string;
  description?: string;
  timestamp: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  icon?: React.ReactNode;
}

interface TimelineProps {
  items: TimelineItemProps[];
  className?: string;
}

const typeStyles = {
  info: 'bg-blue-500',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  error: 'bg-red-500',
};

export const Timeline = ({ items, className }: TimelineProps) => {
  return (
    <div className={cn("relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-muted before:to-transparent", className)}>
      {items.map((item, index) => (
        <div key={index} className="relative flex items-start gap-6 group">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background ring-4 ring-background z-10">
            {item.icon || (
              <div className={cn("h-3 w-3 rounded-full", typeStyles[item.type || 'info'])} />
            )}
          </div>
          <div className="flex flex-col space-y-1 py-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{item.title}</span>
              <span className="text-xs text-muted-foreground">• {item.timestamp}</span>
            </div>
            {item.description && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
