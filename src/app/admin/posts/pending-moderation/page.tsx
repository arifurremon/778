"use client";

import { format } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Ban,
    CheckCircle,
    Clock,
    EyeOff,
    Flag,
    ShieldAlert,
    Trash2
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { ConfirmationDialog } from '@/components/admin/actions/ConfirmationDialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

// SCHEMA-FALLBACK: moderationStatus field not available — using visibility as proxy
interface FlaggedPost {
  id: string;
  content: string;
  images: string[] | null;
  flagCount: number;
  moderationReason: string | null;
  author: { 
    id: string; 
    name: string; 
    email: string; 
    profileImage: string | null;
  };
  createdAt: string;
}

export default function PendingModerationPage() {
  const [flaggedPosts, setFlaggedPosts] = useState<FlaggedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Dialog states
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean, postId: string | null }>({ open: false, postId: null });
  const [confirmBan, setConfirmBan] = useState<{ open: boolean, authorId: string | null }>({ open: false, authorId: null });

  useEffect(() => {
    fetchFlaggedPosts();
  }, []);

  const fetchFlaggedPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/posts/flagged');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setFlaggedPosts(data);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to load moderation queue." });
    } finally {
      setLoading(false);
    }
  };

  const handleModeration = async (postId: string, action: 'approve' | 'hide' | 'delete') => {
    setActionLoading(postId);
    try {
      // "Approve" clears the flag and sets moderationStatus = 'ACTIVE'
      const status = action === 'approve' ? 'ACTIVE' : action === 'hide' ? 'HIDDEN' : 'DELETED';
      
      const res = await fetch(`/api/admin/posts/${postId}/moderate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, status })
      });
      if (!res.ok) throw new Error();

      toast({ title: "Action Applied", description: `Post has been ${action === 'approve' ? 'approved and returned to feed' : action === 'hide' ? 'hidden' : 'deleted'}.` });
      
      // Animate out the card
      setFlaggedPosts(prev => prev.filter(p => p.id !== postId));
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: `Failed to ${action} post.` });
    } finally {
      setActionLoading(null);
      setConfirmDelete({ open: false, postId: null });
    }
  };

  const handleBanAuthor = async (authorId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${authorId}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: "Policy violation: Posting inappropriate content.", suspended: true })
      });
      if (!res.ok) throw new Error();
      toast({ title: "Author Banned", description: "The user has been suspended from the platform." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to ban author." });
    } finally {
      setConfirmBan({ open: false, authorId: null });
    }
  };

  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-2">
          <ShieldAlert size={12} />
          Moderation Queue
        </div>
        <h1 className="text-3xl font-black tracking-tight italic">Flagged Content</h1>
        <p className="text-sm text-muted-foreground mt-1">Review items reported by the community</p>
      </div>

      {loading ? (
        <div className="grid gap-6">
          {[1, 2].map(i => (
            <Card key={i} className="animate-pulse bg-muted/20 h-64" />
          ))}
        </div>
      ) : flaggedPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-muted/5 rounded-3xl border-2 border-dashed">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
            <CheckCircle size={32} />
          </div>
          <h2 className="text-xl font-bold">Queue Clear!</h2>
          <p className="text-sm text-muted-foreground mt-1">No posts currently require moderation.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          <AnimatePresence mode="popLayout">
            {flaggedPosts.map((post) => (
              <motion.div
                key={post.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                transition={{ duration: 0.3 }}
              >
                <Card className="overflow-hidden border-border shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-start justify-between bg-muted/5 p-6 pb-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-10 h-10 border border-primary/20">
                        <AvatarImage src={post.author.profileImage || ""} />
                        <AvatarFallback>{post.author.name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <Link href={`/admin/users/${post.author.id}`} className="text-sm font-bold hover:underline">
                          {post.author.name}
                        </Link>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock size={10} /> {format(new Date(post.createdAt), 'PPp')}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <Badge variant="destructive" className="gap-1 text-[10px] font-black px-2 py-0.5 rounded-full">
                        <Flag size={10} /> {post.flagCount} Reports
                      </Badge>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Reason: {post.moderationReason || "Unspecified"}</span>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6 pt-4 space-y-4">
                    <div className="p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-xl">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium text-amber-900">
                        {post.content}
                      </p>
                    </div>
                    
                    {post.images && post.images.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {post.images.map((img, idx) => (
                          <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border shrink-0">
                            <img src={img} alt="Post content" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="bg-muted/10 border-t grid grid-cols-2 md:grid-cols-4 gap-2 p-3">
                    <Button 
                      onClick={() => handleModeration(post.id, 'approve')}
                      disabled={!!actionLoading}
                      className="bg-emerald-600 hover:bg-emerald-700 font-bold gap-2 rounded-lg"
                    >
                      <CheckCircle size={14} /> Approve
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => handleModeration(post.id, 'hide')}
                      disabled={!!actionLoading}
                      className="font-bold gap-2 rounded-lg border-amber-300 text-amber-700 hover:bg-amber-50"
                    >
                      <EyeOff size={14} /> Hide Post
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setConfirmDelete({ open: true, postId: post.id })}
                      disabled={!!actionLoading}
                      className="font-bold gap-2 rounded-lg border-rose-300 text-rose-700 hover:bg-rose-50"
                    >
                      <Trash2 size={14} /> Delete
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setConfirmBan({ open: true, authorId: post.author.id })}
                      disabled={!!actionLoading}
                      className="font-bold gap-2 rounded-lg border-destructive/20 text-destructive hover:bg-destructive/5"
                    >
                      <Ban size={14} /> Ban Author
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <ConfirmationDialog 
        open={confirmDelete.open}
        onOpenChange={(o) => setConfirmDelete({ open: o, postId: o ? confirmDelete.postId : null })}
        onConfirm={() => confirmDelete.postId && handleModeration(confirmDelete.postId, 'delete')}
        title="Destroy content?"
        description="This will permanently delete this post from the database. This action is irreversible."
      />

      <ConfirmationDialog 
        open={confirmBan.open}
        onOpenChange={(o) => setConfirmBan({ open: o, authorId: o ? confirmBan.authorId : null })}
        onConfirm={() => confirmBan.authorId && handleBanAuthor(confirmBan.authorId)}
        title="Suspend user account?"
        description="This will immediately block the user's access to the platform."
        confirmText="Ban Author"
      />
    </div>
  );
}
