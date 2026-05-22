
"use client";

import { Suspense } from "react";
import AuthPageShell from "@/components/auth/auth-page-shell";

export default function Home() {
  return (
    <Suspense>
      <AuthPageShell defaultTab="login" />
    </Suspense>
  );
}
