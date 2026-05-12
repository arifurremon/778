import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  serverExternalPackages: ["ws", "@neondatabase/serverless"],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'utfs.io',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
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
