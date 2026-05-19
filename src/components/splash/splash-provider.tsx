"use client";

import { useState, useEffect } from "react";
import SplashScreen from "@/components/splash/splash-screen";

export default function SplashProvider({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Hide splash after 2300ms (2.3 seconds)
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2300);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <SplashScreen isVisible={showSplash} />
      {/* 
        When splash is showing, we can wrap children to prevent scroll, 
        or just rely on the splash screen's fixed overlay to block interaction.
      */}
      <div className={showSplash ? "h-screen overflow-hidden" : ""}>
        {children}
      </div>
    </>
  );
}
