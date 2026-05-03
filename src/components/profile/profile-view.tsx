
"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  Camera, 
  MapPin, 
  ShieldCheck, 
  Calendar, 
  Store, 
  Briefcase, 
  ChevronRight,
  Settings,
  Grid,
  UserCircle,
  Eye,
  Clock,
  Award,
  BadgeCheck,
  Star,
  FileText,
  AtSign,
  User,
  Cake,
  Hash,
  AlertCircle,
  Bookmark,
  ArrowRight,
  Globe,
  Home,
  Lock,
  Phone,
  Mail,
  UserPlus,
  Check
} from "lucide-react";
import { useAuth, PrivacyLevel } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import PostCard from "@/components/community/post-card";
import { toast } from "@/hooks/use-toast";
import { GlobalUserBadges } from "@/components/user/global-user-badges";
import { differenceInYears, format, parseISO } from "date-fns";
import { useCommunity } from "@/hooks/use-community";
import { cn } from "@/lib/utils";
import { UploadButton } from "@/lib/uploadthing";

const CHITTAGONG_AREAS = [
  'Akbar Shah', 'Bakalia', 'Bandar', 'Bayezid Bostami', 
  'Chandgaon', 'Chawkbazar', 'Double Mooring', 'EPZ', 
  'Halishahar', 'Karnaphuli', 'Khulshi', 'Kotwali', 
  'Pahartali', 'Panchlaish', 'Patenga', 'Sadarghat'
];

