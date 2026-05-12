import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface TableSkeletonProps {
  columns?: number;
  rows?: number;
  showFilters?: boolean;
}

export function TableSkeleton({ columns = 5, rows = 8, showFilters = true }: TableSkeletonProps) {
  const widths = ['w-[40%]', 'w-[70%]', 'w-[50%]', 'w-[60%]', 'w-[80%]'];

  return (
    <Card className="border-border/50 shadow-xl shadow-black/5 overflow-hidden">
      {showFilters && (
        <CardHeader className="bg-muted/10 pb-6 border-b border-border/30">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 bg-muted/60 animate-pulse rounded-xl" />
            ))}
          </div>
        </CardHeader>
      )}

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-muted/50 border-b border-border/50">
              <tr>
                {[...Array(columns)].map((_, i) => (
                  <th key={i} className="px-6 py-4">
                    <div className="h-3 w-20 bg-muted/60 animate-pulse rounded-full" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {[...Array(rows)].map((_, rowIndex) => (
                <tr key={rowIndex}>
                  {[...Array(columns)].map((_, colIndex) => (
                    <td key={colIndex} className="px-6 py-4">
                      <div 
                        className={cn(
                          "h-4 bg-muted/60 animate-pulse rounded-full",
                          widths[(rowIndex + colIndex) % widths.length]
                        )} 
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
