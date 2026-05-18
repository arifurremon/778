"use client";

import { format } from 'date-fns';
import {
    AlertCircle,
    Ban,
    CheckCircle2,
    ChevronLeft,
    Clock,
    Globe,
    History,
    Mail,
    MapPin,
    MoreHorizontal,
    Phone,
    ShieldAlert,
    ShieldCheck,
    Trash2
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { ConfirmationDialog } from '@/components/admin/actions/ConfirmationDialog';
import { ActivityTimeline } from '@/components/admin/display/ActivityTimeline';
import { StatusBadge } from '@/components/admin/display/StatusBadge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ShopProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  status: 'active' | 'hidden';
  createdAt: string;
}

interface AdminShopDetail {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  address: string | null;
  phone: string | null;
  website?: string | null;
  logo: string | null;
  isVerified: boolean;
  verifiedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  owner: { id: string; name: string; email: string; profileImage: string | null };
  _count: { products: number };
  products: ShopProduct[];
  verificationHistory: Array<{
    id: string;
    action: string;
    reason?: string;
    adminName: string;
    createdAt: string;
  }>;
  auditLogs: Array<{
    id: string;
    action: string;
    details: Record<string, unknown>;
    createdAt: string;
  }>;
}

export default function ShopDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [shop, setShop] = useState<AdminShopDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Actions states
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmSuspend, setConfirmSuspend] = useState(false);

  useEffect(() => {
    fetchShopDetails();
  }, [id]);

  const fetchShopDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/shops/${id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setShop(data.shop);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Shop not found." });
      router.push('/admin/shops');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string) => {
    try {
      const res = await fetch(`/api/admin/shops/${id}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (!res.ok) throw new Error();
      toast({ title: "Success", description: `Shop action '${action}' completed.` });
      fetchShopDetails();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Action failed." });
    }
  };

  if (loading || !shop) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Clock className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background/50">
      {/* Sticky Action Bar */}
      <div className="sticky top-0 z-30 w-full border-b bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Button variant="ghost" size="icon" asChild className="rounded-full">
              <Link href="/admin/shops"><ChevronLeft size={20} /></Link>
            </Button>
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="w-8 h-8 rounded-lg border">
                <AvatarImage src={shop.logo || ""} />
                <AvatarFallback>{shop.name[0]}</AvatarFallback>
              </Avatar>
              <h1 className="text-sm font-black tracking-tight truncate">{shop.name}</h1>
              <StatusBadge status={shop.isVerified ? 'active' : 'pending'} className="text-[10px]" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="hidden md:flex gap-2 rounded-lg font-bold">
              <Mail size={14} /> Contact
            </Button>
            {shop.isVerified ? (
              <Button variant="outline" size="sm" onClick={() => handleAction('revoke')} className="gap-2 rounded-lg font-bold text-amber-600 border-amber-200 hover:bg-amber-50">
                <ShieldAlert size={14} /> Revoke
              </Button>
            ) : (
              <Button size="sm" onClick={() => handleAction('verify')} className="gap-2 rounded-lg font-bold bg-emerald-500 hover:bg-emerald-600">
                <ShieldCheck size={14} /> Verify
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-lg h-8 w-8 border">
                  <MoreHorizontal size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl">
                <DropdownMenuItem onClick={() => setConfirmSuspend(true)} className="text-amber-600">
                  <Ban size={14} className="mr-2" /> Suspend Shop
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setConfirmDelete(true)} className="text-destructive">
                  <Trash2 size={14} className="mr-2" /> Delete Shop
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="bg-muted/50 p-1 rounded-2xl h-12 mb-8">
            <TabsTrigger value="overview" className="rounded-xl px-8 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-background data-[state=active]:shadow-lg">
              Overview
            </TabsTrigger>
            <TabsTrigger value="products" className="rounded-xl px-8 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-background data-[state=active]:shadow-lg">
              Products ({shop._count.products})
            </TabsTrigger>
            <TabsTrigger value="activity" className="rounded-xl px-8 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-background data-[state=active]:shadow-lg">
              Activity Log
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                {/* Header Card */}
                <Card className="border-border/50 shadow-2xl shadow-black/5 overflow-hidden">
                  <CardHeader className="bg-muted/10 p-8 pb-4">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                      <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary font-black text-4xl shadow-inner">
                          {shop.logo ? <img src={shop.logo} className="w-full h-full object-cover rounded-3xl" /> : shop.name[0]}
                        </div>
                        <div className="space-y-1">
                          <h2 className="text-2xl font-black tracking-tight">{shop.name}</h2>
                          <Badge variant="secondary" className="font-bold text-[10px] uppercase tracking-widest px-2 py-0.5">
                            {shop.category || 'General Merchant'}
                          </Badge>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                            <span className="flex items-center gap-1"><MapPin size={12} /> {shop.address}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="text-center px-4">
                          <div className="text-2xl font-black">4.8</div>
                          <div className="text-[8px] font-black uppercase text-muted-foreground">Rating</div>
                        </div>
                        <div className="text-center px-4 border-l">
                          <div className="text-2xl font-black">{shop._count.products}</div>
                          <div className="text-[8px] font-black uppercase text-muted-foreground">Products</div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6">
                    <div className="prose prose-sm max-w-none">
                      <p className="text-sm text-foreground/80 leading-relaxed font-medium">
                        {shop.description || 'No detailed description available for this shop.'}
                      </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4 pt-4">
                      <div className="p-4 bg-muted/20 rounded-2xl border border-border/30 space-y-1">
                        <span className="text-[8px] font-black uppercase text-muted-foreground flex items-center gap-1"><Globe size={10} /> Website</span>
                        <p className="text-xs font-bold truncate">{shop.website || 'Not listed'}</p>
                      </div>
                      <div className="p-4 bg-muted/20 rounded-2xl border border-border/30 space-y-1">
                        <span className="text-[8px] font-black uppercase text-muted-foreground flex items-center gap-1"><Phone size={10} /> Contact</span>
                        <p className="text-xs font-bold">{shop.phone || 'Not listed'}</p>
                      </div>
                      <div className="p-4 bg-muted/20 rounded-2xl border border-border/30 space-y-1">
                        <span className="text-[8px] font-black uppercase text-muted-foreground flex items-center gap-1"><Calendar size={10} /> Joined</span>
                        <p className="text-xs font-bold">{format(new Date(shop.createdAt), 'MMM yyyy')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Verification History */}
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                      <History size={16} className="text-primary" /> Verification History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {shop.verificationHistory?.length > 0 ? shop.verificationHistory.map((item) => (
                        <div key={item.id} className="flex gap-4 p-4 rounded-2xl bg-muted/10 border border-border/30">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                            item.action === 'APPROVED' ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                          )}>
                            {item.action === 'APPROVED' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold">{item.action} by {item.adminName}</span>
                              <span className="text-[10px] text-muted-foreground">{format(new Date(item.createdAt), 'PP')}</span>
                            </div>
                            {item.reason && <p className="text-xs text-muted-foreground">Reason: {item.reason}</p>}
                          </div>
                        </div>
                      )) : (
                        <div className="text-center py-8 text-xs italic text-muted-foreground">No verification records found.</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar: Owner Info */}
              <div className="space-y-8">
                <Card className="shadow-xl shadow-black/5 bg-muted/10">
                  <CardHeader>
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Shop Owner</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-16 h-16 ring-4 ring-background shadow-xl">
                        <AvatarImage src={shop.owner.profileImage || ""} />
                        <AvatarFallback className="text-xl font-black">{shop.owner.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <h4 className="text-lg font-black tracking-tight">{shop.owner.name}</h4>
                        <span className="text-xs text-muted-foreground font-medium">{shop.owner.email}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full justify-start gap-3 rounded-xl border-border/50 font-bold" asChild>
                        <Link href={`/admin/users/${shop.owner.id}`}><User size={14} /> View Profile</Link>
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start gap-3 rounded-xl border-border/50 font-bold">
                        <Mail size={14} /> Send Message
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Stats */}
                <Card className="border-border/50 overflow-hidden">
                  <div className="p-6 bg-primary text-primary-foreground">
                    <h4 className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-4">Marketplace Performance</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-2xl font-black">৳ ৪.৫ক</div>
                        <div className="text-[8px] font-bold uppercase opacity-80">Total Sales</div>
                      </div>
                      <div>
                        <div className="text-2xl font-black">১৫০+</div>
                        <div className="text-[8px] font-bold uppercase opacity-80">Orders</div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="products" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-border/50 overflow-hidden shadow-xl shadow-black/5">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-muted/50 border-b border-border/50 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <tr>
                      <th className="px-6 py-4">Product Name</th>
                      <th className="px-6 py-4 text-center">Price</th>
                      <th className="px-6 py-4 text-center">Stock</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {shop.products?.length > 0 ? shop.products.map((product) => (
                      <tr key={product.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold">{product.name}</span>
                          <p className="text-[10px] text-muted-foreground">Added on {format(new Date(product.createdAt), 'PP')}</p>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-sm">৳ {product.price}</td>
                        <td className="px-6 py-4 text-center">
                          <Badge variant="outline" className="text-[10px] font-bold">
                            {product.stock} in stock
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <StatusBadge status={product.status === 'active' ? 'active' : 'pending'} className="text-[10px]" />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-amber-500">
                              <ShieldAlert size={14} />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-sm italic text-muted-foreground">
                          This shop hasn't listed any products yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-border/50 p-8">
              <ActivityTimeline items={shop.auditLogs?.map(log => ({
                id: log.id,
                action: log.action,
                timestamp: log.createdAt,
                details: log.details
              })) || []} />
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <ConfirmationDialog 
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        onConfirm={() => handleAction('delete')}
        title="Destroy Shop Profile?"
        description="This will permanently delete the shop and all its data. This cannot be undone."
      />
      
      <ConfirmationDialog 
        open={confirmSuspend}
        onOpenChange={setConfirmSuspend}
        onConfirm={() => handleAction('suspend')}
        title="Suspend Shop?"
        description="This will hide the shop and all its products from the marketplace until reinstated."
        confirmText="Confirm Suspension"
      />
    </div>
  );
}
