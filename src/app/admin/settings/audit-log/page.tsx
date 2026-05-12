"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ClipboardList,
  Search,
  Filter,
  User,
  Clock,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { AdminTableToolbar, AdminPagination, AdminEmptyState } from "@/components/admin/admin-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface AuditLog {
  id: string;
  type: string;
  description: string;
  contextUrl: string | null;
  isRead: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    profileImage: string | null;
    isAdmin: boolean;
  };
}

interface AuditResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  totalPages: number;
}

const TYPE_FILTERS = [
  { key: "type", label: "Type", options: [
    { value: "all", label: "All Types" },
    { value: "SYSTEM", label: "System" },
    { value: "LIKE", label: "Like" },
    { value: "COMMENT", label: "Comment" },
    { value: "SAVED", label: "Saved" },
    { value: "POPULAR", label: "Popular" },
  ]},
];

const TYPE_STYLES: Record<string, string> = {
  SYSTEM: "bg-blue-400/10 text-blue-400",
  LIKE: "bg-emerald-400/10 text-emerald-400",
  COMMENT: "bg-violet-400/10 text-violet-400",
  SAVED: "bg-amber-400/10 text-amber-400",
  POPULAR: "bg-rose-400/10 text-rose-400",
};

const TYPE_EMOJI: Record<string, string> = {
  SYSTEM: "⚙️",
  LIKE: "👍",
  COMMENT: "💬",
  SAVED: "🔖",
  POPULAR: "🔥",
};

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "30", search, type });
      const res = await fetch(`/api/admin/audit-log?${params.toString()}`);
      if (!res.ok) throw new Error();
      const data = await res.json() as AuditResponse;
      setLogs(data.logs);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to load audit log." });
    } finally {
      setLoading(false);
    }
  }, [page, search, type]);

  useEffect(() => { void fetchLogs(); }, [fetchLogs]);
  useEffect(() => { const t = setTimeout(() => setPage(1), 400); return () => clearTimeout(t); }, [search]);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-2">
          <ClipboardList size={12} />
          Settings
        </div>
        <h1 className="text-2xl font-black tracking-tight">Audit Log</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {total.toLocaleString()} activity events recorded
        </p>
      </div>

      <div className="bg-card/40 border border-border/50 rounded-2xl p-4">
        <AdminTableToolbar
          search={search}
          onSearch={(v) => { setSearch(v); setPage(1); }}
          placeholder="Search log descriptions..."
          filters={TYPE_FILTERS}
          activeFilters={{ type }}
          onFilter={(_, v) => { setType(v); setPage(1); }}
        />
      </div>

      <div className="bg-card/40 border border-border/50 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="divide-y divide-border/20">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <Skeleton className="w-9 h-9 rounded-xl" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <AdminEmptyState icon={<ClipboardList size={40} />} title="No log entries" description="Try adjusting your filters." />
        ) : (
          <div className="divide-y divide-border/20">
            {logs.map((log, i) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.01 }}
                className="flex items-start gap-4 px-5 py-4 hover:bg-muted/20 transition-colors"
              >
                {/* Type emoji */}
                <div className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0",
                  TYPE_STYLES[log.type] ?? "bg-muted"
                )}>
                  {TYPE_EMOJI[log.type] ?? "📋"}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <Badge className={cn("text-[9px] px-1.5 py-0.5 font-bold border-0", TYPE_STYLES[log.type] ?? "bg-muted text-muted-foreground")}>
                      {log.type}
                    </Badge>
                    {log.user.isAdmin && (
                      <Badge className="text-[9px] px-1.5 py-0.5 bg-rose-500/10 text-rose-400 border-0">Admin</Badge>
                    )}
                  </div>
                  <p className="text-sm text-foreground font-medium leading-tight">{log.description}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <Link href={`/admin/users/${log.user.id}`} className="flex items-center gap-1.5 group">
                      <Avatar className="w-4 h-4">
                        <AvatarImage src={log.user.profileImage ?? ""} />
                        <AvatarFallback className="text-[8px]">{log.user.name?.[0] ?? "U"}</AvatarFallback>
                      </Avatar>
                      <span className="text-[10px] font-medium text-muted-foreground group-hover:text-primary transition-colors">
                        {log.user.name ?? log.user.email}
                      </span>
                    </Link>
                    <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
                      <Clock size={9} />
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Context link */}
                {log.contextUrl && (
                  <Link href={log.contextUrl} className="shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground">
                      <ExternalLink size={12} />
                    </Button>
                  </Link>
                )}
              </motion.div>
            ))}
          </div>
        )}

        <div className="px-5 border-t border-border/30">
          <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} total={total} limit={30} />
        </div>
      </div>
    </div>
  );
}
