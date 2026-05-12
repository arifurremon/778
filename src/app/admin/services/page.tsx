"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Briefcase,
  Star,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  ShieldCheck,
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AdminService {
  id: string;
  profession: string;
  category: string;
  location: string;
  experienceYears: number;
  fee: string;
  rating: number;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    profileImage: string | null;
    isServiceProvider: boolean;
    serviceRegistrationStatus: string;
  };
}

interface ServicesResponse {
  services: AdminService[];
  total: number;
  page: number;
  totalPages: number;
}

const CATEGORIES = ["All", "Medical", "Legal", "Engineering", "Education", "Finance", "Technology", "Construction"];

export default function AdminServicesPage() {
  const [services, setServices] = useState<AdminService[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20", search, category });
      const res = await fetch(`/api/admin/services?${params.toString()}`);
      if (!res.ok) throw new Error();
      const data = await res.json() as ServicesResponse;
      setServices(data.services);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to load services." });
    } finally {
      setLoading(false);
    }
  }, [page, search, category]);

  useEffect(() => { void fetchServices(); }, [fetchServices]);
  useEffect(() => { const t = setTimeout(() => setPage(1), 400); return () => clearTimeout(t); }, [search]);

  const handleApprove = async (userId: string, approve: boolean) => {
    try {
      const res = await fetch(`/api/admin/verify/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: approve ? "approve" : "reject", type: "service" }),
      });
      if (!res.ok) throw new Error();
      toast({ title: approve ? "Expert Certified" : "Application Rejected" });
      void fetchServices();
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Action failed." });
    }
  };

  const CATEGORY_FILTERS = [
    { key: "category", label: "Category", options: CATEGORIES.map((c) => ({ value: c.toLowerCase() === "all" ? "all" : c, label: c })) },
  ];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-cyan-400 mb-2">
          <Briefcase size={12} />
          Service Management
        </div>
        <h1 className="text-2xl font-black tracking-tight">Expert Services</h1>
        <p className="text-sm text-muted-foreground mt-1">{total.toLocaleString()} service providers on the platform</p>
      </div>

      <div className="bg-card/40 border border-border/50 rounded-2xl p-4">
        <AdminTableToolbar
          search={search}
          onSearch={(v) => { setSearch(v); setPage(1); }}
          placeholder="Search by profession, category, or location..."
          filters={CATEGORY_FILTERS}
          activeFilters={{ category }}
          onFilter={(_, v) => { setCategory(v); setPage(1); }}
        />
      </div>

      <div className="bg-card/40 border border-border/50 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="divide-y divide-border/20">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-5">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        ) : services.length === 0 ? (
          <AdminEmptyState icon={<Briefcase size={40} />} title="No services found" />
        ) : (
          <div className="divide-y divide-border/20">
            {services.map((svc, i) => (
              <motion.div
                key={svc.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="flex flex-col md:flex-row md:items-center gap-4 px-5 py-5 hover:bg-muted/20 transition-colors"
              >
                {/* Provider */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <Avatar className="w-12 h-12 border border-border/30 shrink-0">
                    <AvatarImage src={svc.user.profileImage ?? ""} />
                    <AvatarFallback className="font-bold">{svc.user.name?.[0] ?? "E"}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold truncate">{svc.user.name ?? svc.user.email}</h3>
                      {svc.user.isServiceProvider && <ShieldCheck size={13} className="text-cyan-400 shrink-0" />}
                    </div>
                    <p className="text-xs font-semibold text-cyan-400/80">{svc.profession}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin size={9} /> {svc.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={9} /> {svc.experienceYears}y exp
                      </span>
                      <span className="flex items-center gap-1">
                        <Star size={9} className="text-amber-400" /> {svc.rating.toFixed(1)}
                      </span>
                      <span className="font-bold text-foreground">{svc.fee}</span>
                    </div>
                  </div>
                </div>

                {/* Category & Status */}
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge className="text-[9px] bg-cyan-400/10 text-cyan-400 border-cyan-400/20">{svc.category}</Badge>
                  <Badge
                    className={cn(
                      "text-[9px]",
                      svc.user.serviceRegistrationStatus === "APPROVED"
                        ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/20"
                        : svc.user.serviceRegistrationStatus === "PENDING"
                        ? "bg-blue-400/10 text-blue-400 border-blue-400/20"
                        : svc.user.serviceRegistrationStatus === "REJECTED"
                        ? "bg-destructive/10 text-destructive border-destructive/20"
                        : "bg-muted text-muted-foreground border-border"
                    )}
                  >
                    {svc.user.serviceRegistrationStatus}
                  </Badge>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {svc.user.serviceRegistrationStatus === "PENDING" && (
                    <>
                      <Button size="sm" onClick={() => void handleApprove(svc.user.id, true)}
                        className="h-7 text-[10px] font-bold bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg px-3">
                        <CheckCircle2 size={11} className="mr-1" /> Certify
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => void handleApprove(svc.user.id, false)}
                        className="h-7 text-[10px] text-destructive hover:bg-destructive/10 rounded-lg px-2">
                        <XCircle size={11} />
                      </Button>
                    </>
                  )}
                  {svc.user.serviceRegistrationStatus === "APPROVED" && (
                    <Button size="sm" variant="ghost" onClick={() => void handleApprove(svc.user.id, false)}
                      className="h-7 text-[10px] text-destructive hover:bg-destructive/10 rounded-lg px-2">
                      Revoke
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <div className="px-5 border-t border-border/30">
          <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} total={total} limit={20} />
        </div>
      </div>
    </div>
  );
}
