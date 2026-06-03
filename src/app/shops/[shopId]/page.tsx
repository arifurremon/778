"use client";

import { OrderModal } from "@/components/shops/order-modal";
import { VerifiedReviews } from "@/components/shops/verified-reviews";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { useMessages } from "@/hooks/use-messages";
import { api } from "@/lib/api";
import {
  formatShopPrice,
  getProductImage,
  getShopImage,
  getShopOwnerName,
  parseShopPrice,
  toOrderProduct,
  type ShopDetail,
  type ShopDetailProduct,
  type ShopOrderProduct,
} from "@/lib/shop-utils";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
    ArrowLeft,
    Filter,
    Info,
    MapPin,
    MessageSquare,
    Package,
    Phone,
    Plus,
    Search,
    ShieldCheck,
    Star
} from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function ShopStorefront() {
  const { shopId } = useParams<{ shopId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { startConversation } = useMessages();
  
  const [shop, setShop] = useState<ShopDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ShopOrderProduct | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Scoped Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [onlyInStock, setOnlyInStock] = useState(false);

  useEffect(() => {
    if (!shopId) return;

    let cancelled = false;

    const loadShop = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const data = await api.get<ShopDetail>(`/api/shops/${shopId}`);
        if (!cancelled) {
          setShop(data);
        }
      } catch (error) {
        if (!cancelled) {
          setShop(null);
          setLoadError(error instanceof Error ? error.message : "Failed to load shop.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadShop();

    return () => {
      cancelled = true;
    };
  }, [shopId]);

  const shopProducts = useMemo(() => shop?.products ?? [], [shop]);

  const filteredCatalog = useMemo(() => {
    return shopProducts.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      const numericPrice = parseShopPrice(product.price);
      const matchesPrice = numericPrice >= priceRange[0] && numericPrice <= priceRange[1];
      const matchesStock = onlyInStock ? product.inStock : true;
      return matchesSearch && matchesPrice && matchesStock;
    });
  }, [shopProducts, searchQuery, priceRange, onlyInStock]);

  const handleBuyNow = (product: ShopDetailProduct) => {
    if (!shop) return;
    setSelectedProduct(toOrderProduct(product, shop.name));
    setIsOrderModalOpen(true);
  };

  const handleMessageSeller = () => {
    if (!shop) return;

    startConversation({
      id: shop.user.id,
      name: getShopOwnerName(shop),
      avatar: getShopImage(shop),
      role: "Verified Merchant",
      context: `Inquiry about ${shop.name}`,
    });
    router.push("/messages");
  };

  if (isLoading) {
    return <ShopStorefrontSkeleton />;
  }

  if (loadError || !shop) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center space-y-6">
        <Package className="w-16 h-16 text-muted-foreground/30" />
        <div className="space-y-2">
          <h1 className="text-2xl font-black tracking-tight">Shop Not Found</h1>
          <p className="text-sm text-muted-foreground font-medium max-w-md">
            {loadError ?? "This shop is unavailable or may have been removed."}
          </p>
        </div>
        <Button onClick={() => router.push("/shops")} className="rounded-xl font-bold uppercase tracking-widest text-[10px]">
          Back to Marketplace
        </Button>
      </div>
    );
  }

  const isOwner = user?.id === shop.user.id;

  return (
    <>
      <div className="min-h-screen pb-32">
        {/* Immersive Hero */}
        <div className="relative h-[400px] md:h-[500px]">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/30 via-background/60 to-background z-0" />
          <Image 
            src="/city_background.png" 
            alt="Cover" 
            fill 
            className="object-cover opacity-40 z-[-1]"
            priority
          />
          
          <div className="absolute top-8 left-8 md:left-12 z-10">
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full bg-background/40 backdrop-blur-xl border-border/50 hover:bg-background/80 h-12 w-12"
              onClick={() => router.back()}
            >
              <ArrowLeft size={20} />
            </Button>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 flex flex-col md:flex-row md:items-end justify-between gap-10">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-8 text-center md:text-left">
              <div className="relative w-32 h-32 md:w-44 md:h-44 rounded-[3rem] overflow-hidden border-8 border-background shadow-2xl ring-8 ring-accent/5">
                <Image src={getShopImage(shop)} alt={shop.name} fill className="object-cover" />
              </div>
              <div className="space-y-4 mb-2">
                <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
                  <h1 className="text-3xl md:text-5xl font-black tracking-tight">{shop.name}</h1>
                  <Badge className="bg-accent/20 text-accent border-accent/20 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full">
                    {shop.category}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground font-black uppercase tracking-widest justify-center md:justify-start">
                  <span className="flex items-center gap-2"><Star size={16} className="text-accent fill-accent" /> {shop.rating.toFixed(1)} ({shopProducts.length} PRODUCTS)</span>
                  <span className="flex items-center gap-2"><MapPin size={16} className="text-primary" /> {shop.location}</span>
                  <span className={cn(
                    "flex items-center gap-2 px-3 py-1 rounded-lg border shadow-lg",
                    shop.isVerified ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" : "text-muted-foreground bg-muted/20 border-border"
                  )}>
                    <ShieldCheck size={16} /> {shop.isVerified ? 'VERIFIED MERCHANT' : 'COMMUNITY SELLER'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={handleMessageSeller}
                className="rounded-2xl h-14 px-10 bg-accent hover:bg-accent/90 text-accent-foreground font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-accent/20 transition-all active:scale-95"
              >
                <MessageSquare size={18} className="mr-2" /> Message Seller
              </Button>
              <Button variant="outline" className="rounded-2xl h-14 px-8 border-border/50 bg-background/20 backdrop-blur-md hover:bg-white/5 font-black uppercase tracking-widest text-[11px]">
                <Phone size={18} className="mr-2" /> Contact Shop
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-8 py-16 space-y-24">
          {/* Shop Meta Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
             <div className="md:col-span-2 space-y-6">
                <div className="bg-card/20 border border-border/30 rounded-[2.5rem] p-10 flex items-start gap-6 shadow-sm">
                  <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center text-accent shrink-0">
                    <Info size={28} />
                  </div>
                  <div className="space-y-3">
                    <h3 className="font-black text-xl tracking-tight uppercase">About the Store</h3>
                    <p className="text-base text-muted-foreground leading-relaxed font-bold">
                      {shop.description}
                    </p>
                  </div>
                </div>
             </div>

             <div className="bg-gradient-to-br from-primary/10 to-accent/5 border border-border/40 rounded-[2.5rem] p-10 space-y-8 flex flex-col justify-center text-center">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Community Trust Score</p>
                  <h4 className="text-5xl font-black text-accent">{shop.trustScore}%</h4>
                </div>
                <div className="flex items-center justify-center gap-2">
                   {[...Array(5)].map((_, i) => (
                     <Star key={i} size={20} className={i < 4 ? 'fill-accent text-accent' : 'text-accent/30'} />
                   ))}
                </div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Based on verified resident feedback</p>
             </div>
          </div>

          {/* Catalog & Search Section */}
          <section className="space-y-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
              <h2 className="text-3xl font-black tracking-tight uppercase flex items-center gap-3">
                <Package size={28} className="text-accent" /> Shop Catalog
              </h2>
              
              <div className="flex items-center gap-3 w-full md:w-auto">
                 <div className="relative flex-1 md:w-80">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                   <Input 
                    placeholder="Search in this shop..." 
                    className="pl-10 h-12 bg-card/20 border-border/50 focus:ring-accent rounded-xl font-bold"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                   />
                 </div>
                 
                 <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                   <DialogTrigger asChild>
                     <Button variant="outline" className="h-12 w-12 rounded-xl border-border/50 bg-card/20 p-0">
                       <Filter size={18} />
                     </Button>
                   </DialogTrigger>
                   <DialogContent className="sm:max-w-[425px] bg-background border-border rounded-3xl">
                     <DialogHeader>
                       <DialogTitle className="text-xl font-black uppercase tracking-tight">Advanced Filters</DialogTitle>
                     </DialogHeader>
                     <div className="py-6 space-y-8">
                       <div className="space-y-4">
                         <div className="flex justify-between items-center">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Price Range (৳)</Label>
                            <span className="text-xs font-bold text-accent">৳{priceRange[0]} - ৳{priceRange[1]}</span>
                         </div>
                         <Slider 
                           defaultValue={[0, 10000]} 
                           max={10000} 
                           step={100}
                           value={priceRange}
                           onValueChange={(val) => setPriceRange(val as [number, number])}
                           className="py-4"
                         />
                       </div>

                       <div className="flex items-center justify-between p-4 bg-card/20 rounded-2xl border border-border/50">
                         <div className="space-y-0.5">
                            <Label className="text-sm font-bold">Only In Stock</Label>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Hide currently unavailable items</p>
                         </div>
                         <Switch checked={onlyInStock} onCheckedChange={setOnlyInStock} />
                       </div>
                     </div>
                     <div className="flex gap-3">
                       <Button variant="ghost" className="flex-1 rounded-xl font-bold uppercase text-[10px] tracking-widest" onClick={() => {setPriceRange([0,10000]); setOnlyInStock(false);}}>Reset</Button>
                       <Button className="flex-[2] bg-accent text-accent-foreground rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-lg h-12" onClick={() => setIsFilterOpen(false)}>Apply Filters</Button>
                     </div>
                   </DialogContent>
                 </Dialog>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {filteredCatalog.length > 0 ? (
                <motion.div 
                  key="grid"
                  variants={container} 
                  initial="hidden" 
                  animate="show" 
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                  {filteredCatalog.map((product) => (
                    <motion.div key={product.id} variants={item} className="bg-card border border-border/50 rounded-[2.5rem] overflow-hidden group hover:border-accent/40 hover:shadow-2xl transition-all duration-500 flex flex-col h-full relative">
                      {!product.inStock && (
                        <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] z-10 flex items-center justify-center pointer-events-none">
                          <Badge className="bg-rose-500 text-white font-black text-xs px-6 py-2 rounded-xl shadow-xl">OUT OF STOCK</Badge>
                        </div>
                      )}
                      <div className="relative aspect-square overflow-hidden">
                        <Image src={getProductImage(product)} alt={product.name} fill className="object-cover transition-transform duration-1000 group-hover:scale-110" />
                        <div className="absolute top-4 right-4">
                          <div className="bg-black/60 backdrop-blur-xl px-5 py-2.5 rounded-2xl border border-white/10 text-accent font-black text-sm shadow-2xl">
                            {formatShopPrice(product.price)}
                          </div>
                        </div>
                      </div>
                      <div className="p-8 flex-1 flex flex-col">
                        <h4 className="font-bold text-xl mb-3 group-hover:text-accent transition-colors leading-tight">{product.name}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-8 flex-1 font-bold">{product.description}</p>
                        <div className="mt-auto">
                          <Button 
                            disabled={!product.inStock}
                            onClick={() => handleBuyNow(product)} 
                            className="w-full rounded-2xl bg-accent hover:bg-accent/90 text-accent-foreground font-black text-[11px] uppercase tracking-[0.2em] h-14 transition-all shadow-xl shadow-accent/10 active:scale-95 disabled:bg-muted disabled:text-muted-foreground"
                          >
                            <Plus size={18} className="mr-2" /> Buy Now
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className="py-32 text-center bg-card/10 border-2 border-dashed border-border/50 rounded-[3rem]"
                >
                   <Package className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                   <h4 className="text-xl font-bold">No products match your filters</h4>
                   <p className="text-sm text-muted-foreground mt-1 font-bold">Try adjusting your search or price range.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          <section className="pt-24 border-t border-border/10">
            <VerifiedReviews productId="general" shopId={shop.id} isOwner={isOwner} />
          </section>
        </div>
      </div>

      {selectedProduct && (
        <OrderModal
          product={selectedProduct}
          shopId={shop.id}
          isOpen={isOrderModalOpen}
          onClose={() => {
            setIsOrderModalOpen(false);
            setSelectedProduct(null);
          }}
        />
      )}
    </>
  );
}

function ShopStorefrontSkeleton() {
  return (
    <div className="min-h-screen pb-32">
      <Skeleton className="h-[400px] md:h-[500px] w-full rounded-none" />
      <div className="max-w-6xl mx-auto px-8 py-16 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <Skeleton className="md:col-span-2 h-48 rounded-[2.5rem]" />
          <Skeleton className="h-48 rounded-[2.5rem]" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-[420px] rounded-[2.5rem]" />
          ))}
        </div>
      </div>
    </div>
  );
}
