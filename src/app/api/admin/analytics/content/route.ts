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

    const [postsData, shopsData, servicesData, shopCats, serviceCats] = await Promise.all([
      db.post.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' }
      }),
      db.shop.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' }
      }),
      db.expertService.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' }
      }),
      db.shop.groupBy({
        by: ['category'],
        _count: { _all: true },
        orderBy: { _count: { category: 'desc' } },
        take: 5
      }),
      db.expertService.groupBy({
        by: ['category'],
        _count: { _all: true },
        orderBy: { _count: { category: 'desc' } },
        take: 5
      })
    ]);

    const postCounts = groupByDate(postsData);
    const shopCounts = groupByDate(shopsData);
    const serviceCounts = groupByDate(servicesData);

    const postGrowth = fillDateRange(startDate, endDate, postCounts);
    const shopGrowth = fillDateRange(startDate, endDate, shopCounts);
    const serviceGrowth = fillDateRange(startDate, endDate, serviceCounts);

    return NextResponse.json({
      success: true,
      data: {
        daily: {
          posts: postGrowth,
          shops: shopGrowth,
          services: serviceGrowth
        },
        topCategories: {
          shops: shopCats.map(c => ({ name: c.category, value: c._count._all })),
          services: serviceCats.map(c => ({ name: c.category, value: c._count._all }))
        }
      }
    }, {
      headers: { "Cache-Control": "private, no-store" }
    });
  } catch (err) {
    logErrorToSentry(err, {
      endpoint: "/api/admin/analytics/content",
      method: "GET",
    });
    return NextResponse.json(
      formatAPIError(err),
      { status: 500 }
    );
  }
}
