"use client";

import AuthContainer from "@/components/auth/auth-container";
import { SiteFooter } from "@/components/legal/site-footer";
import CityBackground from "@/components/ui/city-background";
import { GlobalLoader } from "@/components/ui/global-loader";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { authStyles } from "@/lib/design/auth-styles";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

interface AuthPageShellProps {
  defaultTab: "login" | "register";
}

function VerificationHandler() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    if (searchParams.get("verified") === "true") {
      toast({
        title: "Email Verified",
        description: "Your email has been successfully verified. You can now sign in.",
      });
    } else if (searchParams.get("error")) {
      toast({
        title: "Verification Error",
        description: "The verification link is invalid, expired, or failed.",
        variant: "destructive",
      });
    }
  }, [searchParams, toast]);

  return null;
}

export default function AuthPageShell({ defaultTab }: AuthPageShellProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) router.push("/dashboard");
  }, [user, router]);

  if (isLoading) return <GlobalLoader />;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="auth"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={authStyles.pageShell}
      >
        <div className={authStyles.pageInner}>
          <CityBackground />
          <div className="absolute inset-0 z-10 bg-gradient-to-br from-auth-brand/8 via-auth-bg/20 to-auth-brand-deep/10 pointer-events-none" />
          <div className="absolute inset-0 z-[5] pointer-events-none overflow-hidden">
            <div className="absolute -top-32 -right-32 h-72 w-72 rounded-full bg-white/8 blur-3xl" />
            <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-auth-brand/10 blur-3xl" />
          </div>
          <AuthContainer defaultTab={defaultTab} />
          <VerificationHandler />
        </div>
        <SiteFooter />
      </motion.div>
    </AnimatePresence>
  );
}
