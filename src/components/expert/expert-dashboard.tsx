
"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, 
  Clock, 
  Star, 
  Wallet, 
  CheckCircle2, 
  XCircle, 
  Zap, 
  UserCircle, 
  MoreVertical,
  ChevronRight,
  TrendingUp,
  MapPin,
  MessageSquare,
  ArrowUpRight,
  History,
  Send,
  Eye,
  Briefcase
} from "lucide-react";
import { useServices, Booking, BookingStatus } from "@/hooks/use-services";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

export function ExpertDashboard() {
  const { user } = useAuth();
  const { bookings, reviews, wallet, acceptBooking, declineBooking, updateOngoingStatus, completeBooking, replyToReview } = useServices();
  const [isOnline, setIsOnline] = useState(true);
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});

  const stats = useMemo(() => ({
    totalRequests: bookings.length,
    completedTasks: bookings.filter(b => b.status === 'Completed').length,
    profileViews: "1.2K",
    rating: "4.9"
  }), [bookings]);

  return (
    <div className="space-y-8 pb-20">
      {/* Dynamic Header & Duty Toggle */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-card/20 border border-border/30 rounded-[2.5rem] p-8 gap-8 backdrop-blur-sm">
        <div className="flex items-center gap-5 text-left w-full">
          <Avatar className="w-20 h-20 border-4 border-background ring-4 ring-accent/10 shadow-2xl">
            <AvatarImage src={user?.profileImage} />
            <AvatarFallback className="font-bold text-2xl">{user?.name?.[0]}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h3 className="text-2xl font-black tracking-tight">{user?.name}</h3>
            <div className="flex items-center gap-3">
              <Badge className="bg-accent/10 text-accent border-accent/20 font-black text-[9px] uppercase tracking-widest px-3">
                {user?.serviceDetails?.specialization || 'Professional Expert'}
              </Badge>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">
                <MapPin size={10} className="text-primary" /> {user?.location}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
           <div className="flex-1 flex items-center justify-between gap-6 bg-background/40 px-6 py-4 rounded-[2rem] border border-border/50">
             <div className="text-left">
               <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1 block">Duty Status</Label>
               <p className={`text-xs font-black uppercase tracking-widest ${isOnline ? 'text-emerald-400' : 'text-muted-foreground opacity-50'}`}>
                 {isOnline ? 'Available' : 'Offline'}
               </p>
             </div>
             <Switch checked={isOnline} onCheckedChange={(v) => {
               setIsOnline(v);
               toast({ title: v ? "Online Status Active" : "Status set to Offline" });
             }} />
           </div>
        </div>
      </div>

      {/* Bento Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Requests" value={stats.totalRequests.toString()} icon={<Zap size={18} />} color="text-accent" />
        <MetricCard label="Completed" value={stats.completedTasks.toString()} icon={<CheckCircle2 size={18} />} color="text-emerald-400" />
        <MetricCard label="Profile Views" value={stats.profileViews} icon={<Eye size={18} />} color="text-blue-400" />
        <MetricCard label="Expert Rating" value={stats.rating} icon={<Star size={18} />} color="text-amber-400" />
      </div>

      <Tabs defaultValue="requests" className="space-y-8">
        <TabsList className="bg-card/20 border border-border/50 p-1.5 rounded-full w-full max-w-2xl mx-auto flex">
          <TabsTrigger value="requests" className="flex-1 rounded-full font-black text-[10px] uppercase tracking-[0.15em] py-3 transition-all">
            Operations
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex-1 rounded-full font-black text-[10px] uppercase tracking-[0.15em] py-3 transition-all">
            Availability
          </TabsTrigger>
          <TabsTrigger value="reputation" className="flex-1 rounded-full font-black text-[10px] uppercase tracking-[0.15em] py-3 transition-all">
            Reputation
          </TabsTrigger>
          <TabsTrigger value="wallet" className="flex-1 rounded-full font-black text-[10px] uppercase tracking-[0.15em] py-3 transition-all">
            Earnings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-10 mt-0">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <section className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground flex items-center gap-2">
                    <Clock size={12} /> New Service Inquiries
                  </h4>
                  <Badge variant="outline" className="font-bold text-[9px] uppercase border-accent/20 text-accent bg-accent/5">{bookings.filter(b => b.status === 'Pending').length} Pending</Badge>
                </div>
                <div className="space-y-4">
                  {bookings.filter(b => b.status === 'Pending').map(booking => (
                    <BookingCard 
                      key={booking.id} 
                      booking={booking} 
                      onAccept={() => acceptBooking(booking.id)}
                      onDecline={() => declineBooking(booking.id)}
                    />
                  ))}
                  {bookings.filter(b => b.status === 'Pending').length === 0 && (
                    <EmptyState message="All caught up! No pending requests." />
                  )}
                </div>
              </section>

              <section className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground flex items-center gap-2">
                    <Zap size={12} className="text-accent" /> Active Deployments
                  </h4>
                </div>
                <div className="space-y-4">
                  {bookings.filter(b => b.status === 'Ongoing').map(booking => (
                    <ActiveBookingCard 
                      key={booking.id} 
                      booking={booking} 
                      onUpdate={(s) => updateOngoingStatus(booking.id, s)}
                      onComplete={() => completeBooking(booking.id)}
                    />
                  ))}
                  {bookings.filter(b => b.status === 'Ongoing').length === 0 && (
                    <EmptyState message="No tasks currently in progress." />
                  )}
                </div>
              </section>
           </div>
        </TabsContent>

        <TabsContent value="schedule" className="mt-0">
           <div className="max-w-3xl mx-auto bg-card/20 border border-border/50 rounded-[2.5rem] p-8 space-y-8">
              <div className="text-center space-y-2">
                <h3 className="text-xl font-black uppercase tracking-tight">Weekly Availability</h3>
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] opacity-60">Manage your active service hours</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
                  <div key={day} className="flex items-center justify-between p-4 bg-background/40 border border-border/30 rounded-2xl group hover:border-accent/30 transition-all">
                    <span className="text-xs font-black uppercase tracking-widest">{day}</span>
                    <Switch defaultChecked={day !== 'Friday'} />
                  </div>
                ))}
              </div>
              
              <Button className="w-full bg-primary hover:bg-primary/90 h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-primary/20">
                Save Schedule Changes
              </Button>
           </div>
        </TabsContent>

        <TabsContent value="reputation" className="mt-0 space-y-6">
           <div className="max-w-3xl mx-auto space-y-4">
              {reviews.map(review => (
                <Card key={review.id} className="bg-card/20 border-border/50 p-6 rounded-[2rem] space-y-6 group hover:border-accent/30 transition-all">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12 border border-border/50">
                        <AvatarFallback className="font-black bg-muted text-muted-foreground">{review.clientName[0]}</AvatarFallback>
                      </Avatar>
                      <div className="text-left">
                        <p className="text-sm font-black tracking-tight">{review.clientName}</p>
                        <div className="flex gap-0.5 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={10} className={cn(i < review.rating ? 'fill-accent text-accent' : 'text-muted-foreground opacity-30')} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-[9px] text-muted-foreground uppercase font-black tracking-widest opacity-60">{review.timestamp}</span>
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed font-bold pl-16 text-left">
                    "{review.comment}"
                  </p>
                  
                  {review.reply ? (
                    <div className="ml-16 bg-accent/5 border-l-2 border-accent rounded-r-2xl p-5 text-left animate-in slide-in-from-left-2">
                       <p className="text-[9px] font-black text-accent uppercase tracking-[0.2em] mb-2">My Response</p>
                       <p className="text-xs text-muted-foreground font-bold leading-relaxed">{review.reply}</p>
                    </div>
                  ) : (
                    <div className="ml-16 pt-4 border-t border-border/10 flex gap-3">
                      <Input 
                        placeholder="Type a professional reply..." 
                        className="h-11 bg-background/40 border-border/30 text-xs font-bold rounded-xl focus:ring-accent"
                        value={replyText[review.id] || ""}
                        onChange={(e) => setReplyText({...replyText, [review.id]: e.target.value})}
                      />
                      <Button size="icon" onClick={() => {
                        replyToReview(review.id, replyText[review.id]);
                        setReplyText({...replyText, [review.id]: ""});
                        toast({ title: "Reply Published" });
                      }} className="bg-accent text-accent-foreground h-11 w-11 rounded-xl shrink-0 shadow-lg shadow-accent/20 hover:scale-105 transition-all"><Send size={16} /></Button>
                    </div>
                  )}
                </Card>
              ))}
           </div>
        </TabsContent>

        <TabsContent value="wallet" className="mt-0">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="md:col-span-1 bg-gradient-to-br from-primary/10 to-accent/5 border-primary/20 p-10 rounded-[2.5rem] flex flex-col justify-between text-left h-full">
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">Service Balance</p>
                  <h3 className="text-5xl font-black tracking-tighter text-foreground">৳{wallet.balance.toLocaleString()}</h3>
                </div>
                <div className="mt-12 space-y-4">
                  <Button className="w-full bg-accent text-accent-foreground font-black uppercase tracking-[0.2em] text-[11px] h-14 rounded-2xl shadow-2xl shadow-accent/30 hover:scale-[1.02] transition-all">
                    Initiate Withdrawal
                  </Button>
                  <p className="text-[8px] text-center text-muted-foreground font-black uppercase tracking-widest opacity-60">Settlements every 7 days</p>
                </div>
              </Card>

              <Card className="md:col-span-2 bg-card/10 border-border/50 rounded-[2.5rem] p-8">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] mb-8 flex items-center gap-3 px-2">
                  <History size={14} className="text-accent" /> Financial Audit Log
                </h4>
                <div className="space-y-3">
                  {wallet.history.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-5 bg-background/30 rounded-2xl border border-border/30 group hover:border-accent/20 transition-all">
                       <div className="flex items-center gap-4 text-left">
                          <div className={cn("p-2.5 rounded-xl border", item.type === 'Withdrawal' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20')}>
                            {item.type === 'Withdrawal' ? <ArrowUpRight size={18} /> : <TrendingUp size={18} />}
                          </div>
                          <div>
                            <p className="text-sm font-black">{item.type} • {item.amount}</p>
                            <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-60">{item.date}</p>
                          </div>
                       </div>
                       <Badge variant="outline" className="text-[8px] font-black uppercase tracking-tighter border-border/40 text-muted-foreground px-3">{item.status}</Badge>
                    </div>
                  ))}
                </div>
              </Card>
           </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MetricCard({ label, value, icon, color }: { label: string, value: string, icon: any, color: string }) {
  return (
    <Card className="p-6 bg-card/20 border-border/50 rounded-[2rem] relative overflow-hidden group text-left backdrop-blur-sm">
      <div className="flex justify-between items-start mb-4">
        <div className={cn("p-2 rounded-xl bg-background/40 border border-border/30 shadow-sm", color)}>
          {icon}
        </div>
      </div>
      <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.25em] mb-1">{label}</p>
      <h3 className="text-2xl font-black tracking-tighter">{value}</h3>
    </Card>
  );
}

function BookingCard({ booking, onAccept, onDecline }: { booking: Booking, onAccept: () => void, onDecline: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card/20 border border-border/50 rounded-[2rem] p-6 space-y-6 group hover:border-accent/40 transition-all shadow-sm">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <Avatar className="w-12 h-12 border-2 border-background shadow-lg">
            <AvatarImage src={booking.clientAvatar} />
            <AvatarFallback className="font-black bg-muted text-muted-foreground">{booking.clientName[0]}</AvatarFallback>
          </Avatar>
          <div className="text-left space-y-0.5">
            <p className="text-sm font-black tracking-tight">{booking.clientName}</p>
            <p className="text-[10px] text-accent font-black uppercase tracking-widest">{booking.serviceType}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest text-orange-400 border-orange-500/30 bg-orange-500/5 px-2.5">Incoming</Badge>
           <span className="text-[10px] font-black text-foreground">{booking.price}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 bg-background/30 rounded-2xl p-4 border border-border/30">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase truncate">
          <MapPin size={12} className="text-primary shrink-0" /> {booking.address}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase truncate">
          <Clock size={12} className="text-primary shrink-0" /> {booking.timestamp}
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={onAccept} className="flex-1 bg-accent text-accent-foreground font-black text-[10px] uppercase tracking-[0.2em] h-11 rounded-xl shadow-lg shadow-accent/20 hover:scale-[1.02] transition-all">Confirm Order</Button>
        <Button onClick={onDecline} variant="outline" className="px-5 rounded-xl border-border/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all font-black text-[10px] uppercase tracking-widest">Reject</Button>
      </div>
    </motion.div>
  );
}

function ActiveBookingCard({ booking, onUpdate, onComplete }: { booking: Booking, onUpdate: (s: any) => void, onComplete: () => void }) {
  const nextStatusMap: { [key: string]: any } = {
    'Confirmed': 'On My Way',
    'On My Way': 'Start Service',
  };

  const nextStatus = nextStatusMap[booking.subStatus || ''];

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-accent/5 border border-accent/30 rounded-[2rem] p-6 space-y-6 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 blur-[40px] pointer-events-none" />
      
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse shadow-[0_0_8px_rgba(97,179,204,0.6)]" />
          <h4 className="text-sm font-black uppercase tracking-tight">{booking.serviceType}</h4>
        </div>
        <Badge className="bg-accent text-accent-foreground font-black text-[9px] uppercase tracking-[0.2em] px-3 py-1 rounded-lg">
          {booking.subStatus || 'Confirmed'}
        </Badge>
      </div>

      <div className="flex items-center gap-4 bg-background/40 rounded-2xl p-4 border border-border/30 text-left">
         <Avatar className="w-10 h-10 border border-border/50">
           <AvatarImage src={booking.clientAvatar} />
         </Avatar>
         <div className="flex-1 min-w-0">
           <p className="text-xs font-black uppercase truncate">{booking.clientName}</p>
           <p className="text-[10px] text-muted-foreground font-bold flex items-center gap-1.5 uppercase truncate opacity-70">
             <MapPin size={10} className="shrink-0" /> {booking.address}
           </p>
         </div>
      </div>

      <div className="flex gap-3">
        {nextStatus ? (
          <Button onClick={() => onUpdate(nextStatus)} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-[10px] uppercase tracking-[0.15em] h-12 rounded-xl shadow-xl shadow-primary/20">
            Action: {nextStatus}
          </Button>
        ) : (
          <Button onClick={onComplete} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10px] uppercase tracking-[0.15em] h-12 rounded-xl shadow-xl shadow-emerald-500/20">
            Finalize: Mark Completed
          </Button>
        )}
        <Button variant="outline" className="h-12 w-12 rounded-xl border-border/50 hover:bg-accent/10 hover:text-accent transition-all">
          <MessageSquare size={18} />
        </Button>
      </div>
    </motion.div>
  );
}

function EmptyState({ message, icon }: { message: string, icon?: any }) {
  return (
    <div className="py-12 text-center bg-card/5 border border-dashed border-border/30 rounded-[2rem]">
      {icon ? <div className="text-muted-foreground/20 mb-3">{icon}</div> : <CheckCircle2 className="w-10 h-10 text-muted-foreground/10 mx-auto mb-3" />}
      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">{message}</p>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
