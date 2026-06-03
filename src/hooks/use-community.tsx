"use client";

import { api } from "@/lib/api";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
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
    id: string;
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
  userReaction?: "helpful" | "notHelpful" | null;
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
  loadingMore: boolean;
  error: string | null;
  hasNextPage: boolean;
  currentPage: number;
  fetchPosts: () => Promise<void>;
  fetchMorePosts: () => Promise<void>;
  refresh: () => Promise<void>;
  addPost: (post: Omit<Post, 'id' | 'timestamp' | 'helpfulCount' | 'notHelpfulCount' | 'comments'>) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  addComment: (postId: string, comment: Omit<Comment, 'id' | 'timestamp' | 'likes' | 'unlikes'>) => Promise<void>;
  likeComment: (postId: string, commentId: string) => void;
  unlikeComment: (postId: string, commentId: string) => void;
  interactPost: (postId: string, type: 'helpful' | 'not-helpful') => Promise<void>;
  toggleSavePost: (id: string) => Promise<void>;
  toggleFollowPost: (id: string) => Promise<void>;
  blockUser: (username: string) => void;
  repost: (postId: string, caption: string, user: Post['author']) => Promise<void>;
}

interface PostApiResponse {
  id: string;
  content: string;
  images: string[];
  checkInLocation?: string;
  visibility: string;
  createdAt: string;
  helpfulCount?: number;
  notHelpfulCount?: number;
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

function mapVisibilityFromAPI(v: string): PrivacyLevel {
  if (v === 'PUBLIC') return 'Public';
  if (v === 'NEIGHBOURS') return 'Neighbours';
  if (v === 'PRIVATE') return 'Only Me';
  return 'Public';
}

export function mapApiPost(p: any): Post {
  const reaction = p.userReaction ?? null;
  return {
    ...p,
    timestamp: p.createdAt,
    author: { ...p.author, id: p.author.id, avatar: p.author.profileImage },
    comments: (p.comments || []).map((c: any) => ({
      ...c,
      timestamp: c.createdAt,
      author: { ...c.author, avatar: c.author.profileImage },
      likes: c.likes ?? 0,
      unlikes: c.unlikes ?? 0,
    })),
    isSaved: p.isSaved ?? false,
    isFollowing: p.isFollowing ?? false,
    helpfulCount: p.helpfulCount ?? 0,
    notHelpfulCount: p.notHelpfulCount ?? 0,
    userReaction: reaction,
    visibility: mapVisibilityFromAPI(p.visibility ?? "PUBLIC"),
  };
}

const LIMIT = 10;

const CommunityContext = createContext<CommunityContextType | null>(null);

export function CommunityProvider({ children }: { children: React.ReactNode }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);

  // Prevent concurrent fetches without blocking re-fetches (unlike hasFetchedRef)
  const isFetchingRef = useRef(false);

  useEffect(() => {
    api.get<{ blockedUserIds: string[] }>('/api/user/block')
      .then(res => {
        if (res.blockedUserIds) setBlockedUsers(res.blockedUserIds);
      })
      .catch(err => {
        // Ignored. User might not be authenticated.
      });
  }, []);

