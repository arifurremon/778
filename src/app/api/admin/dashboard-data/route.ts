import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
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

    return NextResponse.json({
      stats: {
        users: { total: totalUsers, growth: calcGrowth(current30dUsers, prev30dUsers) },
        posts: { total: totalPosts, growth: calcGrowth(current30dPosts, prev30dPosts) },
        shops: { total: totalShops, growth: calcGrowth(current30dShops, prev30dShops), pendingVerification: pendingShops },
        services: { total: totalServices, growth: calcGrowth(current30dServices, prev30dServices), pendingVerification: pendingServices },
        flaggedPosts: 0,
      },
      recentActivity: recentLogs.map(log => ({
        description: log.description,
        createdAt: log.createdAt,
        type: log.type,
        user: {
          name: log.user.name,
          email: log.user.email
        }
      }))
    });
  } catch (error) {
    console.error("Dashboard data fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
