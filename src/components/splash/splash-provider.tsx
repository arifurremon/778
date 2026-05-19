"use client";

import { useState, useEffect } from "react";
import SplashScreen from "@/components/splash/splash-screen";

export default function SplashProvider({ children }: { children: React.ReactNode }) {
  // Start as false to avoid SSR mismatch
  const [showSplash, setShowSplash] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setShowSplash(true);

    // Hide splash after 2300ms (2.3 seconds)
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2300);

    return () => clearTimeout(timer);
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
