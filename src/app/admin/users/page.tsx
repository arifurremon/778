"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Users,
  ShieldCheck,
  Trash2,
  RotateCcw,
  MoreHorizontal,
  UserCheck,
  BadgeCheck,
} from "lucide-react";
import { AdminTableToolbar, AdminPagination, AdminEmptyState } from "@/components/admin/admin-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  username: string | null;
  profileImage: string | null;
  location: string | null;
  isAdmin: boolean;
  isVerified: boolean;
  isSeller: boolean;
  isServiceProvider: boolean;
  registrationStatus: string;
  serviceRegistrationStatus: string;
  verificationRequestStatus: string;
  deletedAt: string | null;
  emailVerified: string | null;
  createdAt: string;
  _count: { posts: number; comments: number };
}

interface UsersResponse {
  users: AdminUser[];
  total: number;
  page: number;
  totalPages: number;
}

const FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "verified", label: "Verified" },
  { value: "sellers", label: "Sellers" },
  { value: "experts", label: "Experts" },
  { value: "admins", label: "Admins" },
  { value: "deleted", label: "Deleted" },
];

const BULK_ACTIONS = [
  { label: "Verify", value: "verify" },
  { label: "Make Admin", value: "makeAdmin" },
  { label: "Remove Admin", value: "removeAdmin" },
  { label: "Soft Delete", value: "delete", variant: "destructive" as const },
  { label: "Restore", value: "restore" },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmAction, setConfirmAction] = useState<{ action: string; userId?: string } | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
        search,
        filter,
      });
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json() as UsersResponse;
      setUsers(data.users);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to load users." });
    } finally {
      setLoading(false);
    }
  }, [page, search, filter]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => { setPage(1); }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const handleBulkAction = async (action: string, userIds?: string[]) => {
    const ids = userIds ?? Array.from(selected);
    if (ids.length === 0) return;
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: ids, action }),
      });
      if (!res.ok) throw new Error("Action failed");
      toast({ title: "Success", description: `Action '${action}' applied to ${ids.length} user(s).` });
      setSelected(new Set());
      void fetchUsers();
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to perform action." });
    }
    setConfirmAction(null);
  };

  const handleSingleAction = async (action: string, userId: string) => {
    if (["delete", "makeAdmin", "removeAdmin"].includes(action)) {
      setConfirmAction({ action, userId });
    } else {
      await handleBulkAction(action, [userId]);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === users.length) setSelected(new Set());
    else setSelected(new Set(users.map((u) => u.id)));
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-violet-400 mb-2">
          <Users size={12} />
          User Management
        </div>
        <h1 className="text-2xl font-black tracking-tight">All Users</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {total.toLocaleString()} total users across the platform
        </p>
      </div>

      {/* Toolbar */}
      <div className="bg-card/40 border border-border/50 rounded-2xl p-4">
        <AdminTableToolbar
          search={search}
          onSearch={(v) => { setSearch(v); setPage(1); }}
          placeholder="Search by name, email, or username..."
          filters={[{ key: "filter", label: "Role", options: FILTER_OPTIONS }]}
          activeFilters={{ filter }}
          onFilter={(_, v) => { setFilter(v); setPage(1); }}
          selectedCount={selected.size}
          bulkActions={BULK_ACTIONS}
          onBulkAction={(a) => {
            if (["delete", "makeAdmin", "removeAdmin"].includes(a)) {
              setConfirmAction({ action: a });
            } else {
              void handleBulkAction(a);
            }
          }}
        />
      </div>

      {/* Table */}
      <div className="bg-card/40 border border-border/50 rounded-2xl overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-border/30 bg-muted/20">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={selected.size === users.length && users.length > 0}
              onChange={toggleAll}
              className="rounded"
            />
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">User</div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hidden md:block">Roles</div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hidden lg:block">Activity</div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Actions</div>
        </div>

        {loading ? (
          <div className="divide-y divide-border/20">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <Skeleton className="w-4 h-4 rounded" />
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <AdminEmptyState icon={<Users size={40} />} title="No users found" description="Try adjusting your search or filters." />
        ) : (
          <div className="divide-y divide-border/20">
            {users.map((user, i) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className={cn(
                  "grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 items-center px-5 py-4 hover:bg-muted/20 transition-colors",
                  selected.has(user.id) && "bg-primary/5",
                  user.deletedAt && "opacity-50"
                )}
              >
                {/* Checkbox */}
                <div>
                  <input
                    type="checkbox"
                    checked={selected.has(user.id)}
                    onChange={() => toggleSelect(user.id)}
                    className="rounded"
                  />
                </div>

                {/* User Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="w-9 h-9 border border-border/30 shrink-0">
                    <AvatarImage src={user.profileImage ?? ""} />
                    <AvatarFallback className="text-xs font-bold">
                      {user.name?.[0] ?? (user.email[0] ?? "U").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-bold truncate">{user.name ?? "—"}</p>
                      {user.isVerified && <BadgeCheck size={13} className="text-cyan-400 shrink-0" />}
                      {user.deletedAt && <Badge variant="destructive" className="text-[9px] px-1.5 py-0.5">Deleted</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    <p className="text-[10px] text-muted-foreground/60 truncate">
                      {user.username ? `@${user.username}` : "no username"} • {user.location ?? "no location"}
                    </p>
                  </div>
                </div>

                {/* Roles */}
                <div className="hidden md:flex flex-wrap gap-1 justify-end max-w-[160px]">
                  {user.isAdmin && <Badge className="text-[9px] px-1.5 py-0.5 bg-rose-500/10 text-rose-400 border-rose-500/20">Admin</Badge>}
                  {user.isSeller && <Badge className="text-[9px] px-1.5 py-0.5 bg-amber-500/10 text-amber-400 border-amber-500/20">Seller</Badge>}
                  {user.isServiceProvider && <Badge className="text-[9px] px-1.5 py-0.5 bg-cyan-500/10 text-cyan-400 border-cyan-500/20">Expert</Badge>}
                  {!user.isAdmin && !user.isSeller && !user.isServiceProvider && (
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0.5">User</Badge>
                  )}
                </div>

                {/* Activity */}
                <div className="hidden lg:flex flex-col items-end text-right">
                  <span className="text-xs font-bold">{user._count.posts} posts</span>
                  <span className="text-[10px] text-muted-foreground">{user._count.comments} comments</span>
                  <span className="text-[10px] text-muted-foreground/60">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                      <MoreHorizontal size={14} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44 rounded-xl">
                    <DropdownMenuItem onClick={() => void handleSingleAction("verify", user.id)} className="text-xs">
                      <UserCheck size={13} className="mr-2" />
                      {user.isVerified ? "Unverify" : "Verify User"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => void handleSingleAction(user.isAdmin ? "removeAdmin" : "makeAdmin", user.id)} className="text-xs">
                      <ShieldCheck size={13} className="mr-2" />
                      {user.isAdmin ? "Remove Admin" : "Make Admin"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {user.deletedAt ? (
                      <DropdownMenuItem onClick={() => void handleSingleAction("restore", user.id)} className="text-xs text-emerald-500">
                        <RotateCcw size={13} className="mr-2" />
                        Restore User
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={() => void handleSingleAction("delete", user.id)}
                        className="text-xs text-destructive focus:text-destructive"
                      >
                        <Trash2 size={13} className="mr-2" />
                        Soft Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="px-5 border-t border-border/30">
          <AdminPagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            total={total}
            limit={20}
          />
        </div>
      </div>

      {/* Confirm Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={(o) => !o && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to perform this action? This will affect{" "}
              {confirmAction?.userId ? "1 user" : `${selected.size} user(s)`}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmAction) {
                  void handleBulkAction(
                    confirmAction.action,
                    confirmAction.userId ? [confirmAction.userId] : undefined
                  );
                }
              }}
              className={confirmAction?.action === "delete" ? "bg-destructive hover:bg-destructive/90" : ""}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
