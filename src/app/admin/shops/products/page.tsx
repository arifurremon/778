"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Package,
  Store,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  BadgeCheck,
  MoreHorizontal,
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

interface AdminProduct {
  id: string;
  name: string;
  description: string;
  price: string;
  originalPrice: string | null;
  images: string[];
  inStock: boolean;
  category: string;
  createdAt: string;
  shop: {
    id: string;
    name: string;
    isVerified: boolean;
    user: { id: string; name: string | null; email: string; profileImage: string | null };
  };
}

interface ProductsResponse {
  products: AdminProduct[];
  total: number;
  page: number;
  totalPages: number;
}

const STOCK_FILTERS = [
  { key: "inStock", label: "Stock", options: [
    { value: "", label: "All" },
    { value: "true", label: "In Stock" },
    { value: "false", label: "Out of Stock" },
  ]},
];

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [inStock, setInStock] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20", search });
      if (inStock) params.set("inStock", inStock);
      const res = await fetch(`/api/admin/products?${params.toString()}`);
      if (!res.ok) throw new Error();
      const data = await res.json() as ProductsResponse;
      setProducts(data.products);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to load products." });
    } finally {
      setLoading(false);
    }
  }, [page, search, inStock]);

  useEffect(() => { void fetchProducts(); }, [fetchProducts]);
  useEffect(() => { const t = setTimeout(() => setPage(1), 400); return () => clearTimeout(t); }, [search]);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-2">
          <Package size={12} />
          Marketplace
        </div>
        <h1 className="text-2xl font-black tracking-tight">All Products</h1>
        <p className="text-sm text-muted-foreground mt-1">{total.toLocaleString()} products across all shops</p>
      </div>

      <div className="bg-card/40 border border-border/50 rounded-2xl p-4">
        <AdminTableToolbar
          search={search}
          onSearch={(v) => { setSearch(v); setPage(1); }}
          placeholder="Search by name, category, or description..."
          filters={STOCK_FILTERS}
          activeFilters={{ inStock }}
          onFilter={(_, v) => { setInStock(v); setPage(1); }}
        />
      </div>

      <div className="bg-card/40 border border-border/50 rounded-2xl overflow-hidden">
        <div className="hidden md:grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-border/30 bg-muted/20">
          <div />
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Product</div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Shop</div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">Stock</div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">Price</div>
        </div>

        {loading ? (
          <div className="divide-y divide-border/20">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <AdminEmptyState icon={<Package size={40} />} title="No products found" description="Try adjusting your search or filters." />
        ) : (
          <div className="divide-y divide-border/20">
            {products.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto_auto_auto] gap-4 items-center px-5 py-4 hover:bg-muted/20 transition-colors"
              >
                {/* Image */}
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted/40 shrink-0">
                  {product.images[0] ? (
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Package size={16} />
                    </div>
                  )}
                </div>

                {/* Name & category */}
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{product.category}</p>
                  <p className="text-[10px] text-muted-foreground/60 truncate line-clamp-1">{product.description}</p>
                </div>

                {/* Shop */}
                <Link href={`/admin/shops/${product.shop.id}`} className="hidden md:flex items-center gap-2 group">
                  <Avatar className="w-6 h-6 shrink-0">
                    <AvatarImage src={product.shop.user.profileImage ?? ""} />
                    <AvatarFallback className="text-[9px] font-bold">{product.shop.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold group-hover:text-primary transition-colors">{product.shop.name}</span>
                      {product.shop.isVerified && <ShieldCheck size={9} className="text-amber-400" />}
                    </div>
                  </div>
                </Link>

                {/* Stock */}
                <div className="hidden md:flex justify-center">
                  <Badge className={cn("text-[9px] px-2 py-0.5", product.inStock ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/20" : "bg-destructive/10 text-destructive border-destructive/20")}>
                    {product.inStock ? "In Stock" : "Out of Stock"}
                  </Badge>
                </div>

                {/* Price */}
                <div className="hidden md:block text-right">
                  <p className="text-sm font-black text-primary">{product.price}</p>
                  {product.originalPrice && (
                    <p className="text-[10px] text-muted-foreground line-through">{product.originalPrice}</p>
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
