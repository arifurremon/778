import { ActivityTimeline } from "@/components/admin/display/ActivityTimeline";
import { StatsCard } from "@/components/admin/display/StatsCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import {
    AlertCircle,
    Briefcase,
    ChevronRight,
    Clock,
    FileText,
    Store,
    Users
} from "lucide-react";
import Link from "next/link";

interface DashboardStats {
  users: { total: number; growth: number }
  posts: { total: number; growth: number }
  shops: { total: number; growth: number; pendingVerification: number }
  services: { total: number; growth: number; pendingVerification: number }
  flaggedPosts: number
}

interface DashboardActivityLog {
  description: string
  createdAt: Date
  type: string
  user: {
    name: string | null
    email: string
  }
}

async function getDashboardData(): Promise<{ stats: DashboardStats; recentActivity: DashboardActivityLog[] }> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const [
    totalUsers, current30dUsers, prev30dUsers,
    totalPosts, current30dPosts, prev30dPosts,
    totalShops, current30dShops, prev30dShops,
    totalServices, current30dServices, prev30dServices,
    pendingShops, pendingServices,
    recentLogs
  ] = await Promise.all([
    // Users
    db.user.count(),
    db.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    db.user.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
    
    // Posts
    db.post.count(),
    db.post.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    db.post.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
    
    // Shops
    db.shop.count(),
    db.shop.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    db.shop.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
    
    // Services
    db.expertService.count(),
    db.expertService.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    db.expertService.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
    
    // Pending
    db.user.count({ where: { registrationStatus: "PENDING" } }),
    db.user.count({ where: { serviceRegistrationStatus: "PENDING" } }),
    
    // Recent Activity
    db.activityLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { user: true }
    })
  ]);

  const calcGrowth = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  };

  return {
    stats: {
      users: { total: totalUsers, growth: calcGrowth(current30dUsers, prev30dUsers) },
      posts: { total: totalPosts, growth: calcGrowth(current30dPosts, prev30dPosts) },
      shops: { total: totalShops, growth: calcGrowth(current30dShops, prev30dShops), pendingVerification: pendingShops },
      services: { total: totalServices, growth: calcGrowth(current30dServices, prev30dServices), pendingVerification: pendingServices },
      flaggedPosts: 0, // No flagged field in current schema
    },
    recentActivity: recentLogs as DashboardActivityLog[]
  };
}

export default async function AdminDashboardPage() {
  const { stats, recentActivity } = await getDashboardData();

  const timelineItems = recentActivity.map(log => ({
    title: log.description,
    timestamp: new Date(log.createdAt).toLocaleString(),
    type: log.type === 'SYSTEM' ? ('info' as const) : ('success' as const),
    description: `By ${log.user.name || log.user.email}`
  }));

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1 font-medium">
          Welcome back — here&apos;s what&apos;s happening
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Total Users"
          value={stats.users.total}
          trend={stats.users.growth}
          icon={Users}
          iconColor="text-blue-400"
          iconBg="bg-blue-400/10"
          subtitle="Registered citizens"
        />
        <StatsCard 
          title="Total Posts"
          value={stats.posts.total}
          trend={stats.posts.growth}
          icon={FileText}
          iconColor="text-purple-400"
          iconBg="bg-purple-400/10"
          subtitle="Community updates"
        />
        <StatsCard 
          title="Total Shops"
          value={stats.shops.total}
          trend={stats.shops.growth}
          icon={Store}
          iconColor="text-amber-400"
          iconBg="bg-amber-400/10"
          subtitle="Marketplace vendors"
        />
        <StatsCard 
          title="Total Services"
          value={stats.services.total}
          trend={stats.services.growth}
          icon={Briefcase}
          iconColor="text-green-400"
          iconBg="bg-green-400/10"
          subtitle="Expert providers"
        />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Recent Activity */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Recent Activity
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/settings/audit-log">View All</Link>
            </Button>
          </div>
          <Card className="border-border/50 bg-card/40">
            <CardContent className="p-6">
              {timelineItems.length > 0 ? (
                <ActivityTimeline items={timelineItems} />
              ) : (
                <div className="py-12 text-center">
                  <p className="text-sm text-muted-foreground">No recent activity found.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Pending Actions */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Pending Actions
          </h2>
          <Card className="border-border/50 bg-card/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Attention Required</CardTitle>
              <CardDescription className="text-xs">Items awaiting administrative review</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <PendingActionRow 
                label="Shop Verifications"
                count={stats.shops.pendingVerification}
                href="/admin/shops/pending-verification"
                color="amber"
              />
              <PendingActionRow 
                label="Service Verifications"
                count={stats.services.pendingVerification}
                href="/admin/services/pending-verification"
                color="blue"
              />
              <PendingActionRow 
                label="Flagged Posts"
                count={stats.flaggedPosts}
                href="/admin/posts/pending-moderation"
                color="rose"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function PendingActionRow({ label, count, href, color }: { label: string; count: number; href: string; color: 'amber' | 'blue' | 'rose' }) {
  const colorClasses = {
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    rose: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-background/50 hover:bg-muted/30 transition-colors group">
      <div className="flex items-center gap-3">
        <div className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border", colorClasses[color])}>
          {count}
        </div>
        <span className="text-xs font-semibold">{label}</span>
      </div>
      <Link href={href}>
        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg group-hover:bg-primary/10 group-hover:text-primary">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}
