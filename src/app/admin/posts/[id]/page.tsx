"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Globe,
  Users,
  Lock,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Image as ImageIcon,
  MapPin,
  Trash2,
  AlertCircle,
  Calendar,
  BadgeCheck,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PostDetail {
  id: string;
  content: string;
  images: string[];
  checkInLocation: string | null;
  visibility: string;
  helpfulCount: number;
  notHelpfulCount: number;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string | null;
    email: string;
    profileImage: string | null;
    isVerified: boolean;
    isSeller: boolean;
    isServiceProvider: boolean;
    location: string | null;
  };
  comments: {
    id: string;
    text: string;
    likes: number;
    unlikes: number;
    createdAt: string;
    author: {
      id: string;
      name: string | null;
      profileImage: string | null;
      isVerified: boolean;
    };
  }[];
  _count: { comments: number };
}

const VISIBILITY_CONFIG: Record<string, { icon: React.ElementType; label: string; className: string }> = {
  PUBLIC: { icon: Globe, label: "Public", className: "text-emerald-400 bg-emerald-400/10" },
  NEIGHBOURS: { icon: Users, label: "Neighbours Only", className: "text-blue-400 bg-blue-400/10" },
  PRIVATE: { icon: Lock, label: "Private", className: "text-muted-foreground bg-muted" },
};
const VISIBILITY_FALLBACK = { icon: Globe, label: "Public", className: "text-emerald-400 bg-emerald-400/10" };


export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch(`/api/admin/posts/${id}`);
        if (!res.ok) throw new Error();
        const data = await res.json() as PostDetail;
        setPost(data);
      } catch {
        toast({ variant: "destructive", title: "Error", description: "Failed to load post." });
      } finally {
        setLoading(false);
      }
    };
    void fetch_();
  }, [id]);

  const handleDeletePost = async () => {
    try {
      const res = await fetch(`/api/admin/posts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast({ title: "Post deleted" });
      router.push("/admin/posts");
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Delete failed." });
    }
    setConfirmDelete(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const res = await fetch("/api/admin/comments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentIds: [commentId] }),
      });
      if (!res.ok) throw new Error();
      setPost((p) => p ? { ...p, comments: p.comments.filter((c) => c.id !== commentId) } : p);
      toast({ title: "Comment deleted" });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Delete failed." });
    }
    setDeletingCommentId(null);
  };

  if (loading) return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-4">
      <Skeleton className="h-8 w-32 rounded-xl" />
      <Skeleton className="h-56 rounded-2xl" />
      <Skeleton className="h-48 rounded-2xl" />
    </div>
  );

  if (!post) return (
    <div className="p-8 text-center">
      <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4 opacity-50" />
      <p className="text-sm font-bold text-muted-foreground">Post not found</p>
      <Link href="/admin/posts"><Button variant="outline" className="mt-4">Back to Posts</Button></Link>
    </div>
  );

  const visConfig = VISIBILITY_CONFIG[post.visibility] ?? VISIBILITY_FALLBACK;
  const VisIcon = visConfig.icon;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link href="/admin/posts">
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs rounded-xl text-muted-foreground">
            <ArrowLeft size={13} /> All Posts
          </Button>
        </Link>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setConfirmDelete(true)}
          className="h-8 text-xs gap-1.5 text-destructive hover:bg-destructive/10 rounded-xl"
        >
          <Trash2 size={13} /> Delete Post
        </Button>
      </div>

      {/* Post Card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card/40 border border-border/50 rounded-2xl p-6 space-y-5"
      >
        {/* Author */}
        <div className="flex items-center justify-between">
          <Link href={`/admin/users/${post.author.id}`} className="flex items-center gap-3 group">
            <Avatar className="w-10 h-10 border border-border/30">
              <AvatarImage src={post.author.profileImage ?? ""} />
              <AvatarFallback className="font-bold">{post.author.name?.[0] ?? "U"}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold group-hover:text-primary transition-colors">{post.author.name ?? post.author.email}</p>
                {post.author.isVerified && <BadgeCheck size={13} className="text-cyan-400" />}
              </div>
              <p className="text-[10px] text-muted-foreground">{post.author.email}</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <div className={cn("flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-lg", visConfig.className)}>
              <VisIcon size={11} />
              {visConfig.label}
            </div>
          </div>
        </div>

        {/* Content */}
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>

        {/* Images */}
        {post.images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {post.images.map((img, i) => (
              <div key={i} className="relative aspect-video rounded-xl overflow-hidden bg-muted/40">
                <img src={img} alt={`Image ${i + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-border/30 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <ThumbsUp size={12} className="text-emerald-400" />
            <span className="font-bold text-emerald-400">{post.helpfulCount}</span> helpful
          </div>
          <div className="flex items-center gap-1.5">
            <ThumbsDown size={12} className="text-rose-400" />
            <span className="font-bold text-rose-400">{post.notHelpfulCount}</span> not helpful
          </div>
          <div className="flex items-center gap-1.5">
            <MessageSquare size={12} />
            {post._count.comments} comments
          </div>
          {post.checkInLocation && (
            <div className="flex items-center gap-1.5 text-accent">
              <MapPin size={11} />
              {post.checkInLocation}
            </div>
          )}
          <div className="flex items-center gap-1.5 ml-auto">
            <Calendar size={11} />
            {new Date(post.createdAt).toLocaleDateString("en-US", { dateStyle: "long" })}
          </div>
        </div>
      </motion.div>

      {/* Comments */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card/40 border border-border/50 rounded-2xl p-6"
      >
        <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
          <MessageSquare size={14} className="text-blue-400" />
          Comments <span className="text-muted-foreground font-normal">({post.comments.length})</span>
        </h3>
        {post.comments.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">No comments on this post.</p>
        ) : (
          <div className="space-y-3">
            {post.comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 group py-3 border-b border-border/20 last:border-0">
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarImage src={comment.author.profileImage ?? ""} />
                  <AvatarFallback className="text-xs">{comment.author.name?.[0] ?? "U"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link href={`/admin/users/${comment.author.id}`} className="text-xs font-bold hover:text-primary transition-colors">
                      {comment.author.name ?? "Unknown"}
                    </Link>
                    {comment.author.isVerified && <BadgeCheck size={11} className="text-cyan-400" />}
                    <span className="text-[10px] text-muted-foreground">{new Date(comment.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{comment.text}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><ThumbsUp size={9} /> {comment.likes}</span>
                    <span className="flex items-center gap-1"><ThumbsDown size={9} /> {comment.unlikes}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10 shrink-0"
                  onClick={() => setDeletingCommentId(comment.id)}
                >
                  <Trash2 size={12} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Delete Post Dialog */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the post and all {post.comments.length} comment(s). This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleDeletePost()} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Comment Dialog */}
      <AlertDialog open={!!deletingCommentId} onOpenChange={(o) => !o && setDeletingCommentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete comment?</AlertDialogTitle>
            <AlertDialogDescription>This comment will be permanently deleted.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingCommentId && void handleDeleteComment(deletingCommentId)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
