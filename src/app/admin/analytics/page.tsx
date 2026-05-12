"use client";

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreVertical
} from 'lucide-react';
import { motion } from 'framer-motion';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LineChart } from '@/components/admin/analytics/LineChart';
import { BarChart } from '@/components/admin/analytics/BarChart';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface OverviewData {
  growth: { date: string; value: number }[];
  contentCreated: { name: string; value: number }[];
  pendingActions: {
    users: number;
    shops: number;
    services: number;
    reports: number;
  };
  health: {
    uptime: string;
    responseTime: string;
    errorRate: string;
  };
  activeUsers: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    actions: number;
  }[];
}

const TIME_RANGES = [
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: '90 Days', value: '90d' },
  { label: '1 Year', value: '1y' },
];

export default function AnalyticsOverviewPage() {
  const [timeRange, setTimeRange] = useState('30d');
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/analytics/overview?range=${timeRange}`);
        if (!res.ok) throw new Error();
        const json = await res.json();
        setData(json.data);
      } catch (err) {
        toast({ variant: "destructive", title: "Error", description: "Failed to load analytics data." });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [timeRange]);

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary mb-2">
            <BarChart3 size={12} />
            Intelligence Dashboard
          </div>
          <h1 className="text-3xl font-black tracking-tight">Platform Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">Holistic view of growth, engagement, and system health.</p>
        </div>

        <div className="inline-flex p-1 bg-muted/50 rounded-xl border border-border/50">
          {TIME_RANGES.map((range) => (
            <Button
              key={range.value}
              variant={timeRange === range.value ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setTimeRange(range.value)}
              className={cn(
                "rounded-lg px-4 text-xs font-bold transition-all",
                timeRange === range.value ? "bg-background shadow-sm" : "text-muted-foreground"
              )}
            >
              {range.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-border/50 bg-primary/5 border-primary/10 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp size={64} className="text-primary" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-primary/70">User Growth</CardDescription>
            <CardTitle className="text-3xl font-black">
              {loading ? "..." : "+12.5%"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart data={data?.growth || []} loading={loading} height={80} color="hsl(var(--primary))" />
          </CardContent>
        </Card>

        <Card className="border-border/50 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-emerald-500">
            <Activity size={64} />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">New Listings</CardDescription>
            <CardTitle className="text-3xl font-black">
              {loading ? "..." : (data?.contentCreated.reduce((acc, curr) => acc + curr.value, 0) || 0).toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart data={data?.contentCreated || []} loading={loading} height={80} color="#10b981" layout="horizontal" />
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-amber-500/5 border-amber-500/10 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-amber-500">
            <Clock size={64} />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-amber-600">Pending Reviews</CardDescription>
            <CardTitle className="text-3xl font-black">
              {loading ? "..." : (data ? data.pendingActions.users + data.pendingActions.shops + data.pendingActions.services : 0)}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/20 text-[8px] font-black uppercase tracking-widest">
              {data?.pendingActions.users || 0} Users
            </Badge>
            <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/20 text-[8px] font-black uppercase tracking-widest">
              {data?.pendingActions.shops || 0} Shops
            </Badge>
            <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/20 text-[8px] font-black uppercase tracking-widest">
              {data?.pendingActions.services || 0} Services
            </Badge>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-emerald-500/5 border-emerald-500/10 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-emerald-500">
            <CheckCircle2 size={64} />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-emerald-600">System Health</CardDescription>
            <CardTitle className="text-3xl font-black">Stable</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-muted-foreground uppercase tracking-widest">Uptime</span>
              <span className="text-emerald-600">{data?.health.uptime || "99.9%"}</span>
            </div>
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-muted-foreground uppercase tracking-widest">Latency</span>
              <span>{data?.health.responseTime || "124ms"}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/50 shadow-2xl shadow-black/5">
            <CardHeader className="flex flex-row items-center justify-between pb-8">
              <div>
                <CardTitle className="text-lg font-black tracking-tight italic">User Acquisition</CardTitle>
                <CardDescription>Daily registration trends for the selected period.</CardDescription>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full">
                <MoreVertical size={16} />
              </Button>
            </CardHeader>
            <CardContent>
              <LineChart data={data?.growth || []} loading={loading} height={300} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border/50 shadow-xl shadow-black/5">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Users size={16} className="text-primary" /> Top Contributors
              </CardTitle>
              <CardDescription>Most active users in the last 30 days.</CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <div className="divide-y divide-border/30">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 px-6 py-4">
                      <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
                      <div className="space-y-2 flex-1">
                        <div className="h-3 bg-muted rounded w-32 animate-pulse" />
                        <div className="h-2 bg-muted rounded w-20 animate-pulse" />
                      </div>
                    </div>
                  ))
                ) : (
                  data?.activeUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/10 transition-colors group">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-10 h-10 border border-border/50 shadow-sm ring-primary/20 group-hover:ring-2 transition-all">
                          <AvatarImage src={user.avatar || ""} />
                          <AvatarFallback className="font-bold text-xs">{user.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-bold tracking-tight">{user.name}</p>
                          <p className="text-[10px] text-muted-foreground font-medium">{user.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black">{user.actions.toLocaleString()}</p>
                        <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Actions</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
            <div className="p-4 bg-muted/5 border-t border-border/30 text-center">
              <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5">
                View Full Leaderboard
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
