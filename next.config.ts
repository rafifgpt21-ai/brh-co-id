import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
      },
    ],
  },
  // @ts-ignore - allowedDevOrigins is required for cross-origin dev server access
  allowedDevOrigins: ["10.146.131.12"],
};

export default nextConfig;
