"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  FileText,
  Store,
  Briefcase,
  MessageSquare,
  ShieldCheck,
  Clock,
  TrendingUp,
  BadgeCheck,
  Activity,
  BarChart3,
  Flame,
  Heart,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { StatCard, PendingAlert } from "@/components/admin/stat-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface AnalyticsData {
  totalUsers: number;
  totalPosts: number;
  totalShops: number;
  totalServices: number;
  totalComments: number;
  totalConnections: number;
  pendingShops: number;
  pendingServices: number;
  pendingVerifications: number;
  totalPending: number;
  newUsersWeek: number;
  newPostsWeek: number;
  deletedUsers: number;
  verifiedUsers: number;
  adminUsers: number;
  sellers: number;
  experts: number;
  postVisibility: { public: number; neighbours: number; private: number };
  shopStatus: { verified: number; unverified: number };
  chartData: { date: string; users: number; posts: number }[];
  topPosters: {
    id: string;
    name: string;
    profileImage: string | null;
    isVerified: boolean;
    _count: { posts: number };
  }[];
  recentActivity: {
    id: string;
    type: string;
    description: string;
    createdAt: string;
    user: { name: string; profileImage: string | null };
  }[];
}

export default function AdminOverviewPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch("/api/admin/analytics");
        if (!res.ok) throw new Error("Failed to fetch analytics");
        const json = await res.json() as AnalyticsData;
        setData(json);
      } catch (err) {
        setError("Failed to load analytics data.");
      } finally {
        setLoading(false);
      }
    };
    void fetchAnalytics();
  }, []);

  if (loading) return <OverviewSkeleton />;
  if (error || !data) return (
    <div className="p-8 text-center">
      <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4 opacity-50" />
      <p className="text-sm font-bold text-muted-foreground">{error ?? "Unknown error"}</p>
    </div>
  );

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-rose-400 mb-2"
          >
            <ShieldCheck size={12} />
            Admin Command Center
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl md:text-3xl font-black tracking-tight"
          >
            Platform Overview
          </motion.h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium">
            Real-time insights across The Chattala platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-emerald-400/10 border border-emerald-400/20 rounded-xl px-4 py-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-emerald-400">System Live</span>
          </div>
        </div>
      </div>

      {/* Pending Actions Alert */}
      {data.totalPending > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Clock size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-400">{data.totalPending} items need attention</h3>
              <p className="text-xs text-muted-foreground">Review pending applications and verification requests</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {data.pendingVerifications > 0 && (
              <PendingAlert count={data.pendingVerifications} label="Resident verifications" href="/admin/verifications" />
            )}
            {data.pendingShops > 0 && (
              <PendingAlert count={data.pendingShops} label="Shop applications" href="/admin/verifications" />
            )}
            {data.pendingServices > 0 && (
              <PendingAlert count={data.pendingServices} label="Service applications" href="/admin/verifications" />
            )}
          </div>
        </motion.div>
      )}

      {/* Core Stats Grid */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Platform Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Users"
            value={data.totalUsers}
            subtitle={`+${data.newUsersWeek} this week`}
            icon={Users}
            iconColor="text-violet-400"
            iconBg="bg-violet-400/10"
            trend={data.newUsersWeek > 0 ? Math.round((data.newUsersWeek / Math.max(1, data.totalUsers - data.newUsersWeek)) * 100) : 0}
            index={0}
          />
          <StatCard
            title="Total Posts"
            value={data.totalPosts}
            subtitle={`+${data.newPostsWeek} this week`}
            icon={FileText}
            iconColor="text-emerald-400"
            iconBg="bg-emerald-400/10"
            trend={data.newPostsWeek > 0 ? Math.round((data.newPostsWeek / Math.max(1, data.totalPosts - data.newPostsWeek)) * 100) : 0}
            index={1}
          />
          <StatCard
            title="Total Shops"
            value={data.totalShops}
            subtitle={`${data.shopStatus.verified} verified`}
            icon={Store}
            iconColor="text-amber-400"
            iconBg="bg-amber-400/10"
            index={2}
          />
          <StatCard
            title="Expert Services"
            value={data.totalServices}
            subtitle="Active service providers"
            icon={Briefcase}
            iconColor="text-cyan-400"
            iconBg="bg-cyan-400/10"
            index={3}
          />
          <StatCard
            title="Comments"
            value={data.totalComments}
            subtitle="Community engagement"
            icon={MessageSquare}
            iconColor="text-blue-400"
            iconBg="bg-blue-400/10"
            index={4}
          />
          <StatCard
            title="Connections"
            value={data.totalConnections}
            subtitle="Accepted neighbour links"
            icon={Users}
            iconColor="text-rose-400"
            iconBg="bg-rose-400/10"
            index={5}
          />
          <StatCard
            title="Verified Users"
            value={data.verifiedUsers}
            subtitle={`${Math.round((data.verifiedUsers / Math.max(1, data.totalUsers)) * 100)}% of total`}
            icon={BadgeCheck}
            iconColor="text-teal-400"
            iconBg="bg-teal-400/10"
            index={6}
          />
          <StatCard
            title="Sellers & Experts"
            value={data.sellers + data.experts}
            subtitle={`${data.sellers} sellers • ${data.experts} experts`}
            icon={ShieldCheck}
            iconColor="text-indigo-400"
            iconBg="bg-indigo-400/10"
            index={7}
          />
        </div>
      </div>

      {/* Chart + Top Posters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth Chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-card/40 border border-border/50 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-base">Growth Trend</h3>
              <p className="text-xs text-muted-foreground font-medium">Last 30 days — Users & Posts</p>
            </div>
            <div className="flex items-center gap-2 bg-primary/5 rounded-lg p-1.5">
              <BarChart3 size={14} className="text-primary" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="usersGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="postsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
              />
              <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
              <Area
                type="monotone"
                dataKey="users"
                name="New Users"
                stroke="#8b5cf6"
                fill="url(#usersGrad)"
                strokeWidth={2}
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="posts"
                name="New Posts"
                stroke="#34d399"
                fill="url(#postsGrad)"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Top Posters */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card/40 border border-border/50 rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <Flame size={16} className="text-rose-400" />
            <h3 className="font-bold text-base">Top Contributors</h3>
          </div>
          <div className="space-y-3">
            {data.topPosters.map((poster, i) => (
              <div key={poster.id} className="flex items-center gap-3 group">
                <span className="text-[10px] font-black text-muted-foreground/50 w-4 text-right tabular-nums">
                  {i + 1}
                </span>
                <Avatar className="w-8 h-8 border border-border/30">
                  <AvatarImage src={poster.profileImage ?? ""} />
                  <AvatarFallback className="text-xs font-bold">
                    {poster.name?.[0] ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate flex items-center gap-1">
                    {poster.name}
                    {poster.isVerified && <BadgeCheck size={11} className="text-cyan-400 shrink-0" />}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {poster._count.posts} posts
                  </p>
                </div>
                <Link href={`/admin/users?search=${poster.name}`}>
                  <Button variant="ghost" size="sm" className="h-7 text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    View
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Post Visibility */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-card/40 border border-border/50 rounded-2xl p-6"
        >
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
            <FileText size={14} className="text-emerald-400" />
            Post Visibility
          </h3>
          <div className="space-y-3">
            {[
              { label: "Public", value: data.postVisibility.public, color: "bg-emerald-400" },
              { label: "Neighbours", value: data.postVisibility.neighbours, color: "bg-blue-400" },
              { label: "Private", value: data.postVisibility.private, color: "bg-muted" },
            ].map((item) => {
              const total = data.totalPosts || 1;
              const pct = Math.round((item.value / total) * 100);
              return (
                <div key={item.label}>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-bold">{item.value.toLocaleString()} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* User Roles */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card/40 border border-border/50 rounded-2xl p-6"
        >
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
            <Users size={14} className="text-violet-400" />
            User Roles
          </h3>
          <div className="space-y-3">
            {[
              { label: "Regular Users", value: data.totalUsers - data.sellers - data.experts, color: "text-muted-foreground", badge: "bg-muted" },
              { label: "Verified Residents", value: data.verifiedUsers, color: "text-teal-400", badge: "bg-teal-400/10" },
              { label: "Sellers", value: data.sellers, color: "text-amber-400", badge: "bg-amber-400/10" },
              { label: "Service Experts", value: data.experts, color: "text-cyan-400", badge: "bg-cyan-400/10" },
              { label: "Admins", value: data.adminUsers, color: "text-rose-400", badge: "bg-rose-400/10" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">{item.label}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${item.badge} ${item.color}`}>
                  {item.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="bg-card/40 border border-border/50 rounded-2xl p-6"
        >
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
            <Activity size={14} className="text-blue-400" />
            Recent Activity
          </h3>
          <div className="space-y-3 overflow-hidden">
            {data.recentActivity.slice(0, 5).map((log) => (
              <div key={log.id} className="flex items-start gap-2.5">
                <Avatar className="w-6 h-6 shrink-0 mt-0.5">
                  <AvatarImage src={log.user.profileImage ?? ""} />
                  <AvatarFallback className="text-[9px] font-bold">{log.user.name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-muted-foreground leading-tight line-clamp-2">
                    <span className="font-bold text-foreground">{log.user.name}</span>{" "}
                    {log.description.toLowerCase()}
                  </p>
                  <p className="text-[9px] text-muted-foreground/50 font-medium mt-0.5">
                    {new Date(log.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-card/40 border border-border/50 rounded-2xl p-6"
      >
        <h3 className="font-bold text-sm mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { label: "Manage Users", href: "/admin/users", icon: Users, color: "text-violet-400", bg: "bg-violet-400/10" },
            { label: "Review Posts", href: "/admin/posts", icon: FileText, color: "text-emerald-400", bg: "bg-emerald-400/10" },
            { label: "Shop Approvals", href: "/admin/shops", icon: Store, color: "text-amber-400", bg: "bg-amber-400/10" },
            { label: "Service Review", href: "/admin/services", icon: Briefcase, color: "text-cyan-400", bg: "bg-cyan-400/10" },
            { label: "Verifications", href: "/admin/verifications", icon: BadgeCheck, color: "text-teal-400", bg: "bg-teal-400/10" },
            { label: "Analytics", href: "/admin/analytics", icon: BarChart3, color: "text-rose-400", bg: "bg-rose-400/10" },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href}>
                <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/30 hover:border-border hover:bg-card/60 transition-all group cursor-pointer text-center">
                  <div className={`w-10 h-10 rounded-xl ${action.bg} flex items-center justify-center transition-transform group-hover:scale-110`}>
                    <Icon size={18} className={action.color} />
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground group-hover:text-foreground transition-colors">{action.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="lg:col-span-2 h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </div>
  );
}
