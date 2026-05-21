"use client";

import { api } from "@/lib/api";
import React, { createContext, useContext, useEffect, useState } from "react";
import { PrivacyLevel } from "./use-auth";

export interface Comment {
  id: string;
  author: {
    name: string;
    avatar: string;
    username: string;
  };
  text: string;
  timestamp: string;
  likes: number;
  likedByMe?: boolean;
  unlikes: number;
  unlikedByMe?: boolean;
}

export interface Post {
  id: string;
  author: {
    name: string;
    avatar: string;
    location: string;
    username: string;
    isVerified?: boolean;
    isSeller?: boolean;
    isServiceProvider?: boolean;
  };
  content: string;
  timestamp: string;
  images?: string[];
  helpfulCount: number;
  notHelpfulCount: number;
  comments: Comment[];
  isSaved?: boolean;
  isFollowing?: boolean;
  checkInLocation?: string;
  visibility: PrivacyLevel;
  _count?: { comments: number };
}

interface CommunityContextType {
  posts: Post[];
  loading: boolean;
  error: string | null;
  addPost: (post: Omit<Post, 'id' | 'timestamp' | 'helpfulCount' | 'notHelpfulCount' | 'comments'>) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  addComment: (postId: string, comment: Omit<Comment, 'id' | 'timestamp' | 'likes' | 'unlikes'>) => Promise<void>;
  likeComment: (postId: string, commentId: string) => void;
  unlikeComment: (postId: string, commentId: string) => void;
  interactPost: (postId: string, type: 'helpful' | 'not-helpful') => Promise<void>;
  toggleSavePost: (id: string) => void;
  toggleFollowPost: (id: string) => void;
  blockUser: (username: string) => void;
  repost: (postId: string, caption: string, user: Post['author']) => void;
}

interface PostApiResponse {
  id: string;
  content: string;
  images: string[];
  checkInLocation?: string;
  visibility: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    username: string;
    profileImage: string;
    isVerified?: boolean;
    isSeller?: boolean;
    isServiceProvider?: boolean;
  };
  comments?: CommentApiResponse[];
}

interface CommentApiResponse {
  id: string;
  text: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    username: string;
    profileImage: string;
  };
}

const CommunityContext = createContext<CommunityContextType | null>(null);

