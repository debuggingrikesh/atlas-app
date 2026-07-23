/* eslint-disable @typescript-eslint/no-explicit-any */

import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from "next";
import packageJson from "./package.json";

const nextConfig: NextConfig = {
  transpilePackages: ['@atlas/core'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
          }
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: "atlas-workspace",
  project: "atlas-app",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  sourcemaps: { disable: false, deleteSourcemapsAfterUpload: true },
  release: {
    name: process.env.NEXT_PUBLIC_RELEASE_VERSION || `atlas-app@${packageJson.version}-${process.env.VERCEL_GIT_COMMIT_SHA || 'unknown'}`,
    setCommits: {
      auto: true,
    }
  }
});
