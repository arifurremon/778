import { GlobalErrorBoundary } from '@/components/error-boundary';
import SplashProvider from '@/components/splash/splash-provider';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/hooks/use-auth';
import { BusinessProvider } from '@/hooks/use-business';
import { CommunityProvider } from '@/hooks/use-community';
import { MessagesProvider } from '@/hooks/use-messages';
import { ServicesProvider } from '@/hooks/use-services';
import { ThemeProvider } from '@/hooks/use-theme';
import "@uploadthing/react/styles.css";
import type { Metadata } from 'next';
import { SessionProvider } from 'next-auth/react';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'The Chattala | Premium Digital Excellence',
  description: 'Experience a sophisticated web platform built for high-end professional needs.',
  icons: {
    icon: 'https://res.cloudinary.com/det1qnlrh/image/upload/v1779150538/LOGOICON_chfprq.png',
  },
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
