import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type StatusType = 'pending' | 'active' | 'suspended' | 'resolved' | 'rejected' | 'archived';

interface StatusBadgeProps {
  status: StatusType | string;
  className?: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: 'Pending', variant: 'secondary' },
  active: { label: 'Active', variant: 'default' },
  suspended: { label: 'Suspended', variant: 'destructive' },
  resolved: { label: 'Resolved', variant: 'outline' },
  rejected: { label: 'Rejected', variant: 'destructive' },
  archived: { label: 'Archived', variant: 'outline' },
};

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const config = statusConfig[status.toLowerCase()] || { label: status, variant: 'outline' };
  
  return (
    <Badge 
      variant={config.variant} 
      className={cn("capitalize font-medium px-2.5 py-0.5 rounded-full text-xs", className)}
    >
      {config.label}
    </Badge>
  );
};
