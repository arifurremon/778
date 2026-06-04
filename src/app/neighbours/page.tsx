
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { api } from "@/lib/api";
import { 
  UserPlus, 
  Home, 
  Clock, 
  Search, 
  Check, 
  X, 
  Users, 
  MapPin, 
  MessageSquare,
  ShieldCheck
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/ui/page-header";
import { GlobalUserBadges } from "@/components/user/global-user-badges";
import type {
  NeighbourConnectionUser,
  NeighbourRequestRow,
  NeighbourRequestsResponse,
  NeighboursListResponse,
} from "@/types/neighbours";

export default function NeighboursPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  
  const [neighbours, setNeighbours] = useState<NeighbourConnectionUser[]>([]);
  const [requests, setRequests] = useState<NeighbourRequestRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch from API
  const fetchConnections = async () => {
    try {
      const [nRes, rRes] = await Promise.all([
        api.get<NeighboursListResponse>("/api/neighbours"),
        api.get<NeighbourRequestsResponse>("/api/neighbours/requests"),
      ]);
      setNeighbours(nRes.data?.neighbours ?? nRes.neighbours ?? []);
      setRequests(rRes.data?.requests ?? rRes.requests ?? []);
    } catch (error) {
      console.error("Error fetching connections:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchConnections();
  }, [user]);

  const handleAcceptRequest = async (connectionId: string, username: string) => {
    try {
      await api.patch(`/api/neighbours/requests/${connectionId}`, { action: "accept" });
      toast({ title: "Trust Established", description: `You and @${username} are now neighbours.` });
      fetchConnections();
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Could not accept request." });
    }
  };

  const handleDeclineRequest = async (connectionId: string) => {
    try {
      await api.patch(`/api/neighbours/requests/${connectionId}`, { action: "reject" });
      toast({ title: "Request Ignored" });
      fetchConnections();
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Could not ignore request." });
    }
  };

  const handleRemoveNeighbour = async (connectionId: string) => {
    try {
      await api.del(`/api/neighbours/${connectionId}`);
      toast({ title: "Connection Removed" });
      fetchConnections();
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Could not remove neighbour." });
    }
  };

  const filteredNeighbours = neighbours.filter(
    (n) =>
      (n.username ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.name ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
      <div className="max-w-4xl mx-auto py-8 px-6 space-y-8">
        <PageHeader
          eyebrow="Social Trust Network"
          eyebrowIcon={Home}
          title={
            <>
              My <span className="text-accent">Neighbours</span>
            </>
          }
          subtitle="Manage your verified neighborhood connections"
          subtitleClassName="text-[10px] font-bold uppercase tracking-widest opacity-60"
        />

        <Tabs defaultValue="current" className="space-y-8">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <TabsList className="bg-card/20 border border-border/50 p-1 rounded-full">
              <TabsTrigger value="current" className="rounded-full px-8 text-[10px] font-bold uppercase tracking-widest">
                Mutual ({neighbours.length})
              </TabsTrigger>
              <TabsTrigger value="pending" className="rounded-full px-8 text-[10px] font-bold uppercase tracking-widest relative">
                Requests 
                {requests.length > 0 ? (
                  <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                ) : null}
              </TabsTrigger>
            </TabsList>
            
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Find a resident..." 
                className="pl-10 h-10 bg-card/20 border-border/50 text-xs rounded-xl font-bold"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <TabsContent value="current" className="mt-0 space-y-4">
             {isLoading ? (
               <div className="py-20 text-center"><span className="animate-pulse font-bold text-muted-foreground">Loading neighbours...</span></div>
             ) : neighbours.length === 0 ? (
               <div className="py-20 text-center bg-card/5 border-2 border-dashed border-border/50 rounded-[2.5rem]">
                  <Users className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                  <h3 className="text-lg font-bold">No mutual neighbours yet</h3>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Start connecting with verified residents in your Thana</p>
               </div>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredNeighbours.map(n => (
                    <NeighbourCard 
                      key={n.connectionId} 
                      user={n} 
                      onRemove={() => handleRemoveNeighbour(n.connectionId)}
                    />
                  ))}
               </div>
             )}
          </TabsContent>

          <TabsContent value="pending" className="mt-0 space-y-4">
             {isLoading ? (
               <div className="py-20 text-center"><span className="animate-pulse font-bold text-muted-foreground">Loading requests...</span></div>
             ) : requests.length === 0 ? (
               <div className="py-20 text-center bg-card/5 border-2 border-dashed border-border/50 rounded-[2.5rem]">
                  <Clock className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                  <h3 className="text-lg font-bold">No pending requests</h3>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">When residents request to be your neighbour, they'll appear here</p>
               </div>
             ) : (
               <div className="grid grid-cols-1 gap-4">
                  {requests.map(req => (
                    <RequestCard 
                      key={req.id} 
                      sender={req.sender} 
                      onAccept={() => handleAcceptRequest(req.id, req.sender.username)}
                      onDecline={() => handleDeclineRequest(req.id)}
                    />
                  ))}
               </div>
             )}
          </TabsContent>
        </Tabs>
      </div>
  );
}

function NeighbourCard({
  user,
  onRemove,
}: {
  user: NeighbourConnectionUser;
  onRemove: () => void;
}) {
  const username = user.username;
  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-card/20 border border-border/50 rounded-[2rem] p-5 flex items-center justify-between group hover:border-accent/40 transition-all">
       <div className="flex items-center gap-4 text-left">
          <Link href={`/profile/${username}`}>
            <Avatar className="w-12 h-12 border border-border/50 hover:ring-2 hover:ring-accent transition-all cursor-pointer">
              <AvatarImage src={user.profileImage || `/city_background.png${username}/100`} />
              <AvatarFallback>{(user.name?.[0] || username?.[0] || '').toUpperCase()}</AvatarFallback>
            </Avatar>
          </Link>
          <div>
            <div className="flex items-center gap-1">
              <Link href={`/profile/${username}`}>
                <h4 className="text-sm font-black hover:text-accent hover:underline cursor-pointer">{user.name || `@${username}`}</h4>
              </Link>
              <ShieldCheck size={12} className="text-cyan-400" />
            </div>
            <p className="text-[10px] text-muted-foreground font-bold flex items-center gap-1 uppercase tracking-tight">
              <MapPin size={8} className="text-primary" /> {user.location || "Chittagong Resident"}
            </p>
          </div>
       </div>
       <div className="flex gap-2">
         <Button size="icon" variant="ghost" className="rounded-xl h-10 w-10 text-muted-foreground hover:text-accent hover:bg-accent/5">
           <MessageSquare size={16} />
         </Button>
         <Button size="icon" onClick={onRemove} variant="ghost" className="rounded-xl h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/5">
           <X size={16} />
         </Button>
       </div>
    </motion.div>
  );
}

