"use client";

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  UserCheck, 
  UserX, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart2
} from 'lucide-react';
import { motion } from 'framer-motion';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart } from '@/components/admin/analytics/LineChart';
import { BarChart } from '@/components/admin/analytics/BarChart';
import { PieChart } from '@/components/admin/analytics/PieChart';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface UserAnalytics {
  growth: { date: string; value: number }[];
  total: number;
  active: number;
  newThisMonth: number;
  suspended: number;
  roleDistribution: { name: string; value: number; color: string }[];
  topUsers: { id: string; name: string; postCount: number }[];
}

export default function UserAnalyticsPage() {
  const [data, setData] = useState<UserAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/analytics/users');
        if (!res.ok) throw new Error();
        const json = await res.json();
        setData(json.data);
      } catch (err) {
        toast({ variant: "destructive", title: "Error", description: "Failed to load user analytics." });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = [
    { label: 'Total Users', value: data?.total || 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/5', trend: '+5.2%' },
    { label: 'Active (30d)', value: data?.active || 0, icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/5', trend: '+3.1%' },
    { label: 'New This Month', value: data?.newThisMonth || 0, icon: UserPlus, color: 'text-primary', bg: 'bg-primary/5', trend: '+12.4%' },
    { label: 'Suspended', value: data?.suspended || 0, icon: UserX, color: 'text-rose-500', bg: 'bg-rose-500/5', trend: '-2.0%' },
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary mb-2">
            <Users size={12} />
            Community Insights
          </div>
          <h1 className="text-3xl font-black tracking-tight">User Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Detailed breakdown of user demographics and behavior.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="border-border/50 shadow-sm overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={cn("p-2.5 rounded-xl", stat.bg)}>
                  <stat.icon className={cn("w-5 h-5", stat.color)} />
                </div>
                <div className={cn(
                  "flex items-center text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                  stat.trend.startsWith('+') ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"
                )}>
                  {stat.trend.startsWith('+') ? <ArrowUpRight size={10} className="mr-1" /> : <ArrowDownRight size={10} className="mr-1" />}
                  {stat.trend}
                </div>
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{stat.label}</p>
              <h3 className="text-3xl font-black tracking-tight">
                {loading ? "..." : stat.value.toLocaleString()}
              </h3>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/50 shadow-2xl shadow-black/5">
        <CardHeader className="flex flex-row items-center justify-between pb-8">
          <div>
            <CardTitle className="text-xl font-black tracking-tight italic flex items-center gap-2">
              <TrendingUp size={20} className="text-primary" /> Registration Growth
            </CardTitle>
            <CardDescription>Visualizing new account creations over time.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <LineChart data={data?.growth || []} loading={loading} height={350} />
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="border-border/50 shadow-xl shadow-black/5">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <PieChartIcon size={16} className="text-primary" /> Role Distribution
            </CardTitle>
            <CardDescription>Breakdown of users by platform role.</CardDescription>
          </CardHeader>
          <CardContent>
            <PieChart data={data?.roleDistribution || []} loading={loading} height={300} />
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-xl shadow-black/5">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <BarChart2 size={16} className="text-primary" /> Top Users by Engagement
            </CardTitle>
            <CardDescription>Top 10 users ranked by total post count.</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart 
              data={data?.topUsers.map(u => ({ name: u.name, value: u.postCount })) || []} 
              loading={loading} 
              height={300}
              color="hsl(var(--primary))"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
