"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Users,
  FileText,
  Store,
  Briefcase,
  BadgeCheck,
  MessageSquare,
  Link2,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";
import { StatCard } from "@/components/admin/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
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
  newUsersWeek: number;
  newPostsWeek: number;
  verifiedUsers: number;
  sellers: number;
  experts: number;
  adminUsers: number;
  deletedUsers: number;
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
}

const PIE_COLORS = {
  visibility: ["#34d399", "#60a5fa", "#94a3b8"],
  shopStatus: ["#fbbf24", "#94a3b8"],
  userRoles: ["#8b5cf6", "#2dd4bf", "#f59e0b", "#06b6d4", "#f43f5e"],
};

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch("/api/admin/analytics");
        if (!res.ok) throw new Error();
        const json = await res.json() as AnalyticsData;
        setData(json);
      } catch {
        toast({ variant: "destructive", title: "Error", description: "Failed to load analytics." });
      } finally {
        setLoading(false);
      }
    };
    void fetch_();
  }, []);

  if (loading) return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </div>
  );

  if (!data) return null;

  const visibilityData = [
    { name: "Public", value: data.postVisibility.public },
    { name: "Neighbours", value: data.postVisibility.neighbours },
    { name: "Private", value: data.postVisibility.private },
  ];

  const userRoleData = [
    { name: "Regular", value: Math.max(0, data.totalUsers - data.sellers - data.experts - data.adminUsers) },
    { name: "Verified", value: data.verifiedUsers },
    { name: "Sellers", value: data.sellers },
    { name: "Experts", value: data.experts },
    { name: "Admins", value: data.adminUsers },
  ];

  const shopData = [
    { name: "Verified", value: data.shopStatus.verified },
    { name: "Unverified", value: data.shopStatus.unverified },
  ];

  const topPostersChart = data.topPosters.map((p) => ({
    name: p.name?.split(" ")[0] ?? "User",
    posts: p._count.posts,
  }));

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-rose-400 mb-2">
          <BarChart3 size={12} />
          Platform Analytics
        </div>
        <h1 className="text-2xl font-black tracking-tight">Analytics & Insights</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Comprehensive metrics across The Chattala platform
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={data.totalUsers} icon={Users} iconColor="text-violet-400" iconBg="bg-violet-400/10" subtitle={`+${data.newUsersWeek} this week`} index={0} />
        <StatCard title="Total Posts" value={data.totalPosts} icon={FileText} iconColor="text-emerald-400" iconBg="bg-emerald-400/10" subtitle={`+${data.newPostsWeek} this week`} index={1} />
        <StatCard title="Active Shops" value={data.totalShops} icon={Store} iconColor="text-amber-400" iconBg="bg-amber-400/10" subtitle={`${data.shopStatus.verified} verified`} index={2} />
        <StatCard title="Expert Services" value={data.totalServices} icon={Briefcase} iconColor="text-cyan-400" iconBg="bg-cyan-400/10" index={3} />
        <StatCard title="Total Comments" value={data.totalComments} icon={MessageSquare} iconColor="text-blue-400" iconBg="bg-blue-400/10" index={4} />
        <StatCard title="Connections" value={data.totalConnections} icon={Link2} iconColor="text-indigo-400" iconBg="bg-indigo-400/10" index={5} />
        <StatCard title="Verified Users" value={data.verifiedUsers} icon={BadgeCheck} iconColor="text-teal-400" iconBg="bg-teal-400/10" index={6} />
        <StatCard title="Admin Users" value={data.adminUsers} icon={ShieldCheck} iconColor="text-rose-400" iconBg="bg-rose-400/10" index={7} />
      </div>

      {/* 30-Day Area Chart */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card/40 border border-border/50 rounded-2xl p-6"
      >
        <h3 className="font-bold text-base mb-1">30-Day Growth</h3>
        <p className="text-xs text-muted-foreground mb-6">Daily new users and posts over the past month</p>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={data.chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="usersGrad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="postsGrad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} />
            <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
            <Area type="monotone" dataKey="users" name="New Users" stroke="#8b5cf6" fill="url(#usersGrad2)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="posts" name="New Posts" stroke="#34d399" fill="url(#postsGrad2)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Post Visibility Pie */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card/40 border border-border/50 rounded-2xl p-6">
          <h3 className="font-bold text-sm mb-1">Post Visibility</h3>
          <p className="text-xs text-muted-foreground mb-4">Distribution across privacy levels</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={visibilityData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                {visibilityData.map((_, i) => <Cell key={i} fill={PIE_COLORS.visibility[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }} />
              <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: "10px" }} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* User Roles Pie */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="bg-card/40 border border-border/50 rounded-2xl p-6">
          <h3 className="font-bold text-sm mb-1">User Roles</h3>
          <p className="text-xs text-muted-foreground mb-4">Breakdown by role type</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={userRoleData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                {userRoleData.map((_, i) => <Cell key={i} fill={PIE_COLORS.userRoles[i % PIE_COLORS.userRoles.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }} />
              <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: "10px" }} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Shop Status */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-card/40 border border-border/50 rounded-2xl p-6">
          <h3 className="font-bold text-sm mb-1">Shop Status</h3>
          <p className="text-xs text-muted-foreground mb-4">Verified vs unverified shops</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={shopData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                {shopData.map((_, i) => <Cell key={i} fill={PIE_COLORS.shopStatus[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }} />
              <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: "10px" }} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Top Posters Bar Chart */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="bg-card/40 border border-border/50 rounded-2xl p-6"
      >
        <h3 className="font-bold text-base mb-1">Top Contributors</h3>
        <p className="text-xs text-muted-foreground mb-6">Users with most posts on the platform</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={topPostersChart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
            <Bar dataKey="posts" name="Posts" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