function RequestCard({
  sender,
  onAccept,
  onDecline,
}: {
  sender: NeighbourRequestRow["sender"];
  onAccept: () => void;
  onDecline: () => void;
}) {
  const username = sender.username;
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card/30 border border-border/50 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 group hover:border-accent/40 transition-all">
       <div className="flex items-center gap-4 text-left w-full sm:w-auto">
          <Link href={`/profile/${username}`}>
            <Avatar className="w-14 h-14 border-2 border-background ring-2 ring-accent/10 shadow-lg hover:ring-accent transition-all cursor-pointer">
              <AvatarImage src={sender.profileImage || `/city_background.png${username}/100`} />
              <AvatarFallback>{(sender.name?.[0] || username?.[0] || '').toUpperCase()}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="space-y-1">
            <p className="text-[9px] font-black text-accent uppercase tracking-[0.2em]">New Trust Request</p>
            <Link href={`/profile/${username}`}>
              <h4 className="text-base font-black hover:text-accent hover:underline cursor-pointer">{sender.name || `@${username}`}</h4>
            </Link>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">{sender.location || "Chittagong Resident"}</p>
          </div>
       </div>
       <div className="flex gap-3 w-full sm:w-auto">
         <Button onClick={onAccept} className="flex-1 sm:flex-none bg-accent text-accent-foreground font-black text-[10px] uppercase tracking-[0.2em] px-8 h-11 rounded-xl shadow-lg shadow-accent/20 transition-all active:scale-95">
           Establish Trust <Check size={14} className="ml-2" />
         </Button>
         <Button onClick={onDecline} variant="outline" className="flex-1 sm:flex-none h-11 rounded-xl border-border/50 hover:bg-destructive/10 hover:text-destructive font-black text-[10px] uppercase tracking-widest px-6">
           Ignore
         </Button>
       </div>
    </motion.div>
  );
}
