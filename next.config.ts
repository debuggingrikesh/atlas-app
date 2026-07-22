import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from "next";
import packageJson from "./package.json";

const nextConfig: NextConfig = {
  transpilePackages: ['@atlas/core'],
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