export default function ProfileView() {
  const { user, updateUser } = useAuth();
  const { posts } = useCommunity();
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [verificationReason, setVerificationReason] = useState("");
  const [requestSent, setRequestSent] = useState(false);
  
  // Personal Info Form State
  const [editName, setEditName] = useState(user?.name || "");
  const [editLocation, setEditLocation] = useState(user?.location || "");
  const [editDob, setEditDob] = useState(user?.dob || "");
  const [editBio, setEditBio] = useState(user?.bio || "");

  const ageData = useMemo(() => {
    if (!user?.dob) return null;
    const date = parseISO(user.dob);
    return {
      age: differenceInYears(new Date(), date),
      birthday: format(date, 'd MMMM')
    };
  }, [user?.dob]);

  // handlePhotoClick removed in favor of UploadThing

  const submitVerificationRequest = () => {
    if (!verificationReason.trim()) return;
    updateUser({ 
      verificationRequestStatus: 'Pending',
      verificationReason: verificationReason 
    });
    setIsVerificationModalOpen(false);
    toast({
      title: "Application Submitted",
      description: "Our compliance team will review your credibility shortly.",
    });
  };

  const handleSavePersonalInfo = () => {
    const updates: any = {};
    
    if (editName !== user?.name) {
      if ((user?.nameChangeCount || 0) >= 3) {
        toast({ variant: "destructive", title: "Limit reached", description: "You have already changed your name 3 times." });
        return;
      }
      updates.name = editName;
      updates.nameChangeCount = (user?.nameChangeCount || 0) + 1;
    }

    updates.location = editLocation;
    updates.dob = editDob;
    updates.bio = editBio;

    updateUser(updates);
    toast({ title: "Profile Updated", description: "Your personal information has been saved." });
  };

  const myPosts = useMemo(() => {
    return posts.filter(p => p.author.username === user?.username);
  }, [posts, user?.username]);

  const savedPosts = useMemo(() => {
    return posts.filter(p => p.isSaved);
  }, [posts]);

  const handlePrivacyChange = (field: keyof NonNullable<typeof user>["privacySettings"], value: PrivacyLevel) => {
    if (!user) return;
    updateUser({
      privacySettings: {
        ...user.privacySettings,
        [field]: value
      }
    });
    toast({ title: "Privacy Updated", description: `Visibility for ${field} set to ${value}.` });
  };

  const getShopStatusDisplay = () => {
    switch(user?.registrationStatus) {
      case 'Pending':
        return (
          <Button disabled className="w-full bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-xl font-bold text-[10px] uppercase tracking-widest h-11 cursor-default">
            <Clock size={14} className="mr-2" /> Verification Under Review
          </Button>
        );
      case 'Approved':
        return (
          <Link href="/seller" className="block w-full">
            <Button className="w-full bg-emerald-500 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest h-11 shadow-lg shadow-emerald-500/20">
              Manage Dashboard <ChevronRight size={14} className="ml-1" />
            </Button>
          </Link>
        );
      default:
        return (
          <Link href="/register-shop" className="block w-full">
            <Button className="w-full bg-primary hover:bg-primary/90 rounded-xl font-bold text-[10px] uppercase tracking-widest h-11">
              Start Journey <ArrowRight size={14} className="ml-1" />
            </Button>
          </Link>
        );
    }
  };

  const getServiceStatusDisplay = () => {
    switch(user?.serviceRegistrationStatus) {
      case 'Pending':
        return (
          <Button disabled className="w-full bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-xl font-bold text-[10px] uppercase tracking-widest h-11 cursor-default">
            <Clock size={14} className="mr-2" /> Verification Under Review
          </Button>
        );
      case 'Approved':
        return (
          <Link href="/expert" className="block w-full">
            <Button className="w-full bg-accent text-accent-foreground rounded-xl font-bold text-[10px] uppercase tracking-widest h-11 shadow-lg shadow-accent/20">
              Manage Dashboard <ChevronRight size={14} className="ml-1" />
            </Button>
          </Link>
        );
      default:
        return (
          <Link href="/register-service" className="block w-full">
            <Button className="w-full bg-accent/20 hover:bg-accent/30 text-accent rounded-xl font-bold text-[10px] uppercase tracking-widest h-11">
              Start Journey <ArrowRight size={14} className="ml-1" />
            </Button>
          </Link>
        );
    }
  };

  const PrivacySelector = ({ field, current }: { field: keyof NonNullable<typeof user>["privacySettings"], current: PrivacyLevel }) => (
    <div className="flex items-center gap-2">
      <Select value={current} onValueChange={(v) => handlePrivacyChange(field, v as PrivacyLevel)}>
        <SelectTrigger className="w-[140px] h-9 bg-background/50 border-border/30 text-[10px] font-bold uppercase tracking-widest rounded-lg">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-popover border-border">
          <SelectItem value="Public" className="text-[10px] font-bold uppercase tracking-widest cursor-pointer">
            <div className="flex items-center gap-2"><Globe size={12} /> Public</div>
          </SelectItem>
          <SelectItem value="Neighbours" className="text-[10px] font-bold uppercase tracking-widest cursor-pointer">
            <div className="flex items-center gap-2"><Home size={12} /> Neighbours</div>
          </SelectItem>
          <SelectItem value="Only Me" className="text-[10px] font-bold uppercase tracking-widest cursor-pointer">
            <div className="flex items-center gap-2"><Lock size={12} /> Only Me</div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto py-10 px-6 relative">
      {/* Settings Desktop Trigger */}
      <div className="absolute top-8 right-6 hidden md:block">
        <Link href="/settings">
          <Button variant="outline" size="icon" className="rounded-full bg-card/30 border-border/50 hover:bg-accent/10 hover:text-accent">
            <Settings size={20} />
          </Button>
        </Link>
      </div>

      <section className="flex flex-col items-center text-center mb-12">
        <div className="relative group mb-6">
          <Avatar className="w-32 h-32 border-4 border-card ring-4 ring-primary/20 shadow-2xl transition-transform duration-500 group-hover:scale-105">
            <AvatarImage src={user?.profileImage} />
            <AvatarFallback className="text-4xl font-bold bg-primary/20 text-primary">
              {user?.name?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 opacity-0 group-hover:opacity-100 transition-smooth z-10 flex items-center justify-center">
            <UploadButton
              endpoint="profileImage"
              onClientUploadComplete={(res) => {
                if (res?.[0]) {
                  updateUser({ profileImage: res[0].url });
                  toast({ title: "Photo Updated", description: "Your new profile picture has been saved." });
                  setTimeout(() => window.location.reload(), 1500);
                }
              }}
              onUploadError={(error: Error) => {
                toast({ variant: "destructive", title: "Upload Failed", description: error.message });
              }}
              appearance={{
                button: "bg-accent text-accent-foreground rounded-full shadow-lg text-xs font-bold px-3 py-1.5 h-auto",
                allowedContent: "hidden"
              }}
            />
          </div>
        </div>
        
        <div className="flex flex-col items-center gap-1 mb-10">
          <div className="flex items-center justify-center gap-2">
            <h2 className="text-3xl font-bold tracking-tight">{user?.name}</h2>
            <GlobalUserBadges user={user} size={20} />
          </div>
          <p className="text-accent font-bold text-sm tracking-tight mb-2">@{user?.username}</p>
          
          <p className="text-sm text-muted-foreground font-bold max-w-sm mx-auto">
            {user?.bio || "A passionate developer from Chattogram."}
          </p>

          {ageData && (
            <div className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 mt-3 flex items-center justify-center gap-1.5">
               <Cake size={10} className="text-accent/40" />
               <span>BIRTHDAY: {ageData.birthday.toUpperCase()}</span>
            </div>
          )}
        </div>

        {/* Unified Neighbour Interaction Bar */}
        <div className="w-full max-w-sm mb-10">
          <div className="bg-card/30 backdrop-blur-md border border-border/50 rounded-2xl overflow-hidden flex items-stretch shadow-lg">
            {/* Left: Social Proof */}
            <Link href="/neighbours" className="flex-1 flex flex-col items-center justify-center p-4 border-r border-border/50 hover:bg-white/5 transition-colors cursor-pointer group">
              <span className="text-lg font-black tracking-tight">{user?.neighbours?.length || 0}</span>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground group-hover:text-accent transition-colors">neighbours</span>
            </Link>

            {/* Right: Action Trigger */}
            <div className="flex-1 flex items-center justify-center p-4">
               {user?.isVerified ? (
                 <Button variant="ghost" className="w-full h-full rounded-xl font-black text-[10px] uppercase tracking-widest text-accent flex items-center justify-center gap-2">
                   <Home size={16} /> Neighbour
                 </Button>
               ) : requestSent ? (
                 <Button disabled className="w-full h-full bg-muted/40 text-muted-foreground rounded-xl font-black text-[10px] uppercase tracking-widest cursor-default flex items-center justify-center gap-2">
                   <Clock size={16} /> Request Sent
                 </Button>
               ) : (
                 <Button onClick={() => setRequestSent(true)} className="w-full h-full bg-accent text-accent-foreground rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-accent/20 hover:scale-[1.02] transition-all">
                   <UserPlus size={16} className="mr-1.5" /> Add Neighbour
                 </Button>
               )}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {user?.verificationRequestStatus === 'Pending' && !user?.isVerified && (
            <Badge variant="outline" className="rounded-full border-orange-500/50 text-orange-400 font-bold uppercase tracking-widest text-[9px] h-10 px-8 flex items-center justify-center">
              <Clock size={12} className="mr-1.5" /> Identity Review Pending
            </Badge>
          )}
        </div>
      </section>

      {/* Opportunities Section */}
      <section className="mb-16 space-y-6">
        <div className="border-b border-border/10 pb-2">
          <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-accent">Opportunities in The Chattala</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
            <div className={`h-full bg-gradient-to-br from-card/80 to-card/40 border border-border/50 rounded-[2rem] p-8 flex flex-col shadow-xl transition-all`}>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-emerald-500/10 text-emerald-500 shadow-sm border border-emerald-500/10`}>
                <Store size={28} />
              </div>
              <h4 className="text-lg font-black uppercase tracking-tight mb-2">Merchant Account</h4>
              <p className="text-xs text-muted-foreground mb-8 leading-relaxed flex-1 font-bold">
                {user?.isSeller 
                  ? "Your official storefront is live. Manage inventory and track orders from your merchant dashboard."
                  : `Launch your local business on the port city's digital hub and reach thousands of residents.`
                }
              </p>
              <div className="pt-2">
                {getShopStatusDisplay()}
              </div>
            </div>
          </motion.div>

          <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
            <div className={`h-full bg-gradient-to-br from-card/80 to-card/40 border border-border/50 rounded-[2rem] p-8 flex flex-col shadow-xl transition-all`}>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-purple-500/10 text-purple-500 shadow-sm border border-purple-500/10`}>
                <Briefcase size={28} />
              </div>
              <h4 className="text-lg font-black uppercase tracking-tight mb-2">Expert Listings</h4>
              <p className="text-xs text-muted-foreground mb-8 leading-relaxed flex-1 font-bold">
                {user?.isServiceProvider
                  ? "Your professional profile is verified. Manage your service bookings and reputation here."
                  : "List your specialized skills as a verified Doctor, Engineer, or Tutor in the city directory."
                }
              </p>
              <div className="pt-2">
                {getServiceStatusDisplay()}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="w-full bg-card/20 border border-border/50 p-1.5 rounded-full mb-8">
          <TabsTrigger value="settings" className="flex-1 rounded-full flex items-center gap-2 py-3 data-[state=active]:bg-background data-[state=active]:shadow-xl transition-all font-bold text-[10px] uppercase tracking-widest">
            <Settings size={14} /> Account
          </TabsTrigger>
          <TabsTrigger value="posts" className="flex-1 rounded-full flex items-center gap-2 py-3 data-[state=active]:bg-background data-[state=active]:shadow-xl transition-all font-bold text-[10px] uppercase tracking-widest">
            <Grid size={14} /> My Posts
          </TabsTrigger>
          <TabsTrigger value="saved" className="flex-1 rounded-full flex items-center gap-2 py-3 data-[state=active]:bg-background data-[state=active]:shadow-xl transition-all font-bold text-[10px] uppercase tracking-widest">
            <Bookmark size={14} /> Saved
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4">
          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem value="account" className="border border-border/50 rounded-3xl bg-card/10 overflow-hidden px-6">
              <AccordionTrigger className="hover:no-underline py-6">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                    <UserCircle size={24} />
                  </div>
                  <span className="text-base font-bold">Personal Info</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-8 space-y-6 px-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Username (Permanent)</Label>
                    <div className="flex items-center gap-2 bg-background/20 border border-border/30 h-12 px-4 rounded-xl text-muted-foreground font-bold text-sm">
                      <AtSign size={14} /> {user?.username}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Full Name ({3 - (user?.nameChangeCount || 0)} changes left)</Label>
                    <Input 
                      value={editName} 
                      onChange={e => setEditName(e.target.value)} 
                      disabled={(user?.nameChangeCount || 0) >= 3}
                      className="bg-background/50 border-border/50 h-12 rounded-xl font-bold" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Locality (Thana)</Label>
                    <Select onValueChange={setEditLocation} defaultValue={editLocation}>
                      <SelectTrigger className="bg-background/50 border-border/50 h-12 rounded-xl font-bold">
                        <SelectValue placeholder="Select Area" />
                      </SelectTrigger>
                      <SelectContent>
                        {CHITTAGONG_AREAS.map(area => (
                          <SelectItem key={area} value={area} className="font-bold">{area}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date of Birth</Label>
                    <Input 
                      type="date" 
                      value={editDob} 
                      onChange={e => setEditDob(e.target.value)}
                      className="bg-background/50 border-border/50 h-12 rounded-xl font-bold" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Personal Bio</Label>
                  <Textarea 
                    value={editBio} 
                    onChange={e => setEditBio(e.target.value)}
                    placeholder="Tell the community about yourself..."
                    className="bg-background/50 border-border/50 min-h-[100px] rounded-xl font-bold resize-none p-4" 
                  />
                </div>

                <div className="pt-2">
                  <Button onClick={handleSavePersonalInfo} className="w-full bg-primary font-bold uppercase tracking-widest text-[10px] h-12 rounded-xl shadow-lg shadow-primary/10">Save Changes</Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="privacy" className="border border-border/50 rounded-3xl bg-card/10 overflow-hidden px-6">
              <AccordionTrigger className="hover:no-underline py-6">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                    <Lock size={22} />
                  </div>
                  <span className="text-base font-bold">Identity & Visibility</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-8 space-y-6 px-2">
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-background/20 rounded-2xl border border-border/20">
                    <div className="space-y-0.5 text-left">
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-accent" />
                        <Label className="text-sm font-bold">Phone Number Visibility</Label>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">Who can see your contact number?</p>
                    </div>
                    <PrivacySelector field="mobile" current={user?.privacySettings?.mobile || 'Only Me'} />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-background/20 rounded-2xl border border-border/20">
                    <div className="space-y-0.5 text-left">
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-accent" />
                        <Label className="text-sm font-bold">Email Visibility</Label>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">Who can see your primary email?</p>
                    </div>
                    <PrivacySelector field="email" current={user?.privacySettings?.email || 'Neighbours'} />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-background/20 rounded-2xl border border-border/20">
                    <div className="space-y-0.5 text-left">
                      <div className="flex items-center gap-2">
                        <Cake size={14} className="text-accent" />
                        <Label className="text-sm font-bold">Date of Birth Visibility</Label>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">Who can see your age/birthday?</p>
                    </div>
                    <PrivacySelector field="dob" current={user?.privacySettings?.dob || 'Neighbours'} />
                  </div>

                  <div className="h-px bg-border/20 my-4" />
                  
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-1">Display Controls</h4>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5 text-left">
                      <Label className="text-sm font-bold">Show Full Age</Label>
                      <p className="text-xs text-muted-foreground font-bold">Displays e.g. "23 Years Old" on profile</p>
                    </div>
                    <Switch checked={user?.showFullAge} onCheckedChange={(v) => updateUser({ showFullAge: v, showBirthdayOnly: v ? false : user?.showBirthdayOnly })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5 text-left">
                      <Label className="text-sm font-bold">Show Birthday Only</Label>
                      <p className="text-xs text-muted-foreground font-bold">Displays e.g. "19 January", hides year</p>
                    </div>
                    <Switch checked={user?.showBirthdayOnly} onCheckedChange={(v) => updateUser({ showBirthdayOnly: v, showFullAge: v ? false : user?.showFullAge })} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5 text-left">
                      <Label className="text-sm font-bold">Show Merchant Status</Label>
                      <p className="text-xs text-muted-foreground font-bold">Toggle the store icon next to your name</p>
                    </div>
                    <Switch checked={user?.showShopBadge} onCheckedChange={(v) => updateUser({ showShopBadge: v })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5 text-left">
                      <Label className="text-sm font-bold">Show Expert Status</Label>
                      <p className="text-xs text-muted-foreground font-bold">Toggle the star icon next to your name</p>
                    </div>
                    <Switch checked={user?.showExpertBadge} onCheckedChange={(v) => updateUser({ showExpertBadge: v })} />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>

        <TabsContent value="posts" className="space-y-6">
          {myPosts.length > 0 ? (
            myPosts.map(post => (
              <PostCard key={post.id} post={post as any} />
            ))
          ) : (
            <div className="text-center py-20 border-2 border-dashed border-border/50 rounded-3xl">
              <p className="text-muted-foreground text-sm font-bold">You haven't posted anything yet.</p>
              <Link href="/community">
                <Button variant="link" className="text-accent font-bold mt-2">Start a conversation</Button>
              </Link>
            </div>
          )}
        </TabsContent>

        <TabsContent value="saved" className="space-y-6">
          {savedPosts.length > 0 ? (
            savedPosts.map(post => (
              <PostCard key={post.id} post={post as any} />
            ))
          ) : (
            <div className="text-center py-20 border-2 border-dashed border-border/50 rounded-3xl">
              <Bookmark className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
              <p className="text-muted-foreground text-sm font-bold">You haven't saved any posts yet.</p>
              <Link href="/community">
                <Button variant="link" className="text-accent font-bold mt-2">Explore Community Hub</Button>
              </Link>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Verification Modal */}
      <Dialog open={isVerificationModalOpen} onOpenChange={setIsVerificationModalOpen}>
        <DialogContent className="bg-background border-border sm:max-w-[450px] rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight flex items-center gap-2 uppercase">
              <BadgeCheck className="text-cyan-400" /> Apply for Verification
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed font-bold uppercase tracking-widest">
              Verified residents are recognized as credible members of the Chittagong community.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
             <div className="space-y-2">
               <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Credibility Statement</Label>
               <Textarea 
                 placeholder="Why should you be a verified resident? (e.g., Local community leader, active contributor)" 
                 className="bg-card/20 min-h-[120px] font-bold rounded-xl focus:ring-accent resize-none p-4"
                 value={verificationReason}
                 onChange={(e) => setVerificationReason(e.target.value)}
               />
             </div>
             <div className="p-4 bg-accent/5 border border-accent/20 rounded-2xl flex items-start gap-3">
               <FileText size={16} className="text-accent shrink-0 mt-0.5" />
               <p className="text-[10px] text-muted-foreground leading-relaxed font-bold">
                 Our compliance team in Chittagong will review your application based on your community history and provided reasoning.
               </p>
             </div>
          </div>
          <DialogFooter className="gap-3">
             <Button variant="ghost" onClick={() => setIsVerificationModalOpen(false)} className="rounded-xl font-bold uppercase text-[10px] tracking-widest">Cancel</Button>
             <Button onClick={submitVerificationRequest} className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest px-8 shadow-lg shadow-cyan-500/20 h-11">Submit Application</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="h-24 md:h-10" />
    </div>
  );
}