export function CommunityProvider({ children }: { children: React.ReactNode }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedBlocked = localStorage.getItem("chattala_blocked_users");
    if (savedBlocked) setBlockedUsers(JSON.parse(savedBlocked));

    api.get<{ posts: any[] }>('/api/posts?page=1&limit=10')
      .then(data => {
        const fetchedPosts = data.posts.map((p: any) => ({
          ...p,
          timestamp: p.createdAt,
          author: { ...p.author, avatar: p.author.profileImage },
          comments: (p.comments || []).map((c: any) => ({ 
            ...c, 
            timestamp: c.createdAt, 
            author: { ...c.author, avatar: c.author.profileImage },
            likes: c.likes ?? 0,
            unlikes: c.unlikes ?? 0
          })),
          isSaved: false,
          isFollowing: false,
          helpfulCount: p.helpfulCount ?? 0,
          notHelpfulCount: p.notHelpfulCount ?? 0,
        }));
        setPosts(fetchedPosts);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch posts:", err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    localStorage.setItem("chattala_blocked_users", JSON.stringify(blockedUsers));
  }, [blockedUsers]);

  const addPost = async (postData: Omit<Post, 'id' | 'timestamp' | 'helpfulCount' | 'notHelpfulCount' | 'comments'>) => {
    try {
      const newPostRaw = await api.post<PostApiResponse>('/api/posts', {
        content: postData.content,
        images: postData.images,
        checkInLocation: postData.checkInLocation,
        visibility: postData.visibility === 'Public' ? 'PUBLIC' : postData.visibility === 'Neighbours' ? 'NEIGHBOURS' : 'PRIVATE'
      });
      const newPost = { ...newPostRaw, timestamp: newPostRaw.createdAt, author: { ...newPostRaw.author, avatar: newPostRaw.author.profileImage } };
      setPosts(prev => [{
        ...newPost,
        comments: [],
        isSaved: false,
        isFollowing: false,
        helpfulCount: 0,
        notHelpfulCount: 0,
      } as any, ...prev]);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const deletePost = async (id: string) => {
    try {
      await api.del(`/api/posts/${id}`);
      setPosts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const addComment = async (postId: string, commentData: Omit<Comment, 'id' | 'timestamp' | 'likes' | 'unlikes'>) => {
    try {
      const newCommentRaw = await api.post<CommentApiResponse>(`/api/posts/${postId}/comments`, { text: commentData.text });
      const newComment = { ...newCommentRaw, timestamp: newCommentRaw.createdAt, author: { ...newCommentRaw.author, avatar: newCommentRaw.author.profileImage }, likes: 0, unlikes: 0 };
      setPosts(prev => prev.map(p => 
        p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p
      ));
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const likeComment = async (postId: string, commentId: string) => {
    // Optimistic Update
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          comments: p.comments.map(c => {
            if (c.id === commentId) {
              const wasUnliked = c.unlikedByMe;
              const isLiked = !c.likedByMe;
              return {
                ...c,
                likedByMe: isLiked,
                likes: isLiked ? c.likes + 1 : c.likes - 1,
                unlikedByMe: false,
                unlikes: wasUnliked ? c.unlikes - 1 : c.unlikes
              };
            }
            return c;
          })
        };
      }
      return p;
    }));
    
    // Background API call
    try {
      await api.post(`/api/posts/${postId}/comments/${commentId}/react`, { type: 'like' });
    } catch (error) {
      console.error("Failed to like comment", error);
      // Silently fail — optimistic update stays
    }
  };

  const unlikeComment = async (postId: string, commentId: string) => {
    // Optimistic Update
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          comments: p.comments.map(c => {
            if (c.id === commentId) {
              const wasLiked = c.likedByMe;
              const isUnliked = !c.unlikedByMe;
              return {
                ...c,
                unlikedByMe: isUnliked,
                unlikes: isUnliked ? c.unlikes + 1 : c.unlikes - 1,
                likedByMe: false,
                likes: wasLiked ? c.likes - 1 : c.likes
              };
            }
            return c;
          })
        };
      }
      return p;
    }));

    // Background API call
    try {
      await api.post(`/api/posts/${postId}/comments/${commentId}/react`, { type: 'unlike' });
    } catch (error) {
      console.error("Failed to unlike comment", error);
      // Silently fail — optimistic update stays
    }
  };

  const interactPost = async (postId: string, type: 'helpful' | 'not-helpful') => {
    try {
      const dbType = type === 'helpful' ? 'helpful' : 'notHelpful';
      const updatedCounts = await api.post<{ helpfulCount: number; notHelpfulCount: number }>(`/api/posts/${postId}/react`, { type: dbType });
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            helpfulCount: updatedCounts.helpfulCount,
            notHelpfulCount: updatedCounts.notHelpfulCount,
          };
        }
        return p;
      }));
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const toggleSavePost = (id: string) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, isSaved: !p.isSaved } : p));
  };

  const toggleFollowPost = (id: string) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, isFollowing: !p.isFollowing } : p));
  };

  const blockUser = (username: string) => {
    setBlockedUsers(prev => [...prev, username]);
  };

  const repost = (postId: string, caption: string, user: Post['author']) => {
    const originalPost = posts.find(p => p.id === postId);
    if (!originalPost) return;

    const repostContent = `${caption}\n\n---\nReposted from @${originalPost.author.username}:\n"${originalPost.content}"`;
    
    addPost({
      author: {
        name: user.name,
        username: user.username,
        avatar: (user as { profileImage?: string }).profileImage ?? user.avatar ?? '',
        location: user.location,
        isVerified: user.isVerified,
        isSeller: user.isSeller,
        isServiceProvider: user.isServiceProvider
      },
      content: repostContent,
      images: originalPost.images,
      visibility: 'Public' as PrivacyLevel
    });
  };

  const filteredPosts = posts.filter(p => !blockedUsers.includes(p.author.username));

  return (
    <CommunityContext.Provider value={{ 
      posts: filteredPosts,
      loading,
      error,
      addPost, 
      deletePost, 
      addComment, 
      likeComment,
      unlikeComment,
      interactPost,
      toggleSavePost,
      toggleFollowPost,
      blockUser,
      repost
    }}>
      {children}
    </CommunityContext.Provider>
  );
}

export const useCommunity = () => {
  const context = useContext(CommunityContext);
  if (!context) throw new Error("useCommunity must be used within CommunityProvider");
  return context;
};
