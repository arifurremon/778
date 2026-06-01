import { Suspense } from "react";
import {
  AdminDashboardSkeleton,
  AdminDashboardView,
} from "@/app/admin/_components/admin-dashboard-view";
import { getDashboardOverview } from "@/lib/admin/dashboard-metrics";
import { requireAdminPage } from "@/lib/admin/require-admin-page";

export const dynamic = "force-dynamic";

async function AdminDashboardContent() {
  await requireAdminPage();
  const data = await getDashboardOverview();
  return <AdminDashboardView data={data} />;
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<AdminDashboardSkeleton />}>
      <AdminDashboardContent />
    </Suspense>
  );
}
