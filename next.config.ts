import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Private capability URLs must not be printed by development request logs.
  logging: { incomingRequests: false, browserToTerminal: false },
  async headers() {
    return ["/patient/track/:path*", "/api/requests/:path*", "/dentist/:path*", "/api/dentist/:path*"].map((source) => ({
      source,
      headers: [
        { key: "Cache-Control", value: "private, no-store, max-age=0" },
        { key: "Referrer-Policy", value: "no-referrer" },
        { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        { key: "X-Content-Type-Options", value: "nosniff" },
      ],
    }));
  },
};

export default nextConfig;
