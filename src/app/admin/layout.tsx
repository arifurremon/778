"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AdminDashboardLayout from "@/components/admin/admin-layout";
import { AdminErrorBoundary } from "@/components/admin/error-boundary";
import { GlobalLoader } from "@/components/ui/global-loader";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    } else if (status === "authenticated" && !session?.user?.isAdmin) {
      router.push("/dashboard?error=unauthorized");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return <GlobalLoader />;
  }

  if (status === "unauthenticated" || !session?.user?.isAdmin) {
    return null;
  }

  return (
    <AdminErrorBoundary>
      <AdminDashboardLayout>{children}</AdminDashboardLayout>
    </AdminErrorBoundary>
  );
}
