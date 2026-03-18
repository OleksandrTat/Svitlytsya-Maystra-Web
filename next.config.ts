import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/constructor/:type",
        destination: "/configurator/:type",
      },
      {
        source: "/constructor",
        destination: "/configurator",
      },
    ];
  },
};

export default nextConfig;
