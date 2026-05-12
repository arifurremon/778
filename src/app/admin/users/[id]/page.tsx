"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Users,
  ArrowLeft,
  BadgeCheck,
  ShieldCheck,
  Store,
  Briefcase,
  FileText,
  MessageSquare,
  MapPin,
  Phone,
  Mail,
  Calendar,
  MoreHorizontal,
  Trash2,
  RotateCcw,
  UserCheck,
  UserX,
  AlertCircle,
  Star,
  Activity,
  Clock,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UserDetail {
  id: string;
  name: string | null;
  email: string;
  username: string | null;
  profileImage: string | null;
  mobile: string | null;
  location: string | null;
  dob: string | null;
  joinDate: string | null;
  isAdmin: boolean;
  isVerified: boolean;
  isSeller: boolean;
  isServiceProvider: boolean;
  registrationStatus: string;
  serviceRegistrationStatus: string;
  verificationRequestStatus: string;
  verificationReason: string | null;
  emailVerified: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  _count: {
    posts: number;
    comments: number;
    sentRequests: number;
    receivedRequests: number;
  };
  shop: {
    id: string;
    name: string;
    category: string;
    isVerified: boolean;
    rating: number;
    trustScore: number;
    _count: { products: number };
  } | null;
  expertService: {
    id: string;
    profession: string;
    category: string;
    rating: number;
    experienceYears: number;
  } | null;
  activityLogs: {
    id: string;
    type: string;
    description: string;
    createdAt: string;
  }[];
}

function InfoRow({ label, value, icon: Icon }: { label: string; value: string | null | undefined; icon?: React.ElementType }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3 py-2 border-b border-border/20 last:border-0">
      {Icon && <Icon size={14} className="text-muted-foreground shrink-0" />}
      <span className="text-xs font-medium text-muted-foreground min-w-[100px]">{label}</span>
      <span className="text-xs font-semibold text-foreground flex-1">{value}</span>
    </div>
  );
}

function StatusBadge({ status, map }: { status: string; map: Record<string, { label: string; className: string }> }) {
  const cfg = map[status] ?? { label: status, className: "bg-muted text-muted-foreground" };
  return <Badge className={cn("text-[9px] px-2 py-0.5 font-bold border-0", cfg.className)}>{cfg.label}</Badge>;
}

const REG_STATUS_MAP: Record<string, { label: string; className: string }> = {
  NONE: { label: "None", className: "bg-muted text-muted-foreground" },
  PENDING: { label: "Pending", className: "bg-blue-400/10 text-blue-400" },
  APPROVED: { label: "Approved", className: "bg-emerald-400/10 text-emerald-400" },
  REJECTED: { label: "Rejected", className: "bg-red-400/10 text-red-400" },
};

