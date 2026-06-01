
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
    ArrowRight,
    MapPin,
    Pill,
    Refrigerator,
    Search,
    ShieldCheck,
    Shirt,
    ShoppingBag,
    Smartphone,
    Star,
    Store,
    Zap,
    Cpu,
    Flame,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type RealShop = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  location: string;
  trustScore: number;
  rating: number;
  isVerified: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    profileImage: string | null;
    isVerified: boolean;
  };
  _count: { products: number };
};

const SHOP_CATEGORY_FILTER: Record<string, string | null> = {
  all: null,
  flash: null,
  grocery: "Grocery",
  medicine: "Pharmacy",
  electronics: "Electronics",
  gadgets: "Electronics",
  clothes: "Fashion",
  appliances: "Home Decor",
  others: "Others",
};

function shopImageSrc(shop: RealShop): string {
  return (
    shop.user.profileImage ??
    "/city_background.png"
  );
}

export const CATEGORIES = [
  { id: 'all', name: 'All', icon: <ShoppingBag size={14} /> },
  { id: 'flash', name: 'Flash Sale', icon: <Flame size={14} className="text-orange-500" /> },
  { id: 'appliances', name: 'Home Appliances', icon: <Refrigerator size={14} /> },
  { id: 'grocery', name: 'Grocery', icon: <Store size={14} /> },
  { id: 'medicine', name: 'Medicine', icon: <Pill size={14} /> },
  { id: 'electronics', name: 'Electronics', icon: <Cpu size={14} /> },
  { id: 'gadgets', name: 'Gadgets', icon: <Smartphone size={14} /> },
  { id: 'clothes', name: 'Clothes', icon: <Shirt size={14} /> },
  { id: 'others', name: 'Others', icon: <ShoppingBag size={14} /> },
];

