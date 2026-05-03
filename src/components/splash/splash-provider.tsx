"use client";

import { useState, useEffect } from "react";
import SplashScreen from "@/components/splash/splash-screen";

const SESSION_KEY = "chattala_splash_shown";

export default function SplashProvider({ children }: { children: React.ReactNode }) {
  // Start as false to avoid SSR mismatch; we'll set it from sessionStorage on mount
  const [showSplash, setShowSplash] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const alreadyShown = sessionStorage.getItem(SESSION_KEY);
    if (!alreadyShown) {
      setShowSplash(true);
      sessionStorage.setItem(SESSION_KEY, "true");

      // Hide splash after 2500ms + 900ms exit animation buffer
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, []);

  // Don't render anything until mounted (avoids hydration mismatch)
  if (!mounted) return <>{children}</>;

  return (
    <>
      <SplashScreen isVisible={showSplash} />
      {children}
    </>
  );
}
