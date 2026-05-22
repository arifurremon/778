"use client";

/**
 * Global Provider Tree for The Chattala.
 * This is the single "use client" boundary that wraps all context providers.
 * Keep layout.tsx clean as a pure Next.js 15 Server Component.
 *
 * Provider order (outermost → innermost):
 *   SessionProvider  → next-auth session
 *   AuthProvider     → app-level user state (depends on session)
 *   ThemeProvider    → dark/light mode persistence
 *   BusinessProvider → seller/business context
 *   ServicesProvider → expert services context
 *   MessagesProvider → messaging context
 *   CommunityProvider→ feed/posts context
 *   SplashProvider   → initial splash/onboarding screen
 *   GlobalErrorBoundary → catches unhandled client errors
 *   Toaster          → global toast notifications (leaf node)
 */

import { GlobalErrorBoundary } from "@/components/error-boundary";
import SplashProvider from "@/components/splash/splash-provider";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { BusinessProvider } from "@/hooks/use-business";
import { CommunityProvider } from "@/hooks/use-community";
import { MessagesProvider } from "@/hooks/use-messages";
import { ServicesProvider } from "@/hooks/use-services";
import { ThemeProvider } from "@/hooks/use-theme";
import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <AuthProvider>
        <ThemeProvider>
          <BusinessProvider>
            <ServicesProvider>
              <MessagesProvider>
                <CommunityProvider>
                  <SplashProvider>
                    <GlobalErrorBoundary>
                      {children}
                    </GlobalErrorBoundary>
                    {/* Toaster is intentionally outside children so toasts
                        render above all page content without layout shifts. */}
                    <Toaster />
                  </SplashProvider>
                </CommunityProvider>
              </MessagesProvider>
            </ServicesProvider>
          </BusinessProvider>
        </ThemeProvider>
      </AuthProvider>
    </SessionProvider>
  );
}
