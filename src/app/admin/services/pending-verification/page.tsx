"use client";

import { format } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    Mail,
    MapPin,
    ShieldCheck,
    XCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';

interface PendingService {
  id: string;
  title: string;
  description: string | null;
  serviceAreas: string[];
  provider: { id: string; name: string; email: string; profileImage: string | null };
  createdAt: string;
}

export default function PendingServiceVerificationPage() {
  const [services, setServices] = useState<PendingService[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Rejection modal state
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean, id: string | null, reason: string }>({
    open: false,
    id: null,
    reason: ""
  });

  useEffect(() => {
    fetchPendingServices();
  }, []);

  const fetchPendingServices = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/services/pending');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setServices(data.services);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to load verification queue." });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setActionLoading(id);
    try {
      const body: Record<string, string> = { action };
      if (action === 'reject') body.reason = rejectDialog.reason;

      const res = await fetch(`/api/admin/services/${id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error();

      toast({ 
        title: action === 'approve' ? "Approved" : "Rejected", 
        description: `Service has been ${action === 'approve' ? 'verified' : 'rejected'}.` 
      });
      
      // Animate out
      setServices(prev => prev.filter(s => s.id !== id));
      setRejectDialog({ open: false, id: null, reason: "" });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Action failed. Please try again." });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-2">
          <ShieldCheck size={12} />
          Moderation Queue
        </div>
        <h1 className="text-3xl font-black tracking-tight italic">Service Provider Verification</h1>
        <p className="text-sm text-muted-foreground mt-1">Review new service listings and provider profiles</p>
      </div>

      {loading ? (
        <div className="grid gap-6">
          {[1, 2].map(i => (
            <Card key={i} className="animate-pulse bg-muted/20 border-border/50 h-64" />
          ))}
        </div>
      ) : services.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-muted/5 rounded-3xl border-2 border-dashed border-border/50">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-4">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Queue Clear!</h2>
          <p className="text-sm text-muted-foreground mt-1 font-medium">All provider requests have been processed.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          <AnimatePresence>
            {services.map((service) => (
              <motion.div
                key={service.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                transition={{ duration: 0.3 }}
              >
                <Card className="overflow-hidden border-border/50 shadow-xl shadow-black/5 hover:border-border transition-all">
                  <CardHeader className="flex flex-row items-start justify-between gap-4 pb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-xl">
                        {service.title[0]}
                      </div>
                      <div className="flex flex-col">
                        <CardTitle className="text-xl font-black tracking-tight">{service.title}</CardTitle>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                          <Clock size={10} /> Requested {format(new Date(service.createdAt), 'PPp')}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-4">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Service Description</Label>
                        <p className="text-sm text-foreground/80 leading-relaxed font-medium">
                          {service.description || 'No description provided.'}
                        </p>
                      </div>
                      <div className="space-y-2 pt-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                          <MapPin size={12} className="text-primary" /> Service Areas
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {service.serviceAreas && service.serviceAreas.length > 0 ? (
                            service.serviceAreas.map((area, idx) => (
                              <Badge key={idx} variant="secondary" className="font-bold text-xs bg-primary/10 text-primary border-primary/20">
                                {area}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Not specified</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-muted/30 rounded-2xl p-4 border border-border/30 space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">Provider Identity</Label>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 ring-2 ring-background">
                          <AvatarImage src={service.provider.profileImage || ""} />
                          <AvatarFallback className="font-bold">{service.provider.name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold">{service.provider.name}</span>
                          <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">{service.provider.email}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="w-full h-8 text-[10px] font-black uppercase tracking-widest gap-2 bg-background border hover:bg-muted transition-colors">
                        <Mail size={12} /> Contact Provider
                      </Button>
                    </div>
                  </CardContent>

                  <CardFooter className="bg-muted/10 border-t border-border/30 flex items-center justify-end gap-2 p-3">
                    <Button 
                      variant="outline" 
                      onClick={() => setRejectDialog({ open: true, id: service.id, reason: "" })}
                      disabled={!!actionLoading}
                      className="h-9 font-bold gap-2 border-rose-500/20 text-rose-600 hover:bg-rose-500/5"
                    >
                      <XCircle size={14} /> Reject
                    </Button>
                    <Button 
                      onClick={() => handleAction(service.id, 'approve')}
                      disabled={!!actionLoading}
                      className="h-9 font-bold gap-2 bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20"
                    >
                      {actionLoading === service.id ? <Clock className="h-4 w-4 animate-spin" /> : <ShieldCheck size={14} />}
                      Approve Provider
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Rejection Modal */}
      <Dialog open={rejectDialog.open} onOpenChange={(o) => setRejectDialog(prev => ({ ...prev, open: o }))}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600 italic">
              <AlertCircle size={20} /> Reject Service Provider
            </DialogTitle>
            <DialogDescription>
              Please provide a detailed reason for rejection. This will be sent to the service provider.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="reason" className="text-xs font-bold uppercase tracking-widest">Rejection Reason (Min 20 chars)</Label>
            <Textarea 
              id="reason"
              placeholder="e.g., The provided identification documents are unclear..."
              value={rejectDialog.reason}
              onChange={(e) => setRejectDialog(prev => ({ ...prev, reason: e.target.value }))}
              className="min-h-[120px] rounded-xl border-border/50 resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectDialog({ open: false, id: null, reason: "" })}>Cancel</Button>
            <Button 
              variant="destructive"
              onClick={() => handleAction(rejectDialog.id!, 'reject')}
              disabled={rejectDialog.reason.length < 20 || !!actionLoading}
              className="font-bold gap-2"
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
