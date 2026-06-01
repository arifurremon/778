"use client";

import PostCard from "@/components/community/post-card";
import { realProviderToProvider } from "@/components/services/service-view";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCommunity } from "@/hooks/use-community";
import type { Provider } from "@/types/index";
import { AnimatePresence, motion } from "framer-motion";
import {
    AlertCircle,
    Briefcase,
    ChevronRight,
    MapPin,
    Search,
    ShoppingBag,
    Star,
    Users
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { Suspense, useEffect, useMemo, useState } from "react";
const CHITTAGONG_AREAS = [
  "Akbar Shah", "Bakalia", "Bandar", "Bayezid Bostami", "Chandgaon",
  "Chawkbazar", "Double Mooring", "EPZ", "Halishahar", "Karnaphuli",
  "Khulshi", "Kotwali", "Pahartali", "Panchlaish", "Patenga", "Sadarghat",
];

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

type RealProvider = {
  id: string;
  profession: string;
  category: string;
  location: string;
  experienceYears: number;
  fee: number | null;
  bio: string | null;
  qualifications: string[] | null;
  rating: number;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    preferredName: string | null;
    username: string | null;
    profileImage: string | null;
    isVerified: boolean;
  };
};

function shopImageSrc(shop: RealShop): string {
  return shop.user.profileImage ?? "https://placehold.co/800x450/1e293b/94a3b8?text=Shop";
}

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const { posts, fetchPosts } = useCommunity();

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const [activeTab, setActiveTab] = useState("all");
  const [filterArea, setFilterArea] = useState("All Areas");
  const [filterRating, setFilterRating] = useState("0");
  const [shops, setShops] = useState<RealShop[]>([]);
  const [services, setServices] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setShops([]);
      setServices([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    Promise.all([
      fetch(`/api/shops?search=${encodeURIComponent(query)}&limit=10`),
      fetch(`/api/services?search=${encodeURIComponent(query)}&limit=10`),
    ])
      .then(async ([shopsRes, servicesRes]) => {
        const shopsData = shopsRes.ok
          ? ((await shopsRes.json()) as { shops: RealShop[] })
          : { shops: [] };
        const servicesData = servicesRes.ok
          ? ((await servicesRes.json()) as { services: RealProvider[] })
          : { services: [] };
        if (cancelled) return;
        setShops(shopsData.shops ?? []);
        setServices((servicesData.services ?? []).map(realProviderToProvider));
      })
      .catch(() => {
        if (!cancelled) {
          setShops([]);
          setServices([]);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query]);

  const results = useMemo(() => {
    const minRating = parseFloat(filterRating);

    const filteredShops = shops.filter((s) => {
      const matchesArea = filterArea === "All Areas" || s.location === filterArea;
      const matchesRating = s.rating >= minRating;
      return matchesArea && matchesRating;
    });

    const filteredServices = services.filter((p) => {
      const matchesArea = filterArea === "All Areas" || p.location === filterArea;
      const matchesRating = p.rating >= minRating;
      return matchesArea && matchesRating;
    });

    const q = query.toLowerCase();
    const community = posts.filter((post) => {
      const matchesText =
        post.content.toLowerCase().includes(q) ||
        post.author.name.toLowerCase().includes(q);
      const matchesArea =
        filterArea === "All Areas" || post.author.location === filterArea;
      return matchesText && matchesArea;
    });

    return { shops: filteredShops, services: filteredServices, community };
  }, [shops, services, posts, query, filterArea, filterRating]);

  const totalResultsCount =
    results.shops.length + results.services.length + results.community.length;

  return (
    <div className="max-w-6xl mx-auto py-8 px-6 space-y-8">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="space-y-1">
            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest opacity-60">
              The Chattala | 2026
            </p>
            <div className="flex items-center gap-2 text-accent font-bold uppercase tracking-[0.2em] text-[10px]">
              <Search size={12} /> Universal Search Engine
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Results for <span className="text-accent">&quot;{query}&quot;</span>
          </h1>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest opacity-60">
            {isLoading ? "Searching..." : `Found ${totalResultsCount} items across Chattala`}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase text-muted-foreground">Area:</span>
            <Select value={filterArea} onValueChange={setFilterArea}>
              <SelectTrigger className="w-[160px] h-9 bg-card/20 border-border/50 text-xs rounded-full focus:ring-accent font-bold">
                <SelectValue placeholder="All Areas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Areas">All Areas</SelectItem>
                {CHITTAGONG_AREAS.map((area) => (
                  <SelectItem key={area} value={area}>{area}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase text-muted-foreground">Rating:</span>
            <Select value={filterRating} onValueChange={setFilterRating}>
              <SelectTrigger className="w-[120px] h-9 bg-card/20 border-border/50 text-xs rounded-full focus:ring-accent font-bold">
                <SelectValue placeholder="Any Rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Any Rating</SelectItem>
                <SelectItem value="4">4.0+ Stars</SelectItem>
                <SelectItem value="4.5">4.5+ Stars</SelectItem>
                <SelectItem value="4.8">4.8+ Stars</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : (
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full space-y-8">
          <TabsList className="bg-card/20 border border-border/50 p-1 rounded-full w-full max-w-2xl">
            <TabsTrigger value="all" className="flex-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
              All Results
            </TabsTrigger>
            <TabsTrigger value="shops" className="flex-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
              Shops ({results.shops.length})
            </TabsTrigger>
            <TabsTrigger value="services" className="flex-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
              Services ({results.services.length})
            </TabsTrigger>
            <TabsTrigger value="community" className="flex-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
              Posts ({results.community.length})
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.3 }}
            >
              <TabsContent value="all" className="space-y-12 mt-0">
                {!query.trim() ? (
                  <EmptyState area={filterArea} message="Enter a search term to find shops, services, and posts." />
                ) : totalResultsCount === 0 ? (
                  <EmptyState area={filterArea} />
                ) : (
                  <>
                    {results.shops.length > 0 && (
                      <section className="space-y-4">
                        <SectionHeader title="Shops & Markets" icon={<ShoppingBag size={18} />} href="/shops" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {results.shops.slice(0, 3).map((shop) => (
                            <ShopCard key={shop.id} shop={shop} />
                          ))}
                        </div>
                      </section>
                    )}

                    {results.services.length > 0 && (
                      <section className="space-y-4">
                        <SectionHeader title="Expert Services" icon={<Briefcase size={18} />} href="/services" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {results.services.slice(0, 3).map((provider) => (
                            <ProviderMiniCard key={provider.id} provider={provider} />
                          ))}
                        </div>
                      </section>
                    )}

                    {results.community.length > 0 && (
                      <section className="space-y-4">
                        <SectionHeader title="Community Discussion" icon={<Users size={18} />} href="/community" />
                        <div className="grid grid-cols-1 gap-6 max-w-2xl">
                          {results.community.slice(0, 2).map((post) => (
                            <PostCard key={post.id} post={post} />
                          ))}
                        </div>
                      </section>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="shops" className="mt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {results.shops.map((shop) => (
                    <ShopCard key={shop.id} shop={shop} />
                  ))}
                  {results.shops.length === 0 && <EmptyState area={filterArea} category="Shops" />}
                </div>
              </TabsContent>

              <TabsContent value="services" className="mt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {results.services.map((provider) => (
                    <ProviderMiniCard key={provider.id} provider={provider} />
                  ))}
                  {results.services.length === 0 && <EmptyState area={filterArea} category="Services" />}
                </div>
              </TabsContent>

              <TabsContent value="community" className="mt-0">
                <div className="grid grid-cols-1 gap-6 max-w-2xl">
                  {results.community.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                  {results.community.length === 0 && <EmptyState area={filterArea} category="Posts" />}
                </div>
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Loading search...</p>
          </div>
        </div>
      }
    >
      <SearchResults />
    </Suspense>
  );
}

function SectionHeader({ title, icon, href }: { title: string; icon: React.ReactElement<{ className?: string }>; href: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/10 pb-2">
      <h3 className="text-lg font-bold flex items-center gap-2">
        <span className="text-accent">{icon}</span> {title}
      </h3>
      <Link href={href}>
        <Button variant="link" className="text-accent text-[10px] font-bold uppercase tracking-widest p-0 h-auto">
          Explore All <ChevronRight size={12} />
        </Button>
      </Link>
    </div>
  );
}

function ShopCard({ shop }: { shop: RealShop }) {
  return (
    <Link href={`/shops/${shop.id}`}>
      <div className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden hover:bg-card/40 hover:border-accent/30 transition-smooth group flex flex-col h-full">
        <div className="relative h-40">
          <Image src={shopImageSrc(shop)} alt={shop.name} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
          <Badge className="absolute top-3 left-3 bg-black/60 text-accent border border-accent/20 font-bold text-[9px] uppercase">
            {shop.category}
          </Badge>
        </div>
        <div className="p-5 flex-1">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-bold text-sm tracking-tight group-hover:text-accent transition-colors">{shop.name}</h4>
            <div className="flex items-center text-accent font-bold text-[10px]">
              <Star size={10} className="fill-accent mr-1" /> {shop.rating.toFixed(1)}
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase tracking-widest font-bold opacity-60">
            <MapPin size={10} className="text-primary" /> {shop.location}
          </p>
        </div>
      </div>
    </Link>
  );
}

function ProviderMiniCard({ provider }: { provider: Provider }) {
  return (
    <Link href={`/services/${provider.id}`}>
      <div className="bg-card/30 border border-border/50 rounded-2xl p-5 hover:bg-card/40 hover:border-accent/30 transition-smooth group">
        <div className="flex items-center gap-4">
          <Avatar className="w-12 h-12 border border-border/50">
            <AvatarImage src={provider.image} />
          </Avatar>
          <div>
            <h4 className="text-sm font-bold group-hover:text-accent transition-colors">{provider.name}</h4>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{provider.profession}</p>
          </div>
        </div>
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/10">
          <div className="flex items-center gap-1.5">
            <MapPin size={10} className="text-primary" />
            <span className="text-[10px] font-bold text-muted-foreground">{provider.location}</span>
          </div>
          <Button size="sm" variant="outline" className="h-8 rounded-full text-[10px] font-bold uppercase tracking-widest border-border/50 hover:bg-accent hover:text-accent-foreground hover:border-accent transition-smooth">
            Book Now
          </Button>
        </div>
      </div>
    </Link>
  );
}

function EmptyState({ area, category, message }: { area?: string; category?: string; message?: string }) {
  return (
    <div className="text-center py-20 border-2 border-dashed border-border/30 rounded-3xl bg-card/5 col-span-full">
      <AlertCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
      <h3 className="text-xl font-bold">No results found</h3>
      <p className="text-muted-foreground text-sm mt-1 max-w-sm mx-auto leading-relaxed font-bold">
        {message ??
          `We couldn't find any ${category ? category.toLowerCase() : "matching items"} in `}
        {!message && (
          <span className="text-accent font-bold">{area === "All Areas" ? "Chittagong" : area}</span>
        )}
        {!message && "."}
      </p>
      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/community">
          <Button className="bg-primary rounded-full px-8 text-xs font-bold uppercase tracking-widest">
            Ask the Community
          </Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="outline" className="rounded-full px-8 text-xs font-bold uppercase tracking-widest border-border/50">
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
