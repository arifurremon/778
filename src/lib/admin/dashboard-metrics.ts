import { db } from "@/lib/db";
import { subDays, startOfDay } from "date-fns";
import type { Prisma } from "@prisma/client";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type TimeRangeKey = "7d" | "30d" | "90d" | "1y";

export function parseTimeRange(range: string | null | undefined): {
  key: TimeRangeKey;
  days: number;
} {
  switch (range) {
    case "7d":
      return { key: "7d", days: 7 };
    case "90d":
      return { key: "90d", days: 90 };
    case "1y":
      return { key: "1y", days: 365 };
    default:
      return { key: "30d", days: 30 };
  }
}

export function calculateGrowthPercent(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function thirtyDayWindows(now = new Date()) {
  const thirtyDaysAgo = new Date(now.getTime() - 30 * MS_PER_DAY);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * MS_PER_DAY);
  return { now, thirtyDaysAgo, sixtyDaysAgo };
}

const activeUserWhere = { deletedAt: null } satisfies Prisma.UserWhereInput;

const flaggedPostWhere = {
  deletedAt: null,
  OR: [
    { flagged: true },
    { moderationStatus: "FLAGGED" as const },
    { flagCount: { gt: 0 } },
  ],
} satisfies Prisma.PostWhereInput;

const pendingShopWhere = {
  isVerified: false,
  rejectedAt: null,
} satisfies Prisma.ShopWhereInput;

const pendingServiceWhere = {
  isVerified: false,
  rejectedAt: null,
} satisfies Prisma.ExpertServiceWhereInput;

export interface DashboardStats {
  users: { total: number; growth: number };
  posts: { total: number; growth: number };
  shops: { total: number; growth: number; pendingVerification: number };
  services: { total: number; growth: number; pendingVerification: number };
  flaggedPosts: number;
  orders: { total: number; growth: number; revenueTotal: number; revenueGrowth: number };
  pendingVerifications: number;
}

export interface DashboardActivityItem {
  description: string;
  createdAt: Date;
  type: string;
  user: { name: string | null; email: string };
}

export interface DashboardOverview {
  stats: DashboardStats;
  recentActivity: DashboardActivityItem[];
}

export interface AnalyticsOverview {
  range: TimeRangeKey;
  growth: { date: string; value: number }[];
  contentCreated: { name: string; value: number }[];
  pendingActions: {
    users: number;
    shops: number;
    services: number;
    verifications: number;
    flaggedPosts: number;
  };
  realtime: {
    usersRegisteredToday: number;
    ordersToday: number;
    dbLatencyMs: number;
  };
  userGrowthPercent: number;
  revenue: {
    periodTotal: number;
    periodOrderCount: number;
    currency: string;
  };
  activeUsers: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    actions: number;
  }[];
  totals: {
    users: number;
    posts: number;
    shops: number;
    services: number;
    orders: number;
  };
}

async function measureDbLatencyMs(): Promise<number> {
  const start = performance.now();
  await db.$queryRaw`SELECT 1`;
  return Math.round(performance.now() - start);
}

