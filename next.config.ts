import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // forbidden() → 403 page for signed-in non-admins on /admin pages
    // (src/lib/adminAuth.ts).
    authInterrupts: true,
  },
  async headers() {
    return [
      {
        // Owner app service worker: may control /dashboard/ although it is
        // served from the root, and is always re-checked for updates.
        source: "/owner-sw.js",
        headers: [
          { key: "Service-Worker-Allowed", value: "/dashboard/" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        ],
      },
    ];
  },
};

export default nextConfig;
