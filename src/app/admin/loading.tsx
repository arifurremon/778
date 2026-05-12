import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function AdminDashboardLoading() {
  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-24 bg-muted/60 animate-pulse rounded-full" />
        <div className="h-10 w-64 bg-muted/60 animate-pulse rounded-xl" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="pb-2">
              <div className="h-3 w-20 bg-muted/60 animate-pulse rounded-full" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted/60 animate-pulse rounded-lg mb-2" />
              <div className="h-3 w-24 bg-muted/60 animate-pulse rounded-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="border-border/50 shadow-xl shadow-black/5 overflow-hidden">
            <CardHeader className="bg-muted/10 pb-4 border-b border-border/30">
              <div className="h-5 w-40 bg-muted/60 animate-pulse rounded-lg" />
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[300px] w-full bg-muted/40 animate-pulse rounded-xl" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity Table Skeleton */}
      <div className="space-y-4">
        <div className="h-6 w-32 bg-muted/60 animate-pulse rounded-lg" />
        <Card className="border-border/50 shadow-sm overflow-hidden">
          <div className="divide-y divide-border/30">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-muted/60 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 bg-muted/60 animate-pulse rounded-full" />
                  <div className="h-3 w-1/4 bg-muted/60 animate-pulse rounded-full" />
                </div>
                <div className="h-6 w-16 bg-muted/60 animate-pulse rounded-lg" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
