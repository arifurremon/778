"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useCommunity } from "@/hooks/use-community";
import PostCard from "./post-card";
import CreatePost from "./create-post";
import { Users } from "lucide-react";

export default function CommunityView() {
  const { user } = useAuth();
  const { posts, addPost } = useCommunity();
  const [showSubtitle, setShowSubtitle] = useState(false);

  useEffect(() => {
    // One-time session animation logic
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

  const handleCreatePost = (newPost: any) => {
    addPost({
      author: {
        name: user?.name || "Guest User",
        username: user?.username || "guest",
        avatar: user?.profileImage || `https://picsum.photos/seed/${user?.email}/100`,
        location: user?.location || "Unknown",
        isVerified: user?.isVerified,
        isSeller: user?.isSeller,
        isServiceProvider: user?.isServiceProvider
      },
      content: newPost.content,
      images: newPost.images,
      visibility: newPost.visibility || 'Public',
    });
  };

  return (
    <div className="min-h-full bg-muted/30 dark:bg-background/20">
      <div className="max-w-2xl mx-auto py-10 px-4 md:px-0">
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <CreatePost onCreate={handleCreatePost} />
        </motion.div>

        <div className="flex flex-col gap-6 mt-10">
          {posts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.4 }}
            >
              <PostCard post={post} />
            </motion.div>
          ))}
        </div>
        
        <div className="h-24 md:h-20" />
      </div>
    </div>
  );
}
