"use client";

import { BarChart } from "@/components/admin/analytics/BarChart";
import { LineChart } from "@/components/admin/analytics/LineChart";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnalyticsOverview, TimeRangeKey } from "@/lib/admin/dashboard-metrics";
import { cn } from "@/lib/utils";
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Clock,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const TIME_RANGES: { label: string; value: TimeRangeKey }[] = [
  { label: "7 Days", value: "7d" },
  { label: "30 Days", value: "30d" },
  { label: "90 Days", value: "90d" },
  { label: "1 Year", value: "1y" },
];

type AnalyticsOverviewViewProps = {
  data: AnalyticsOverview;
  currentRange: TimeRangeKey;
};

export function AnalyticsOverviewView({ data, currentRange }: AnalyticsOverviewViewProps) {
  const router = useRouter();

  const formatRevenue = (amount: number) =>
    new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: data.revenue.currency,
      maximumFractionDigits: 0,
    }).format(amount);

  const growthLabel =
    data.userGrowthPercent > 0
      ? `+${data.userGrowthPercent}%`
      : `${data.userGrowthPercent}%`;

  const newListingsTotal = data.contentCreated.reduce((acc, curr) => acc + curr.value, 0);
  const pendingTotal =
    data.pendingActions.users +
    data.pendingActions.shops +
    data.pendingActions.services +
    data.pendingActions.verifications;

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary mb-2">
            <BarChart3 size={12} />
            Intelligence Dashboard
          </div>
          <h1 className="text-3xl font-black tracking-tight">Platform Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Live metrics from your database for the selected period.
          </p>
        </div>

        <div className="inline-flex p-1 bg-muted/50 rounded-xl border border-border/50">
          {TIME_RANGES.map((range) => (
            <Button
              key={range.value}
              variant={currentRange === range.value ? "secondary" : "ghost"}
              size="sm"
              onClick={() => router.push(`/admin/analytics?range=${range.value}`)}
              className={cn(
                "rounded-lg px-4 text-xs font-bold transition-all",
                currentRange === range.value ? "bg-background shadow-sm" : "text-muted-foreground"
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
            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-primary/70">
              User Growth
            </CardDescription>
            <CardTitle className="text-3xl font-black">{growthLabel}</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart data={data.growth} height={80} color="hsl(var(--primary))" />
          </CardContent>
        </Card>

        <Card className="border-border/50 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-emerald-500">
            <Activity size={64} />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              New Listings
            </CardDescription>
            <CardTitle className="text-3xl font-black">
              {newListingsTotal.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              data={data.contentCreated}
              height={80}
              color="#10b981"
              layout="horizontal"
            />
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-amber-500/5 border-amber-500/10 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-amber-500">
            <Clock size={64} />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-amber-600">
              Pending Reviews
            </CardDescription>
            <CardTitle className="text-3xl font-black">{pendingTotal.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className="bg-amber-500/10 text-amber-700 border-amber-500/20 text-[8px] font-black uppercase tracking-widest"
            >
              {data.pendingActions.users} Users
            </Badge>
            <Badge
              variant="outline"
              className="bg-amber-500/10 text-amber-700 border-amber-500/20 text-[8px] font-black uppercase tracking-widest"
            >
              {data.pendingActions.shops} Shops
            </Badge>
            <Badge
              variant="outline"
              className="bg-amber-500/10 text-amber-700 border-amber-500/20 text-[8px] font-black uppercase tracking-widest"
            >
              {data.pendingActions.services} Services
            </Badge>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-emerald-500/5 border-emerald-500/10 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-emerald-500">
            <UserPlus size={64} />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
              Today&apos;s Activity
            </CardDescription>
            <CardTitle className="text-3xl font-black">
              {data.realtime.usersRegisteredToday}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-muted-foreground uppercase tracking-widest">
                New signups today
              </span>
              <span className="text-emerald-600">{data.realtime.usersRegisteredToday}</span>
            </div>
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-muted-foreground uppercase tracking-widest">
                Orders today
              </span>
              <span>{data.realtime.ordersToday}</span>
            </div>
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-muted-foreground uppercase tracking-widest">DB latency</span>
              <span>{data.realtime.dbLatencyMs}ms</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Users", value: data.totals.users },
          { label: "Posts", value: data.totals.posts },
          { label: "Shops", value: data.totals.shops },
          { label: "Services", value: data.totals.services },
          {
            label: `Revenue (${currentRange})`,
            value: formatRevenue(data.revenue.periodTotal),
            isText: true,
          },
        ].map((item) => (
          <Card key={item.label} className="border-border/50 bg-card/30">
            <CardContent className="p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                {item.label}
              </p>
              <p className="text-lg font-black mt-1 tabular-nums">
                {item.isText ? item.value : Number(item.value).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/50 shadow-2xl shadow-black/5">
            <CardHeader className="pb-8">
              <div>
                <CardTitle className="text-lg font-black tracking-tight italic">
                  User Acquisition
                </CardTitle>
                <CardDescription>
                  Daily registration trends for the selected period.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <LineChart data={data.growth} height={300} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border/50 shadow-xl shadow-black/5">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Users size={16} className="text-primary" /> Top Contributors
              </CardTitle>
              <CardDescription>
                Most active users by posts and comments in this period.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <div className="divide-y divide-border/30">
                {data.activeUsers.length === 0 ? (
                  <p className="px-6 py-8 text-sm text-muted-foreground text-center">
                    No contributor activity in this period yet.
                  </p>
                ) : (
                  data.activeUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between px-6 py-4 hover:bg-muted/10 transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="w-10 h-10 border border-border/50 shadow-sm ring-primary/20 group-hover:ring-2 transition-all">
                          <AvatarImage src={user.avatar || ""} />
                          <AvatarFallback className="font-bold text-xs">
                            {user.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-bold tracking-tight">{user.name}</p>
                          <p className="text-[10px] text-muted-foreground font-medium">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black">{user.actions.toLocaleString()}</p>
                        <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">
                          Actions
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
            <div className="p-4 bg-muted/5 border-t border-border/30 text-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5"
                asChild
              >
                <Link href="/admin/users">View all users</Link>
              </Button>
            </div>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                Moderation queue
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Flagged posts</span>
                <span className="font-bold">{data.pendingActions.flaggedPosts}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Period orders</span>
                <span className="font-bold">{data.revenue.periodOrderCount}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function AnalyticsOverviewSkeleton() {
  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto animate-pulse">
      <div className="h-20 bg-muted rounded-2xl" />
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-40 bg-muted rounded-2xl" />
        ))}
      </div>
      <div className="h-80 bg-muted rounded-2xl" />
    </div>
  );
}
