"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  Briefcase,
  Star,
  MapPin,
  Clock,
  BadgeCheck,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Award,
  DollarSign,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ServiceDetail {
  id: string;
  profession: string;
  category: string;
  location: string;
  experienceYears: number;
  fee: string;
  bio: string;
  qualifications: string[];
  rating: number;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    profileImage: string | null;
    isVerified: boolean;
    isServiceProvider: boolean;
    serviceRegistrationStatus: string;
    mobile: string | null;
    location: string | null;
    createdAt: string;
    activityLogs: {
      id: string;
      type: string;
      description: string;
      createdAt: string;
    }[];
  };
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  NONE: { label: "Not Applied", className: "bg-muted text-muted-foreground" },
  PENDING: { label: "Pending Review", className: "bg-blue-400/10 text-blue-400" },
  APPROVED: { label: "Certified Expert", className: "bg-emerald-400/10 text-emerald-400" },
  REJECTED: { label: "Rejected", className: "bg-red-400/10 text-red-400" },
};

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [service, setService] = useState<ServiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch(`/api/admin/services/${id}`);
        if (!res.ok) throw new Error();
        setService(await res.json() as ServiceDetail);
      } catch {
        toast({ variant: "destructive", title: "Error", description: "Failed to load service." });
      } finally {
        setLoading(false);
      }
    };
    void fetch_();
  }, [id]);

  const handleApprove = async (approve: boolean) => {
    if (!service) return;
    setActing(true);
    try {
      const { adminApi } = await import("@/lib/admin-api");
      await adminApi.post(`/api/admin/verify/${service.user.id}`, {
        action: approve ? "approve" : "reject",
        type: "service",
      });
      const newStatus = approve ? "APPROVED" : "REJECTED";
      setService((s) => s ? { ...s, user: { ...s.user, serviceRegistrationStatus: newStatus, isServiceProvider: approve } } : s);
      toast({ title: approve ? "✅ Expert Certified" : "❌ Application Rejected" });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Action failed." });
    } finally {
      setActing(false);
    }
  };

  if (loading) return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-4">
      <Skeleton className="h-8 w-32 rounded-xl" />
      <Skeleton className="h-52 rounded-2xl" />
      <Skeleton className="h-36 rounded-2xl" />
    </div>
  );

  if (!service) return (
    <div className="p-8 text-center">
      <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4 opacity-50" />
      <p className="text-sm font-bold text-muted-foreground">Service not found</p>
      <Link href="/admin/services"><Button variant="outline" className="mt-4">Back to Services</Button></Link>
    </div>
  );

  const statusFallback = { label: "Unknown", className: "bg-muted text-muted-foreground" };
  const status = STATUS_MAP[service.user.serviceRegistrationStatus] ?? statusFallback;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-4xl mx-auto">
      <Link href="/admin/services">
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs rounded-xl text-muted-foreground">
          <ArrowLeft size={13} /> All Services
        </Button>
      </Link>

      {/* Expert Profile */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card/40 border border-border/50 rounded-2xl p-6"
      >
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <Link href={`/admin/users/${service.user.id}`}>
            <Avatar className="w-20 h-20 border-2 border-cyan-400/20 cursor-pointer hover:border-cyan-400/60 transition-colors">
              <AvatarImage src={service.user.profileImage ?? ""} />
              <AvatarFallback className="text-2xl font-black bg-cyan-400/10 text-cyan-400">
                {service.user.name?.[0] ?? "E"}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <Link href={`/admin/users/${service.user.id}`}>
                <h1 className="text-xl font-black hover:text-primary transition-colors">{service.user.name ?? "—"}</h1>
              </Link>
              {service.user.isVerified && <BadgeCheck size={18} className="text-cyan-400" />}
              {service.user.isServiceProvider && <ShieldCheckIcon />}
            </div>
            <p className="text-sm font-semibold text-cyan-400">{service.profession}</p>
            <p className="text-xs text-muted-foreground">{service.category}</p>

            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5"><MapPin size={11} className="text-accent" />{service.location}</div>
              <div className="flex items-center gap-1.5"><Clock size={11} />{service.experienceYears} years experience</div>
              <div className="flex items-center gap-1.5"><DollarSign size={11} className="text-emerald-400" />{service.fee}</div>
              <div className="flex items-center gap-1.5"><Star size={11} className="text-amber-400 fill-amber-400" />{service.rating.toFixed(1)}</div>
            </div>

            <div className="flex items-center gap-3 mt-3">
              <Badge className={cn("text-[10px] px-2.5 py-0.5 font-bold", status.className)}>{status.label}</Badge>
              {service.user.serviceRegistrationStatus === "PENDING" && (
                <>
                  <Button size="sm" onClick={() => void handleApprove(true)} disabled={acting}
                    className="h-7 text-[10px] font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg px-3">
                    <CheckCircle2 size={11} className="mr-1" /> Certify
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => void handleApprove(false)} disabled={acting}
                    className="h-7 text-[10px] text-destructive hover:bg-destructive/10 rounded-lg">
                    <XCircle size={11} className="mr-1" /> Reject
                  </Button>
                </>
              )}
              {service.user.serviceRegistrationStatus === "APPROVED" && (
                <Button size="sm" variant="ghost" onClick={() => void handleApprove(false)} disabled={acting}
                  className="h-7 text-[10px] text-destructive hover:bg-destructive/10 rounded-lg">
                  Revoke Certification
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bio */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card/40 border border-border/50 rounded-2xl p-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Professional Bio</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{service.bio || "No bio provided."}</p>
        </motion.div>

        {/* Qualifications */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-card/40 border border-border/50 rounded-2xl p-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
            <Award size={12} /> Qualifications
          </h3>
          {service.qualifications.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No qualifications listed.</p>
          ) : (
            <ul className="space-y-2">
              {service.qualifications.map((q, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                  <span className="text-muted-foreground">{q}</span>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>

      {/* Contact */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-card/40 border border-border/50 rounded-2xl p-5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Contact Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2"><Mail size={12} /> {service.user.email}</div>
          {service.user.mobile && <div className="flex items-center gap-2"><Phone size={12} /> {service.user.mobile}</div>}
          <div className="flex items-center gap-2"><Calendar size={12} /> Joined {new Date(service.user.createdAt).toLocaleDateString()}</div>
        </div>
      </motion.div>
    </div>
  );
}

function ShieldCheckIcon() {
  return <span className="text-[10px] font-bold bg-cyan-400/10 text-cyan-400 border border-cyan-400/20 rounded-full px-2 py-0.5">Certified</span>;
}
