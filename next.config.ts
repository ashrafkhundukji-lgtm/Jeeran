import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // forbidden() → 403 page for signed-in non-admins on /admin pages
    // (src/lib/adminAuth.ts).
    authInterrupts: true,
  },
};

export default nextConfig;
