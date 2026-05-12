
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
import { validateFileUpload } from "@/lib/sanitize";

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
    <div className="w-full bg-background min-h-screen pb-24 md:pb-10">
      {/* Settings Desktop Trigger - Floating Top Right */}
      <div className="fixed top-24 right-8 hidden xl:block z-50">
        <Link href="/settings">
          <Button variant="outline" size="icon" className="rounded-full bg-card/50 backdrop-blur-md border-border/50 hover:bg-accent hover:text-accent-foreground shadow-lg h-12 w-12">
            <Settings size={22} />
          </Button>
        </Link>
      </div>

      {/* Full Width Premium Banner */}
      <div className="h-48 sm:h-64 lg:h-[320px] w-full relative overflow-hidden bg-gradient-to-r from-primary/40 via-accent/30 to-purple-500/40">
        <div className="absolute inset-0 bg-background/10 backdrop-blur-sm" />
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
        
        {/* Banner Edit Button */}
        <div className="absolute top-6 right-6 z-10 flex gap-2">
          <Button variant="outline" size="sm" className="bg-black/40 backdrop-blur-md border-white/10 text-white hover:bg-black/60 rounded-full h-9 px-4 text-[10px] uppercase tracking-widest font-bold shadow-xl">
            <Camera size={14} className="mr-2" /> Change Cover
          </Button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 relative">
          
          {/* Left Sidebar - Profile Identity (Sticky) */}
          <div className="lg:col-span-4 relative z-20">
            <div className="lg:sticky lg:top-24 -mt-20 sm:-mt-24 lg:-mt-32 flex flex-col gap-6">
              
              {/* Identity Card */}
              <div className="bg-card/60 backdrop-blur-xl border border-border/50 rounded-[2rem] p-6 sm:p-8 shadow-2xl flex flex-col items-center sm:items-start text-center sm:text-left relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
                
                {/* Avatar with Upload */}
                <div className="relative group shrink-0 mb-6">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl scale-110" />
                  <Avatar className="w-32 h-32 sm:w-40 sm:h-40 border-4 border-card ring-4 ring-primary/20 shadow-2xl transition-transform duration-500 relative z-10">
                    <AvatarImage src={user?.profileImage} className="object-cover" />
                    <AvatarFallback className="text-5xl font-black bg-gradient-to-br from-primary/20 to-accent/20 text-primary">
                      {user?.name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Facebook-style Upload Button */}
                  <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 z-20">
                    <UploadButton
                      endpoint="profileImage"
                      onBeforeUploadBegin={(files) => {
                        const validFiles = files.filter(validateFileUpload);
                        if (validFiles.length === 0) {
                          toast({ variant: "destructive", title: "Invalid File", description: "Only JPG, PNG, PDF under 10MB are allowed." });
                        }
                        return validFiles;
                      }}
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
                        button: "bg-secondary hover:bg-secondary/80 text-foreground rounded-full w-10 h-10 sm:w-11 sm:h-11 min-w-0 p-0 shadow-sm transition-colors flex items-center justify-center border-4 border-card",
                        allowedContent: "hidden"
                      }}
                      content={{ button: <Camera size={18} /> }}
                    />
                  </div>
                </div>

                {/* Name & Title */}
                <div className="space-y-2 w-full">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 justify-center sm:justify-start">
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">{user?.name}</h2>
                    <GlobalUserBadges user={user} size={24} className="mt-1" />
                  </div>
                  <p className="text-accent font-black text-sm tracking-widest uppercase">@{user?.username}</p>
                </div>

                {/* Bio */}
                <p className="mt-4 text-sm text-foreground/80 font-medium leading-relaxed">
                  {user?.bio || "No bio added yet. Tell the community about yourself!"}
                </p>

                {/* Location & DOB Details */}
                <div className="mt-6 flex flex-col gap-3 w-full">
                  {user?.location && (
                    <div className="flex items-center gap-3 text-sm font-bold text-muted-foreground bg-background/40 p-3 rounded-xl border border-border/30">
                      <MapPin size={16} className="text-primary" /> {user?.location}
                    </div>
                  )}
                  {ageData && user?.showBirthdayOnly !== false && user?.privacySettings?.dob !== 'Only Me' && (
                    <div className="flex items-center gap-3 text-sm font-bold text-muted-foreground bg-background/40 p-3 rounded-xl border border-border/30">
                      <Cake size={16} className="text-pink-500" /> {ageData.birthday}
                    </div>
                  )}
                </div>

                {/* Primary Action Button */}
                <div className="mt-8 w-full pt-6 border-t border-border/50">
                  {user?.isVerified ? (
                    <Button variant="outline" className="w-full rounded-xl font-black text-[11px] uppercase tracking-widest text-emerald-500 border-emerald-500/30 bg-emerald-500/5 h-12 cursor-default hover:bg-emerald-500/10">
                      <ShieldCheck size={18} className="mr-2" /> Verified Neighbour
                    </Button>
                  ) : requestSent ? (
                    <Button disabled className="w-full bg-muted/40 text-muted-foreground rounded-xl font-black text-[11px] uppercase tracking-widest h-12">
                      <Clock size={18} className="mr-2" /> Request Sent
                    </Button>
                  ) : (
                    <Button onClick={() => setRequestSent(true)} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-accent/20 h-12 transition-transform hover:-translate-y-1">
                      <UserPlus size={18} className="mr-2" /> Add Neighbour
                    </Button>
                  )}
                </div>
              </div>

              {/* Stats Card */}
              <div className="bg-card/60 backdrop-blur-xl border border-border/50 rounded-[2rem] overflow-hidden shadow-xl grid grid-cols-2 divide-x divide-border/50">
                <Link href="/neighbours" className="flex flex-col items-center justify-center p-6 hover:bg-white/5 transition-colors cursor-pointer group">
                  <span className="text-3xl font-black tracking-tight text-foreground group-hover:text-accent transition-colors">{user?.neighbours?.length || 0}</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-2 flex items-center gap-1"><Home size={12}/> Neighbours</span>
                </Link>
                <div className="flex flex-col items-center justify-center p-6 bg-background/10">
                  <span className="text-3xl font-black tracking-tight text-foreground">{myPosts.length}</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-2 flex items-center gap-1"><Grid size={12}/> Posts</span>
                </div>
              </div>

              {/* Opportunities Sidebar Cards */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground px-2">Opportunities</h3>
                
                {/* Merchant */}
                <div className="bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-3xl p-5 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                      <Store size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-tight">Merchant Account</h4>
                    </div>
                  </div>
                  <div className="mt-4">{getShopStatusDisplay()}</div>
                </div>

                {/* Expert */}
                <div className="bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 rounded-3xl p-5 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-500 flex items-center justify-center">
                      <Briefcase size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-tight">Expert Listing</h4>
                    </div>
                  </div>
                  <div className="mt-4">{getServiceStatusDisplay()}</div>
                </div>
              </div>

            </div>
          </div>

          {/* Right Main Area - Tabs & Content */}
          <div className="lg:col-span-8 pt-8 lg:pt-6">
            <Tabs defaultValue="posts" className="w-full">
              
              {/* Premium Pill Tabs */}
              <TabsList className="w-full bg-card/40 backdrop-blur-md border border-border/50 p-2 rounded-2xl h-auto flex flex-wrap gap-2 mb-8 shadow-sm">
                <TabsTrigger value="posts" className="flex-1 rounded-xl flex items-center justify-center gap-2 py-3.5 data-[state=active]:bg-background data-[state=active]:shadow-md transition-all font-black text-[11px] uppercase tracking-widest min-w-[120px]">
                  <Grid size={16} /> My Posts
                </TabsTrigger>
                <TabsTrigger value="saved" className="flex-1 rounded-xl flex items-center justify-center gap-2 py-3.5 data-[state=active]:bg-background data-[state=active]:shadow-md transition-all font-black text-[11px] uppercase tracking-widest min-w-[120px]">
                  <Bookmark size={16} /> Saved
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex-1 rounded-xl flex items-center justify-center gap-2 py-3.5 data-[state=active]:bg-background data-[state=active]:shadow-md transition-all font-black text-[11px] uppercase tracking-widest min-w-[120px]">
                  <Settings size={16} /> Settings
                </TabsTrigger>
              </TabsList>

              {/* POSTS TAB */}
              <TabsContent value="posts" className="space-y-6 outline-none focus-visible:ring-0">
                {myPosts.length > 0 ? (
                  <div className="space-y-6">
                    {myPosts.map(post => (
                      <PostCard key={post.id} post={post as any} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-24 bg-card/20 border-2 border-dashed border-border/50 rounded-[2.5rem] flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-muted/30 rounded-3xl flex items-center justify-center mb-6 text-muted-foreground">
                      <Grid size={32} />
                    </div>
                    <h3 className="text-lg font-black tracking-tight mb-2">No Posts Yet</h3>
                    <p className="text-muted-foreground text-sm font-bold max-w-xs mx-auto mb-6">Share your thoughts, updates, or local news with the Chattala community.</p>
                    <Link href="/community">
                      <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-[10px] tracking-widest h-12 px-8 rounded-xl shadow-xl shadow-primary/20">
                        Create Post
                      </Button>
                    </Link>
                  </div>
                )}
              </TabsContent>

              {/* SAVED TAB */}
              <TabsContent value="saved" className="space-y-6 outline-none focus-visible:ring-0">
                {savedPosts.length > 0 ? (
                  <div className="space-y-6">
                    {savedPosts.map(post => (
                      <PostCard key={post.id} post={post as any} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-24 bg-card/20 border-2 border-dashed border-border/50 rounded-[2.5rem] flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-muted/30 rounded-3xl flex items-center justify-center mb-6 text-muted-foreground">
                      <Bookmark size={32} />
                    </div>
                    <h3 className="text-lg font-black tracking-tight mb-2">Saved Collection Empty</h3>
                    <p className="text-muted-foreground text-sm font-bold max-w-xs mx-auto mb-6">Bookmark helpful posts and discussions to easily find them later here.</p>
                    <Link href="/community">
                      <Button className="bg-accent hover:bg-accent/90 text-accent-foreground font-black uppercase text-[10px] tracking-widest h-12 px-8 rounded-xl shadow-xl shadow-accent/20">
                        Explore Community
                      </Button>
                    </Link>
                  </div>
                )}
              </TabsContent>

              {/* SETTINGS TAB */}
              <TabsContent value="settings" className="space-y-8 outline-none focus-visible:ring-0">
                
                {/* Profile Information Block */}
                <div className="bg-card/40 backdrop-blur-md border border-border/50 rounded-[2.5rem] overflow-hidden shadow-lg">
                  <div className="p-6 sm:p-8 border-b border-border/50 bg-gradient-to-r from-background/50 to-transparent flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                      <UserCircle size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black tracking-tight">Personal Information</h3>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Manage your identity</p>
                    </div>
                  </div>
                  
                  <div className="p-6 sm:p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2.5">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Permanent Username</Label>
                        <div className="flex items-center gap-3 bg-background/60 border border-border/40 h-14 px-4 rounded-2xl text-muted-foreground font-bold text-sm shadow-inner">
                          <AtSign size={16} className="text-accent" /> {user?.username}
                        </div>
                      </div>
                      <div className="space-y-2.5">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex justify-between">
                          Full Name <span>{3 - (user?.nameChangeCount || 0)} changes left</span>
                        </Label>
                        <Input 
                          value={editName} 
                          onChange={e => setEditName(e.target.value)} 
                          disabled={(user?.nameChangeCount || 0) >= 3}
                          className="bg-background/60 border-border/40 h-14 rounded-2xl font-bold shadow-inner focus-visible:ring-primary" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2.5">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Locality (Thana)</Label>
                        <Select onValueChange={setEditLocation} defaultValue={editLocation}>
                          <SelectTrigger className="bg-background/60 border-border/40 h-14 rounded-2xl font-bold shadow-inner focus:ring-primary">
                            <SelectValue placeholder="Select Area" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-border/50 shadow-xl backdrop-blur-xl bg-card/90">
                            {CHITTAGONG_AREAS.map(area => (
                              <SelectItem key={area} value={area} className="font-bold py-3">{area}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2.5">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date of Birth</Label>
                        <Input 
                          type="date" 
                          value={editDob} 
                          onChange={e => setEditDob(e.target.value)}
                          className="bg-background/60 border-border/40 h-14 rounded-2xl font-bold shadow-inner focus-visible:ring-primary" 
                        />
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Professional Bio</Label>
                      <Textarea 
                        value={editBio} 
                        onChange={e => setEditBio(e.target.value)}
                        placeholder="Tell the community about yourself, your skills, and what you do..."
                        className="bg-background/60 border-border/40 min-h-[120px] rounded-2xl font-medium resize-none p-5 shadow-inner focus-visible:ring-primary text-sm leading-relaxed" 
                      />
                    </div>

                    <div className="pt-4 flex justify-end">
                      <Button onClick={handleSavePersonalInfo} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-[11px] h-12 px-10 rounded-xl shadow-xl shadow-primary/20 transition-transform hover:-translate-y-1">
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Privacy & Visibility Block */}
                <div className="bg-card/40 backdrop-blur-md border border-border/50 rounded-[2.5rem] overflow-hidden shadow-lg">
                  <div className="p-6 sm:p-8 border-b border-border/50 bg-gradient-to-r from-background/50 to-transparent flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                      <Lock size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black tracking-tight">Privacy & Display</h3>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Control your digital footprint</p>
                    </div>
                  </div>
                  
                  <div className="p-6 sm:p-8 space-y-8">
                    
                    {/* Contact Privacy */}
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-accent mb-4">Contact Privacy</h4>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-background/40 rounded-2xl border border-border/30 gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Phone size={16} className="text-muted-foreground" />
                            <Label className="text-sm font-bold">Mobile Number</Label>
                          </div>
                          <p className="text-[11px] text-muted-foreground font-medium">Who can see your registered contact number?</p>
                        </div>
                        <PrivacySelector field="mobile" current={user?.privacySettings?.mobile || 'Only Me'} />
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-background/40 rounded-2xl border border-border/30 gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Mail size={16} className="text-muted-foreground" />
                            <Label className="text-sm font-bold">Email Address</Label>
                          </div>
                          <p className="text-[11px] text-muted-foreground font-medium">Who can see your primary email address?</p>
                        </div>
                        <PrivacySelector field="email" current={user?.privacySettings?.email || 'Neighbours'} />
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-background/40 rounded-2xl border border-border/30 gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Cake size={16} className="text-muted-foreground" />
                            <Label className="text-sm font-bold">Date of Birth</Label>
                          </div>
                          <p className="text-[11px] text-muted-foreground font-medium">Who can view your birthday?</p>
                        </div>
                        <PrivacySelector field="dob" current={user?.privacySettings?.dob || 'Neighbours'} />
                      </div>
                    </div>

                    <div className="h-px bg-border/40 my-8" />
                    
                    {/* Profile Badges Display */}
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-accent mb-4">Profile Elements Display</h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-5 bg-background/40 rounded-2xl border border-border/30">
                          <div className="space-y-1">
                            <Label className="text-sm font-bold">Full Age</Label>
                            <p className="text-[10px] text-muted-foreground font-medium">Shows "23 Years Old"</p>
                          </div>
                          <Switch checked={user?.showFullAge} onCheckedChange={(v) => updateUser({ showFullAge: v, showBirthdayOnly: v ? false : user?.showBirthdayOnly })} />
                        </div>
                        
                        <div className="flex items-center justify-between p-5 bg-background/40 rounded-2xl border border-border/30">
                          <div className="space-y-1">
                            <Label className="text-sm font-bold">Birthday Only</Label>
                            <p className="text-[10px] text-muted-foreground font-medium">Shows "19 Jan", hides year</p>
                          </div>
                          <Switch checked={user?.showBirthdayOnly} onCheckedChange={(v) => updateUser({ showBirthdayOnly: v, showFullAge: v ? false : user?.showFullAge })} />
                        </div>

                        <div className="flex items-center justify-between p-5 bg-background/40 rounded-2xl border border-border/30">
                          <div className="space-y-1">
                            <Label className="text-sm font-bold flex items-center gap-1.5"><Store size={14} className="text-emerald-500"/> Merchant Badge</Label>
                            <p className="text-[10px] text-muted-foreground font-medium">Display shop icon on profile</p>
                          </div>
                          <Switch checked={user?.showShopBadge} onCheckedChange={(v) => updateUser({ showShopBadge: v })} />
                        </div>

                        <div className="flex items-center justify-between p-5 bg-background/40 rounded-2xl border border-border/30">
                          <div className="space-y-1">
                            <Label className="text-sm font-bold flex items-center gap-1.5"><Star size={14} className="text-purple-500"/> Expert Badge</Label>
                            <p className="text-[10px] text-muted-foreground font-medium">Display expert star on profile</p>
                          </div>
                          <Switch checked={user?.showExpertBadge} onCheckedChange={(v) => updateUser({ showExpertBadge: v })} />
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

              </TabsContent>
            </Tabs>
          </div>

        </div>
      </div>

      {/* Verification Modal */}
      <Dialog open={isVerificationModalOpen} onOpenChange={setIsVerificationModalOpen}>
        <DialogContent className="bg-card/95 backdrop-blur-xl border-border/50 sm:max-w-[450px] rounded-[2.5rem] shadow-2xl">
          <DialogHeader className="p-2">
            <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-2 uppercase text-foreground">
              <BadgeCheck className="text-cyan-400" size={24} /> Verification Setup
            </DialogTitle>
            <DialogDescription className="text-[11px] text-muted-foreground leading-relaxed font-bold uppercase tracking-widest mt-3">
              Verified residents are recognized as credible members of the Chittagong community.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-5">
             <div className="space-y-3">
               <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Credibility Statement</Label>
               <Textarea 
                 placeholder="Why should you be a verified resident? (e.g., Local community leader, active contributor)" 
                 className="bg-background/50 min-h-[140px] font-medium rounded-2xl border-border/40 focus-visible:ring-primary resize-none p-5 text-sm leading-relaxed"
                 value={verificationReason}
                 onChange={(e) => setVerificationReason(e.target.value)}
               />
             </div>
             <div className="p-4 bg-accent/5 border border-accent/20 rounded-2xl flex items-start gap-3">
               <ShieldCheck size={18} className="text-accent shrink-0 mt-0.5" />
               <p className="text-[11px] text-muted-foreground leading-relaxed font-bold">
                 Our local compliance team will review your application based on community history and provided reasoning.
               </p>
             </div>
          </div>
          <DialogFooter className="gap-3 pt-4">
             <Button variant="ghost" onClick={() => setIsVerificationModalOpen(false)} className="rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-muted/50 h-12">Cancel</Button>
             <Button onClick={submitVerificationRequest} className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest px-8 shadow-xl shadow-cyan-500/20 h-12 transition-transform hover:-translate-y-1">Submit Application</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
