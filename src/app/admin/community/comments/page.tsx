"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  MessageSquare,
  Trash2,
  MoreHorizontal,
  ThumbsUp,
  ThumbsDown,
  BadgeCheck,
  ExternalLink,
} from "lucide-react";
import { AdminTableToolbar, AdminPagination, AdminEmptyState } from "@/components/admin/admin-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

interface AdminComment {
  id: string;
  text: string;
  likes: number;
  unlikes: number;
  createdAt: string;
  post: { id: string; content: string; visibility: string };
  author: { id: string; name: string | null; email: string; profileImage: string | null; isVerified: boolean };
}

interface CommentsResponse {
  comments: AdminComment[];
  total: number;
  page: number;
  totalPages: number;
}

const BULK_ACTIONS = [
  { label: "Delete Selected", value: "delete", variant: "destructive" as const },
];

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState<string[] | null>(null);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20", search });
      const res = await fetch(`/api/admin/comments?${params.toString()}`);
      if (!res.ok) throw new Error();
      const data = await res.json() as CommentsResponse;
      setComments(data.comments);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to load comments." });
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { void fetchComments(); }, [fetchComments]);
  useEffect(() => { const t = setTimeout(() => setPage(1), 400); return () => clearTimeout(t); }, [search]);

  const handleDelete = async (ids: string[]) => {
    try {
      const { adminApi } = await import("@/lib/admin-api");
      await adminApi.del("/api/admin/comments", { commentIds: ids });
      toast({ title: `${ids.length} comment(s) deleted.` });
      setSelected(new Set());
      void fetchComments();
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete." });
    }
    setConfirmDelete(null);
  };

  const toggleSelect = (id: string) =>
    setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () =>
    setSelected(selected.size === comments.length ? new Set() : new Set(comments.map((c) => c.id)));

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-2">
          <MessageSquare size={12} />
          Community Moderation
        </div>
        <h1 className="text-2xl font-black tracking-tight">Comment Moderation</h1>
        <p className="text-sm text-muted-foreground mt-1">{total.toLocaleString()} comments across all posts</p>
      </div>

      <div className="bg-card/40 border border-border/50 rounded-2xl p-4">
        <AdminTableToolbar
          search={search}
          onSearch={(v) => { setSearch(v); setPage(1); }}
          placeholder="Search comment text..."
          selectedCount={selected.size}
          bulkActions={BULK_ACTIONS}
          onBulkAction={() => setConfirmDelete(Array.from(selected))}
        />
      </div>

      <div className="bg-card/40 border border-border/50 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="hidden md:grid grid-cols-[auto_1fr_auto_auto] gap-4 px-5 py-3 border-b border-border/30 bg-muted/20">
          <input type="checkbox" checked={selected.size === comments.length && comments.length > 0} onChange={toggleAll} className="rounded" />
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Comment</div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">Engagement</div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">Actions</div>
        </div>

        {loading ? (
          <div className="divide-y divide-border/20">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex gap-4 px-5 py-5">
                <Skeleton className="w-4 h-4 rounded shrink-0 mt-1" />
                <div className="flex-1 space-y-2">
                  <div className="flex gap-3">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="space-y-1 flex-1">
                      <Skeleton className="h-3.5 w-32" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <AdminEmptyState icon={<MessageSquare size={40} />} title="No comments found" description="Try adjusting your search." />
        ) : (
          <div className="divide-y divide-border/20">
            {comments.map((comment, i) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className={cn("flex gap-4 px-5 py-4 hover:bg-muted/20 transition-colors", selected.has(comment.id) && "bg-primary/5")}
              >
                <input type="checkbox" checked={selected.has(comment.id)} onChange={() => toggleSelect(comment.id)} className="rounded mt-1 shrink-0" />

                <div className="flex-1 min-w-0 space-y-2">
                  {/* Author + timestamp */}
                  <div className="flex items-center justify-between">
                    <Link href={`/admin/users/${comment.author.id}`} className="flex items-center gap-2 group">
                      <Avatar className="w-7 h-7 border border-border/30">
                        <AvatarImage src={comment.author.profileImage ?? ""} />
                        <AvatarFallback className="text-[10px] font-bold">{comment.author.name?.[0] ?? "U"}</AvatarFallback>
                      </Avatar>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold group-hover:text-primary transition-colors">{comment.author.name ?? comment.author.email}</span>
                        {comment.author.isVerified && <BadgeCheck size={11} className="text-cyan-400" />}
                      </div>
                    </Link>
                    <span className="text-[10px] text-muted-foreground">{new Date(comment.createdAt).toLocaleDateString()}</span>
                  </div>

                  {/* Comment text */}
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{comment.text}</p>

                  {/* Post reference */}
                  <Link href={`/admin/posts/${comment.post.id}`} className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60 hover:text-primary transition-colors">
                    <ExternalLink size={9} />
                    <span className="line-clamp-1">On: {comment.post.content.slice(0, 60)}…</span>
                  </Link>

                  {/* Engagement */}
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><ThumbsUp size={9} className="text-emerald-400" />{comment.likes}</span>
                    <span className="flex items-center gap-1"><ThumbsDown size={9} className="text-rose-400" />{comment.unlikes}</span>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg shrink-0">
                      <MoreHorizontal size={13} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-36 rounded-xl">
                    <DropdownMenuItem
                      onClick={() => setConfirmDelete([comment.id])}
                      className="text-xs text-destructive focus:text-destructive"
                    >
                      <Trash2 size={12} className="mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
            <AlertDialogTitle>Delete {confirmDelete?.length} comment(s)?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the selected comments. Cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmDelete && void handleDelete(confirmDelete)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
