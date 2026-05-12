"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Globe,
  Users,
  Lock,
  Trash2,
  MoreHorizontal,
  Image as ImageIcon,
  MessageSquare,
  ThumbsUp,
} from "lucide-react";
import { AdminTableToolbar, AdminPagination, AdminEmptyState } from "@/components/admin/admin-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

interface AdminPost {
  id: string;
  content: string;
  images: string[];
  visibility: string;
  helpfulCount: number;
  notHelpfulCount: number;
  checkInLocation: string | null;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    email: string;
    profileImage: string | null;
    isVerified: boolean;
  };
  _count: { comments: number };
}

interface PostsResponse {
  posts: AdminPost[];
  total: number;
  page: number;
  totalPages: number;
}

const VISIBILITY_FILTERS = [
  { key: "visibility", label: "Visibility", options: [
    { value: "all", label: "All" },
    { value: "public", label: "Public" },
    { value: "neighbours", label: "Neighbours" },
    { value: "private", label: "Private" },
  ]},
];

const BULK_ACTIONS = [
  { label: "Delete Selected", value: "delete", variant: "destructive" as const },
];

function VisibilityBadge({ visibility }: { visibility: string }) {
  const config: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    PUBLIC: { icon: <Globe size={10} />, color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", label: "Public" },
    NEIGHBOURS: { icon: <Users size={10} />, color: "text-blue-400 bg-blue-400/10 border-blue-400/20", label: "Neighbours" },
    PRIVATE: { icon: <Lock size={10} />, color: "text-muted-foreground bg-muted border-border", label: "Private" },
  };
  const fallback = { icon: <Globe size={10} />, color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", label: "Public" };
  const c = config[visibility] ?? fallback;
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${c.color}`}>
      {c.icon} {c.label}
    </span>
  );
}

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [visibility, setVisibility] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState<string[] | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20", search, visibility });
      const res = await fetch(`/api/admin/posts?${params.toString()}`);
      if (!res.ok) throw new Error();
      const data = await res.json() as PostsResponse;
      setPosts(data.posts);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to load posts." });
    } finally {
      setLoading(false);
    }
  }, [page, search, visibility]);

  useEffect(() => { void fetchPosts(); }, [fetchPosts]);

  useEffect(() => {
    const t = setTimeout(() => setPage(1), 400);
    return () => clearTimeout(t);
  }, [search]);

  const handleDelete = async (postIds: string[]) => {
    try {
      const res = await fetch("/api/admin/posts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postIds }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Deleted", description: `${postIds.length} post(s) deleted.` });
      setSelected(new Set());
      void fetchPosts();
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete posts." });
    }
    setConfirmDelete(null);
  };

  const toggleSelect = (id: string) =>
    setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const toggleAll = () =>
    setSelected(selected.size === posts.length ? new Set() : new Set(posts.map((p) => p.id)));

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-2">
          <FileText size={12} />
          Content Management
        </div>
        <h1 className="text-2xl font-black tracking-tight">All Posts</h1>
        <p className="text-sm text-muted-foreground mt-1">{total.toLocaleString()} posts in the community</p>
      </div>

      <div className="bg-card/40 border border-border/50 rounded-2xl p-4">
        <AdminTableToolbar
          search={search}
          onSearch={(v) => { setSearch(v); setPage(1); }}
          placeholder="Search post content..."
          filters={VISIBILITY_FILTERS}
          activeFilters={{ visibility }}
          onFilter={(_, v) => { setVisibility(v); setPage(1); }}
          selectedCount={selected.size}
          bulkActions={BULK_ACTIONS}
          onBulkAction={() => setConfirmDelete(Array.from(selected))}
        />
      </div>

      <div className="bg-card/40 border border-border/50 rounded-2xl overflow-hidden">
        {/* Table Header */}
        <div className="hidden md:grid grid-cols-[auto_1fr_auto_auto] gap-4 px-5 py-3 border-b border-border/30 bg-muted/20">
          <input type="checkbox" checked={selected.size === posts.length && posts.length > 0} onChange={toggleAll} className="rounded" />
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Post</div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">Visibility</div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">Actions</div>
        </div>

        {loading ? (
          <div className="divide-y divide-border/20">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex gap-4 px-5 py-5">
                <Skeleton className="w-4 h-4 rounded shrink-0 mt-1" />
                <div className="flex-1 space-y-2">
                  <div className="flex gap-3">
                    <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-3.5 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <AdminEmptyState icon={<FileText size={40} />} title="No posts found" description="Try adjusting your search or filters." />
        ) : (
          <div className="divide-y divide-border/20">
            {posts.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className={cn(
                  "flex gap-4 px-5 py-5 hover:bg-muted/20 transition-colors",
                  selected.has(post.id) && "bg-primary/5"
                )}
              >
                <input
                  type="checkbox"
                  checked={selected.has(post.id)}
                  onChange={() => toggleSelect(post.id)}
                  className="rounded mt-1 shrink-0"
                />

                <div className="flex-1 min-w-0 space-y-2.5">
                  {/* Author row */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="w-8 h-8 border border-border/30">
                        <AvatarImage src={post.author.profileImage ?? ""} />
                        <AvatarFallback className="text-xs font-bold">{post.author.name?.[0] ?? "U"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-xs font-bold">{post.author.name ?? post.author.email}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(post.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <VisibilityBadge visibility={post.visibility} />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg">
                            <MoreHorizontal size={13} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36 rounded-xl">
                          <DropdownMenuItem
                            onClick={() => setConfirmDelete([post.id])}
                            className="text-xs text-destructive focus:text-destructive"
                          >
                            <Trash2 size={12} className="mr-2" />
                            Delete Post
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Content preview */}
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{post.content}</p>

                  {/* Meta row */}
                  <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-medium">
                    {post.images.length > 0 && (
                      <span className="flex items-center gap-1">
                        <ImageIcon size={10} /> {post.images.length} image{post.images.length > 1 ? "s" : ""}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <MessageSquare size={10} /> {post._count.comments} comments
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp size={10} /> {post.helpfulCount} helpful
                    </span>
                    {post.checkInLocation && (
                      <span className="text-accent">{post.checkInLocation}</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <div className="px-5 border-t border-border/30">
          <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} total={total} limit={20} />
        </div>
      </div>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Posts?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {confirmDelete?.length} post(s) and all associated comments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDelete && void handleDelete(confirmDelete)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
