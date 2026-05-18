"use client";

import { format } from 'date-fns';
import {
    AlertCircle,
    Ban,
    Briefcase,
    Calendar,
    CheckCircle2,
    ChevronLeft,
    Clock,
    CreditCard,
    History,
    Mail,
    MapPin,
    MoreHorizontal,
    ShieldAlert,
    ShieldCheck,
    Trash2,
    User
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

interface ServiceBooking {
  id: string;
  customerName: string;
  serviceDate: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  amount: number;
}

interface AdminServiceDetail {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  serviceAreas: string[];
  pricing: string | null;
  isVerified: boolean;
  verifiedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  provider: { id: string; name: string; email: string; profileImage: string | null };
  _count: { bookings: number };
  bookings?: ServiceBooking[];
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

export default function ServiceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [service, setService] = useState<AdminServiceDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Actions states
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmSuspend, setConfirmSuspend] = useState(false);

  useEffect(() => {
    fetchServiceDetails();
  }, [id]);

  const fetchServiceDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/services/${id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setService(data.service);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Service not found." });
      router.push('/admin/services');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string) => {
    try {
      const res = await fetch(`/api/admin/services/${id}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (!res.ok) throw new Error();
      toast({ title: "Success", description: `Service action '${action}' completed.` });
      fetchServiceDetails();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Action failed." });
    }
  };

  if (loading || !service) {
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
              <Link href="/admin/services"><ChevronLeft size={20} /></Link>
            </Button>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg border bg-primary/10 text-primary flex items-center justify-center">
                <Briefcase size={16} />
              </div>
              <h1 className="text-sm font-black tracking-tight truncate">{service.title}</h1>
              <StatusBadge status={service.isVerified ? 'active' : 'pending'} className="text-[10px]" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="hidden md:flex gap-2 rounded-lg font-bold">
              <Mail size={14} /> Contact
            </Button>
            {service.isVerified ? (
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
                  <Ban size={14} className="mr-2" /> Suspend Service
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setConfirmDelete(true)} className="text-destructive">
                  <Trash2 size={14} className="mr-2" /> Delete Service
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
            <TabsTrigger value="bookings" className="rounded-xl px-8 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-background data-[state=active]:shadow-lg">
              Bookings ({service._count.bookings})
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
                          {service.title[0]}
                        </div>
                        <div className="space-y-1">
                          <h2 className="text-2xl font-black tracking-tight">{service.title}</h2>
                          <Badge variant="secondary" className="font-bold text-[10px] uppercase tracking-widest px-2 py-0.5">
                            {service.category || 'General Service'}
                          </Badge>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                            <span className="flex items-center gap-1 font-bold text-primary"><CreditCard size={12} /> {service.pricing || 'Custom Pricing'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="text-center px-4">
                          <div className="text-2xl font-black">4.9</div>
                          <div className="text-[8px] font-black uppercase text-muted-foreground">Rating</div>
                        </div>
                        <div className="text-center px-4 border-l">
                          <div className="text-2xl font-black">{service._count.bookings}</div>
                          <div className="text-[8px] font-black uppercase text-muted-foreground">Bookings</div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6">
                    <div className="prose prose-sm max-w-none">
                      <p className="text-sm text-foreground/80 leading-relaxed font-medium">
                        {service.description || 'No detailed description available for this service.'}
                      </p>
                    </div>
                    
                    <div className="pt-4 border-t border-border/30">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1 mb-3">
                        <MapPin size={12} /> Service Areas
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {service.serviceAreas && service.serviceAreas.length > 0 ? (
                          service.serviceAreas.map((area, idx) => (
                            <Badge key={idx} variant="outline" className="font-bold text-xs bg-muted/20 border-border/50">
                              {area}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Not specified</span>
                        )}
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
                      {service.verificationHistory?.length > 0 ? service.verificationHistory.map((item) => (
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

              {/* Sidebar: Provider Info */}
              <div className="space-y-8">
                <Card className="border-border/50 shadow-xl shadow-black/5 bg-muted/10">
                  <CardHeader>
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Service Provider</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-16 h-16 ring-4 ring-background shadow-xl">
                        <AvatarImage src={service.provider.profileImage || ""} />
                        <AvatarFallback className="text-xl font-black">{service.provider.name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <h4 className="text-lg font-black tracking-tight">{service.provider.name}</h4>
                        <span className="text-xs text-muted-foreground font-medium">{service.provider.email}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full justify-start gap-3 rounded-xl border-border/50 font-bold" asChild>
                        <Link href={`/admin/users/${service.provider.id}`}><User size={14} /> View Profile</Link>
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
                    <h4 className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-4">Service Performance</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-2xl font-black">৳ ২.১ক</div>
                        <div className="text-[8px] font-bold uppercase opacity-80">Total Earned</div>
                      </div>
                      <div>
                        <div className="text-2xl font-black">৮৫%</div>
                        <div className="text-[8px] font-bold uppercase opacity-80">Completion Rate</div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="bookings" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-border/50 overflow-hidden shadow-xl shadow-black/5">
              {!service.bookings || service.bookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 bg-muted/5">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                    <Calendar size={32} />
                  </div>
                  <h2 className="text-lg font-black tracking-tight">Bookings coming soon</h2>
                  <p className="text-sm text-muted-foreground mt-1 text-center max-w-sm">
                    Once users start booking this service, the schedule and transaction details will appear here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-muted/50 border-b border-border/50 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      <tr>
                        <th className="px-6 py-4">Customer Name</th>
                        <th className="px-6 py-4 text-center">Service Date</th>
                        <th className="px-6 py-4 text-center">Amount</th>
                        <th className="px-6 py-4 text-center">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {service.bookings.map((booking) => (
                        <tr key={booking.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-6 py-4">
                            <span className="text-sm font-bold">{booking.customerName}</span>
                          </td>
                          <td className="px-6 py-4 text-center text-xs font-medium">
                            {format(new Date(booking.serviceDate), 'PP')}
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-sm">৳ {booking.amount}</td>
                          <td className="px-6 py-4 text-center">
                            <StatusBadge status={booking.status} className="text-[10px]" />
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button variant="ghost" size="sm" className="text-xs font-bold text-primary">
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-border/50 p-8">
              <ActivityTimeline items={service.auditLogs?.map(log => ({
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
        title="Destroy Service Profile?"
        description="This will permanently delete the service listing and all its booking data. This cannot be undone."
      />
      
      <ConfirmationDialog 
        open={confirmSuspend}
        onOpenChange={setConfirmSuspend}
        onConfirm={() => handleAction('suspend')}
        title="Suspend Service?"
        description="This will hide the service from the platform and prevent any new bookings until reinstated."
        confirmText="Confirm Suspension"
      />
    </div>
  );
}
