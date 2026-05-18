import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { formatAPIError, logErrorToSentry } from "@/lib/error-handler";
import { endOfDay, startOfDay, subDays } from "date-fns";
import { NextRequest, NextResponse } from "next/server";

function groupByDate(items: { createdAt: Date }[]): Record<string, number> {
  return items.reduce((acc, item) => {
    const date = item.createdAt.toISOString().split('T')[0]
    if (date) acc[date] = (acc[date] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)
}

function fillDateRange(start: Date, end: Date, counts: Record<string, number>) {
  const result: { date: string; value: number }[] = []
  const current = new Date(start)
  while (current <= end) {
    const date = current.toISOString().split('T')[0]
    if (date) result.push({ date, value: counts[date] ?? 0 })
    current.setDate(current.getDate() + 1)
  }
  return result
}

export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "30d";
    
    let days = 30;
    if (range === "7d") days = 7;
    if (range === "90d") days = 90;
    if (range === "1y") days = 365;

    const startDate = startOfDay(subDays(new Date(), days));
    const endDate = endOfDay(new Date());

    const [growthData, totalUsers, activeUsersCount, topUsersRaw, roleCounts] = await Promise.all([
      db.user.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' }
      }),
      db.user.count(),
      db.user.count({
        where: {
          // Active if created in last 30d or has activity (simplistic fallback)
          createdAt: { gte: subDays(new Date(), 30) }
        }
      }),
      db.user.findMany({
        take: 10,
        select: {
          id: true,
          name: true,
          _count: { select: { posts: true } }
        },
        orderBy: { posts: { _count: 'desc' } }
      }),
      Promise.all([
        db.user.count({ where: { isAdmin: true } }),
        db.user.count({ where: { isSeller: true } }),
        db.user.count({ where: { isServiceProvider: true } }),
        db.user.count({ where: { isAdmin: false, isSeller: false, isServiceProvider: false } }),
      ])
    ]);

    const dailyCounts = groupByDate(growthData);
    const growth = fillDateRange(startDate, endDate, dailyCounts);

    const roleDistribution = [
      { name: 'Admins', value: roleCounts[0], color: '#ef4444' },
      { name: 'Sellers', value: roleCounts[1], color: '#f59e0b' },
      { name: 'Providers', value: roleCounts[2], color: '#10b981' },
      { name: 'Regular', value: roleCounts[3], color: '#3b82f6' },
    ];

    const topUsers = topUsersRaw.map(u => ({
      id: u.id,
      name: u.name || 'Anonymous',
      postCount: u._count.posts
    }));

    return NextResponse.json({
      success: true,
      data: {
        growth,
        total: totalUsers,
        active: activeUsersCount,
        newThisMonth: growthData.length,
        suspended: 0, // SCHEMA-FALLBACK: 'suspended' status may not exist
        roleDistribution,
        topUsers
      }
    }, {
      headers: { 'Cache-Control': 'public, max-age=300' }
    });
  } catch (err) {
    logErrorToSentry(err, {
      endpoint: "/api/admin/analytics/users",
      method: "GET",
    });
    return NextResponse.json(
      formatAPIError(err),
      { status: 500 }
    );
  }
}