async function getDailyUserRegistrations(
  periodStart: Date,
  now: Date
): Promise<{ date: string; value: number }[]> {
  const rows = await db.$queryRaw<{ day: Date; value: bigint }[]>`
    SELECT DATE_TRUNC('day', "createdAt")::date AS day, COUNT(*)::bigint AS value
    FROM "User"
    WHERE "createdAt" >= ${periodStart}
      AND "createdAt" <= ${now}
      AND "deletedAt" IS NULL
    GROUP BY 1
    ORDER BY 1 ASC
  `;

  const dailyCounts = new Map<string, number>();
  for (const row of rows) {
    const date = row.day.toISOString().split("T")[0];
    if (date) dailyCounts.set(date, Number(row.value));
  }

  const trend: { date: string; value: number }[] = [];
  const cursor = startOfDay(periodStart);
  const end = startOfDay(now);
  while (cursor <= end) {
    const date = cursor.toISOString().split("T")[0];
    if (date) trend.push({ date, value: dailyCounts.get(date) ?? 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  return trend;
}

async function getTopContributors(periodStart: Date, limit = 5) {
  const [postGroups, commentGroups, recentSignups] = await Promise.all([
    db.post.groupBy({
      by: ["authorId"],
      where: { createdAt: { gte: periodStart }, deletedAt: null },
      _count: { id: true },
    }),
    db.comment.groupBy({
      by: ["authorId"],
      where: { createdAt: { gte: periodStart }, deletedAt: null },
      _count: { id: true },
    }),
    db.user.findMany({
      where: { createdAt: { gte: periodStart }, ...activeUserWhere },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        profileImage: true,
      },
    }),
  ]);

  const actionTotals = new Map<string, number>();
  for (const row of postGroups) {
    actionTotals.set(row.authorId, (actionTotals.get(row.authorId) ?? 0) + row._count.id);
  }
  for (const row of commentGroups) {
    actionTotals.set(row.authorId, (actionTotals.get(row.authorId) ?? 0) + row._count.id);
  }

  const rankedIds = [...actionTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);

  if (rankedIds.length === 0) {
    return recentSignups.map((u) => ({
      id: u.id,
      name: u.name || "User",
      email: u.email,
      avatar: u.profileImage,
      actions: 0,
    }));
  }

  const users = await db.user.findMany({
    where: { id: { in: rankedIds } },
    select: { id: true, name: true, email: true, profileImage: true },
  });
  const userById = new Map(users.map((u) => [u.id, u]));

  return rankedIds
    .map((id) => {
      const user = userById.get(id);
      if (!user) return null;
      return {
        id: user.id,
        name: user.name || "User",
        email: user.email,
        avatar: user.profileImage,
        actions: actionTotals.get(id) ?? 0,
      };
    })
    .filter((u): u is NonNullable<typeof u> => u !== null);
}

async function sumOrderRevenue(where: Prisma.OrderWhereInput): Promise<{
  total: number;
  count: number;
}> {
  const agg = await db.order.aggregate({
    where,
    _sum: { totalPrice: true },
    _count: { id: true },
  });
  return {
    total: Number(agg._sum.totalPrice ?? 0),
    count: agg._count.id,
  };
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const { now, thirtyDaysAgo, sixtyDaysAgo } = thirtyDayWindows();

  const [
    userTotal,
    userCurrent,
    userPrev,
    postTotal,
    postCurrent,
    postPrev,
    shopTotal,
    shopCurrent,
    shopPrev,
    serviceTotal,
    serviceCurrent,
    servicePrev,
    pendingShops,
    pendingServices,
    pendingVerifications,
    flaggedPosts,
    orderTotal,
    orderCurrent,
    orderPrev,
    revenueCurrent,
    revenuePrev,
    recentActivity,
  ] = await Promise.all([
    db.user.count({ where: activeUserWhere }),
    db.user.count({ where: { ...activeUserWhere, createdAt: { gte: thirtyDaysAgo } } }),
    db.user.count({
      where: { ...activeUserWhere, createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
    }),
    db.post.count({ where: { deletedAt: null } }),
    db.post.count({ where: { deletedAt: null, createdAt: { gte: thirtyDaysAgo } } }),
    db.post.count({
      where: { deletedAt: null, createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
    }),
    db.shop.count(),
    db.shop.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    db.shop.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
    db.expertService.count(),
    db.expertService.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    db.expertService.count({
      where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
    }),
    db.shop.count({ where: pendingShopWhere }),
    db.expertService.count({ where: pendingServiceWhere }),
    db.user.count({ where: { verificationRequestStatus: "PENDING" } }),
    db.post.count({ where: flaggedPostWhere }),
    db.order.count(),
    db.order.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    db.order.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
    sumOrderRevenue({ createdAt: { gte: thirtyDaysAgo } }),
    sumOrderRevenue({ createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } }),
    db.activityLog.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      select: {
        description: true,
        createdAt: true,
        type: true,
        user: { select: { name: true, email: true } },
      },
    }),
  ]);

  const stats: DashboardStats = {
    users: {
      total: userTotal,
      growth: calculateGrowthPercent(userCurrent, userPrev),
    },
    posts: {
      total: postTotal,
      growth: calculateGrowthPercent(postCurrent, postPrev),
    },
    shops: {
      total: shopTotal,
      growth: calculateGrowthPercent(shopCurrent, shopPrev),
      pendingVerification: pendingShops,
    },
    services: {
      total: serviceTotal,
      growth: calculateGrowthPercent(serviceCurrent, servicePrev),
      pendingVerification: pendingServices,
    },
    flaggedPosts,
    orders: {
      total: orderTotal,
      growth: calculateGrowthPercent(orderCurrent, orderPrev),
      revenueTotal: revenueCurrent.total,
      revenueGrowth: calculateGrowthPercent(
        Math.round(revenueCurrent.total),
        Math.round(revenuePrev.total)
      ),
    },
    pendingVerifications,
  };

  return { stats, recentActivity };
}

export async function getAnalyticsOverview(
  rangeInput: string | null | undefined
): Promise<AnalyticsOverview> {
  const { key: range, days } = parseTimeRange(rangeInput);
  const now = new Date();
  const periodStart = subDays(now, days);
  const prevPeriodStart = subDays(now, days * 2);
  const todayStart = startOfDay(now);

  const [
    currUsers,
    prevUsers,
    currPosts,
    prevPosts,
    currShops,
    prevShops,
    currServices,
    prevServices,
    pendingUsers,
    pendingShops,
    pendingServices,
    pendingVerifications,
    flaggedPosts,
    usersRegisteredToday,
    ordersToday,
    dbLatencyMs,
    growth,
    activeUsers,
    revenuePeriod,
    totals,
  ] = await Promise.all([
    db.user.count({ where: { ...activeUserWhere, createdAt: { gte: periodStart } } }),
    db.user.count({
      where: { ...activeUserWhere, createdAt: { gte: prevPeriodStart, lt: periodStart } },
    }),
    db.post.count({ where: { deletedAt: null, createdAt: { gte: periodStart } } }),
    db.post.count({
      where: { deletedAt: null, createdAt: { gte: prevPeriodStart, lt: periodStart } },
    }),
    db.shop.count({ where: { createdAt: { gte: periodStart } } }),
    db.shop.count({ where: { createdAt: { gte: prevPeriodStart, lt: periodStart } } }),
    db.expertService.count({ where: { createdAt: { gte: periodStart } } }),
    db.expertService.count({
      where: { createdAt: { gte: prevPeriodStart, lt: periodStart } },
    }),
    db.user.count({ where: { registrationStatus: "PENDING" } }),
    db.shop.count({ where: pendingShopWhere }),
    db.expertService.count({ where: pendingServiceWhere }),
    db.user.count({ where: { verificationRequestStatus: "PENDING" } }),
    db.post.count({ where: flaggedPostWhere }),
    db.user.count({ where: { ...activeUserWhere, createdAt: { gte: todayStart } } }),
    db.order.count({ where: { createdAt: { gte: todayStart } } }),
    measureDbLatencyMs(),
    getDailyUserRegistrations(periodStart, now),
    getTopContributors(periodStart, 5),
    sumOrderRevenue({ createdAt: { gte: periodStart } }),
    Promise.all([
      db.user.count({ where: activeUserWhere }),
      db.post.count({ where: { deletedAt: null } }),
      db.shop.count(),
      db.expertService.count(),
      db.order.count(),
    ]),
  ]);

  return {
    range,
    growth,
    contentCreated: [
      { name: "Posts", value: currPosts },
      { name: "Shops", value: currShops },
      { name: "Services", value: currServices },
    ],
    pendingActions: {
      users: pendingUsers,
      shops: pendingShops,
      services: pendingServices,
      verifications: pendingVerifications,
      flaggedPosts,
    },
    realtime: {
      usersRegisteredToday,
      ordersToday,
      dbLatencyMs,
    },
    userGrowthPercent: calculateGrowthPercent(currUsers, prevUsers),
    revenue: {
      periodTotal: revenuePeriod.total,
      periodOrderCount: revenuePeriod.count,
      currency: "BDT",
    },
    activeUsers,
    totals: {
      users: totals[0],
      posts: totals[1],
      shops: totals[2],
      services: totals[3],
      orders: totals[4],
    },
  };
}
