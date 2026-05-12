
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import Layout from "../dashboard/layout";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { GlobalUserBadges } from "@/components/user/global-user-badges";

export default function NeighboursPage() {
  const { user, updateUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const handleAcceptRequest = (username: string) => {
    if (!user) return;
    const newReceived = (user.neighbourRequestsReceived || []).filter(u => u !== username);
    const newNeighbours = [...(user.neighbours || []), username];
    updateUser({
      neighbourRequestsReceived: newReceived,
      neighbours: newNeighbours
    });
    toast({ title: "Trust Established", description: `You and @${username} are now neighbours.` });
  };

  const handleDeclineRequest = (username: string) => {
    if (!user) return;
    const newReceived = (user.neighbourRequestsReceived || []).filter(u => u !== username);
    updateUser({ neighbourRequestsReceived: newReceived });
    toast({ title: "Request Ignored" });
  };

  const handleRemoveNeighbour = (username: string) => {
    if (!user) return;
    const newNeighbours = (user.neighbours || []).filter(u => u !== username);
    updateUser({ neighbours: newNeighbours });
    toast({ title: "Connection Removed" });
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8 px-6 space-y-8">
        <header className="space-y-2">
          <div className="flex items-center gap-2 text-accent font-bold uppercase tracking-[0.2em] text-[10px]">
             <Home size={12} /> Social Trust Network
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            My <span className="text-accent">Neighbours</span>
          </h1>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest opacity-60">
            Manage your verified neighborhood connections
          </p>
        </header>

        <Tabs defaultValue="current" className="space-y-8">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <TabsList className="bg-card/20 border border-border/50 p-1 rounded-full">
              <TabsTrigger value="current" className="rounded-full px-8 text-[10px] font-bold uppercase tracking-widest">
                Mutual ({user?.neighbours?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="pending" className="rounded-full px-8 text-[10px] font-bold uppercase tracking-widest relative">
                Requests 
                {(user?.neighbourRequestsReceived?.length || 0) > 0 ? (
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
             {(user?.neighbours?.length || 0) === 0 ? (
               <div className="py-20 text-center bg-card/5 border-2 border-dashed border-border/50 rounded-[2.5rem]">
                  <Users className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                  <h3 className="text-lg font-bold">No mutual neighbours yet</h3>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Start connecting with verified residents in your Thana</p>
               </div>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user?.neighbours?.map(username => (
                    <NeighbourCard 
                      key={username} 
                      username={username} 
                      onRemove={() => handleRemoveNeighbour(username)}
                    />
                  ))}
               </div>
             )}
          </TabsContent>

          <TabsContent value="pending" className="mt-0 space-y-4">
             {(user?.neighbourRequestsReceived?.length || 0) === 0 ? (
               <div className="py-20 text-center bg-card/5 border-2 border-dashed border-border/50 rounded-[2.5rem]">
                  <Clock className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                  <h3 className="text-lg font-bold">No pending requests</h3>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">When residents request to be your neighbour, they'll appear here</p>
               </div>
             ) : (
               <div className="grid grid-cols-1 gap-4">
                  {user?.neighbourRequestsReceived?.map(username => (
                    <RequestCard 
                      key={username} 
                      username={username} 
                      onAccept={() => handleAcceptRequest(username)}
                      onDecline={() => handleDeclineRequest(username)}
                    />
                  ))}
               </div>
             )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

function NeighbourCard({ username, onRemove }: { username: string, onRemove: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-card/20 border border-border/50 rounded-[2rem] p-5 flex items-center justify-between group hover:border-accent/40 transition-all">
       <div className="flex items-center gap-4 text-left">
          <Avatar className="w-12 h-12 border border-border/50">
            <AvatarImage src={`https://picsum.photos/seed/${username}/100`} />
            <AvatarFallback>{(username[0] ?? '').toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-1">
              <h4 className="text-sm font-black">@{username}</h4>
              <ShieldCheck size={12} className="text-cyan-400" />
            </div>
            <p className="text-[10px] text-muted-foreground font-bold flex items-center gap-1 uppercase tracking-tight">
              <MapPin size={8} className="text-primary" /> Chittagong Resident
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

function RequestCard({ username, onAccept, onDecline }: { username: string, onAccept: () => void, onDecline: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card/30 border border-border/50 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 group hover:border-accent/40 transition-all">
       <div className="flex items-center gap-4 text-left w-full sm:w-auto">
          <Avatar className="w-14 h-14 border-2 border-background ring-2 ring-accent/10 shadow-lg">
            <AvatarImage src={`https://picsum.photos/seed/${username}/100`} />
          </Avatar>
          <div className="space-y-1">
            <p className="text-[9px] font-black text-accent uppercase tracking-[0.2em]">New Trust Request</p>
            <h4 className="text-base font-black">@{username}</h4>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">Wants to be your neighbour</p>
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
