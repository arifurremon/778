"use client";
import ProtectedRoute from "@/components/layouts/protected-route";
import type { ReactNode } from "react";

export default function SearchLayout({ children }: { children: ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
