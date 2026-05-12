import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export default function AdminAnalyticsLoading() {
  return (
    <div className="p-6 md:p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary mb-2">
            <BarChart3 size={12} />
            Data Insights
          </div>
          <div className="h-10 w-48 bg-muted/60 animate-pulse rounded-xl" />
        </div>
        <div className="h-10 w-64 bg-muted/60 animate-pulse rounded-xl" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Large Bar Chart Skeleton */}
        <Card className="border-border/50 shadow-xl shadow-black/5 overflow-hidden lg:col-span-2">
          <CardHeader className="bg-muted/10 pb-4 border-b border-border/30">
            <div className="h-5 w-48 bg-muted/60 animate-pulse rounded-lg" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[350px] w-full bg-muted/40 animate-pulse rounded-xl" />
          </CardContent>
        </Card>

        {/* Smaller Charts Grid */}
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="border-border/50 shadow-lg overflow-hidden">
            <CardHeader className="bg-muted/10 pb-4 border-b border-border/30">
              <div className="h-5 w-32 bg-muted/60 animate-pulse rounded-lg" />
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[250px] w-full bg-muted/40 animate-pulse rounded-xl" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
