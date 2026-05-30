import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { formatAPIError, logErrorToSentry } from "@/lib/error-handler";
import { format, startOfDay, subDays } from "date-fns";
import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// GET /api/admin/analytics  — Platform-wide analytics
// ---------------------------------------------------------------------------
export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    const sevenDaysAgo = subDays(now, 7);
    const yesterday = subDays(now, 1);

    // Core counts (run in parallel)
    const [
      totalUsers,
      totalPosts,
      totalShops,
      totalServices,
      totalComments,
      totalConnections,
      // Pending items
      pendingShops,
      pendingServices,
      pendingVerifications,
      // Recent counts (last 7 days)
      newUsersWeek,
      newPostsWeek,
      // Deleted/inactive
      deletedUsers,
      verifiedUsers,
      adminUsers,
      // Seller/Expert counts
      sellers,
      experts,
    ] = await Promise.all([
      db.user.count(),
      db.post.count(),
      db.shop.count(),
      db.expertService.count(),
      db.comment.count(),
      db.neighbourConnection.count({ where: { status: "ACCEPTED" } }),
      db.user.count({ where: { registrationStatus: "PENDING" } }),
      db.user.count({ where: { serviceRegistrationStatus: "PENDING" } }),
      db.user.count({ where: { verificationRequestStatus: "PENDING" } }),
      db.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      db.post.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      db.user.count(),
      db.user.count({ where: { isVerified: true } }),
      db.user.count({ where: { isAdmin: true } }),
      db.user.count({ where: { isSeller: true } }),
      db.user.count({ where: { isServiceProvider: true } }),
    ]);

    // User registration trend (last 30 days) - grouped by day
    const userTrend = await db.user.groupBy({
      by: ["createdAt"],
      where: { createdAt: { gte: thirtyDaysAgo } },
      _count: { _all: true },
      orderBy: { createdAt: "asc" },
    });

    // Post trend (last 30 days)
    const postTrend = await db.post.groupBy({
      by: ["createdAt"],
      where: { createdAt: { gte: thirtyDaysAgo } },
      _count: { _all: true },
      orderBy: { createdAt: "asc" },
    });

    // Build 30-day chart data
    const chartData: { date: string; users: number; posts: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const day = subDays(now, i);
      const dayStr = format(day, "MMM d");
      const dayStart = startOfDay(day);
      const dayEnd = startOfDay(subDays(day, -1));

      const usersOnDay = userTrend.filter(
        (u) => u.createdAt >= dayStart && u.createdAt < dayEnd
      ).reduce((sum, u) => sum + (u._count._all ?? 0), 0);

      const postsOnDay = postTrend.filter(
        (p) => p.createdAt >= dayStart && p.createdAt < dayEnd
      ).reduce((sum, p) => sum + (p._count._all ?? 0), 0);

      chartData.push({ date: dayStr, users: usersOnDay, posts: postsOnDay });
    }

    // Visibility breakdown for posts
    const [publicPosts, neighbourPosts, privatePosts] = await Promise.all([
      db.post.count({ where: { visibility: "PUBLIC" } }),
      db.post.count({ where: { visibility: "NEIGHBOURS" } }),
      db.post.count({ where: { visibility: "PRIVATE" } }),
    ]);

    // Shop verification status
    const [verifiedShops, unverifiedShops] = await Promise.all([
      db.shop.count({ where: { isVerified: true } }),
      db.shop.count({ where: { isVerified: false } }),
    ]);

    // Most active users (by post count)
    const topPosters = await db.user.findMany({
      orderBy: { posts: { _count: "desc" } },
      take: 5,
      select: {
        id: true,
        name: true,
        profileImage: true,
        isVerified: true,
        _count: { select: { posts: true } },
      },
    });

    // Recent activity logs (platform-wide)
    const recentActivity = await db.activityLog.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        type: true,
        description: true,
        createdAt: true,
        user: { select: { name: true, profileImage: true } },
      },
    });

    return NextResponse.json({
      // Summary
      totalUsers,
      totalPosts,
      totalShops,
      totalServices,
      totalComments,
      totalConnections,
      // Pending
      pendingShops,
      pendingServices,
      pendingVerifications,
      totalPending: pendingShops + pendingServices + pendingVerifications,
      // Growth
      newUsersWeek,
      newPostsWeek,
      // Breakdown
      deletedUsers,
      verifiedUsers,
      adminUsers,
      sellers,
      experts,
      // Post visibility
      postVisibility: { public: publicPosts, neighbours: neighbourPosts, private: privatePosts },
      // Shop status
      shopStatus: { verified: verifiedShops, unverified: unverifiedShops },
      // Charts
      chartData,
      // Top users
      topPosters,
      // Activity
      recentActivity,
    });
  } catch (error) {
    logErrorToSentry(error, {
      endpoint: "/api/admin/analytics",
      method: "GET",
    });
    return NextResponse.json(
      formatAPIError(error),
      { status: 500 }
    );
  }
}
