
"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  ShoppingBag, 
  Star, 
  MapPin, 
  ChevronRight, 
  Store,
  Utensils,
  Cpu,
  Pill,
  Shirt,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Flame,
  Smartphone,
  Watch,
  Refrigerator,
  Zap
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from "@/components/ui/carousel";
import Image from "next/image";
import Link from "next/link";
import { MOCK_SHOPS, MOCK_PRODUCTS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

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

  const filteredShops = useMemo(() => {
    return MOCK_SHOPS.filter(shop => {
      const matchesSearch = shop.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === "all" || shop.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  const discoveryProducts = useMemo(() => {
    // Show products relevant to active category or all
    const baseProducts = activeCategory === 'all' 
      ? MOCK_PRODUCTS 
      : MOCK_PRODUCTS.filter(p => p.category.toLowerCase() === activeCategory || p.type === activeCategory);
    
    return [...baseProducts].sort(() => Math.random() - 0.5);
  }, [activeCategory]);

  return (
    <div className="max-w-6xl mx-auto py-8 px-6 space-y-12">
      {/* Header Section */}
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

      {/* Horizontal Category Swiper */}
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
                ? 'bg-accent border-accent text-accent-foreground shadow-lg shadow-accent/20 scale-105' 
                : 'bg-card/40 border-border/50 text-muted-foreground hover:border-accent/40 hover:text-foreground'
              )}
            >
              {cat.icon}
              {cat.name}
            </button>
          ))}
        </div>
        <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none" />
      </section>

      {/* Discovery Feed */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
            <Zap size={14} className="text-amber-500 fill-amber-500" /> 
            {activeCategory === 'all' ? 'Recommended For You' : `Trending in ${activeCategory}`}
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {discoveryProducts.slice(0, activeCategory === 'all' ? 10 : 25).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Shop Hub Bento Grid - Only show if not filtered by product search significantly or on 'All' */}
      {activeCategory === 'all' && !searchQuery && (
        <section className="space-y-6 pt-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Verified Local Shops</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredShops.map((shop, idx) => (
                <motion.div
                  key={shop.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  className="bg-card border border-border/60 rounded-[2.5rem] overflow-hidden hover:bg-card/80 hover:border-accent/30 transition-all duration-500 group h-full flex flex-col shadow-sm hover:shadow-2xl"
                >
                  <Link href={`/shops/${shop.id}`} className="flex flex-col h-full">
                    <div className="relative h-56 overflow-hidden">
                      <Image src={shop.image} alt={shop.name} fill className="object-cover transition-transform duration-1000 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="absolute top-5 left-5">
                        <Badge className="bg-black/60 backdrop-blur-md text-accent border border-white/10 font-black text-[9px] uppercase tracking-widest px-3 py-1">
                          {shop.category}
                        </Badge>
                      </div>
                    </div>

                    <div className="p-8 flex-1 flex flex-col text-left">
                      <div className="flex items-start justify-between mb-4">
                        <h4 className="text-xl font-bold tracking-tight text-foreground group-hover:text-accent transition-colors">{shop.name}</h4>
                        <div className="flex items-center gap-1.5 text-emerald-400 font-black text-[10px] bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20 shadow-sm">
                          <ShieldCheck size={12} /> {shop.trustScore}% Trust
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground uppercase tracking-widest font-black opacity-60 mb-8">
                        <span className="flex items-center gap-1.5"><MapPin size={12} className="text-primary" /> {shop.location}</span>
                        <span className="w-1 h-1 rounded-full bg-border" />
                        <span className="flex items-center gap-1.5"><Star size={12} className="fill-accent text-accent" /> {shop.rating}</span>
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
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* Empty State */}
      {discoveryProducts.length === 0 && (
        <div className="text-center py-32 bg-card/20 border-2 border-dashed border-border/40 rounded-[3rem]">
          <ShoppingBag className="w-16 h-16 text-muted-foreground/20 mx-auto mb-6" />
          <h3 className="text-2xl font-bold">No results found</h3>
          <p className="text-muted-foreground text-sm mt-2 max-w-sm mx-auto leading-relaxed font-bold">
            Try adjusting your search query or switching categories to find local businesses in Chittagong.
          </p>
          <Button variant="link" className="text-accent font-black uppercase tracking-[0.2em] text-[10px] mt-8" onClick={() => {setActiveCategory('all'); setSearchQuery('');}}>
            Clear All Filters
          </Button>
        </div>
      )}

      <div className="h-20" />
    </div>
  );
}

function ProductCard({ product }: { product: any }) {
  const shop = MOCK_SHOPS.find(s => s.id === product.shopId);
  
  return (
    <Link href={`/shops/${product.shopId}`}>
      <motion.div 
        whileHover={{ y: -5 }}
        className="bg-card border border-border/50 rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col group cursor-pointer h-full"
      >
        <div className="relative aspect-square">
          <Image src={product.image} alt={product.name} fill className="object-cover" />
          {product.originalPrice && (
            <Badge className="absolute top-2 left-2 bg-rose-500 text-white border-0 text-[8px] font-black uppercase tracking-tighter rounded-md">SALE</Badge>
          )}
        </div>
        <div className="p-3.5 space-y-1 flex-1 flex flex-col text-left">
          <h4 className="text-xs font-bold truncate group-hover:text-accent transition-colors">{product.name}</h4>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-black text-foreground">{product.price}</span>
            {product.originalPrice && (
              <span className="text-[10px] text-muted-foreground line-through font-medium">{product.originalPrice}</span>
            )}
          </div>
          <div className="pt-2 mt-auto flex items-center justify-between border-t border-border/10">
            <span className="text-[8px] font-black uppercase text-muted-foreground flex items-center gap-1">
              <MapPin size={8} className="text-accent" /> {shop?.location || "Chittagong"}
            </span>
            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
              <ChevronRight size={10} />
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
