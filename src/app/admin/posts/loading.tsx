import React from 'react';
import { TableSkeleton } from '@/components/admin/feedback/TableSkeleton';
import { LayoutGrid } from 'lucide-react';

export default function AdminPostsLoading() {
  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary mb-2">
          <LayoutGrid size={12} />
          Content Moderation
        </div>
        <div className="h-10 w-48 bg-muted/60 animate-pulse rounded-xl" />
        <div className="h-4 w-64 bg-muted/60 animate-pulse rounded-full mt-2" />
      </div>

      <TableSkeleton columns={5} rows={12} />
    </div>
  );
}
