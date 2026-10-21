import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Dezen landing page lives in its own repo (dezen-homepage)
  async redirects() {
    return [
      { source: "/", destination: "/express/customer", permanent: false },
    ];
  },
};

export default nextConfig;
