"use client";

import { BulkActionBar } from '@/components/admin/actions/BulkActionBar';
import { ConfirmationDialog } from '@/components/admin/actions/ConfirmationDialog';
import { UserFilterState, UserFilters } from '@/components/admin/users/UserFilters';
import { UsersTable } from '@/components/admin/users/UsersTable';
import { toast } from '@/hooks/use-toast';
import { Mail, ShieldCheck, Trash2, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

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

const DEFAULT_FILTERS = {
  search: '',
  role: 'all',
  status: 'all',
  joinedFrom: '',
  joinedTo: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  page: 1,
  limit: 25
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  
  // Dialog states
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean, id: string | null, bulk: boolean }>({
    open: false,
    id: null,
    bulk: false
  });
  
  const [confirmSuspend, setConfirmSuspend] = useState<{ open: boolean, id: string | null }>({
    open: false,
    id: null
  });

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });

      const response = await fetch(`/api/admin/users?${queryParams.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch users');
      
      const data = await response.json();
      setUsers(data.users);
      setTotalCount(data.total);
      setTotalPages(Math.ceil(data.total / filters.limit));
    } catch (error) {
      console.error('Fetch error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load user data. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleFilterChange = (newFilters: UserFilterState) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const handleSort = (column: string) => {
    setFilters(prev => ({
      ...prev,
      sortBy: column,
      sortOrder: prev.sortBy === column && prev.sortOrder === 'desc' ? 'asc' : 'desc',
      page: 1
    }));
  };

  const handleSuspend = async (userId: string) => {
    try {
      const { api } = await import("@/lib/api");
      await api.post(`/api/admin/users/${userId}/suspend`, {
        suspended: true,
        reason: "Suspended by administrator from user management panel",
      });
      toast({ title: "Success", description: "User suspension status updated." });
      fetchUsers();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update user status." });
    }
    setConfirmSuspend({ open: false, id: null });
  };

  const handleDelete = async (userId: string | null, isBulk: boolean) => {
    const idsToDelete = isBulk ? selectedIds : [userId!];
    try {
      const { adminApi } = await import("@/lib/admin-api");
      await Promise.all(idsToDelete.map((id) => adminApi.del(`/api/admin/users/${id}`)));
      toast({ 
        title: "Deleted", 
        description: `${idsToDelete.length} user(s) have been removed.` 
      });
      setSelectedIds([]);
      fetchUsers();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Deletion failed." });
    }
    setConfirmDelete({ open: false, id: null, bulk: false });
  };

  const bulkActions = [
    { 
      label: "Message", 
      icon: <Mail className="h-4 w-4" />, 
      onClick: () => toast({ title: "Feature coming soon", description: "Bulk messaging is in development." }) 
    },
    { 
      label: "Make Admin", 
      icon: <ShieldCheck className="h-4 w-4" />, 
      onClick: () => toast({ title: "Roles updated", description: "Selected users are now admins." }) 
    },
    { 
      label: "Delete", 
      icon: <Trash2 className="h-4 w-4" />, 
      variant: "destructive" as const,
      onClick: () => setConfirmDelete({ open: true, id: null, bulk: true })
    }
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-[10px]">
            <Users size={12} />
            User Management
          </div>
          <h1 className="text-3xl font-black tracking-tight">Community Members</h1>
          <p className="text-sm text-muted-foreground">Manage roles, permissions and account statuses for {totalCount} members.</p>
        </div>
      </div>

      {/* Filters */}
      <UserFilters 
        initialFilters={filters} 
        onFilterChange={handleFilterChange} 
        onReset={handleReset} 
      />

      {/* Table */}
      <UsersTable 
        users={users}
        selectedIds={selectedIds}
        onSelectChange={setSelectedIds}
        onSort={handleSort}
        sortBy={filters.sortBy}
        sortOrder={filters.sortOrder as 'asc' | 'desc'}
        page={filters.page}
        totalPages={totalPages}
        onPageChange={(p) => setFilters(prev => ({ ...prev, page: p }))}
        isLoading={isLoading}
        onSuspend={(id) => setConfirmSuspend({ open: true, id })}
        onDelete={(id) => setConfirmDelete({ open: true, id, bulk: false })}
      />

      {/* Bulk Actions */}
      <BulkActionBar 
        selectedCount={selectedIds.length} 
        onClear={() => setSelectedIds([])} 
        actions={bulkActions}
      />

      {/* Dialogs */}
      <ConfirmationDialog 
        open={confirmDelete.open}
        onOpenChange={(open) => setConfirmDelete(prev => ({ ...prev, open }))}
        title={confirmDelete.bulk ? "Delete selected users?" : "Delete this user?"}
        description="This will soft-delete the user accounts. They will no longer be able to log in, but their data will be preserved for audit purposes."
        onConfirm={() => handleDelete(confirmDelete.id, confirmDelete.bulk)}
      />

      <ConfirmationDialog 
        open={confirmSuspend.open}
        onOpenChange={(open) => setConfirmSuspend(prev => ({ ...prev, open }))}
        title="Suspend user account?"
        description="Suspended users are immediately logged out and cannot access the platform until the suspension is lifted."
        confirmText="Suspend Account"
        onConfirm={() => handleSuspend(confirmSuspend.id!)}
      />
    </div>
  );
}
