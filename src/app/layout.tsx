import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/hooks/use-auth';
import { ThemeProvider } from '@/hooks/use-theme';
import { BusinessProvider } from '@/hooks/use-business';
import { MessagesProvider } from '@/hooks/use-messages';
import { ServicesProvider } from '@/hooks/use-services';
import { CommunityProvider } from '@/hooks/use-community';
import { Toaster } from '@/components/ui/toaster';
import { SessionProvider } from 'next-auth/react';
import { Inter } from 'next/font/google';
import "@uploadthing/react/styles.css";
import SplashProvider from '@/components/splash/splash-provider';
import { GlobalErrorBoundary } from '@/components/error-boundary';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'The Chattala | Premium Digital Excellence',
  description: 'Experience a sophisticated web platform built for high-end professional needs.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-body antialiased min-h-screen bg-background overflow-x-hidden`}>
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
                        <Toaster />
                      </SplashProvider>
                    </CommunityProvider>
                  </MessagesProvider>
                </ServicesProvider>
              </BusinessProvider>
            </ThemeProvider>
          </AuthProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
