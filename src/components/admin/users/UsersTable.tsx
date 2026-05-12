"use client";

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/admin/display/StatusBadge';
import { QuickActionMenu } from '@/components/admin/actions/QuickActionMenu';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  username: string | null;
  profileImage: string | null;
  isAdmin: boolean;
  isSeller: boolean;
  isServiceProvider: boolean;
  emailVerified: Date | null;
  createdAt: Date;
  suspendedAt: Date | null;
  _count: { posts: number; shops: number; services: number };
}

interface UsersTableProps {
  users: AdminUser[];
  selectedIds: string[];
  onSelectChange: (ids: string[]) => void;
  onSort: (column: string) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
  onSuspend: (id: string) => void;
  onDelete: (id: string) => void;
}

export const UsersTable = ({
  users,
  selectedIds,
  onSelectChange,
  onSort,
  sortBy,
  sortOrder,
  page,
  totalPages,
  onPageChange,
  isLoading,
  onSuspend,
  onDelete
}: UsersTableProps) => {
  const router = useRouter();

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectChange(users.map(u => u.id));
    } else {
      onSelectChange([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      onSelectChange([...selectedIds, id]);
    } else {
      onSelectChange(selectedIds.filter(i => i !== id));
    }
  };

  const getStatus = (user: AdminUser) => {
    if (user.suspendedAt) return 'suspended';
    if (!user.emailVerified) return 'unverified';
    return 'active';
  };

  const renderSortIcon = (column: string) => {
    return (
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => onSort(column)}
        className={cn("h-8 px-2 -ml-2 hover:bg-transparent", sortBy === column && "text-primary")}
      >
        <ArrowUpDown className={cn("ml-2 h-4 w-4", sortBy === column && "opacity-100")} />
      </Button>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 w-full bg-muted/50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-12">
                <Checkbox 
                  checked={users.length > 0 && selectedIds.length === users.length} 
                  onCheckedChange={(checked) => handleSelectAll(!!checked)}
                />
              </TableHead>
              <TableHead className="min-w-[200px]">
                <div className="flex items-center gap-1">
                  User {renderSortIcon('name')}
                </div>
              </TableHead>
              <TableHead className="hidden md:table-cell">Username</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">
                <div className="flex items-center gap-1">
                  Joined {renderSortIcon('createdAt')}
                </div>
              </TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  No users found matching your filters.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow 
                  key={user.id} 
                  className={cn(
                    "cursor-pointer hover:bg-muted/50 transition-colors group",
                    selectedIds.includes(user.id) && "bg-primary/5"
                  )}
                  onClick={() => router.push(`/admin/users/${user.id}`)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox 
                      checked={selectedIds.includes(user.id)} 
                      onCheckedChange={(checked) => handleSelectRow(user.id, !!checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-border/50">
                        <AvatarImage src={user.profileImage || ''} />
                        <AvatarFallback className="text-xs font-bold uppercase bg-primary/10 text-primary">
                          {user.name?.[0] || user.email[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm line-clamp-1">{user.name || 'Anonymous'}</span>
                        <span className="text-xs text-muted-foreground line-clamp-1">{user.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-xs text-muted-foreground font-medium">@{user.username || 'user'}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.isAdmin && (
                        <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-600 border-red-500/20 px-1.5 py-0">Admin</Badge>
                      )}
                      {user.isSeller && (
                        <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/20 px-1.5 py-0">Seller</Badge>
                      )}
                      {user.isServiceProvider && (
                        <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-600 border-purple-500/20 px-1.5 py-0">Provider</Badge>
                      )}
                      {!user.isAdmin && !user.isSeller && !user.isServiceProvider && (
                        <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground border-border px-1.5 py-0">User</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={getStatus(user)} className="text-[10px]" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                    </span>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <QuickActionMenu 
                      onView={() => router.push(`/admin/users/${user.id}`)}
                      onBan={() => onSuspend(user.id)}
                      onDelete={() => onDelete(user.id)}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          Page <span className="font-medium text-foreground">{page}</span> of <span className="font-medium text-foreground">{totalPages}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            disabled={page === 1 || isLoading} 
            onClick={() => onPageChange(page - 1)}
            className="h-8 px-2"
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            disabled={page === totalPages || isLoading} 
            onClick={() => onPageChange(page + 1)}
            className="h-8 px-2"
          >
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};
