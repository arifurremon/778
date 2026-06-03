"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AdminDashboardLayout from "@/components/admin/admin-layout";
import { AdminErrorBoundary } from "@/components/admin/error-boundary";
import { GlobalLoader } from "@/components/ui/global-loader";
import { isAdminRole } from "@/lib/rbac";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const hasAdminAccess = isAdminRole(session?.user?.role);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    } else if (status === "authenticated" && !hasAdminAccess) {
      router.push("/dashboard?error=unauthorized");
    }
  }, [status, hasAdminAccess, router]);

  if (status === "loading") {
    return <GlobalLoader />;
  }

  if (status === "unauthenticated" || !hasAdminAccess) {
    return null;
  }

  return (
    <AdminErrorBoundary>
      <AdminDashboardLayout>{children}</AdminDashboardLayout>
    </AdminErrorBoundary>
  );
}
