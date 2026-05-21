"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlobalUserBadges } from "@/components/user/global-user-badges";
import { useAuth } from "@/hooks/use-auth";
import { useCommunity } from "@/hooks/use-community";
import { toast } from "@/hooks/use-toast";
import PostCard from "@/components/community/post-card";
import Layout from "../../dashboard/layout";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import {
  MapPin, Briefcase, Cake, Clock, Users,
  Grid3x3, ShieldCheck, Mail, Phone, Lock, Check, UserPlus, UserMinus, UserCheck, X
} from "lucide-react";
import { differenceInYears, format, parseISO } from "date-fns";

type ProfileData = {
  id: string;
  email: string | null;
  mobile: string | null;
  username: string;
  name: string | null;
  preferredName: string | null;
  location: string | null;
  profession: string | null;
  bio: string | null;
  dob: string | null;
  profileImage: string | null;
  joinDate: string | null;
  isVerified: boolean;
  isSeller: boolean;
  isServiceProvider: boolean;
  showShopBadge: boolean;
  showExpertBadge: boolean;
  showFullAge: boolean;
  showBirthdayOnly: boolean;
  neighboursCount: number;
  mutualNeighboursCount: number;
};

type ConnectionStatus = "NONE" | "PENDING_SENT" | "PENDING_RECEIVED" | "ACCEPTED" | "SELF";

