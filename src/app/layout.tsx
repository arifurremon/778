/**
 * Root Layout — Next.js 15 Server Component.
 * All client-side context is isolated inside <Providers>.
 * NextSSRPlugin runs server-side only (uploadthing SSR optimization).
 */

import { Providers } from "@/components/providers";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "@/app/api/uploadthing/core";
import "@uploadthing/react/styles.css";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

/** Required so middleware CSP nonces are injected into HTML (not static shell). */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The Chattala | Your Neighbourhood, Connected",
  description:
    "The hyperlocal community platform for Chittagong — discover local shops, services, neighbours, and emergency contacts.",
  icons: {
    icon: "/logo-icon.png?v=3",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Ensures per-request CSP nonce propagation in production (Next.js 15).
  await headers();

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-body antialiased min-h-screen bg-background overflow-x-hidden`}
      >
        {/* Server-side uploadthing SSR plugin — must stay outside the client boundary */}
        <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
