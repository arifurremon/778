import { Suspense } from "react";
import {
  AnalyticsOverviewSkeleton,
  AnalyticsOverviewView,
} from "@/app/admin/analytics/_components/analytics-overview-view";
import { getAnalyticsOverview, parseTimeRange } from "@/lib/admin/dashboard-metrics";
import { requireAdminPage } from "@/lib/admin/require-admin-page";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ range?: string }>;
};

async function AnalyticsOverviewContent({ range }: { range?: string }) {
  await requireAdminPage();
  const data = await getAnalyticsOverview(range);
  const { key } = parseTimeRange(range);
  return <AnalyticsOverviewView data={data} currentRange={key} />;
}

export default async function AnalyticsOverviewPage({ searchParams }: PageProps) {
  const { range } = await searchParams;

  return (
    <Suspense fallback={<AnalyticsOverviewSkeleton />} key={range ?? "30d"}>
      <AnalyticsOverviewContent range={range} />
    </Suspense>
  );
}
