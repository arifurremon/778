"use client";

import DashboardLayout from "@/components/dashboard/dashboard-view";
import { GlobalLoader } from "@/components/ui/global-loader";
import { useAuth } from "@/hooks/use-auth";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * Single source of truth for authenticated route guard.
 * Replaces duplicated auth logic in dashboard/layout.tsx and community/layout.tsx.
 * Used as the shared layout for all protected app routes.
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated" || (status === "authenticated" && !isLoading && !user)) {
      router.replace("/");
    }
  }, [status, isLoading, user, router]);
  }, [status, isLoading, user, router]);

  if (status === "loading" || isLoading || (status === "authenticated" && !user && isLoading)) {
    return <GlobalLoader />;
  }

  if (status === "unauthenticated" || (status === "authenticated" && !user)) {
    return null;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
