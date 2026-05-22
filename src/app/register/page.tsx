import type { Metadata } from "next";
import { Suspense } from "react";
import AuthPageShell from "@/components/auth/auth-page-shell";

export const metadata: Metadata = {
  title: "Create Account | The Chattala",
  description: "Join The Chattala and connect with your Chittagong neighbourhood community.",
};

export default function RegisterPage() {
  return (
    <Suspense>
      <AuthPageShell defaultTab="register" />
    </Suspense>
  );
}
