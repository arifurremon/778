import type { Metadata } from "next";
import { Suspense } from "react";
import AuthPageShell from "@/components/auth/auth-page-shell";

export const metadata: Metadata = {
  title: "Sign In | The Chattala",
  description: "Sign in to your Chattala account to access your neighbourhood community.",
};

export default function LoginPage() {
  return (
    <Suspense>
      <AuthPageShell defaultTab="login" />
    </Suspense>
  );
}
