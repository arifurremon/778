"use client";

import PostCard from "@/components/community/post-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { GlobalUserBadges } from "@/components/user/global-user-badges";
import type { User } from "@/hooks/use-auth";
import { PrivacyLevel, useAuth } from "@/hooks/use-auth";
import { useCommunity } from "@/hooks/use-community";
import { toast } from "@/hooks/use-toast";
import { validateFileUpload } from "@/lib/sanitize";
import { UploadButton } from "@/lib/uploadthing";
import { differenceInYears, format, parseISO } from "date-fns";
import { motion } from "framer-motion";
import {
  ArrowRight, AtSign, BadgeCheck, Bookmark, Briefcase,
  Cake, Camera, ChevronRight, Clock, Globe, Grid3x3,
  Home, Lock, Mail, MapPin, Pencil, Phone,
  Save, Settings, ShieldCheck, Star, Store, Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const CHITTAGONG_AREAS = [
  'Akbar Shah','Bakalia','Bandar','Bayezid Bostami','Chandgaon',
  'Chawkbazar','Double Mooring','EPZ','Halishahar','Karnaphuli',
  'Khulshi','Kotwali','Pahartali','Panchlaish','Patenga','Sadarghat',
];

function PrivacySelector({ field, current, onChange }: {
  field: string; current: PrivacyLevel;
  onChange: (v: PrivacyLevel) => void;
}) {
  return (
    <Select value={current} onValueChange={(v) => onChange(v as PrivacyLevel)}>
      <SelectTrigger className="w-[130px] h-8 text-xs font-semibold rounded-lg border-border/50">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="Public"><span className="flex items-center gap-2 text-xs"><Globe size={11}/>Public</span></SelectItem>
        <SelectItem value="Neighbours"><span className="flex items-center gap-2 text-xs"><Home size={11}/>Neighbours</span></SelectItem>
        <SelectItem value="Only Me"><span className="flex items-center gap-2 text-xs"><Lock size={11}/>Only Me</span></SelectItem>
      </SelectContent>
    </Select>
  );
}

export default function ProfileView() {
  const { user, updateUser } = useAuth();
  const { posts } = useCommunity();
  const [activeTab, setActiveTab] = useState("posts");
  const [isSaving, setIsSaving] = useState(false);

  const [editName, setEditName]       = useState(user?.name || "");
  const [editLocation, setEditLocation] = useState(user?.location || "");
  const [editDob, setEditDob]         = useState(user?.dob || "");
  const [editBio, setEditBio]         = useState(user?.bio || "");
  const [editProfession, setEditProfession] = useState((user as any)?.profession || "");

  const ageData = useMemo(() => {
    if (!user?.dob) return null;
    const d = parseISO(user.dob);
    return { age: differenceInYears(new Date(), d), birthday: format(d, "d MMMM") };
  }, [user?.dob]);

  // Sync edit states when user profile loads or updates
  useEffect(() => {
    if (user) {
      setEditName(user.name || "");
      setEditLocation(user.location || "");
      setEditDob(user.dob || "");
      setEditBio(user.bio || "");
      setEditProfession((user as any).profession || "");
    }
  }, [user]);

  const myPosts   = useMemo(() => posts.filter(p => p.author.username === user?.username), [posts, user?.username]);
  const savedPosts = useMemo(() => posts.filter(p => p.isSaved), [posts]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updates: Partial<User & { profession?: string }> = {};
      if (editName !== user?.name) {
        if ((user?.nameChangeCount || 0) >= 3) {
          toast({ variant: "destructive", title: "Name change limit reached", description: "You have used all 3 name changes." });
          setIsSaving(false); return;
        }
        updates.name = editName;
        updates.nameChangeCount = (user?.nameChangeCount || 0) + 1;
      }
      updates.location  = editLocation;
      updates.dob       = editDob;
      updates.bio       = editBio;
      (updates as any).profession = editProfession;
      await updateUser(updates as any);
      toast({ title: "Profile saved", description: "Your changes have been updated." });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Failed to save profile",
        description: err?.message || "An unexpected error occurred while saving.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrivacyChange = (field: keyof NonNullable<typeof user>["privacySettings"], value: PrivacyLevel) => {
    if (!user) return;
    updateUser({ privacySettings: { ...user.privacySettings, [field]: value } });
    toast({ title: "Privacy updated" });
  };

  const shopStatus    = user?.registrationStatus;
  const serviceStatus = user?.serviceRegistrationStatus;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-24 md:pb-10">

        {/* ── Profile Header Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-6 rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden"
        >
          {/* Subtle gradient stripe instead of cover */}
          <div className="h-24 bg-gradient-to-r from-blue-600/20 via-indigo-500/15 to-purple-500/20" />

          <div className="px-5 sm:px-8 pb-6">
            {/* Avatar row */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-12">
              {/* Avatar with upload */}
              <div className="relative w-fit">
                <Avatar className="w-24 h-24 sm:w-28 sm:h-28 border-4 border-card ring-2 ring-border/40 shadow-lg">
                  <AvatarImage src={user?.profileImage} className="object-cover" />
                  <AvatarFallback className="text-3xl font-black bg-muted text-muted-foreground">
                    {user?.name?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {/* Camera upload button */}
                <div className="absolute bottom-0 right-0 z-10">
                  <UploadButton
                    endpoint="profileImage"
                    onBeforeUploadBegin={(files) => {
                      const valid = files.filter(validateFileUpload);
                      if (!valid.length) toast({ variant: "destructive", title: "Invalid file", description: "JPG/PNG under 10MB only." });
                      return valid;
                    }}
                    onClientUploadComplete={(res) => {
                      if (res?.[0]) {
                        updateUser({ profileImage: res[0].url } as any);
                        toast({ title: "Photo updated!" });
                        setTimeout(() => window.location.reload(), 800);
                      }
                    }}
                    onUploadError={(e) => { toast({ variant: "destructive", title: "Upload failed", description: e.message }); }}
                    appearance={{
                      button: "h-8 w-8 min-w-0 p-0 rounded-full bg-primary text-primary-foreground shadow-md border-2 border-card flex items-center justify-center hover:bg-primary/90 transition-colors",
                      allowedContent: "hidden",
                    }}
                    content={{ button: <Camera size={14} /> }}
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pb-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 rounded-xl font-semibold text-xs h-9"
                  onClick={() => setActiveTab("edit")}
                >
                  <Pencil size={13} /> Edit Profile
                </Button>
                <Link href="/settings">
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl border border-border/50">
                    <Settings size={15} />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Name + badges */}
            <div className="mt-4 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">{user?.name || "Your Name"}</h1>
                <GlobalUserBadges user={user} size={18} />
                {user?.isVerified && (
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-bold">
                    <ShieldCheck size={10} className="mr-1" /> Verified
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground font-medium">@{user?.username}</p>
              {user?.bio && <p className="text-sm text-foreground/80 mt-2 leading-relaxed max-w-xl">{user.bio}</p>}
            </div>

            {/* Meta info row */}
            <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4">
              {user?.location && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                  <MapPin size={13} className="text-blue-500" /> {user.location}
                </span>
              )}
              {(user as any)?.profession && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                  <Briefcase size={13} className="text-purple-500" /> {(user as any).profession}
                </span>
              )}
              {ageData && user?.privacySettings?.dob !== 'Only Me' && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                  <Cake size={13} className="text-pink-500" /> {ageData.birthday}
                </span>
              )}
              {user?.joinDate && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                  <Clock size={13} /> Joined {user.joinDate}
                </span>
              )}
            </div>

            {/* Stats row */}
            <div className="flex gap-6 mt-5 pt-4 border-t border-border/40">
              <Link href="/neighbours" className="group text-center">
                <p className="text-lg font-black group-hover:text-primary transition-colors">{user?.neighboursCount ?? 0}</p>
                <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1"><Users size={10}/>Neighbours</p>
              </Link>
              <div className="text-center">
                <p className="text-lg font-black">{myPosts.length}</p>
                <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1"><Grid3x3 size={10}/>Posts</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-black">{savedPosts.length}</p>
                <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1"><Bookmark size={10}/>Saved</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Main Tabs ── */}
        <div className="mt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full bg-card border border-border/50 rounded-xl h-11 p-1 shadow-sm">
              <TabsTrigger value="posts" className="flex-1 rounded-lg gap-1.5 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Grid3x3 size={14}/> My Posts
              </TabsTrigger>
              <TabsTrigger value="saved" className="flex-1 rounded-lg gap-1.5 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Bookmark size={14}/> Saved
              </TabsTrigger>
              <TabsTrigger value="about" className="flex-1 rounded-lg gap-1.5 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <BadgeCheck size={14}/> About
              </TabsTrigger>
              <TabsTrigger value="edit" className="flex-1 rounded-lg gap-1.5 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Pencil size={14}/> Edit
              </TabsTrigger>
            </TabsList>

            {/* ── My Posts ── */}
            <TabsContent value="posts" className="mt-5 space-y-4">
              {myPosts.length > 0 ? myPosts.map(post => (
                <motion.div key={post.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <PostCard post={post} />
                </motion.div>
              )) : (
                <EmptyState icon={<Grid3x3 size={28}/>} title="No posts yet"
                  desc="Share your first update with the Chattala community."
                  cta="Create a Post" href="/community" />
              )}
            </TabsContent>

            {/* ── Saved Posts ── */}
            <TabsContent value="saved" className="mt-5 space-y-4">
              {savedPosts.length > 0 ? savedPosts.map(post => (
                <motion.div key={post.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <PostCard post={post} />
                </motion.div>
              )) : (
                <EmptyState icon={<Bookmark size={28}/>} title="Nothing saved yet"
                  desc="Bookmark posts to find them here quickly."
                  cta="Explore Community" href="/community" />
              )}
            </TabsContent>

            {/* ── About / Opportunities ── */}
            <TabsContent value="about" className="mt-5">
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Merchant card */}
                <Card className="border-border/50 shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                        <Store size={18}/>
                      </div>
                      <div>
                        <p className="text-sm font-bold">Merchant Account</p>
                        <p className="text-xs text-muted-foreground">Sell in the marketplace</p>
                      </div>
                    </div>
                    {shopStatus === 'Pending' ? (
                      <Button disabled size="sm" className="w-full rounded-lg bg-amber-500/10 text-amber-600 text-xs font-semibold">
                        <Clock size={13} className="mr-2"/> Under Review
                      </Button>
                    ) : shopStatus === 'Approved' ? (
                      <Link href="/seller">
                        <Button size="sm" className="w-full rounded-lg bg-emerald-600 text-white text-xs font-semibold">
                          Manage Shop <ChevronRight size={13}/>
                        </Button>
                      </Link>
                    ) : (
                      <Link href="/register-shop">
                        <Button size="sm" variant="outline" className="w-full rounded-lg text-xs font-semibold border-emerald-500/30 text-emerald-700 hover:bg-emerald-50">
                          Open a Shop <ArrowRight size={13}/>
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>

                {/* Expert card */}
                <Card className="border-border/50 shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                        <Briefcase size={18}/>
                      </div>
                      <div>
                        <p className="text-sm font-bold">Expert Listing</p>
                        <p className="text-xs text-muted-foreground">Offer professional services</p>
                      </div>
                    </div>
                    {serviceStatus === 'Pending' ? (
                      <Button disabled size="sm" className="w-full rounded-lg bg-amber-500/10 text-amber-600 text-xs font-semibold">
                        <Clock size={13} className="mr-2"/> Under Review
                      </Button>
                    ) : serviceStatus === 'Approved' ? (
                      <Link href="/expert">
                        <Button size="sm" className="w-full rounded-lg bg-purple-600 text-white text-xs font-semibold">
                          Manage Listing <ChevronRight size={13}/>
                        </Button>
                      </Link>
                    ) : (
                      <Link href="/register-service">
                        <Button size="sm" variant="outline" className="w-full rounded-lg text-xs font-semibold border-purple-500/30 text-purple-700 hover:bg-purple-50">
                          List a Service <ArrowRight size={13}/>
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>

                {/* Verification card */}
                {!user?.isVerified && (
                  <Card className="border-border/50 shadow-sm sm:col-span-2">
                    <CardContent className="p-5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 flex items-center justify-center">
                          <BadgeCheck size={18}/>
                        </div>
                        <div>
                          <p className="text-sm font-bold">Get Verified</p>
                          <p className="text-xs text-muted-foreground">Become a trusted community member</p>
                        </div>
                      </div>
                      <Button size="sm" className="rounded-lg bg-cyan-600 text-white text-xs font-semibold shrink-0">
                        Apply Now
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Privacy display settings */}
              <Card className="mt-4 border-border/50 shadow-sm">
                <CardContent className="p-5 space-y-4">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Lock size={12}/> Privacy Settings
                  </p>
                  {[
                    { field: "mobile" as const, label: "Mobile Number", icon: <Phone size={13}/> },
                    { field: "email"  as const, label: "Email Address", icon: <Mail size={13}/> },
                    { field: "dob"    as const, label: "Date of Birth",  icon: <Cake size={13}/> },
                  ].map(({ field, label, icon }) => (
                    <div key={field} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                      <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        {icon} {label}
                      </span>
                      <PrivacySelector
                        field={field}
                        current={user?.privacySettings?.[field] || 'Only Me'}
                        onChange={(v) => handlePrivacyChange(field, v)}
                      />
                    </div>
                  ))}

                  {/* Badge display toggles */}
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 pt-2">
                    <Star size={12}/> Badge Display
                  </p>
                  {[
                    { key: "showShopBadge",   label: "Merchant Badge",  icon: <Store size={13} className="text-emerald-600"/> },
                    { key: "showExpertBadge", label: "Expert Badge",    icon: <Star size={13} className="text-purple-600"/>   },
                    { key: "showFullAge",      label: "Show Full Age",   icon: <Cake size={13}/>  },
                    { key: "showBirthdayOnly", label: "Show Birthday Only", icon: <Cake size={13}/> },
                  ].map(({ key, label, icon }) => (
                    <div key={key} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                      <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        {icon} {label}
                      </span>
                      <Switch
                        checked={!!(user as any)?.[key]}
                        onCheckedChange={(v) => updateUser({ [key]: v } as any)}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Edit Profile ── */}
            <TabsContent value="edit" className="mt-5">
              <Card className="border-border/50 shadow-sm">
                <CardContent className="p-6 space-y-5">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-1">
                    <Pencil size={12}/> Personal Information
                  </p>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Username (read-only) */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                        <AtSign size={11}/> Username
                        <span className="text-[10px] text-muted-foreground/60">(permanent)</span>
                      </Label>
                      <div className="flex items-center h-10 px-3 rounded-lg bg-muted/50 border border-border/40 text-sm text-muted-foreground font-medium">
                        @{user?.username}
                      </div>
                    </div>

                    {/* Full Name */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                        Full Name
                        <span className="text-[10px] text-muted-foreground/60">
                          {3 - (user?.nameChangeCount || 0)} changes left
                        </span>
                      </Label>
                      <Input
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        disabled={(user?.nameChangeCount || 0) >= 3}
                        className="h-10 rounded-lg text-sm"
                      />
                    </div>

                    {/* Location */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                        <MapPin size={11}/> Locality (Thana)
                      </Label>
                      <Select onValueChange={setEditLocation} defaultValue={editLocation}>
                        <SelectTrigger className="h-10 rounded-lg text-sm">
                          <SelectValue placeholder="Select area" />
                        </SelectTrigger>
                        <SelectContent>
                          {CHITTAGONG_AREAS.map(a => (
                            <SelectItem key={a} value={a} className="text-sm">{a}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Date of birth */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                        <Cake size={11}/> Date of Birth
                      </Label>
                      <Input
                        type="date"
                        value={editDob}
                        onChange={e => setEditDob(e.target.value)}
                        className="h-10 rounded-lg text-sm"
                      />
                    </div>

                    {/* Profession */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                        <Briefcase size={11}/> Profession
                      </Label>
                      <Input
                        value={editProfession}
                        onChange={e => setEditProfession(e.target.value)}
                        placeholder="e.g., Engineer, Teacher, Business Owner"
                        className="h-10 rounded-lg text-sm"
                      />
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">Bio</Label>
                    <Textarea
                      value={editBio}
                      onChange={e => setEditBio(e.target.value)}
                      placeholder="Tell the community about yourself..."
                      className="rounded-lg text-sm min-h-[100px] resize-none"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="gap-2 rounded-xl font-semibold text-sm px-8"
                    >
                      {isSaving ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                          Saving...
                        </span>
                      ) : (
                        <><Save size={14}/> Save Changes</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

      </div>
    </div>
  );
}

function EmptyState({ icon, title, desc, cta, href }: {
  icon: React.ReactNode; title: string; desc: string; cta: string; href: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border/40 rounded-2xl bg-muted/10 text-center px-6">
      <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center text-muted-foreground mb-4">
        {icon}
      </div>
      <h3 className="text-base font-bold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-5">{desc}</p>
      <Link href={href}>
        <Button size="sm" className="rounded-xl text-xs font-semibold px-6">{cta}</Button>
      </Link>
    </div>
  );
}
