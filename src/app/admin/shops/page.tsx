"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Store,
  CheckCircle2,
  XCircle,
  Star,
  Package,
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

interface AdminShop {
  id: string;
  name: string;
  description: string;
  category: string;
  location: string;
  trustScore: number;
  rating: number;
  isVerified: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    profileImage: string | null;
    registrationStatus: string;
  };
  _count: { products: number };
}

interface ShopsResponse {
  shops: AdminShop[];
  total: number;
  page: number;
  totalPages: number;
}

const VERIFICATION_FILTERS = [
  { key: "verified", label: "Status", options: [
    { value: "", label: "All" },
    { value: "true", label: "Verified" },
    { value: "false", label: "Unverified" },
  ]},
];

export default function AdminShopsPage() {
  const [shops, setShops] = useState<AdminShop[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [verified, setVerified] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchShops = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20", search });
      if (verified) params.set("verified", verified);
      const res = await fetch(`/api/admin/shops?${params.toString()}`);
      if (!res.ok) throw new Error();
      const data = await res.json() as ShopsResponse;
      setShops(data.shops);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to load shops." });
    } finally {
      setLoading(false);
    }
  }, [page, search, verified]);

  useEffect(() => { void fetchShops(); }, [fetchShops]);
  useEffect(() => { const t = setTimeout(() => setPage(1), 400); return () => clearTimeout(t); }, [search]);

  const handleVerify = async (shopId: string, userId: string, approve: boolean) => {
    try {
      const res = await fetch(`/api/admin/verify/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: approve ? "approve" : "reject", type: "shop" }),
      });
      if (!res.ok) throw new Error();
      toast({ title: approve ? "Shop Verified" : "Shop Rejected", description: approve ? "Shop is now listed as verified." : "Shop verification rejected." });
      void fetchShops();
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to update shop." });
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-2">
          <Store size={12} />
          Shop Management
        </div>
        <h1 className="text-2xl font-black tracking-tight">All Shops</h1>
        <p className="text-sm text-muted-foreground mt-1">{total.toLocaleString()} shops on the marketplace</p>
      </div>

      <div className="bg-card/40 border border-border/50 rounded-2xl p-4">
        <AdminTableToolbar
          search={search}
          onSearch={(v) => { setSearch(v); setPage(1); }}
          placeholder="Search by name, category, or location..."
          filters={VERIFICATION_FILTERS}
          activeFilters={{ verified }}
          onFilter={(_, v) => { setVerified(v); setPage(1); }}
        />
      </div>

      <div className="bg-card/40 border border-border/50 rounded-2xl overflow-hidden">
        <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-border/30 bg-muted/20">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Shop</div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">Stats</div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">Status</div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">Actions</div>
        </div>

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
        ) : shops.length === 0 ? (
          <AdminEmptyState icon={<Store size={40} />} title="No shops found" description="Try adjusting your search or filters." />
        ) : (
          <div className="divide-y divide-border/20">
            {shops.map((shop, i) => (
              <motion.div
                key={shop.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-5 py-4 hover:bg-muted/20 transition-colors"
              >
                {/* Shop Info */}
                <div className="flex items-center gap-4 min-w-0">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black shrink-0",
                    shop.isVerified ? "bg-amber-400/10 text-amber-400" : "bg-muted text-muted-foreground"
                  )}>
                    {shop.name[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold">{shop.name}</h3>
                      {shop.isVerified && <ShieldCheck size={13} className="text-amber-400" />}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{shop.category} • {shop.location}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Avatar className="w-4 h-4">
                        <AvatarImage src={shop.user.profileImage ?? ""} />
                        <AvatarFallback className="text-[8px]">{shop.user.name?.[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-[10px] text-muted-foreground">{shop.user.name ?? shop.user.email}</span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="hidden md:flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1 text-xs font-bold">
                    <Star size={11} className="text-amber-400 fill-amber-400" />
                    {shop.rating.toFixed(1)}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Package size={10} />
                    {shop._count.products} products
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Trust: {shop.trustScore}
                  </div>
                </div>

                {/* Status */}
                <div className="hidden md:flex justify-center">
                  <Badge
                    className={cn(
                      "text-[9px] px-2 py-0.5",
                      shop.isVerified
                        ? "bg-amber-400/10 text-amber-400 border-amber-400/20"
                        : shop.user.registrationStatus === "PENDING"
                        ? "bg-blue-400/10 text-blue-400 border-blue-400/20"
                        : "bg-muted text-muted-foreground border-border"
                    )}
                  >
                    {shop.isVerified ? "Verified" : shop.user.registrationStatus === "PENDING" ? "Pending" : "Unverified"}
                  </Badge>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 justify-end md:justify-center">
                  {!shop.isVerified && shop.user.registrationStatus === "PENDING" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => void handleVerify(shop.id, shop.user.id, true)}
                        className="h-7 text-[10px] font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg px-3"
                      >
                        <CheckCircle2 size={11} className="mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => void handleVerify(shop.id, shop.user.id, false)}
                        className="h-7 text-[10px] font-bold text-destructive hover:bg-destructive/10 rounded-lg px-2"
                      >
                        <XCircle size={11} />
                      </Button>
                    </>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg">
                        <MoreHorizontal size={13} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 rounded-xl">
                      <DropdownMenuItem
                        onClick={() => void handleVerify(shop.id, shop.user.id, !shop.isVerified)}
                        className="text-xs"
                      >
                        <ShieldCheck size={12} className="mr-2" />
                        {shop.isVerified ? "Revoke Verification" : "Verify Shop"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
