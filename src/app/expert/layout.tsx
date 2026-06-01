"use client";
import ProtectedRoute from "@/components/layouts/protected-route";
import type { ReactNode } from "react";

export default function ExpertLayout({ children }: { children: ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
