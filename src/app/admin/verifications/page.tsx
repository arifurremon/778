"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  Store,
  Briefcase,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  MapPin,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { AdminEmptyState } from "@/components/admin/admin-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface PendingUser {
  id: string;
  name: string | null;
  email: string;
  username: string | null;
  profileImage: string | null;
  location: string | null;
  verificationReason: string | null;
  verificationRequestStatus: string;
  registrationStatus: string;
  serviceRegistrationStatus: string;
  createdAt: string;
  shop: { name: string; category: string; location: string } | null;
  expertService: { profession: string; category: string; location: string; bio: string } | null;
}

interface PendingData {
  residents: PendingUser[];
  shops: PendingUser[];
  services: PendingUser[];
}

export default function AdminVerificationsPage() {
  const [data, setData] = useState<PendingData>({ residents: [], shops: [], services: [] });
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState<{ userId: string; type: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const [residents, shops, services] = await Promise.all([
        fetch("/api/admin/users?filter=all&limit=50&search=").then((r) => r.json()),
        fetch("/api/admin/shops?verified=false&limit=50").then((r) => r.json()),
        fetch("/api/admin/services?limit=50").then((r) => r.json()),
      ]);

      // Filter to pending only from users
      const allUsers = (residents.users ?? []) as PendingUser[];
      setData({
        residents: allUsers.filter((u: PendingUser) => u.verificationRequestStatus === "PENDING"),
        shops: allUsers.filter((u: PendingUser) => u.registrationStatus === "PENDING"),
        services: allUsers.filter((u: PendingUser) => u.serviceRegistrationStatus === "PENDING"),
      });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to load pending verifications." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchPending(); }, []);

  const handleAction = async (userId: string, type: string, action: "approve" | "reject", reason?: string) => {
    setProcessing(userId);
    try {
      const { adminApi } = await import("@/lib/admin-api");
      await adminApi.post(`/api/admin/verify/${userId}`, { action, type, reason });
      toast({
        title: action === "approve" ? "✅ Approved" : "❌ Rejected",
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} application ${action}d.`,
      });
      void fetchPending();
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Action failed. Please try again." });
    } finally {
      setProcessing(null);
      setRejectModal(null);
      setRejectReason("");
    }
  };

  const totalPending = data.residents.length + data.shops.length + data.services.length;

  function VerificationCard({
    user,
    type,
    colorClass,
    detail,
  }: {
    user: PendingUser;
    type: string;
    colorClass: string;
    detail: React.ReactNode;
  }) {
    const isProcessing = processing === user.id;
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card/40 border border-border/50 rounded-2xl p-6 space-y-4 hover:border-border transition-colors"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 border-2 border-border/30">
              <AvatarImage src={user.profileImage ?? ""} />
              <AvatarFallback className="font-bold">{user.name?.[0] ?? "U"}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm">{user.name ?? "Unknown"}</h3>
                <Badge className={cn("text-[9px] px-1.5 py-0.5", colorClass)}>
                  <Clock size={9} className="mr-1" />
                  Pending
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{user.email}</p>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                <MapPin size={9} className="text-accent" />
                {user.location ?? "No location"}
              </div>
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground/60 text-right">
            Applied {new Date(user.createdAt).toLocaleDateString()}
          </div>
        </div>

        {/* Application Details */}
        <div className="bg-background/40 rounded-xl p-4 border border-border/30 space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <FileText size={9} />
            Application Details
          </div>
          {detail}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => void handleAction(user.id, type, "approve")}
            disabled={isProcessing}
            className="flex-1 h-9 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl"
          >
            <CheckCircle2 size={13} className="mr-1.5" />
            {isProcessing ? "Processing…" : "Approve"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setRejectModal({ userId: user.id, type, name: user.name ?? "User" })}
            disabled={isProcessing}
            className="flex-1 h-9 text-xs font-bold text-destructive hover:bg-destructive/10 rounded-xl border border-destructive/20"
          >
            <XCircle size={13} className="mr-1.5" />
            Reject
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-teal-400 mb-2">
          <BadgeCheck size={12} />
          Verification Queue
        </div>
        <h1 className="text-2xl font-black tracking-tight">Pending Verifications</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {loading ? "Loading…" : `${totalPending} applications awaiting review`}
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : (
        <Tabs defaultValue="residents">
          <TabsList className="bg-card/20 border border-border/50 p-1 rounded-2xl w-full">
            <TabsTrigger value="residents" className="flex-1 rounded-xl text-xs font-bold">
              <BadgeCheck size={13} className="mr-1.5" />
              Residents ({data.residents.length})
            </TabsTrigger>
            <TabsTrigger value="shops" className="flex-1 rounded-xl text-xs font-bold">
              <Store size={13} className="mr-1.5" />
              Shops ({data.shops.length})
            </TabsTrigger>
            <TabsTrigger value="services" className="flex-1 rounded-xl text-xs font-bold">
              <Briefcase size={13} className="mr-1.5" />
              Services ({data.services.length})
            </TabsTrigger>
          </TabsList>

          {/* Resident Verifications */}
          <TabsContent value="residents" className="mt-4 space-y-4">
            {data.residents.length === 0 ? (
              <AdminEmptyState icon={<CheckCircle2 size={40} />} title="All clear!" description="No pending resident verifications." />
            ) : (
              data.residents.map((user) => (
                <VerificationCard
                  key={user.id}
                  user={user}
                  type="resident"
                  colorClass="bg-teal-400/10 text-teal-400 border-teal-400/20"
                  detail={
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {user.verificationReason ?? "No reason provided."}
                    </p>
                  }
                />
              ))
            )}
          </TabsContent>

          {/* Shop Approvals */}
          <TabsContent value="shops" className="mt-4 space-y-4">
            {data.shops.length === 0 ? (
              <AdminEmptyState icon={<CheckCircle2 size={40} />} title="All clear!" description="No pending shop applications." />
            ) : (
              data.shops.map((user) => (
                <VerificationCard
                  key={user.id}
                  user={user}
                  type="shop"
                  colorClass="bg-amber-400/10 text-amber-400 border-amber-400/20"
                  detail={
                    user.shop ? (
                      <div className="space-y-1">
                        <p className="text-sm font-bold">{user.shop.name}</p>
                        <p className="text-xs text-muted-foreground">{user.shop.category} · {user.shop.location}</p>
                      </div>
                    ) : <p className="text-xs text-muted-foreground italic">No shop details available.</p>
                  }
                />
              ))
            )}
          </TabsContent>

          {/* Service Approvals */}
          <TabsContent value="services" className="mt-4 space-y-4">
            {data.services.length === 0 ? (
              <AdminEmptyState icon={<CheckCircle2 size={40} />} title="All clear!" description="No pending service applications." />
            ) : (
              data.services.map((user) => (
                <VerificationCard
                  key={user.id}
                  user={user}
                  type="service"
                  colorClass="bg-cyan-400/10 text-cyan-400 border-cyan-400/20"
                  detail={
                    user.expertService ? (
                      <div className="space-y-1">
                        <p className="text-sm font-bold">{user.expertService.profession}</p>
                        <p className="text-xs text-muted-foreground">{user.expertService.category} · {user.expertService.location}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{user.expertService.bio}</p>
                      </div>
                    ) : <p className="text-xs text-muted-foreground italic">No service details available.</p>
                  }
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Reject Dialog */}
      <Dialog open={!!rejectModal} onOpenChange={(o) => !o && setRejectModal(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              You are rejecting the application from <span className="font-bold text-foreground">{rejectModal?.name}</span>. Please provide a reason (optional).
            </p>
            <div className="space-y-2">
              <Label htmlFor="reject-reason" className="text-xs font-bold uppercase tracking-widest">Reason</Label>
              <Textarea
                id="reject-reason"
                placeholder="e.g. Insufficient information provided, please reapply with valid documents."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="rounded-xl resize-none"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setRejectModal(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="rounded-xl"
              onClick={() => {
                if (rejectModal) {
                  void handleAction(rejectModal.userId, rejectModal.type, "reject", rejectReason || undefined);
                }
              }}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