export default function MarketView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [shops, setShops] = useState<RealShop[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetch("/api/shops?limit=20")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load shops");
        return res.json() as Promise<{ shops: RealShop[] }>;
      })
      .then((data) => {
        if (!cancelled) setShops(data.shops ?? []);
      })
      .catch(() => {
        if (!cancelled) {
          toast({
            variant: "destructive",
            title: "Could not load marketplace",
            description: "Please try again in a moment.",
          });
          setShops([]);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredShops = useMemo(() => {
    return shops.filter((shop) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        shop.name.toLowerCase().includes(q) ||
        shop.category.toLowerCase().includes(q) ||
        (shop.description?.toLowerCase().includes(q) ?? false);

      if (!matchesSearch) return false;
      if (activeCategory === "all") return true;
      if (activeCategory === "flash") return shop.isVerified && shop.rating >= 4;
      const mapped = SHOP_CATEGORY_FILTER[activeCategory];
      return mapped ? shop.category === mapped : true;
    });
  }, [shops, searchQuery, activeCategory]);

  const topShops = useMemo(() => {
    return [...shops]
      .filter((s) => s.isVerified)
      .sort((a, b) => b.rating - a.rating || b.trustScore - a.trustScore)
      .slice(0, 6);
  }, [shops]);

  if (!isLoading && shops.length === 0) {
    return (
      <div className="max-w-6xl mx-auto py-8 px-6">
        <div className="text-center py-32 bg-card/20 border-2 border-dashed border-border/40 rounded-[3rem]">
          <Store className="w-16 h-16 text-muted-foreground/20 mx-auto mb-6" />
          <h3 className="text-2xl font-bold">No shops registered yet — be the first!</h3>
          <p className="text-muted-foreground text-sm mt-2 max-w-sm mx-auto leading-relaxed font-bold">
            Launch your business on The Chattala marketplace and reach neighbours across Chittagong.
          </p>
          <Link href="/register-shop" className="inline-block mt-8">
            <Button className="bg-primary hover:bg-primary/90 rounded-xl h-11 px-8 font-bold text-xs uppercase tracking-widest">
              Register Your Shop
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-6 space-y-12">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2 text-left">
          <div className="flex items-center gap-2 text-accent font-bold uppercase tracking-[0.2em] text-[10px]">
            <MapPin size={12} /> Hyperlocal Marketplace
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Explore <span className="text-accent">Chattala Marketplace</span>
          </h1>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest opacity-60">
            Premium products from verified local vendors
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search products or shops..."
              className="pl-10 bg-card/20 border-border/50 h-11 focus:ring-accent rounded-xl font-bold"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Link href="/register-shop">
            <Button className="bg-primary hover:bg-primary/90 rounded-xl h-11 px-6 font-bold text-xs uppercase tracking-widest transition-smooth shadow-lg shadow-primary/20 w-full sm:w-auto">
              <Store size={16} className="mr-2" /> Merchant Account
            </Button>
          </Link>
        </div>
      </section>

      <section className="relative">
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Categories</h3>
        </div>
        <div className="flex overflow-x-auto gap-3 pb-4 scrollbar-hide snap-x snap-mandatory">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "flex items-center gap-2.5 px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest whitespace-nowrap border transition-all duration-300 snap-start",
                activeCategory === cat.id
                  ? "bg-accent border-accent text-accent-foreground shadow-lg shadow-accent/20 scale-105"
                  : "bg-card/40 border-border/50 text-muted-foreground hover:border-accent/40 hover:text-foreground"
              )}
            >
              {cat.icon}
              {cat.name}
            </button>
          ))}
        </div>
        <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none" />
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
            <Zap size={14} className="text-amber-500 fill-amber-500" />
            Top Shops
          </h3>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-3xl" />
            ))}
          </div>
        ) : topShops.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {topShops.map((shop) => (
              <TopShopCard key={shop.id} shop={shop} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground font-bold px-2">No verified shops yet.</p>
        )}
      </section>

      {activeCategory === "all" && !searchQuery && (
        <section className="space-y-6 pt-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              Verified Local Shops
            </h3>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-80 rounded-[2.5rem]" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence mode="popLayout">
                {filteredShops.map((shop, idx) => (
                  <ShopCard key={shop.id} shop={shop} idx={idx} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>
      )}

      {(activeCategory !== "all" || searchQuery) && !isLoading && (
        <section className="space-y-6 pt-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              Matching Shops
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredShops.map((shop, idx) => (
                <ShopCard key={shop.id} shop={shop} idx={idx} />
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      {!isLoading && filteredShops.length === 0 && shops.length > 0 && (
        <div className="text-center py-32 bg-card/20 border-2 border-dashed border-border/40 rounded-[3rem]">
          <ShoppingBag className="w-16 h-16 text-muted-foreground/20 mx-auto mb-6" />
          <h3 className="text-2xl font-bold">No results found</h3>
          <p className="text-muted-foreground text-sm mt-2 max-w-sm mx-auto leading-relaxed font-bold">
            Try adjusting your search query or switching categories to find local businesses in Chittagong.
          </p>
          <Button
            variant="link"
            className="text-accent font-black uppercase tracking-[0.2em] text-[10px] mt-8"
            onClick={() => {
              setActiveCategory("all");
              setSearchQuery("");
            }}
          >
            Clear All Filters
          </Button>
        </div>
      )}

      <div className="h-20" />
    </div>
  );
}

function TopShopCard({ shop }: { shop: RealShop }) {
  return (
    <Link href={`/shops/${shop.id}`}>
      <motion.div
        whileHover={{ y: -5 }}
        className="bg-card border border-border/50 rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col group cursor-pointer h-full"
      >
        <div className="relative aspect-square">
          <Image src={shopImageSrc(shop)} alt={shop.name} fill className="object-cover" />
          <Badge className="absolute top-2 left-2 bg-emerald-600/90 text-white border-0 text-[8px] font-black uppercase tracking-tighter rounded-md">
            Verified
          </Badge>
        </div>
        <div className="p-3.5 space-y-1 flex-1 flex flex-col text-left">
          <h4 className="text-xs font-bold truncate group-hover:text-accent transition-colors">{shop.name}</h4>
          <div className="flex items-center gap-1 text-[10px] font-black text-accent">
            <Star size={10} className="fill-accent" /> {shop.rating.toFixed(1)}
          </div>
          <span className="text-[8px] font-black uppercase text-muted-foreground flex items-center gap-1 pt-1">
            <MapPin size={8} className="text-accent" /> {shop.location}
          </span>
          <span className="text-[8px] text-muted-foreground font-bold">
            {shop._count.products} product{shop._count.products !== 1 ? "s" : ""}
          </span>
        </div>
      </motion.div>
    </Link>
  );
}

function ShopCard({ shop, idx }: { shop: RealShop; idx: number }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.4, delay: idx * 0.05 }}
      className="bg-card border border-border/60 rounded-[2.5rem] overflow-hidden hover:bg-card/80 hover:border-accent/30 transition-all duration-500 group h-full flex flex-col shadow-sm hover:shadow-2xl"
    >
      <Link href={`/shops/${shop.id}`} className="flex flex-col h-full">
        <div className="relative h-56 overflow-hidden">
          <Image src={shopImageSrc(shop)} alt={shop.name} fill className="object-cover transition-transform duration-1000 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute top-5 left-5">
            <Badge className="bg-black/60 backdrop-blur-md text-accent border border-white/10 font-black text-[9px] uppercase tracking-widest px-3 py-1">
              {shop.category}
            </Badge>
          </div>
        </div>

        <div className="p-8 flex-1 flex flex-col text-left">
          <div className="flex items-start justify-between mb-4">
            <h4 className="text-xl font-bold tracking-tight text-foreground group-hover:text-accent transition-colors">
              {shop.name}
            </h4>
            <div className="flex items-center gap-1.5 text-emerald-400 font-black text-[10px] bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20 shadow-sm">
              <ShieldCheck size={12} /> {shop.trustScore}% Trust
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground uppercase tracking-widest font-black opacity-60 mb-8">
            <span className="flex items-center gap-1.5">
              <MapPin size={12} className="text-primary" /> {shop.location}
            </span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span className="flex items-center gap-1.5">
              <Star size={12} className="fill-accent text-accent" /> {shop.rating.toFixed(1)}
            </span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span>{shop._count.products} products</span>
          </div>

          <div className="mt-auto pt-6 border-t border-border/10 flex gap-3">
            <Button variant="outline" className="flex-1 rounded-2xl border-border/50 hover:bg-white/5 font-black text-[10px] uppercase tracking-widest h-12 transition-all">
              Visit Shop
            </Button>
            <div className="h-12 w-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-all">
              <ArrowRight size={20} />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
