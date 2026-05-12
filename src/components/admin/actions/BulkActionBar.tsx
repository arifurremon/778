import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Trash2, ShieldCheck, Mail, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BulkActionBarProps {
  selectedCount: number;
  onClear: () => void;
  actions: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  }[];
  className?: string;
}

export const BulkActionBar = ({
  selectedCount,
  onClear,
  actions,
  className
}: BulkActionBarProps) => {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className={cn(
            "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
            "bg-background border shadow-2xl rounded-full px-6 py-3",
            "flex items-center gap-6 min-w-[300px]",
            className
          )}
        >
          <div className="flex items-center gap-3 border-r pr-6">
            <Button variant="ghost" size="icon" onClick={onClear} className="h-8 w-8 rounded-full">
              <X className="h-4 w-4" />
            </Button>
            <span className="text-sm font-semibold whitespace-nowrap">
              {selectedCount} selected
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {actions.map((action, idx) => (
              <Button
                key={idx}
                variant={action.variant || "ghost"}
                size="sm"
                onClick={action.onClick}
                className="gap-2 rounded-full h-9 px-4"
              >
                {action.icon}
                <span className="hidden md:inline">{action.label}</span>
              </Button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
