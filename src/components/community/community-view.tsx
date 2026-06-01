"use client";

import { useAuth } from "@/hooks/use-auth";
import { useCommunity } from "@/hooks/use-community";
import { toast } from "@/hooks/use-toast";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Loader2, RefreshCw, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import CreatePost from "./create-post";
import PostCard from "./post-card";

// ---------------------------------------------------------------------------
// Skeleton card — shown during initial load
// ---------------------------------------------------------------------------
function PostSkeleton() {
  return (
    <div className="rounded-2xl border border-border/50 bg-card/40 p-5 space-y-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-muted" />
        <div className="space-y-2 flex-1">
          <div className="h-3 w-32 rounded bg-muted" />
          <div className="h-2.5 w-20 rounded bg-muted" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-muted" />
        <div className="h-3 w-4/5 rounded bg-muted" />
        <div className="h-3 w-3/5 rounded bg-muted" />
      </div>
      <div className="flex gap-4 pt-2">
        <div className="h-8 w-20 rounded-lg bg-muted" />
        <div className="h-8 w-20 rounded-lg bg-muted" />
        <div className="h-8 w-24 rounded-lg bg-muted" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CommunityView
// ---------------------------------------------------------------------------
export default function CommunityView() {
  const { user } = useAuth();
  const {
    posts,
    loading,
    loadingMore,
    error,
    hasNextPage,
    fetchPosts,
    fetchMorePosts,
    refresh,
    addPost,
  } = useCommunity();

  const [showSubtitle, setShowSubtitle] = useState(false);

  // Sentinel element ref for IntersectionObserver
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Initial fetch
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // One-time welcome animation
  useEffect(() => {
    const hasSeenWelcome = sessionStorage.getItem('hasSeenCommunityWelcome');
    if (!hasSeenWelcome) {
      setShowSubtitle(true);
      const timer = setTimeout(() => {
        setShowSubtitle(false);
        sessionStorage.setItem('hasSeenCommunityWelcome', 'true');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, []);

  // IntersectionObserver — fires fetchMorePosts when sentinel enters viewport
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting && hasNextPage && !loadingMore) {
          fetchMorePosts();
        }
      },
      { rootMargin: "200px" } // start loading 200px before the user actually hits bottom
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, loadingMore, fetchMorePosts]);

  const handleCreatePost = async (newPost: Parameters<typeof addPost>[0]) => {
    try {
      await addPost({
        author: {
          id: user?.id || `guest-${Date.now()}`,
          name: user?.name || "Guest User",
          username: user?.username || "guest",
          avatar: user?.profileImage || `https://picsum.photos/seed/${user?.email}/100`,
          location: user?.location || "Unknown",
          isVerified: user?.isVerified,
          isSeller: user?.isSeller,
          isServiceProvider: user?.isServiceProvider,
        },
        content: newPost.content,
        images: newPost.images,
        visibility: newPost.visibility || 'Public',
      });
    } catch {
      toast({ title: "Failed to create post", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-full bg-muted/30 dark:bg-background/20">
      <div className="max-w-2xl mx-auto py-10 px-4 md:px-0">

        {/* Header */}
        <div className="mb-10 space-y-2">
          <div className="flex items-center gap-2 text-accent font-bold uppercase tracking-[0.2em] text-[10px]">
            <Users size={12} /> Neighborhood Social
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Community <span className="text-accent">Hub</span>
          </h1>

          <AnimatePresence>
            {showSubtitle && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 0.6, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest opacity-60"
              >
                Stay updated with what's happening in Chittagong
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Create Post */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <CreatePost onCreate={handleCreatePost} />
        </motion.div>

        {/* Error State */}
        {error && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-10 flex flex-col items-center gap-4 text-center py-16"
          >
            <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle size={28} className="text-destructive" />
            </div>
            <p className="text-sm font-bold text-muted-foreground">{error}</p>
            <button
              onClick={refresh}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-accent-foreground text-xs font-bold uppercase tracking-widest hover:opacity-90 transition"
            >
              <RefreshCw size={14} /> Retry
            </button>
          </motion.div>
        )}

        {/* Feed */}
        <div className="flex flex-col gap-6 mt-10">
          {/* Initial loading skeletons */}
          {loading && posts.length === 0 && (
            <>
              <PostSkeleton />
              <PostSkeleton />
              <PostSkeleton />
            </>
          )}

          {/* Posts */}
          {posts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index, 5) * 0.05, duration: 0.4 }}
            >
              <PostCard post={post} />
            </motion.div>
          ))}

          {/* IntersectionObserver sentinel — invisible trigger */}
          <div ref={sentinelRef} aria-hidden="true" />

          {/* Load-more spinner (fallback / explicit feedback) */}
          {loadingMore && (
            <div className="flex justify-center py-6">
              <Loader2 size={22} className="animate-spin text-accent" />
            </div>
          )}

          {/* End-of-feed message */}
          {!hasNextPage && posts.length > 0 && !loading && (
            <p className="text-center text-[11px] font-bold uppercase tracking-widest text-muted-foreground/40 py-6">
              You're all caught up ✓
            </p>
          )}
        </div>

        <div className="h-24 md:h-20" />
      </div>
    </div>
  );
}