  // Fetches page 1 and REPLACES the posts array
  const fetchPosts = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<{ posts: any[]; nextPage: number | null }>(
        `/api/posts?page=1&limit=${LIMIT}`
      );
      setPosts(data.posts.map(mapApiPost));
      setCurrentPage(1);
      setHasNextPage(data.nextPage !== null);
    } catch (err) {
      console.error("Failed to fetch posts:", err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  // Fetches currentPage + 1 and APPENDS to the posts array
  const fetchMorePosts = useCallback(async () => {
    if (isFetchingRef.current || !hasNextPage) return;
    isFetchingRef.current = true;
    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const data = await api.get<{ posts: any[]; nextPage: number | null }>(
        `/api/posts?page=${nextPage}&limit=${LIMIT}`
      );
      setPosts(prev => [...prev, ...data.posts.map(mapApiPost)]);
      setCurrentPage(nextPage);
      setHasNextPage(data.nextPage !== null);
    } catch (err) {
      console.error("Failed to load more posts:", err);
    } finally {
      setLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [currentPage, hasNextPage]);

  // Resets to page 1 and re-fetches from scratch
  const refresh = useCallback(async () => {
    isFetchingRef.current = false; // allow re-fetch even if one was in progress
    await fetchPosts();
  }, [fetchPosts]);

  const addPost = async (postData: Omit<Post, 'id' | 'timestamp' | 'helpfulCount' | 'notHelpfulCount' | 'comments'> & { repostOfId?: string }) => {
    const newPostRaw = await api.post<PostApiResponse>('/api/posts', {
      content: postData.content,
      images: postData.images,
      checkInLocation: postData.checkInLocation,
      visibility: postData.visibility === 'Public' ? 'PUBLIC' : postData.visibility === 'Neighbours' ? 'NEIGHBOURS' : 'PRIVATE',
      repostOfId: postData.repostOfId,
    });
    const newPost: Post = {
      id: newPostRaw.id,
      content: newPostRaw.content,
      timestamp: newPostRaw.createdAt,
      images: newPostRaw.images,
      checkInLocation: newPostRaw.checkInLocation,
      visibility: mapVisibilityFromAPI(newPostRaw.visibility),
      author: {
        id: newPostRaw.author.id,
        name: newPostRaw.author.name,
        username: newPostRaw.author.username,
        avatar: newPostRaw.author.profileImage ?? '',
        location: '',
        isVerified: newPostRaw.author.isVerified,
        isSeller: newPostRaw.author.isSeller,
        isServiceProvider: newPostRaw.author.isServiceProvider,
      },
      comments: [],
      isSaved: false,
      isFollowing: false,
      helpfulCount: 0,
      notHelpfulCount: 0,
      userReaction: null,
    };
    // Optimistically prepend without resetting pagination state
    setPosts(prev => [newPost, ...prev]);
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
    // Optimistic update
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          comments: p.comments.map(c => {
            if (c.id === commentId) {
              const isCurrentlyLiked = c.likedByMe;
              return {
                ...c,
                likedByMe: !isCurrentlyLiked,
                likes: isCurrentlyLiked ? c.likes - 1 : c.likes + 1,
                unlikedByMe: false,
                unlikes: c.unlikedByMe ? c.unlikes - 1 : c.unlikes,
              };
            }
            return c;
          })
        };
      }
      return p;
    }));

    try {
      const res = await api.post<{ likes: number; unlikes: number; userReaction: "like" | "unlike" | null }>(
        `/api/posts/${postId}/comments/${commentId}/react`,
        { type: 'like' }
      );
      // Reconcile with server-authoritative counts
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            comments: p.comments.map(c =>
              c.id === commentId
                ? { ...c, likes: res.likes, unlikes: res.unlikes, likedByMe: res.userReaction === 'like', unlikedByMe: res.userReaction === 'unlike' }
                : c
            )
          };
        }
        return p;
      }));
    } catch (error) {
      console.error("Failed to like comment", error);
    }
  };

  const unlikeComment = async (postId: string, commentId: string) => {
    // Optimistic update
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          comments: p.comments.map(c => {
            if (c.id === commentId) {
              const isCurrentlyUnliked = c.unlikedByMe;
              return {
                ...c,
                unlikedByMe: !isCurrentlyUnliked,
                unlikes: isCurrentlyUnliked ? c.unlikes - 1 : c.unlikes + 1,
                likedByMe: false,
                likes: c.likedByMe ? c.likes - 1 : c.likes,
              };
            }
            return c;
          })
        };
      }
      return p;
    }));

    try {
      const res = await api.post<{ likes: number; unlikes: number; userReaction: "like" | "unlike" | null }>(
        `/api/posts/${postId}/comments/${commentId}/react`,
        { type: 'unlike' }
      );
      // Reconcile with server-authoritative counts
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            comments: p.comments.map(c =>
              c.id === commentId
                ? { ...c, likes: res.likes, unlikes: res.unlikes, likedByMe: res.userReaction === 'like', unlikedByMe: res.userReaction === 'unlike' }
                : c
            )
          };
        }
        return p;
      }));
    } catch (error) {
      console.error("Failed to unlike comment", error);
    }
  };

  const interactPost = async (postId: string, type: 'helpful' | 'not-helpful') => {
    try {
      const dbType = type === 'helpful' ? 'helpful' : 'notHelpful';
      const res = await api.post<{ helpfulCount: number; notHelpfulCount: number; userReaction: "helpful" | "notHelpful" | null }>(
        `/api/posts/${postId}/react`,
        { type: dbType }
      );
      // Use server-authoritative counts + reaction state (handles toggle-off correctly)
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            helpfulCount: res.helpfulCount,
            notHelpfulCount: res.notHelpfulCount,
            userReaction: res.userReaction,
          };
        }
        return p;
      }));
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const toggleSavePost = async (id: string) => {
    const target = posts.find((post) => post.id === id);
    if (!target) return;

    const nextSaved = !target.isSaved;
    setPosts((prev) =>
      prev.map((post) => (post.id === id ? { ...post, isSaved: nextSaved } : post))
    );

    try {
      if (nextSaved) {
        await api.post(`/api/posts/${id}/save`);
      } else {
        await api.del(`/api/posts/${id}/save`);
      }
    } catch (error) {
      setPosts((prev) =>
        prev.map((post) => (post.id === id ? { ...post, isSaved: !nextSaved } : post))
      );
      throw error;
    }
  };

  const toggleFollowPost = async (id: string) => {
    const target = posts.find((post) => post.id === id);
    if (!target) return;

    const nextFollowing = !target.isFollowing;
    setPosts((prev) =>
      prev.map((post) => (post.id === id ? { ...post, isFollowing: nextFollowing } : post))
    );

    try {
      if (nextFollowing) {
        await api.post(`/api/posts/${id}/follow`);
      } else {
        await api.del(`/api/posts/${id}/follow`);
      }
    } catch (error) {
      setPosts((prev) =>
        prev.map((post) =>
          post.id === id ? { ...post, isFollowing: !nextFollowing } : post
        )
      );
      throw error;
    }
  };

  const blockUser = async (username: string) => {
    try {
      const res = await api.get<{ id: string }>(`/api/user/resolve?username=${encodeURIComponent(username)}`);
      if (res.id) {
        await api.post('/api/user/block', { blockedId: res.id });
        setBlockedUsers(prev => [...prev, res.id]);
      }
    } catch (err) {
      console.error("Failed to block user:", err);
    }
  };

  const repost = async (postId: string, caption: string, user: Post['author']) => {
    const originalPost = posts.find((post) => post.id === postId);
    if (!originalPost) return;

    await addPost({
      author: {
        id: user.id,
        name: user.name,
        username: user.username,
        avatar: (user as { profileImage?: string }).profileImage ?? user.avatar ?? "",
        location: user.location,
        isVerified: user.isVerified,
        isSeller: user.isSeller,
        isServiceProvider: user.isServiceProvider,
      },
      content: caption.trim() || "Reposted a discussion.",
      images: originalPost.images,
      visibility: "Public" as PrivacyLevel,
      repostOfId: postId,
    } as Omit<Post, "id" | "timestamp" | "helpfulCount" | "notHelpfulCount" | "comments"> & {
      repostOfId: string;
    });
  };

  const filteredPosts = posts.filter(p => !blockedUsers.includes(p.author.id));

  return (
    <CommunityContext.Provider value={{
      posts: filteredPosts,
      loading,
      loadingMore,
      error,
      hasNextPage,
      currentPage,
      fetchPosts,
      fetchMorePosts,
      refresh,
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
