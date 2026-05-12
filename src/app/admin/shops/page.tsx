"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Store, 
  Search, 
  Filter, 
  ShieldCheck, 
  XCircle, 
  Trash2, 
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Package,
  User,
  ExternalLink,
  Ban,
  Mail,
  Calendar
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

import { StatusBadge } from '@/components/admin/display/StatusBadge';
import { ConfirmationDialog } from '@/components/admin/actions/ConfirmationDialog';
import { FilterPanel } from '@/components/admin/forms/FilterPanel';
import { SearchBar } from '@/components/admin/forms/SearchBar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AdminShop {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  address: string | null;
  phone: string | null;
  logo: string | null;
  isVerified: boolean;
  verifiedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  owner: { id: string; name: string; email: string; profileImage: string | null };
  _count: { products: number };
}

export default function AdminShopsPage() {
  const router = useRouter();
  const [shops, setShops] = useState<AdminShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  
  // Filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });

  // Dialogs
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean, id: string | null }>({ open: false, id: null });
  const [confirmVerify, setConfirmVerify] = useState<{ open: boolean, id: string | null }>({ open: false, id: null });

  const fetchShops = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        search,
        category,
        status,
        from: dateRange.from,
        to: dateRange.to
      });
      const res = await fetch(`/api/admin/shops?${params.toString()}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setShops(data.shops);
      setTotalCount(data.total);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to load shops." });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, category, status, dateRange]);

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/shops/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast({ title: "Deleted", description: "Shop removed successfully." });
      fetchShops();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete shop." });
    } finally {
      setConfirmDelete({ open: false, id: null });
    }
  };

  const handleVerify = async (id: string, approve: boolean) => {
    try {
      const res = await fetch(`/api/admin/shops/${id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: approve ? 'approve' : 'reject' })
      });
      if (!res.ok) throw new Error();
      toast({ title: approve ? "Verified" : "Rejected", description: `Shop ${approve ? 'verified' : 'rejected'} successfully.` });
      fetchShops();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Update failed." });
    } finally {
      setConfirmVerify({ open: false, id: null });
    }
  };

  const getStatus = (shop: AdminShop) => {
    if (shop.isVerified) return 'active';
    if (shop.rejectedAt) return 'rejected';
    return 'pending';
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-2">
            <Store size={12} />
            Marketplace Management
          </div>
          <h1 className="text-3xl font-black tracking-tight">Active Shops</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage verified and unverified sellers on the platform</p>
        </div>
        <Button variant="outline" size="sm" asChild className="rounded-full border-primary/20">
          <Link href="/admin/shops/pending-verification" className="gap-2">
            <Badge variant="secondary" className="h-5 px-1 bg-amber-500/10 text-amber-600">!</Badge>
            Verification Queue
          </Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <SearchBar 
          value={search} 
          onChange={setSearch} 
          placeholder="Search by shop name or owner..." 
          className="flex-1"
        />
        <FilterPanel activeCount={0} onReset={() => {}} onApply={fetchShops}>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-background border rounded-lg p-2 text-sm">
                <option value="all">All Categories</option>
                <option value="electronics">Electronics</option>
                <option value="clothing">Clothing</option>
                <option value="grocery">Grocery</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-background border rounded-lg p-2 text-sm">
                <option value="all">All Status</option>
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </FilterPanel>
      </div>

      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-xl shadow-black/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-muted/30 text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50">
              <tr>
                <th className="px-6 py-4">Shop</th>
                <th className="px-6 py-4">Owner Info</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Products</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-8"><div className="h-4 bg-muted rounded w-full" /></td>
                  </tr>
                ))
              ) : (
                shops.map((shop) => (
                  <tr key={shop.id} className="group hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-10 h-10 rounded-xl border border-border/50 shadow-sm">
                          <AvatarImage src={shop.logo || ""} />
                          <AvatarFallback className="font-bold text-lg bg-primary/10 text-primary">{shop.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold tracking-tight">{shop.name}</span>
                          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">{shop.category || 'General'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-6 h-6 rounded-full">
                          <AvatarImage src={shop.owner.profileImage || ""} />
                          <AvatarFallback className="text-[8px]">{shop.owner.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold">{shop.owner.name}</span>
                          <span className="text-[10px] text-muted-foreground">{shop.owner.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={getStatus(shop)} className="text-[10px]" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant="outline" className="text-[10px] font-bold gap-1 bg-muted/50 border-border/50">
                        <Package size={10} className="text-primary" />
                        {shop._count.products}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-muted-foreground">
                      {format(new Date(shop.createdAt), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal size={14} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 rounded-xl">
                          <DropdownMenuItem onClick={() => router.push(`/admin/shops/${shop.id}`)}>
                            <ExternalLink size={14} className="mr-2" /> View Details
                          </DropdownMenuItem>
                          {!shop.isVerified && (
                            <DropdownMenuItem onClick={() => handleVerify(shop.id, true)}>
                              <ShieldCheck size={14} className="mr-2 text-emerald-500" /> Verify Shop
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-destructive" onClick={() => setConfirmDelete({ open: true, id: shop.id })}>
                            <Trash2 size={14} className="mr-2" /> Delete Shop
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-border/50 flex items-center justify-between bg-muted/10">
          <p className="text-xs font-medium text-muted-foreground">Showing <span className="text-foreground">{shops.length}</span> of <span className="text-foreground">{totalCount}</span> shops</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="h-8 rounded-lg">
              <ChevronLeft size={14} className="mr-1" /> Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="h-8 rounded-lg">
              Next <ChevronRight size={14} className="ml-1" />
            </Button>
          </div>
        </div>
      </div>

      <ConfirmationDialog 
        open={confirmDelete.open}
        onOpenChange={(o) => setConfirmDelete({ open: o, id: o ? confirmDelete.id : null })}
        onConfirm={() => confirmDelete.id && handleDelete(confirmDelete.id)}
        title="Permanently Delete Shop?"
        description="This will remove the shop profile and all its listed products. This action cannot be undone."
      />
    </div>
  );
}
