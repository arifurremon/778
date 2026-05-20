
"use client";

import AuthContainer from "@/components/auth/auth-container";
import CityBackground from "@/components/ui/city-background";
import { GlobalLoader } from "@/components/ui/global-loader";
import { useAuth } from "@/hooks/use-auth";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (isLoading) {
    return <GlobalLoader />;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="auth"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden"
        style={{ background: '#137ece' }}
      >
        {/* City background overlay with blue base */}
        <CityBackground />
        
        {/* Professional overlay gradient for text readability */}
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-blue-600/5 via-transparent to-blue-700/5 pointer-events-none"></div>
        
        {/* Subtle light rays effect */}
        <div className="absolute inset-0 z-5 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        </div>
        
        <AuthContainer />
      </motion.div>
    </AnimatePresence>
  );
}
