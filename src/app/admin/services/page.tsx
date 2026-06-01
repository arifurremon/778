"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, 
  Search, 
  Filter, 
  ShieldCheck, 
  XCircle, 
  Trash2, 
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  MapPin,
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

interface AdminService {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  serviceAreas: string[];
  pricing: string | null;
  isVerified: boolean;
  verifiedAt: Date | null;
  rejectedAt: Date | null;
  rejectionReason: string | null;
  createdAt: Date;
  provider: { id: string; name: string; email: string; profileImage: string | null };
  _count: { bookings: number };
}

export default function AdminServicesPage() {
  const router = useRouter();
  const [services, setServices] = useState<AdminService[]>([]);
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

  const fetchServices = useCallback(async () => {
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
      const res = await fetch(`/api/admin/services?${params.toString()}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setServices(data.services);
      setTotalCount(data.total);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to load services." });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, category, status, dateRange]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleDelete = async (id: string) => {
    try {
      const { adminApi } = await import("@/lib/admin-api");
      await adminApi.del(`/api/admin/services/${id}`);
      toast({ title: "Deleted", description: "Service removed successfully." });
      fetchServices();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete service." });
    } finally {
      setConfirmDelete({ open: false, id: null });
    }
  };

  const handleVerify = async (id: string, approve: boolean) => {
    try {
      const { adminApi } = await import("@/lib/admin-api");
      await adminApi.post(`/api/admin/services/${id}/verify`, {
        action: approve ? "approve" : "reject",
      });
      toast({ title: approve ? "Verified" : "Rejected", description: `Service ${approve ? 'verified' : 'rejected'} successfully.` });
      fetchServices();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Update failed." });
    } finally {
      setConfirmVerify({ open: false, id: null });
    }
  };

  const getStatus = (service: AdminService) => {
    if (service.isVerified) return 'active';
    if (service.rejectedAt) return 'rejected';
    return 'pending';
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-2">
            <Briefcase size={12} />
            Services Management
          </div>
          <h1 className="text-3xl font-black tracking-tight">Active Providers</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage verified and unverified service providers on the platform</p>
        </div>
        <Button variant="outline" size="sm" asChild className="rounded-full border-primary/20">
          <Link href="/admin/services/pending-verification" className="gap-2">
            <Badge variant="secondary" className="h-5 px-1 bg-amber-500/10 text-amber-600">!</Badge>
            Verification Queue
          </Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <SearchBar 
          value={search} 
          onChange={setSearch} 
          placeholder="Search by service title or provider..." 
          className="flex-1"
        />
        <FilterPanel activeCount={0} onReset={() => {}} onApply={fetchServices}>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-background border rounded-lg p-2 text-sm">
                <option value="all">All Categories</option>
                <option value="home">Home Services</option>
                <option value="education">Education & Tutors</option>
                <option value="health">Health & Wellness</option>
                <option value="tech">Tech Support</option>
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
                <th className="px-6 py-4">Service</th>
                <th className="px-6 py-4">Provider Info</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Service Areas</th>
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
                services.map((service) => (
                  <tr key={service.id} className="group hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl border border-border/50 shadow-sm flex items-center justify-center bg-primary/10 text-primary">
                          <Briefcase size={20} />
                        </div>
                        <div className="flex flex-col max-w-[200px]">
                          <span className="text-sm font-bold tracking-tight truncate">{service.title}</span>
                          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest truncate">{service.category || 'General'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-6 h-6 rounded-full">
                          <AvatarImage src={service.provider.profileImage || ""} />
                          <AvatarFallback className="text-[8px]">{service.provider.name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold">{service.provider.name}</span>
                          <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">{service.provider.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={getStatus(service)} className="text-[10px]" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant="outline" className="text-[10px] font-bold bg-muted/50 border-border/50 max-w-[150px] truncate block mx-auto">
                        {service.serviceAreas && service.serviceAreas.length > 0 ? service.serviceAreas.join(', ') : 'Not specified'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-muted-foreground">
                      {format(new Date(service.createdAt), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal size={14} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 rounded-xl">
                          <DropdownMenuItem onClick={() => router.push(`/admin/services/${service.id}`)}>
                            <ExternalLink size={14} className="mr-2" /> View Details
                          </DropdownMenuItem>
                          {!service.isVerified && (
                            <DropdownMenuItem onClick={() => handleVerify(service.id, true)}>
                              <ShieldCheck size={14} className="mr-2 text-emerald-500" /> Verify Provider
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-destructive" onClick={() => setConfirmDelete({ open: true, id: service.id })}>
                            <Trash2 size={14} className="mr-2" /> Delete Provider
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
          <p className="text-xs font-medium text-muted-foreground">Showing <span className="text-foreground">{services.length}</span> of <span className="text-foreground">{totalCount}</span> services</p>
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
        title="Permanently Delete Service?"
        description="This will remove the service provider profile and all their active bookings. This action cannot be undone."
      />
    </div>
  );
}
