import type { NextConfig } from "next";

// Multi-Zones: this is the default zone (serves "/"). The editor lives in
// apps/web under basePath "/app" and is stitched in here via rewrites, so the
// whole product is one origin: marketing at "/", editor at "/app".
//
// APP_ZONE_URL is the editor zone's own deployment URL (e.g. its Vercel URL or
// a custom domain). Locally, run the editor with `bun run dev:web` and it will
// be proxied from here. Set APP_ZONE_URL in the marketing site's environment
// for preview/production deploys.
const APP_ZONE_URL = process.env.APP_ZONE_URL ?? "http://localhost:3000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/app", destination: `${APP_ZONE_URL}/app` },
      { source: "/app/:path*", destination: `${APP_ZONE_URL}/app/:path*` },
    ];
  },
};

export default nextConfig;