const ACTIVITY_ICONS: Record<string, string> = {
  LIKE: "👍",
  COMMENT: "💬",
  SAVED: "🔖",
  SYSTEM: "⚙️",
  POPULAR: "🔥",
};

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState<{ action: string; label: string } | null>(null);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch(`/api/admin/users/${id}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json() as UserDetail;
        setUser(data);
      } catch {
        toast({ variant: "destructive", title: "Error", description: "Failed to load user." });
      } finally {
        setLoading(false);
      }
    };
    void fetch_();
  }, [id]);

  const handleAction = async (action: string) => {
    setActing(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: [id], action }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Success", description: `Action '${action}' applied.` });
      // Refetch
      const fresh = await fetch(`/api/admin/users/${id}`);
      if (fresh.ok) setUser(await fresh.json() as UserDetail);
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Action failed." });
    } finally {
      setActing(false);
      setConfirmAction(null);
    }
  };

  if (loading) return <UserDetailSkeleton />;

  if (!user) return (
    <div className="p-8 text-center">
      <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4 opacity-50" />
      <p className="text-sm font-bold text-muted-foreground">User not found</p>
      <Link href="/admin/users"><Button variant="outline" className="mt-4">Back to Users</Button></Link>
    </div>
  );

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link href="/admin/users">
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs rounded-xl text-muted-foreground">
            <ArrowLeft size={13} /> All Users
          </Button>
        </Link>
      </div>

      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card/40 border border-border/50 rounded-2xl overflow-hidden"
      >
        {/* Cover */}
        <div className="h-24 bg-gradient-to-r from-violet-500/20 via-purple-500/10 to-transparent" />
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <Avatar className="w-20 h-20 border-4 border-background shadow-xl">
              <AvatarImage src={user.profileImage ?? ""} />
              <AvatarFallback className="text-2xl font-black bg-violet-500/10 text-violet-400">
                {user.name?.[0] ?? user.email[0]?.toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-2 mb-2">
              {user.deletedAt ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs rounded-xl gap-1.5 text-emerald-500 border-emerald-500/30"
                  onClick={() => setConfirmAction({ action: "restore", label: "Restore this user?" })}
                  disabled={acting}
                >
                  <RotateCcw size={12} /> Restore
                </Button>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs rounded-xl gap-1.5"
                    onClick={() => setConfirmAction({ action: user.isVerified ? "unverify" : "verify", label: user.isVerified ? "Remove verification?" : "Verify this user?" })}
                    disabled={acting}
                  >
                    <UserCheck size={12} /> {user.isVerified ? "Unverify" : "Verify"}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 w-8 rounded-xl p-0">
                        <MoreHorizontal size={14} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 rounded-xl">
                      <DropdownMenuItem
                        className="text-xs"
                        onClick={() => setConfirmAction({ action: user.isAdmin ? "removeAdmin" : "makeAdmin", label: user.isAdmin ? "Remove admin role?" : "Grant admin role?" })}
                      >
                        <ShieldCheck size={12} className="mr-2" />
                        {user.isAdmin ? "Remove Admin" : "Make Admin"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-xs text-destructive focus:text-destructive"
                        onClick={() => setConfirmAction({ action: "delete", label: "Soft-delete this user? They can be restored." })}
                      >
                        <Trash2 size={12} className="mr-2" />
                        Soft Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-xl font-black">{user.name ?? "—"}</h1>
            {user.isVerified && <BadgeCheck size={18} className="text-cyan-400" />}
            {user.isAdmin && <Badge className="text-[9px] bg-rose-500/10 text-rose-400 border-rose-500/20 px-2">Admin</Badge>}
            {user.deletedAt && <Badge variant="destructive" className="text-[9px]">Deleted</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          {user.username && <p className="text-xs text-muted-foreground/60">@{user.username}</p>}

          {/* Role chips */}
          <div className="flex flex-wrap gap-2 mt-3">
            {user.isSeller && <Badge className="text-[10px] bg-amber-400/10 text-amber-400 border-amber-400/20 px-2.5">🛍️ Seller</Badge>}
            {user.isServiceProvider && <Badge className="text-[10px] bg-cyan-400/10 text-cyan-400 border-cyan-400/20 px-2.5">🧑‍💼 Expert</Badge>}
            {!user.isSeller && !user.isServiceProvider && !user.isAdmin && (
              <Badge variant="secondary" className="text-[10px] px-2.5">👤 Regular User</Badge>
            )}
          </div>
        </div>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Posts", value: user._count.posts, icon: FileText, color: "text-emerald-400" },
          { label: "Comments", value: user._count.comments, icon: MessageSquare, color: "text-blue-400" },
          { label: "Connections Sent", value: user._count.sentRequests, icon: Users, color: "text-violet-400" },
          { label: "Connections Rcvd", value: user._count.receivedRequests, icon: Users, color: "text-cyan-400" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card/40 border border-border/50 rounded-2xl p-4 text-center"
            >
              <Icon size={16} className={cn("mx-auto mb-2", stat.color)} />
              <div className="text-2xl font-black tabular-nums">{stat.value}</div>
              <div className="text-[10px] text-muted-foreground font-medium mt-0.5">{stat.label}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info">
        <TabsList className="bg-card/20 border border-border/50 p-1 rounded-2xl">
          <TabsTrigger value="info" className="rounded-xl text-xs font-bold">Info & Status</TabsTrigger>
          {user.shop && <TabsTrigger value="shop" className="rounded-xl text-xs font-bold">Shop</TabsTrigger>}
          {user.expertService && <TabsTrigger value="service" className="rounded-xl text-xs font-bold">Service</TabsTrigger>}
          <TabsTrigger value="activity" className="rounded-xl text-xs font-bold">Activity Log</TabsTrigger>
        </TabsList>

        {/* Info */}
        <TabsContent value="info" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Personal info */}
            <div className="bg-card/40 border border-border/50 rounded-2xl p-5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Personal Information</h3>
              <div className="space-y-0">
                <InfoRow label="Full Name" value={user.name} icon={Users} />
                <InfoRow label="Email" value={user.email} icon={Mail} />
                <InfoRow label="Mobile" value={user.mobile} icon={Phone} />
                <InfoRow label="Location" value={user.location} icon={MapPin} />
                <InfoRow label="Date of Birth" value={user.dob ? new Date(user.dob).toLocaleDateString() : null} icon={Calendar} />
                <InfoRow label="Joined" value={user.joinDate ?? new Date(user.createdAt).toLocaleDateString()} icon={Calendar} />
                <InfoRow label="Email Verified" value={user.emailVerified ? new Date(user.emailVerified).toLocaleDateString() : "Not verified"} icon={Mail} />
              </div>
            </div>

            {/* Verification status */}
            <div className="bg-card/40 border border-border/50 rounded-2xl p-5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Account Status</h3>
              <div className="space-y-3">
                {[
                  { label: "Resident Verification", value: user.verificationRequestStatus },
                  { label: "Seller Registration", value: user.registrationStatus },
                  { label: "Expert Registration", value: user.serviceRegistrationStatus },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                    <span className="text-xs text-muted-foreground font-medium">{row.label}</span>
                    <StatusBadge status={row.value} map={REG_STATUS_MAP} />
                  </div>
                ))}
                {user.verificationReason && (
                  <div className="bg-muted/30 rounded-xl p-3 mt-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Verification Reason</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{user.verificationReason}</p>
                  </div>
                )}
                <div className="flex items-center justify-between py-2">
                  <span className="text-xs text-muted-foreground font-medium">Admin Privileges</span>
                  <Badge className={user.isAdmin ? "text-[9px] bg-rose-500/10 text-rose-400" : "text-[9px] bg-muted text-muted-foreground"}>
                    {user.isAdmin ? "Yes" : "No"}
                  </Badge>
                </div>
                {user.deletedAt && (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-xs text-muted-foreground font-medium">Deleted At</span>
                    <span className="text-xs font-bold text-destructive">{new Date(user.deletedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Shop */}
        {user.shop && (
          <TabsContent value="shop" className="mt-4">
            <div className="bg-card/40 border border-border/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base">{user.shop.name}</h3>
                    {user.shop.isVerified && <BadgeCheck size={15} className="text-amber-400" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{user.shop.category}</p>
                </div>
                <Link href={`/admin/shops/${user.shop.id}`}>
                  <Button size="sm" variant="outline" className="h-8 text-xs rounded-xl">View Full Shop</Button>
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Rating", value: user.shop.rating.toFixed(1), icon: Star },
                  { label: "Trust Score", value: String(user.shop.trustScore), icon: ShieldCheck },
                  { label: "Products", value: String(user.shop._count.products), icon: Store },
                ].map((s) => {
                  const Icon = s.icon;
                  return (
                    <div key={s.label} className="bg-background/40 rounded-xl p-4 text-center">
                      <Icon size={14} className="text-amber-400 mx-auto mb-1.5" />
                      <div className="text-lg font-black">{s.value}</div>
                      <div className="text-[10px] text-muted-foreground">{s.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>
        )}

        {/* Expert Service */}
        {user.expertService && (
          <TabsContent value="service" className="mt-4">
            <div className="bg-card/40 border border-border/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-bold text-base">{user.expertService.profession}</h3>
                  <p className="text-xs text-cyan-400 font-semibold">{user.expertService.category}</p>
                </div>
                <Link href={`/admin/services/${user.expertService.id}`}>
                  <Button size="sm" variant="outline" className="h-8 text-xs rounded-xl">View Full Profile</Button>
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Rating", value: user.expertService.rating.toFixed(1) },
                  { label: "Experience", value: `${user.expertService.experienceYears}y` },
                ].map((s) => (
                  <div key={s.label} className="bg-background/40 rounded-xl p-4 text-center">
                    <div className="text-lg font-black">{s.value}</div>
                    <div className="text-[10px] text-muted-foreground">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        )}

        {/* Activity */}
        <TabsContent value="activity" className="mt-4">
          <div className="bg-card/40 border border-border/50 rounded-2xl p-6">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <Activity size={14} className="text-blue-400" />
              Recent Activity
            </h3>
            {user.activityLogs.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No activity recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {user.activityLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 py-3 border-b border-border/20 last:border-0">
                    <div className="w-8 h-8 rounded-lg bg-muted/40 flex items-center justify-center text-sm shrink-0">
                      {ACTIVITY_ICONS[log.type] ?? "📋"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground">{log.description}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Clock size={9} />
                        {new Date(log.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-[9px] shrink-0">{log.type}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Confirm Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={(o) => !o && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
            <AlertDialogDescription>{confirmAction?.label}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={acting}
              onClick={() => confirmAction && void handleAction(confirmAction.action)}
              className={confirmAction?.action === "delete" ? "bg-destructive hover:bg-destructive/90" : ""}
            >
              {acting ? "Processing…" : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function UserDetailSkeleton() {
  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
      <Skeleton className="h-8 w-32 rounded-xl" />
      <Skeleton className="h-48 rounded-2xl" />
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}
