"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  User, 
  MessageSquare, 
  ThumbsUp, 
  Share2, 
  Trash2, 
  Ban, 
  Pin, 
  Save, 
  Loader2,
  Globe,
  Users,
  Lock,
  EyeOff,
  AlertTriangle,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

import { StatusBadge } from '@/components/admin/display/StatusBadge';
import { ConfirmationDialog } from '@/components/admin/actions/ConfirmationDialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// SCHEMA-FALLBACK: moderationStatus field not available — using visibility as proxy
interface AdminPostDetail {
  id: string;
  content: string;
  images: string[] | null;
  visibility: 'PUBLIC' | 'NEIGHBOURS' | 'PRIVATE';
  moderationStatus: 'ACTIVE' | 'FLAGGED' | 'HIDDEN' | 'DELETED';
  moderationReason: string | null;
  adminNotes: string | null;
  flagCount: number;
  isPinned?: boolean;
  author: { id: string; name: string; email: string; profileImage: string | null };
  createdAt: string;
  _count: { likes: number; comments: number };
  comments: Array<{
    id: string;
    text: string;
    createdAt: string;
    author: { id: string; name: string; profileImage: string | null };
    isHidden?: boolean;
  }>;
}

export default function PostDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [post, setPost] = useState<AdminPostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Local state for actions
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");
  const [visibility, setVisibility] = useState("");
  const [isPinned, setIsPinned] = useState(false);

  // Dialog states
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmBan, setConfirmBan] = useState(false);

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/posts/${id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      
      // SCHEMA-FALLBACK: moderationStatus field not available — using visibility as proxy
      const mapped = {
        ...data,
        moderationStatus: data.moderationStatus || (data.visibility === 'PRIVATE' ? 'HIDDEN' : 'ACTIVE')
      };
      
      setPost(mapped);
      setNotes(mapped.adminNotes || "");
      setStatus(mapped.moderationStatus);
      setVisibility(mapped.visibility);
      setIsPinned(mapped.isPinned || false);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not retrieve post data." });
      router.push('/admin/posts');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/posts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminNotes: notes,
          moderationStatus: status,
          visibility: visibility,
          isPinned: isPinned
        })
      });
      if (!res.ok) throw new Error();
      toast({ title: "Updated", description: "Post moderation settings saved." });
      fetchPost();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Update failed." });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/admin/posts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast({ title: "Purged", description: "Post has been permanently removed." });
      router.push('/admin/posts');
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Deletion failed." });
    } finally {
      setConfirmDelete(false);
    }
  };

  const handleBanAuthor = async () => {
    try {
      const res = await fetch(`/api/admin/users/${post?.author.id}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: "Policy violation: Repeated violation in content feed.", suspended: true })
      });
      if (!res.ok) throw new Error();
      toast({ title: "Author Suspended", description: "User account access has been revoked." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Operation failed." });
    } finally {
      setConfirmBan(false);
    }
  };

  if (loading || !post) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link href="/admin/posts"><ChevronLeft size={20} /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-black tracking-tight italic">Content Review</h1>
          <p className="text-sm text-muted-foreground mt-1">Audit trail and moderation for Post ID: {post.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: Feed Preview & Interactions */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/5 p-6">
              <div className="flex items-center gap-4">
                <Avatar className="w-12 h-12 border-2 border-primary/10">
                  <AvatarImage src={post.author.profileImage || ""} />
                  <AvatarFallback>{post.author.name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <Link href={`/admin/users/${post.author.id}`} className="font-bold text-lg hover:underline decoration-primary">
                    {post.author.name}
                  </Link>
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                    <Clock size={12} /> {format(new Date(post.createdAt), 'PPPP p')}
                  </span>
                </div>
              </div>
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 gap-1.5 px-3 py-1 text-xs font-bold uppercase">
                {post.visibility === 'PUBLIC' ? <Globe size={12} /> : post.visibility === 'NEIGHBOURS' ? <Users size={12} /> : <Lock size={12} />}
                {post.visibility}
              </Badge>
            </CardHeader>
            <CardContent className="p-8">
              {/* Preserve line breaks */}
              <div className="prose prose-sm max-w-none">
                <p className="text-xl leading-relaxed whitespace-pre-wrap font-medium text-foreground/90">
                  {post.content}
                </p>
              </div>

              {post.images && post.images.length > 0 && (
                <div className={cn(
                  "mt-8 grid gap-4 rounded-2xl overflow-hidden border",
                  post.images.length === 1 ? "grid-cols-1" : post.images.length === 2 ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3"
                )}>
                  {post.images.map((img, idx) => (
                    <div key={idx} className="aspect-square relative group">
                      <img src={img} alt="Post asset" className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700" />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-6 mt-8 pt-6 border-t text-muted-foreground">
                <div className="flex items-center gap-2 text-sm font-bold"><ThumbsUp size={16} /> {post._count.likes} Likes</div>
                <div className="flex items-center gap-2 text-sm font-bold"><MessageSquare size={16} /> {post._count.comments} Comments</div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="text-xl font-black tracking-tight flex items-center gap-2 px-1">
              <MessageSquare size={20} /> 
              Conversation ({post.comments?.length || 0})
            </h3>
            <div className="space-y-3">
              {post.comments?.length > 0 ? post.comments.map((comment) => (
                <Card key={comment.id} className={cn("border-border/50", comment.isHidden && "bg-muted/40 opacity-60")}>
                  <CardContent className="p-4 flex gap-4">
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarImage src={comment.author.profileImage || ""} />
                      <AvatarFallback>{comment.author.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{comment.author.name}</span>
                        <span className="text-[10px] text-muted-foreground">{format(new Date(comment.createdAt), 'PP')}</span>
                      </div>
                      <p className="text-sm text-foreground/80 leading-relaxed">{comment.text}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 self-start">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-amber-50 text-muted-foreground hover:text-amber-600">
                        <EyeOff size={14} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/5 text-muted-foreground hover:text-destructive">
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )) : (
                <div className="p-12 text-center bg-muted/5 border-2 border-dashed rounded-2xl italic text-muted-foreground">
                  This post has no comments.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Moderation Actions */}
        <div className="space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="bg-muted/10 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold uppercase tracking-widest">Moderation</CardTitle>
                <StatusBadge status={post.moderationStatus.toLowerCase()} className="text-[10px]" />
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Current Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="rounded-lg h-10">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active (Live on feed)</SelectItem>
                    <SelectItem value="FLAGGED">Flagged (In Review)</SelectItem>
                    <SelectItem value="HIDDEN">Hidden (System Only)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Global Visibility</Label>
                <Select value={visibility} onValueChange={setVisibility}>
                  <SelectTrigger className="rounded-lg h-10">
                    <SelectValue placeholder="Select Visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PUBLIC">Public</SelectItem>
                    <SelectItem value="NEIGHBOURS">Neighbours</SelectItem>
                    <SelectItem value="PRIVATE">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/20 rounded-xl border border-border/50">
                <div className="flex flex-col">
                  <span className="text-xs font-bold flex items-center gap-1.5"><Pin size={14} className="text-primary" /> Pin Content</span>
                  <span className="text-[10px] text-muted-foreground font-medium">Keep at top of community feed</span>
                </div>
                <Switch checked={isPinned} onCheckedChange={setIsPinned} />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Internal Admin Notes</Label>
                <Textarea 
                  placeholder="Record moderation rationale..." 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[120px] rounded-xl resize-none bg-background"
                />
              </div>

              <Button 
                onClick={handleUpdate} 
                disabled={saving} 
                className="w-full h-11 rounded-xl font-black gap-2 shadow-sm"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save Moderation State
              </Button>
            </CardContent>
          </Card>

          <Card className="border-destructive/20 bg-destructive/5 overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-destructive flex items-center gap-2">
                <AlertTriangle size={16} /> Dangerous Operations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-3">
              <Button 
                variant="destructive" 
                onClick={() => setConfirmDelete(true)}
                className="w-full h-10 rounded-lg font-bold gap-2"
              >
                <Trash2 size={16} /> Purge Post
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setConfirmBan(true)}
                className="w-full h-10 rounded-lg font-bold gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
              >
                <Ban size={16} /> Suspend Author
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmationDialog 
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        onConfirm={handleDelete}
        title="Destroy content?"
        description="This will permanently delete this post and all its interactions. This cannot be reversed."
      />

      <ConfirmationDialog 
        open={confirmBan}
        onOpenChange={setConfirmBan}
        onConfirm={handleBanAuthor}
        title="Ban this user?"
        description="The author will be immediately suspended and barred from platform access."
        confirmText="Confirm Suspension"
      />
    </div>
  );
}
