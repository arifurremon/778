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
    // Only redirect when we are CERTAIN the user is unauthenticated.
    // Never redirect during loading — this was causing authenticated users
    // to be sent back to "/" if the profile API was slow or failed.
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Show spinner while session is loading OR profile is being fetched
  if (status === "loading" || isLoading || (status === "authenticated" && !user)) {
    return <GlobalLoader />;
  }

  // Render nothing while redirect to "/" is in-flight
  if (status === "unauthenticated") {
    return null;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
