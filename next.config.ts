import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

// FIX(P1): Placeholder/stock image domains (placehold.co, picsum.photos,
// images.unsplash.com) are development-only. Allowing them in production
// opens an image injection vector and exposes that the app uses placeholder
// assets. They are now conditionally included only when NODE_ENV !== 'production'.
const devOnlyImageDomains =
  process.env.NODE_ENV !== 'production'
    ? [
        {
          protocol: 'https' as const,
          hostname: 'placehold.co',
          port: '',
          pathname: '/**',
        },
        {
          protocol: 'https' as const,
          hostname: 'images.unsplash.com',
          port: '',
          pathname: '/**',
        },
        {
          protocol: 'https' as const,
          hostname: 'picsum.photos',
          port: '',
          pathname: '/**',
        },
      ]
    : [];

const nextConfig: NextConfig = {
  serverExternalPackages: ["ws", "@neondatabase/serverless"],
  images: {
    remotePatterns: [
      // --- Production-safe domains ---
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google OAuth profile photos
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'utfs.io', // UploadThing CDN
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com', // Cloudinary (legacy or media uploads)
        port: '',
        pathname: '/**',
      },
      // --- Development-only domains (excluded in production) ---
      ...devOnlyImageDomains,
    ],
  },
  webpack: (config, { isServer, nextRuntime }) => {
    // Fix: jose ships a 'webapi' build that uses CompressionStream/DecompressionStream
    // (Node.js-only APIs) — this crashes the Edge Runtime used by next-auth middleware.
    // Alias the webapi entrypoint to jose's Node.js-compatible build for Edge bundles.
    // See: https://github.com/panva/jose/issues/634
    if (nextRuntime === 'edge') {
      config.resolve.alias = {
        ...config.resolve.alias,
        'jose/dist/webapi': require.resolve('jose').replace('/dist/node/index.js', '/dist/node'),
      };
    }

    // Suppress known Sentry + OpenTelemetry critical dependency warnings
    config.ignoreWarnings = [
      { module: /require-in-the-middle/ },
      { module: /@opentelemetry\/instrumentation/ },
      { module: /@prisma\/instrumentation/ },
      { module: /@fastify\/otel/ },
      { message: /Critical dependency: the request of a dependency is an expression/ },
      { message: /Critical dependency: require function is used in a way/ },
    ];
    return config;
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              process.env.NODE_ENV === 'development'
                ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.pusher.com https://js.sentry-cdn.com"
                : "script-src 'self' https://js.pusher.com https://js.sentry-cdn.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self'",
              "connect-src 'self' https://*.pusher.com wss://*.pusher.com https://*.upstash.io https://*.sentry.io https://uploadthing.com https://utfs.io",
              "frame-ancestors 'none'",
            ].join('; '),
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: "inievo-technologies",
  project: "javascript-nextjs",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  telemetry: false,
  webpack: {
    automaticVercelMonitors: true,
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
