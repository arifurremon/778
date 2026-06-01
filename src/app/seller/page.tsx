
"use client";

import { ProductForm } from "@/components/seller/product-form";
import { SellerDashboard } from "@/components/seller/seller-dashboard";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { History, LayoutDashboard, Package, Plus, Settings, ShoppingBag, Store } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
export default function SellerPage() {
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const pathname = usePathname();

  return (
      <div className="flex h-full">
        {/* Contextual Merchant Sidebar */}
        <aside className="hidden lg:flex w-64 flex-col border-r border-border/50 bg-card/5 shrink-0">
          <div className="p-8 space-y-8">
            <div className="space-y-1">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-accent opacity-70 px-4">Merchant Terminal</h3>
            </div>
            
            <nav className="space-y-1">
              <SidebarLink icon={<LayoutDashboard size={18} />} label="Operational Feed" active={true} />
              <SidebarLink icon={<Package size={18} />} label="Live Inventory" />
              <SidebarLink icon={<ShoppingBag size={18} />} label="Order History" />
              <SidebarLink icon={<History size={18} />} label="Payout Logs" />
              <div className="h-px bg-border/20 my-6 mx-4" />
              <SidebarLink icon={<Settings size={18} />} label="Shop Settings" />
            </nav>
          </div>
        </aside>

        <div className="flex-1 max-w-6xl mx-auto py-8 px-6 space-y-10">
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-2 text-left">
              <div className="flex items-center gap-2 text-accent font-black uppercase tracking-[0.3em] text-[10px]">
                 <Store size={12} /> Digital Storefront Operations
              </div>
              <h1 className="text-4xl font-black tracking-tighter">
                Merchant <span className="text-accent">Console</span>
              </h1>
              <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] opacity-50">
                Manage hyperlocal fulfillment and inventory
              </p>
            </div>

            <div className="flex gap-4">
              <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl h-14 px-8 font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-2xl shadow-primary/30 hover:scale-[1.02]">
                    <Plus size={18} className="mr-2" /> List New Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-background border-border sm:max-w-[500px] rounded-[2.5rem] p-8">
                  <DialogHeader className="mb-6">
                    <DialogTitle className="text-2xl font-black tracking-tight uppercase">Create Marketplace Listing</DialogTitle>
                  </DialogHeader>
                  <ProductForm onSuccess={() => setIsAddProductOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>
          </header>

          <SellerDashboard />
        </div>
      </div>
  );
}

function SidebarLink({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <div className={cn(
      "flex items-center gap-4 px-4 py-3.5 rounded-xl cursor-pointer transition-all duration-300 font-black text-[11px] uppercase tracking-widest",
      active 
        ? "bg-accent/10 text-accent border border-accent/20 shadow-sm" 
        : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
    )}>
      {icon}
      <span>{label}</span>
    </div>
  );
}
