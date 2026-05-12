import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Settings } from 'lucide-react';

export default function AdminSettingsLoading() {
  return (
    <div className="p-6 md:p-8 space-y-8 max-w-2xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary mb-2">
          <Settings size={12} />
          Global Configuration
        </div>
        <div className="h-10 w-56 bg-muted/60 animate-pulse rounded-xl" />
      </div>

      <div className="space-y-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-border/50 shadow-xl shadow-black/5 overflow-hidden">
            <CardHeader className="bg-muted/10 pb-4 border-b border-border/30">
              <div className="h-5 w-40 bg-muted/60 animate-pulse rounded-lg" />
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="space-y-2">
                  <div className="h-3 w-20 bg-muted/60 animate-pulse rounded-full" />
                  <div className="h-10 w-full bg-muted/40 animate-pulse rounded-xl" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
