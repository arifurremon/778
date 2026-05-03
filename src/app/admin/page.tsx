"use client";

import { useState } from "react";
import Layout from "../dashboard/layout";
import { 
  ShieldCheck, 
  Users, 
  Store, 
  Star, 
  CheckCircle2, 
  XCircle, 
  Search, 
  ExternalLink,
  ShieldAlert,
  BadgeCheck,
  FileText,
  Clock
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";

export default function AdminDashboard() {
  const { user, updateUser } = useAuth();
  
  const [requests, setRequests] = useState({
    verifications: [
      { id: 'v1', name: 'Tanvir Ahmed', email: 'tanvir@ctg.com', location: 'Halishahar', reason: 'Active contributor and local youth community coordinator.', status: 'Pending' },
      { id: 'v2', name: 'Nabila Khan', email: 'nabila@ctg.com', location: 'Khulshi', reason: 'Verified merchant requesting resident verification for credibility.', status: 'Pending' },
    ],
    shops: [
      { id: 's1', name: 'ElectroMart CTG', owner: 'Sabbir Ahmed', category: 'Electronics', location: 'Agrabad', status: 'Pending' },
    ],
    experts: [
      { id: 'e1', name: 'Dr. Kabir', profession: 'Cardiologist', specialization: 'Heart Specialist', location: 'Panchlaish', status: 'Pending' },
    ]
  });

  const handleApproveResident = (req: any) => {
    if (req.email === user?.email) {
      updateUser({ isVerified: true, verificationRequestStatus: 'Approved' });
    }
    toast({ title: "Resident Verified", description: `${req.name} now has the blue checkmark.` });
    setRequests(prev => ({
      ...prev,
      verifications: prev.verifications.filter(r => r.id !== req.id)
    }));
  };

  const handleRejectResident = (req: any) => {
    if (req.email === user?.email) {
      updateUser({ verificationRequestStatus: 'Rejected' });
    }
    toast({ variant: "destructive", title: "Request Rejected", description: `Verification for ${req.name} was denied.` });
    setRequests(prev => ({
      ...prev,
      verifications: prev.verifications.filter(r => r.id !== req.id)
    }));
  };

  const handleApproveShop = (req: any) => {
    if (req.owner === user?.name) {
      updateUser({ isSeller: true, registrationStatus: 'Approved' });
    }
    toast({ title: "Shop Approved", description: `${req.name} is now live.` });
    setRequests(prev => ({
      ...prev,
      shops: prev.shops.filter(r => r.id !== req.id)
    }));
  };

  const handleApproveExpert = (req: any) => {
    if (req.name === user?.name) {
      updateUser({ isServiceProvider: true, serviceRegistrationStatus: 'Approved' });
    }
    toast({ title: "Expert Certified", description: `${req.name} has been added to directory.` });
    setRequests(prev => ({
      ...prev,
      experts: prev.experts.filter(r => r.id !== req.id)
    }));
  };

  if (!user?.isAdmin) {
    return (
      <Layout>
         <div className="h-full flex flex-col items-center justify-center p-10 text-center">
            <ShieldAlert size={48} className="text-destructive mb-4" />
            <h2 className="text-2xl font-bold">Unauthorized Access</h2>
            <p className="text-muted-foreground mt-2 font-bold">This command center is reserved for platform administrators.</p>
         </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-8 px-6 space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-destructive font-bold uppercase tracking-[0.2em] text-[10px]">
               <ShieldCheck size={12} /> Root Security
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              Admin <span className="text-accent">Command</span> Center
            </h1>
            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest opacity-60">
              Manage multi-role status and verification requests
            </p>
          </div>

          <div className="flex gap-4">
             <div className="bg-card/20 border border-border/50 rounded-2xl px-6 py-3 flex flex-col">
               <span className="text-[10px] font-bold text-muted-foreground uppercase">Pending Tasks</span>
               <span className="text-lg font-black text-accent">{requests.verifications.length + requests.shops.length + requests.experts.length}</span>
             </div>
          </div>
        </header>

        <Tabs defaultValue="residents" className="space-y-8">
          <TabsList className="bg-card/20 border border-border/50 p-1 rounded-full w-full max-w-2xl">
            <TabsTrigger value="residents" className="flex-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
              <BadgeCheck size={14} className="mr-2" /> Resident Verification ({requests.verifications.length})
            </TabsTrigger>
            <TabsTrigger value="merchants" className="flex-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
              <Store size={14} className="mr-2" /> Merchants ({requests.shops.length})
            </TabsTrigger>
            <TabsTrigger value="experts" className="flex-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
              <Star size={14} className="mr-2" /> Experts ({requests.experts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="residents" className="space-y-4 mt-0">
             <div className="grid gap-4">
                {requests.verifications.map(req => (
                  <Card key={req.id} className="bg-card/30 border border-border/50 rounded-3xl p-6 flex flex-col gap-6 overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12 border border-border/50">
                          <AvatarFallback>{req.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-bold text-base">{req.name}</h4>
                          <p className="text-xs text-muted-foreground font-bold">{req.email} • {req.location}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleApproveResident(req)} className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold uppercase tracking-widest text-[9px] px-6 rounded-xl h-10 shadow-lg shadow-cyan-500/20">Approve Resident</Button>
                        <Button size="sm" variant="ghost" onClick={() => handleRejectResident(req)} className="text-destructive hover:bg-destructive/10 font-bold uppercase tracking-widest text-[9px] px-4 rounded-xl">Reject</Button>
                      </div>
                    </div>
                    
                    <div className="bg-background/40 rounded-2xl p-5 border border-border/30 space-y-3">
                       <div className="flex items-center gap-2 text-accent font-bold uppercase tracking-widest text-[8px]">
                         <FileText size={10} /> Application Reason
                       </div>
                       <p className="text-sm text-muted-foreground font-bold leading-relaxed">
                         "{req.reason}"
                       </p>
                    </div>
                  </Card>
                ))}
                {requests.verifications.length === 0 && <EmptyState message="No pending resident verifications." />}
             </div>
          </TabsContent>

          <TabsContent value="merchants" className="space-y-4 mt-0">
             <div className="grid gap-4">
                {requests.shops.map(req => (
                  <div key={req.id} className="bg-card/30 border border-border/50 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                        <Store size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-base">{req.name}</h4>
                        <p className="text-xs text-muted-foreground font-bold">Owner: {req.owner} • {req.category} • {req.location}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                       <Button size="sm" onClick={() => handleApproveShop(req)} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold uppercase tracking-widest text-[9px] px-4 rounded-lg">Approve Shop</Button>
                       <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10 font-bold uppercase tracking-widest text-[9px] px-4 rounded-lg">Reject</Button>
                    </div>
                  </div>
                ))}
                {requests.shops.length === 0 && <EmptyState message="No pending shop applications." />}
             </div>
          </TabsContent>

          <TabsContent value="experts" className="space-y-4 mt-0">
             <div className="grid gap-4">
                {requests.experts.map(req => (
                  <div key={req.id} className="bg-card/30 border border-border/50 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
                        <Star size={24} className="fill-purple-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-base">{req.name}</h4>
                        <p className="text-xs text-muted-foreground font-bold">{req.profession} • {req.specialization} • {req.location}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                       <Button size="sm" onClick={() => handleApproveExpert(req)} className="bg-purple-500 hover:bg-purple-600 text-white font-bold uppercase tracking-widest text-[9px] px-4 rounded-lg">Certify Expert</Button>
                       <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10 font-bold uppercase tracking-widest text-[9px] px-4 rounded-lg">Reject</Button>
                    </div>
                  </div>
                ))}
                {requests.experts.length === 0 && <EmptyState message="No pending expert certifications." />}
             </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-20 text-center bg-card/10 border border-dashed border-border/30 rounded-3xl">
      <CheckCircle2 className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
      <p className="text-sm font-bold text-muted-foreground">{message}</p>
    </div>
  );
}
