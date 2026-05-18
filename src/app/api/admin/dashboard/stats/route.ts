import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { formatAPIError, logErrorToSentry } from "@/lib/error-handler";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/admin/dashboard/stats
 * Fetches centralized statistics for the admin dashboard including growth metrics.
 */
export async function GET(req: NextRequest) {
  try {
    // [cite_start]Call requireAdmin() first — return error if not admin. [cite: 37]
    const { session, error } = await requireAdmin();
    if (error) return error;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    /**
     * [cite_start]Use Promise.all to fetch ALL stats in parallel for optimal performance. [cite: 37, 145]
     */
    const [
      // User Stats
      userTotal, userCurrent, userPrev,
      // Post Stats
      postTotal, postCurrent, postPrev,
      // Shop Stats
      shopTotal, shopCurrent, shopPrev,
      // Service Stats
      serviceTotal, serviceCurrent, servicePrev,
      // Pending Actions
      pendingShops, pendingServices,
      // Flagged Content (Schema-Safe)
      flaggedCount
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

      // Services (ExpertService)
      db.expertService.count(),
      db.expertService.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      db.expertService.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),

      // [cite_start]Pending shop verifications and pending service verifications. [cite: 40, 41]
      db.user.count({ where: { registrationStatus: "PENDING" } }),
      db.user.count({ where: { serviceRegistrationStatus: "PENDING" } }),

      // [cite_start]Schema-Safe query for flagged posts [cite: 262]
      (async () => {
        // SCHEMA-FALLBACK: 'isFlagged' may not exist — verify schema [cite: 264]
        try {
          // @ts-ignore - Fallback for potentially missing field
          return await db.post.count({ where: { isFlagged: true } });
        } catch (err) {
          return 0; // [cite_start]Return a safe default value. [cite: 265]
        }
      })()
    ]);

    /**
     * [cite_start]Growth percentage calculation: ((current - previous) / Math.max(previous, 1)) * 100. [cite: 42]
     */
    const calculateGrowth = (current: number, previous: number) => {
      const growth = ((current - previous) / Math.max(previous, 1)) * 100;
      return Math.round(growth);
    };

    // [cite_start]Return JSON matching the DashboardStats interface. [cite: 42-44]
    const stats = {
      users: {
        total: userTotal,
        growth: calculateGrowth(userCurrent, userPrev)
      },
      posts: {
        total: postTotal,
        growth: calculateGrowth(postCurrent, postPrev)
      },
      shops: {
        total: shopTotal,
        growth: calculateGrowth(shopCurrent, shopPrev),
        pendingVerification: pendingShops
      },
      services: {
        total: serviceTotal,
        growth: calculateGrowth(serviceCurrent, servicePrev),
        pendingVerification: pendingServices
      },
      flaggedPosts: flaggedCount
    };

    return NextResponse.json(stats, {
      status: 200,
      headers: {
        // [cite_start]Add Cache-Control header: 'public, max-age=60'. [cite: 45]
        'Cache-Control': 'public, max-age=60'
      }
    });

  } catch (error) {
    logErrorToSentry(error, {
      endpoint: "/api/admin/dashboard/stats",
      method: "GET",
    });
    return NextResponse.json(
      formatAPIError(error),
      { status: 500 }
    );
  }
}
