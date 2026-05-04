
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
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 relative">
      {/* Settings Desktop Trigger */}
      <div className="absolute top-8 right-6 hidden md:block z-50">
        <Link href="/settings">
          <Button variant="outline" size="icon" className="rounded-full bg-card/50 backdrop-blur-md border-border/50 hover:bg-accent hover:text-accent-foreground shadow-lg">
            <Settings size={20} />
          </Button>
        </Link>
      </div>

      {/* Banner & Profile Info Section */}
      <section className="relative mb-16">
        {/* Cover Photo/Gradient */}
        <div className="h-48 sm:h-64 w-full rounded-[2.5rem] bg-gradient-to-r from-primary/30 via-accent/20 to-purple-500/30 border border-border/50 relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-background/20 backdrop-blur-[2px]" />
          {/* Decorative Pattern */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
        </div>

        {/* Avatar & Main Info */}
        <div className="absolute -bottom-16 left-6 sm:left-12 flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6 w-[calc(100%-3rem)] sm:w-[calc(100%-6rem)]">
          
          <div className="relative group shrink-0">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl scale-110" />
            <Avatar className="w-32 h-32 sm:w-40 sm:h-40 border-4 border-background ring-4 ring-card shadow-2xl transition-transform duration-500 relative z-10">
              <AvatarImage src={user?.profileImage} className="object-cover" />
              <AvatarFallback className="text-5xl font-black bg-gradient-to-br from-primary/20 to-accent/20 text-primary">
                {user?.name?.[0]}
              </AvatarFallback>
            </Avatar>
            
            {/* Upload Button Overlay - Always visible on small screens, hover on large */}
            <div className="absolute bottom-2 right-2 p-1 z-20">
              <div className="relative group/btn">
                <div className="absolute inset-0 bg-primary rounded-full blur-md opacity-40 group-hover/btn:opacity-60 transition-opacity" />
                <UploadButton
                  endpoint="profileImage"
                  onClientUploadComplete={(res) => {
                    if (res?.[0]) {
                      updateUser({ profileImage: res[0].url });
                      toast({ title: "Photo Updated", description: "Your new profile picture has been saved." });
                      setTimeout(() => window.location.reload(), 1000);
                    }
                  }}
                  onUploadError={(error: Error) => {
                    toast({ variant: "destructive", title: "Upload Failed", description: error.message });
                  }}
                  appearance={{
                    button: "bg-primary hover:bg-primary/90 text-white rounded-full w-10 h-10 min-w-0 p-0 shadow-xl transition-all hover:scale-110 flex items-center justify-center border-2 border-background",
                    allowedContent: "hidden"
                  }}
                  content={{
                    button: <Camera size={16} />
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 pb-2 w-full text-center sm:text-left">
            <div className="space-y-1.5">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground drop-shadow-sm">{user?.name}</h2>
                <GlobalUserBadges user={user} size={22} />
              </div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-sm font-bold">
                <span className="text-accent bg-accent/10 px-2.5 py-0.5 rounded-md tracking-tight">@{user?.username}</span>
                {user?.location && (
                  <span className="text-muted-foreground flex items-center gap-1">
                    <MapPin size={14} className="text-primary/70" /> {user?.location}
                  </span>
                )}
                {ageData && user?.showBirthdayOnly !== false && user?.privacySettings?.dob !== 'Only Me' && (
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Cake size={14} className="text-pink-500/70" /> {ageData.birthday}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
               {user?.isVerified ? (
                 <Button variant="outline" className="rounded-xl font-black text-[10px] uppercase tracking-widest text-emerald-400 border-emerald-500/30 bg-emerald-500/5 h-10 px-5 cursor-default hover:bg-emerald-500/10">
                   <ShieldCheck size={16} className="mr-2" /> Verified Neighbour
                 </Button>
               ) : requestSent ? (
                 <Button disabled className="bg-muted/40 text-muted-foreground rounded-xl font-black text-[10px] uppercase tracking-widest h-10 px-5">
                   <Clock size={16} className="mr-2" /> Request Sent
                 </Button>
               ) : (
                 <Button onClick={() => setRequestSent(true)} className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-accent/20 h-10 px-5 transition-transform hover:scale-105">
                   <UserPlus size={16} className="mr-2" /> Add Neighbour
                 </Button>
               )}
            </div>
          </div>
        </div>
      </section>

      {/* Bio & Stats Section */}
      <section className="mt-24 sm:mt-20 mb-12 flex flex-col sm:flex-row gap-6">
        <div className="flex-1 space-y-4">
          <div className="bg-card/40 border border-border/50 rounded-3xl p-6 shadow-sm backdrop-blur-md h-full">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3 flex items-center gap-2">
              <FileText size={12} /> About
            </h3>
            <p className="text-sm text-foreground/90 font-medium leading-relaxed">
              {user?.bio || "No bio added yet. Tell the community about yourself!"}
            </p>
            {user?.verificationRequestStatus === 'Pending' && !user?.isVerified && (
              <div className="mt-6">
                <Badge variant="outline" className="rounded-lg border-orange-500/50 text-orange-400 font-bold uppercase tracking-widest text-[9px] h-8 px-4 flex items-center gap-2 bg-orange-500/5 w-fit">
                  <Clock size={12} /> Identity Review Pending
                </Badge>
              </div>
            )}
          </div>
        </div>

        <div className="w-full sm:w-72 shrink-0">
          <div className="bg-card/40 border border-border/50 rounded-3xl overflow-hidden flex flex-col shadow-sm backdrop-blur-md h-full">
             <Link href="/neighbours" className="flex-1 flex flex-col items-center justify-center p-6 border-b border-border/50 hover:bg-white/5 transition-colors cursor-pointer group">
               <span className="text-3xl font-black tracking-tight text-foreground group-hover:text-accent transition-colors">{user?.neighbours?.length || 0}</span>
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-1">Neighbours</span>
             </Link>
             <div className="flex-1 flex flex-col items-center justify-center p-6 bg-background/20">
               <span className="text-3xl font-black tracking-tight text-foreground">{myPosts.length}</span>
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-1">Posts</span>
             </div>
          </div>
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
