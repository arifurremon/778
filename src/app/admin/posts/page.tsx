"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Search, 
  Filter, 
  Eye, 
  EyeOff, 
  Trash2, 
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  User,
  Calendar,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

import { StatusBadge } from '@/components/admin/display/StatusBadge';
import { BulkActionBar } from '@/components/admin/actions/BulkActionBar';
import { ConfirmationDialog } from '@/components/admin/actions/ConfirmationDialog';
import { FilterPanel } from '@/components/admin/forms/FilterPanel';
import { SearchBar } from '@/components/admin/forms/SearchBar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// SCHEMA-FALLBACK: moderationStatus field not available — using visibility as proxy
interface AdminPost {
  id: string;
  content: string;
  images: string[] | null;
  visibility: 'PUBLIC' | 'NEIGHBOURS' | 'PRIVATE';
  moderationStatus: 'ACTIVE' | 'FLAGGED' | 'HIDDEN' | 'DELETED';
  moderationReason: string | null;
  adminNotes: string | null;
  flagCount: number;
  author: { id: string; name: string; email: string; profileImage: string | null };
  createdAt: string;
  _count: { likes: number; comments: number };
}

export default function AdminPostsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  
  // Filters state
  const [search, setSearch] = useState("");
  const [visibility, setVisibility] = useState("all");
  const [status, setStatus] = useState("all");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });

  // Dialog states
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean, ids: string[] }>({ open: false, ids: [] });
  const [confirmHide, setConfirmHide] = useState<{ open: boolean, ids: string[] }>({ open: false, ids: [] });

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        search,
        visibility,
        status,
        from: dateRange.from,
        to: dateRange.to
      });
      
      const res = await fetch(`/api/admin/posts?${params.toString()}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      
      // SCHEMA-FALLBACK: moderationStatus field not available — using visibility as proxy
      const mappedPosts = data.posts.map((p: any) => ({
        ...p,
        moderationStatus: p.moderationStatus || (p.visibility === 'PRIVATE' ? 'HIDDEN' : 'ACTIVE')
      }));
      
      setPosts(mappedPosts);
      setTotalCount(data.total);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to load posts." });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, visibility, status, dateRange]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleAction = async (action: 'hide' | 'delete', ids: string[]) => {
    try {
      const res = await fetch(`/api/admin/posts/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ids })
      });
      if (!res.ok) throw new Error();
      
      toast({ title: "Success", description: `${ids.length} post(s) ${action === 'hide' ? 'hidden' : 'deleted'}.` });
      setSelectedIds([]);
      fetchPosts();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: `Failed to ${action} posts.` });
    } finally {
      setConfirmDelete({ open: false, ids: [] });
      setConfirmHide({ open: false, ids: [] });
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary mb-2">
            <FileText size={12} />
            Post Management
          </div>
          <h1 className="text-3xl font-black tracking-tight">Community Feed</h1>
          <p className="text-sm text-muted-foreground mt-1">Audit and moderate all community content</p>
        </div>
        <Button variant="outline" size="sm" asChild className="rounded-full border-primary/20">
          <Link href="/admin/posts/pending-moderation" className="gap-2">
            <Badge variant="secondary" className="h-5 px-1 bg-primary/10 text-primary">!</Badge>
            Moderation Queue
          </Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <SearchBar 
          value={search} 
          onChange={setSearch} 
          placeholder="Search post content..." 
          className="flex-1"
        />
        <FilterPanel activeCount={0} onReset={() => {}} onApply={fetchPosts}>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Visibility</label>
              <select value={visibility} onChange={(e) => setVisibility(e.target.value)} className="w-full bg-background border rounded-lg p-2 text-sm">
                <option value="all">All Visibility</option>
                <option value="PUBLIC">Public</option>
                <option value="NEIGHBOURS">Neighbours</option>
                <option value="PRIVATE">Private</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-background border rounded-lg p-2 text-sm">
                <option value="all">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="FLAGGED">Flagged</option>
                <option value="HIDDEN">Hidden</option>
              </select>
            </div>
          </div>
        </FilterPanel>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-muted/30 text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b">
              <tr>
                <th className="px-6 py-4 w-12"><Checkbox checked={selectedIds.length === posts.length && posts.length > 0} onCheckedChange={() => setSelectedIds(selectedIds.length === posts.length ? [] : posts.map(p => p.id))} /></th>
                <th className="px-6 py-4 min-w-[300px]">Content Preview</th>
                <th className="px-6 py-4">Author</th>
                <th className="px-6 py-4 text-center">Visibility</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="px-6 py-8"><div className="h-4 bg-muted rounded w-full" /></td>
                  </tr>
                ))
              ) : posts.map((post) => (
                <tr 
                  key={post.id}
                  className={cn(
                    "hover:bg-muted/10 transition-colors group",
                    selectedIds.includes(post.id) && "bg-primary/5"
                  )}
                >
                  <td className="px-6 py-4">
                    <Checkbox checked={selectedIds.includes(post.id)} onCheckedChange={() => toggleSelect(post.id)} />
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium line-clamp-2 leading-relaxed max-w-xs">{post.content}</p>
                    {post.images && post.images.length > 0 && (
                      <span className="text-[10px] text-primary font-bold mt-1 inline-block">+{post.images.length} images</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/admin/users/${post.author.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={post.author.profileImage || ""} />
                        <AvatarFallback className="text-[10px]">{post.author.name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold">{post.author.name}</span>
                        <span className="text-[10px] text-muted-foreground">{post.author.email}</span>
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Badge variant="outline" className={cn(
                      "text-[9px] font-bold uppercase",
                      post.visibility === 'PUBLIC' ? "bg-emerald-50 text-emerald-600" :
                      post.visibility === 'NEIGHBOURS' ? "bg-blue-50 text-blue-600" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {post.visibility}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <StatusBadge status={post.moderationStatus.toLowerCase()} className="text-[9px]" />
                  </td>
                  <td className="px-6 py-4 text-xs text-muted-foreground font-medium">
                    {format(new Date(post.createdAt), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                          <MoreHorizontal size={14} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => router.push(`/admin/posts/${post.id}`)}>
                          <ExternalLink size={14} className="mr-2" /> View Detail
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setConfirmHide({ open: true, ids: [post.id] })}>
                          <EyeOff size={14} className="mr-2" /> Hide Post
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setConfirmDelete({ open: true, ids: [post.id] })} className="text-destructive">
                          <Trash2 size={14} className="mr-2" /> Delete Post
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t flex items-center justify-between bg-muted/5">
          <p className="text-xs text-muted-foreground">Showing <span className="text-foreground font-bold">{posts.length}</span> of {totalCount} posts</p>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)}
              className="h-8 rounded-lg"
            >
              <ChevronLeft size={14} className="mr-1" /> Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={page === totalPages} 
              onClick={() => setPage(p => p + 1)}
              className="h-8 rounded-lg"
            >
              Next <ChevronRight size={14} className="ml-1" />
            </Button>
          </div>
        </div>
      </div>

      <BulkActionBar 
        selectedCount={selectedIds.length} 
        onClear={() => setSelectedIds([])}
        actions={[
          { label: "Hide Selected", icon: <EyeOff size={14} />, onClick: () => setConfirmHide({ open: true, ids: selectedIds }) },
          { label: "Delete Selected", icon: <Trash2 size={14} />, variant: "destructive", onClick: () => setConfirmDelete({ open: true, ids: selectedIds }) }
        ]}
      />

      <ConfirmationDialog 
        open={confirmDelete.open}
        onOpenChange={(o) => setConfirmDelete(prev => ({ ...prev, open: o }))}
        onConfirm={() => handleAction('delete', confirmDelete.ids)}
        title="Delete content?"
        description="This will permanently delete the selected post(s) and all their associated data."
      />

      <ConfirmationDialog 
        open={confirmHide.open}
        onOpenChange={(o) => setConfirmHide(prev => ({ ...prev, open: o }))}
        onConfirm={() => handleAction('hide', confirmHide.ids)}
        title="Hide from feed?"
        description="Hidden posts are only visible to the author and administrators."
        confirmText="Hide Post"
      />
    </div>
  );
}