export default function PublicProfilePage() {
  const { username } = useParams() as { username: string };
  const { user: currentUser } = useAuth();
  const { posts } = useCommunity();
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("NONE");
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    if (currentUser?.username === username) {
      router.push("/profile");
      return;
    }

    const fetchProfile = async () => {
      try {
        const data = await api.get<any>(`/api/user/profile/${username}`);
        setProfile(data.profile);
        setStatus(data.connectionStatus);
        setConnectionId(data.connectionId);
      } catch (err: any) {
        if (err.response?.status === 404 || err.message?.includes('404')) {
          toast({ variant: "destructive", title: "Resident Not Found" });
          router.push("/directory");
        } else {
          toast({ variant: "destructive", title: "Error loading profile" });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [username, currentUser, router]);

  const userPosts = useMemo(() => posts.filter(p => p.author.username === username), [posts, username]);

  const ageData = useMemo(() => {
    if (!profile?.dob) return null;
    const d = parseISO(profile.dob);
    return { age: differenceInYears(new Date(), d), birthday: format(d, "d MMMM") };
  }, [profile?.dob]);

  const handleAction = async (actionType: "add" | "cancel" | "accept" | "reject" | "remove") => {
    if (!currentUser) {
      toast({ title: "Please login", description: "You need to be logged in to connect with neighbours." });
      return;
    }
    setIsActionLoading(true);
    try {
      if (actionType === "add" && profile) {
        const data = await api.post<any>("/api/neighbours/requests", { receiverId: profile.id });
        setStatus("PENDING_SENT");
        setConnectionId(data.id);
        toast({ title: "Request Sent" });
      } else if (actionType === "cancel" && connectionId) {
        await api.del(`/api/neighbours/requests/${connectionId}`);
        setStatus("NONE");
        setConnectionId(null);
        toast({ title: "Request Cancelled" });
      } else if (actionType === "accept" && connectionId) {
        await api.patch(`/api/neighbours/requests/${connectionId}`, { action: "accept" });
        setStatus("ACCEPTED");
        toast({ title: "Trust Established", description: `You and @${username} are now neighbours.` });
        setProfile(prev => prev ? { ...prev, neighboursCount: prev.neighboursCount + 1 } : null);
      } else if (actionType === "reject" && connectionId) {
        await api.patch(`/api/neighbours/requests/${connectionId}`, { action: "reject" });
        setStatus("NONE");
        setConnectionId(null);
        toast({ title: "Request Ignored" });
      } else if (actionType === "remove" && connectionId) {
        await api.del(`/api/neighbours/${connectionId}`);
        setStatus("NONE");
        setConnectionId(null);
        toast({ title: "Connection Removed" });
        setProfile(prev => prev ? { ...prev, neighboursCount: Math.max(0, prev.neighboursCount - 1) } : null);
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Action failed", description: err.response?.data?.error || err.message || "Something went wrong." });
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center text-muted-foreground font-bold">
          <span className="w-6 h-6 border-4 border-accent border-t-transparent rounded-full animate-spin mr-3" />
          Loading Profile...
        </div>
      </Layout>
    );
  }

  if (!profile) return null;

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-24 md:pb-10">
          
          {/* ── Profile Header Card ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-6 rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden"
          >
            <div className="h-24 bg-gradient-to-r from-blue-600/20 via-indigo-500/15 to-purple-500/20" />

            <div className="px-5 sm:px-8 pb-6">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-12">
                <Avatar className="w-24 h-24 sm:w-28 sm:h-28 border-4 border-card ring-2 ring-border/40 shadow-lg relative z-10">
                  <AvatarImage src={profile.profileImage || ""} className="object-cover" />
                  <AvatarFallback className="text-3xl font-black bg-muted text-muted-foreground">
                    {profile.name?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Connection Action Buttons */}
                <div className="flex flex-wrap gap-2 pb-1 z-10 relative">
                  {status === "NONE" && (
                    <Button onClick={() => handleAction("add")} disabled={isActionLoading} className="rounded-xl font-bold text-xs h-9 bg-accent text-accent-foreground shadow-sm">
                      <UserPlus size={14} className="mr-2" /> Add Neighbour
                    </Button>
                  )}
                  {status === "PENDING_SENT" && (
                    <Button onClick={() => handleAction("cancel")} disabled={isActionLoading} variant="outline" className="rounded-xl font-bold text-xs h-9">
                      <Clock size={14} className="mr-2" /> Cancel Request
                    </Button>
                  )}
                  {status === "PENDING_RECEIVED" && (
                    <div className="flex gap-2">
                      <Button onClick={() => handleAction("accept")} disabled={isActionLoading} className="rounded-xl font-bold text-xs h-9 bg-emerald-600 text-white">
                        <Check size={14} className="mr-2" /> Accept
                      </Button>
                      <Button onClick={() => handleAction("reject")} disabled={isActionLoading} variant="outline" className="rounded-xl font-bold text-xs h-9 text-destructive border-destructive/30 hover:bg-destructive/10">
                        <X size={14} className="mr-2" /> Ignore
                      </Button>
                    </div>
                  )}
                  {status === "ACCEPTED" && (
                    <Button onClick={() => handleAction("remove")} disabled={isActionLoading} variant="outline" className="rounded-xl font-bold text-xs h-9 border-emerald-500/30 text-emerald-600 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 group">
                      <UserCheck size={14} className="mr-2 group-hover:hidden" />
                      <UserMinus size={14} className="mr-2 hidden group-hover:block" />
                      <span className="group-hover:hidden">Neighbours ✓</span>
                      <span className="hidden group-hover:block">Disconnect</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="mt-4 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight">{profile.name || "Resident"}</h1>
                  <GlobalUserBadges user={profile as any} size={18} />
                  {profile.isVerified && (
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-bold">
                      <ShieldCheck size={10} className="mr-1" /> Verified
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground font-medium">@{profile.username}</p>
                {profile.bio && <p className="text-sm text-foreground/80 mt-2 leading-relaxed max-w-xl">{profile.bio}</p>}
              </div>

              {/* Meta info row */}
              <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4">
                {profile.location && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                    <MapPin size={13} className="text-blue-500" /> {profile.location}
                  </span>
                )}
                {profile.profession && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                    <Briefcase size={13} className="text-purple-500" /> {profile.profession}
                  </span>
                )}
                {ageData && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                    <Cake size={13} className="text-pink-500" /> 
                    {profile.showFullAge ? `${ageData.age} years old` : profile.showBirthdayOnly ? ageData.birthday : "Hidden"}
                  </span>
                )}
                {profile.joinDate && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                    <Clock size={13} /> Joined {profile.joinDate}
                  </span>
                )}
              </div>

              {/* Private Info based on connection */}
              {(profile.email || profile.mobile) ? (
                <div className="flex flex-wrap gap-x-5 gap-y-2 mt-2 pt-2 border-t border-border/40">
                  {profile.email && (
                    <span className="flex items-center gap-1.5 text-xs text-foreground font-semibold">
                      <Mail size={13} className="text-muted-foreground" /> {profile.email}
                    </span>
                  )}
                  {profile.mobile && (
                    <span className="flex items-center gap-1.5 text-xs text-foreground font-semibold">
                      <Phone size={13} className="text-muted-foreground" /> {profile.mobile}
                    </span>
                  )}
                </div>
              ) : (
                <div className="mt-2 pt-2 border-t border-border/40 flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                   <Lock size={10} /> Contact info is private
                </div>
              )}

              {/* Stats row */}
              <div className="flex gap-6 mt-5 pt-4 border-t border-border/40">
                <div className="text-center">
                  <p className="text-lg font-black">{profile.neighboursCount}</p>
                  <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1"><Users size={10}/>Neighbours</p>
                </div>
                {status !== "SELF" && (
                  <div className="text-center">
                    <p className="text-lg font-black text-accent">{profile.mutualNeighboursCount}</p>
                    <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1"><Users size={10}/>Mutual</p>
                  </div>
                )}
                <div className="text-center">
                  <p className="text-lg font-black">{userPosts.length}</p>
                  <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1"><Grid3x3 size={10}/>Posts</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Posts ── */}
          <div className="mt-6 space-y-4">
            <h3 className="text-sm font-bold tracking-tight uppercase text-muted-foreground ml-2">Recent Activity</h3>
            {userPosts.length > 0 ? userPosts.map(post => (
              <motion.div key={post.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <PostCard post={post} />
              </motion.div>
            )) : (
              <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border/40 rounded-2xl bg-muted/10 text-center px-6">
                <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center text-muted-foreground mb-4">
                  <Grid3x3 size={28}/>
                </div>
                <h3 className="text-base font-bold mb-1">No posts yet</h3>
                <p className="text-sm text-muted-foreground max-w-xs mb-5">@{profile.username} hasn't shared anything with the community recently.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
