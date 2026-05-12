"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AdminDashboardLayout from "@/components/admin/admin-layout";
import { AdminErrorBoundary } from "@/components/admin/error-boundary";

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
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Verifying Access…</p>
        </div>
      </div>
    );
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
