"use client";

import DashboardLayout from "@/components/dashboard/dashboard-view";
import { GlobalLoader } from "@/components/ui/global-loader";
import { useAuth } from "@/hooks/use-auth";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated" || (status === "authenticated" && !isLoading && !user)) {
      router.push("/");
    }
  }, [status, isLoading, user, router]);

  if (status === "loading" || isLoading || (status === "authenticated" && !user && isLoading)) {
    return <GlobalLoader />;
  }

  if (status === "unauthenticated" || (status === "authenticated" && !user)) {
    return null;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
