"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  Store,
  Star,
  Package,
  ShieldCheck,
  MapPin,
  User,
  Phone,
  Mail,
  Calendar,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  BadgeCheck,
  ExternalLink,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ShopDetail {
  id: string;
  name: string;
  description: string;
  category: string;
  location: string;
  trustScore: number;
  rating: number;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    profileImage: string | null;
    isVerified: boolean;
    registrationStatus: string;
    mobile: string | null;
    location: string | null;
    createdAt: string;
    _count: { posts: number };
  };
  products: {
    id: string;
    name: string;
    price: string;
    originalPrice: string | null;
    images: string[];
    inStock: boolean;
    category: string;
    createdAt: string;
  }[];
  _count: { products: number };
}

export default function ShopDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [shop, setShop] = useState<ShopDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch(`/api/admin/shops/${id}`);
        if (!res.ok) throw new Error();
        setShop(await res.json() as ShopDetail);
      } catch {
        toast({ variant: "destructive", title: "Error", description: "Failed to load shop." });
      } finally {
        setLoading(false);
      }
    };
    void fetch_();
  }, [id]);

  const handleToggleVerification = async () => {
    if (!shop) return;
    setToggling(true);
    try {
      const res = await fetch(`/api/admin/shops/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVerified: !shop.isVerified }),
      });
      if (!res.ok) throw new Error();
      setShop((s) => s ? { ...s, isVerified: !s.isVerified } : s);
      toast({ title: shop.isVerified ? "Verification removed" : "Shop verified" });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Action failed." });
    } finally {
      setToggling(false);
    }
  };

  if (loading) return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-4">
      <Skeleton className="h-8 w-32 rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-48 rounded-2xl md:col-span-2" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    </div>
  );

  if (!shop) return (
    <div className="p-8 text-center">
      <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4 opacity-50" />
      <p className="text-sm font-bold text-muted-foreground">Shop not found</p>
      <Link href="/admin/shops"><Button variant="outline" className="mt-4">Back to Shops</Button></Link>
    </div>
  );

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <Link href="/admin/shops">
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs rounded-xl text-muted-foreground">
            <ArrowLeft size={13} /> All Shops
          </Button>
        </Link>
        <Button
          size="sm"
          onClick={handleToggleVerification}
          disabled={toggling}
          className={cn(
            "h-8 text-xs gap-1.5 rounded-xl font-bold",
            shop.isVerified
              ? "bg-muted text-muted-foreground hover:bg-muted/80"
              : "bg-amber-500 hover:bg-amber-600 text-white"
          )}
        >
          {shop.isVerified ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
          {shop.isVerified ? "Revoke Verification" : "Verify Shop"}
        </Button>
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {/* Shop Info */}
        <div className="md:col-span-2 bg-card/40 border border-border/50 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black shrink-0",
              shop.isVerified ? "bg-amber-400/10 text-amber-400" : "bg-muted text-muted-foreground"
            )}>
              {shop.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-black">{shop.name}</h1>
                {shop.isVerified && <ShieldCheck size={18} className="text-amber-400" />}
              </div>
              <p className="text-sm text-muted-foreground">{shop.category}</p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                <MapPin size={11} className="text-accent" />
                {shop.location}
              </div>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed line-clamp-3">{shop.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-5">
            {[
              { label: "Rating", value: shop.rating.toFixed(1), sub: "/ 5.0", color: "text-amber-400" },
              { label: "Trust Score", value: String(shop.trustScore), sub: "/ 100", color: "text-emerald-400" },
              { label: "Products", value: String(shop._count.products), sub: "items listed", color: "text-blue-400" },
            ].map((s) => (
              <div key={s.label} className="bg-background/40 rounded-xl p-3 text-center">
                <div className={cn("text-xl font-black tabular-nums", s.color)}>{s.value}</div>
                <div className="text-[9px] text-muted-foreground/60">{s.sub}</div>
                <div className="text-[10px] text-muted-foreground font-medium mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Owner Info */}
        <div className="bg-card/40 border border-border/50 rounded-2xl p-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Shop Owner</h3>
          <Link href={`/admin/users/${shop.user.id}`} className="flex items-center gap-3 mb-4 group">
            <Avatar className="w-10 h-10 border border-border/30">
              <AvatarImage src={shop.user.profileImage ?? ""} />
              <AvatarFallback className="font-bold">{shop.user.name?.[0] ?? "U"}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold group-hover:text-primary transition-colors">{shop.user.name ?? "—"}</p>
                {shop.user.isVerified && <BadgeCheck size={12} className="text-cyan-400" />}
              </div>
              <p className="text-[10px] text-muted-foreground truncate max-w-[140px]">{shop.user.email}</p>
            </div>
          </Link>
          <div className="space-y-2 text-xs">
            {shop.user.mobile && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone size={11} /> {shop.user.mobile}
              </div>
            )}
            {shop.user.location && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin size={11} /> {shop.user.location}
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar size={11} /> Joined {new Date(shop.user.createdAt).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <ExternalLink size={11} /> {shop.user._count.posts} posts
            </div>
          </div>
          <Link href={`/admin/users/${shop.user.id}`} className="block mt-4">
            <Button variant="outline" size="sm" className="w-full h-8 text-xs rounded-xl">
              View Full Profile
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Products */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card/40 border border-border/50 rounded-2xl p-6"
      >
        <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
          <Package size={14} className="text-blue-400" />
          Products ({shop._count.products})
        </h3>
        {shop.products.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">No products listed yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {shop.products.map((product) => (
              <div key={product.id} className="bg-background/40 border border-border/30 rounded-xl p-4 group">
                {product.images[0] && (
                  <div className="w-full aspect-video rounded-lg overflow-hidden bg-muted/40 mb-3">
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <p className="text-xs font-bold truncate">{product.name}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-xs font-black text-primary">{product.price}</p>
                  <Badge
                    className={cn(
                      "text-[9px] px-1.5 py-0.5",
                      product.inStock ? "bg-emerald-400/10 text-emerald-400" : "bg-destructive/10 text-destructive"
                    )}
                  >
                    {product.inStock ? "In Stock" : "Out of Stock"}
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{product.category}</p>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
