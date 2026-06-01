
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderStatus, useBusiness } from "@/hooks/use-business";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
    BarChart3,
    ChevronRight,
    Edit,
    LucideIcon,
    MoreVertical,
    Package,
    Search,
    ShoppingBag,
    Star,
    Trash2,
    TrendingUp,
    Truck
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

export function SellerDashboard() {
  const { orders, products, updateOrderStatus, initializeBusiness } = useBusiness();

  useEffect(() => {
    initializeBusiness();
  }, [initializeBusiness]);
  const [activeTab, setActiveTab] = useState("overview");

  const stats = useMemo(() => ({
    totalSales: orders.filter(o => o.status === 'Delivered').reduce((acc, curr) => acc + parseInt(curr.price.replace(/[^0-9]/g, '')), 0),
    activeOrders: orders.filter(o => ['Pending', 'Processing', 'Sent'].includes(o.status)).length,
    activeProducts: products.length,
    rating: "4.8"
  }), [orders, products]);

  const getStatusColor = (status: OrderStatus) => {
    switch(status) {
      case 'Pending': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'Processing': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Sent': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'Delivered': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Cancelled': return 'bg-destructive/20 text-destructive border-destructive/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Bento Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          label="Total Revenue" 
          value={`৳${stats.totalSales.toLocaleString()}`} 
          icon={TrendingUp} 
          color="text-emerald-400"
          trend="+12%"
        />
        <MetricCard 
          label="Active Orders" 
          value={stats.activeOrders.toString()} 
          icon={Truck} 
          color="text-accent"
        />
        <MetricCard 
          label="Live Products" 
          value={stats.activeProducts.toString()} 
          icon={Package} 
          color="text-blue-400"
        />
        <MetricCard 
          label="Shop Rating" 
          value={stats.rating} 
          icon={Star} 
          color="text-amber-400"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-card/20 border border-border/50 p-1 rounded-full w-full max-w-xl">
          <TabsTrigger value="overview" className="flex-1 rounded-full font-bold text-[10px] uppercase tracking-widest">
            Activity Feed
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex-1 rounded-full font-bold text-[10px] uppercase tracking-widest">
            Orders
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex-1 rounded-full font-bold text-[10px] uppercase tracking-widest">
            Inventory
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
           <div className="flex items-center justify-between px-2">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground">Recent Transactions</h3>
              <Button variant="ghost" size="sm" className="text-accent text-[10px] uppercase tracking-widest font-black hover:bg-accent/5">
                Clear All
              </Button>
           </div>
           
           <div className="space-y-3">
              {orders.slice(0, 5).map(order => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={order.id} 
                  className="bg-card/20 border border-border/50 rounded-2xl p-4 flex items-center justify-between group hover:bg-card/40 transition-smooth"
                >
                   <div className="flex items-center gap-4 text-left">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", getStatusColor(order.status))}>
                        <Package size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Order for <span className="text-accent">{order.productName}</span></p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold opacity-60">{order.buyerName} • {order.timestamp}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-4">
                     <span className="text-xs font-black">{order.price}</span>
                     <ChevronRight size={16} className="text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all" />
                   </div>
                </motion.div>
              ))}
              {orders.length === 0 && <EmptyFeed message="Waiting for your first order..." />}
           </div>
        </TabsContent>

        <TabsContent value="orders">
          <Card className="bg-card/20 border-border/50 overflow-hidden rounded-3xl">
            <div className="p-6 border-b border-border/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
               <h3 className="text-sm font-black uppercase tracking-widest">Order Management</h3>
               <div className="relative w-full sm:w-64">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                 <Input placeholder="Search orders..." className="pl-10 h-10 bg-background/40 text-xs border-border/50 rounded-xl font-bold" />
               </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="border-border/50">
                    <TableHead className="text-[9px] font-black uppercase tracking-widest">Order ID</TableHead>
                    <TableHead className="text-[9px] font-black uppercase tracking-widest">Customer</TableHead>
                    <TableHead className="text-[9px] font-black uppercase tracking-widest">Amount</TableHead>
                    <TableHead className="text-[9px] font-black uppercase tracking-widest">Status</TableHead>
                    <TableHead className="text-right text-[9px] font-black uppercase tracking-widest">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} className="border-border/20 hover:bg-white/5 transition-colors">
                      <TableCell className="font-mono text-[9px] font-bold text-muted-foreground uppercase">{order.id}</TableCell>
                      <TableCell className="text-xs">
                         <p className="font-bold">{order.buyerName}</p>
                         <p className="text-[9px] text-muted-foreground font-bold uppercase">{order.phone}</p>
                      </TableCell>
                      <TableCell className="text-accent font-black text-xs">{order.price}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-[8px] font-black uppercase px-2 py-0.5 rounded-md", getStatusColor(order.status))}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-accent">
                              <MoreVertical size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover border-border min-w-[160px]">
                            <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'Processing')} className="font-bold text-xs py-2.5 cursor-pointer">Set as Processing</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'Sent')} className="font-bold text-xs py-2.5 cursor-pointer">Mark as Sent/Shipped</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'Delivered')} className="font-bold text-xs py-2.5 cursor-pointer">Mark as Delivered</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'Cancelled')} className="text-destructive font-bold text-xs py-2.5 cursor-pointer">Cancel Order</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <motion.div 
                layout
                key={product.id} 
                className="bg-card/20 border border-border/50 rounded-[2rem] overflow-hidden group hover:bg-card/40 transition-smooth flex flex-col h-full"
              >
                <div className="relative aspect-video">
                  <Image src={product.images?.[0] ?? ''} alt={product.name} fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="icon" variant="secondary" className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-accent hover:text-white border-0"><Edit size={16} /></Button>
                    <Button size="icon" variant="secondary" className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-destructive hover:text-white border-0"><Trash2 size={16} /></Button>
                  </div>
                </div>
                <div className="p-6 text-left flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-sm tracking-tight">{product.name}</h4>
                    <span className="text-accent font-black text-xs">{product.price}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed mb-6 font-bold flex-1 uppercase">
                    {product.description}
                  </p>
                  <div className="pt-4 border-t border-border/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">In Stock</span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 text-[9px] font-black uppercase tracking-widest text-accent hover:bg-accent/5">Quick Edit</Button>
                  </div>
                </div>
              </motion.div>
            ))}
            {products.length === 0 && <EmptyFeed message="No products listed yet." icon={ShoppingBag} />}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, color, trend }: { label: string, value: string, icon: LucideIcon, color: string, trend?: string }) {
  return (
    <Card className="p-6 bg-card/20 border-border/50 rounded-3xl relative overflow-hidden group text-left backdrop-blur-sm">
      <div className="flex justify-between items-start mb-4">
        <div className={cn("p-2 rounded-xl bg-background/40 border border-border/30", color)}>
          <Icon size={18} />
        </div>
        {trend && <span className="text-[9px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">{trend}</span>}
      </div>
      <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-1">{label}</p>
      <h3 className="text-2xl font-black tracking-tighter">{value}</h3>
    </Card>
  );
}

function EmptyFeed({ message, icon: Icon }: { message: string, icon?: LucideIcon }) {
  return (
    <div className="py-20 text-center bg-card/5 border border-dashed border-border/30 rounded-[2.5rem]">
      {Icon ? <div className="text-muted-foreground/20 mb-4 flex justify-center"><Icon size={32} /></div> : <BarChart3 className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />}
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{message}</p>
    </div>
  );
}


