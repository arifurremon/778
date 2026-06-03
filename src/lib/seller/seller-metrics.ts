import { calculateGrowthPercent } from "@/lib/admin/dashboard-metrics";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type SellerOrderMetricInput = {
  price: number;
  status: string;
  createdAt: string;
};

export function calculateDeliveredRevenueTrend(
  orders: SellerOrderMetricInput[],
  now = new Date()
): number {
  const thirtyDaysAgo = new Date(now.getTime() - 30 * MS_PER_DAY);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * MS_PER_DAY);

  let currentPeriod = 0;
  let previousPeriod = 0;

  for (const order of orders) {
    if (order.status !== "Delivered" && order.status !== "DELIVERED") continue;

    const createdAt = new Date(order.createdAt);
    if (Number.isNaN(createdAt.getTime())) continue;

    if (createdAt >= thirtyDaysAgo) {
      currentPeriod += order.price;
    } else if (createdAt >= sixtyDaysAgo && createdAt < thirtyDaysAgo) {
      previousPeriod += order.price;
    }
  }

  return calculateGrowthPercent(Math.round(currentPeriod), Math.round(previousPeriod));
}

export function formatTrendPercent(value: number): string {
  if (value > 0) return `+${value}%`;
  return `${value}%`;
}
