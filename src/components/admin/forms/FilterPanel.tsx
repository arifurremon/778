import React from 'react';
import { Button } from '@/components/ui/button';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from '@/lib/utils';

interface FilterPanelProps {
  children: React.ReactNode;
  onReset?: () => void;
  onApply?: () => void;
  activeCount?: number;
  className?: string;
}

export const FilterPanel = ({
  children,
  onReset,
  onApply,
  activeCount = 0,
  className
}: FilterPanelProps) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn("w-full border rounded-lg bg-card overflow-hidden", className)}
    >
      <div className="flex items-center justify-between p-4 bg-muted/50">
        <div className="flex items-center gap-3">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              <span className="font-medium">Filters</span>
              {activeCount > 0 && (
                <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {activeCount}
                </span>
              )}
              {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          </CollapsibleTrigger>
          
          {activeCount > 0 && onReset && (
            <Button variant="ghost" size="sm" onClick={onReset} className="h-8 text-xs text-muted-foreground">
              <X className="mr-1 h-3 w-3" /> Clear all
            </Button>
          )}
        </div>
        
        {isOpen && onApply && (
          <Button size="sm" onClick={onApply} className="h-8">
            Apply Filters
          </Button>
        )}
      </div>
      
      <CollapsibleContent>
        <div className="p-4 pt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 border-t">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
