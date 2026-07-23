import type { NextConfig } from "next";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const hostWithPort = appUrl.replace(/^https?:\/\//, ""); // Ambil domain/IP + port
const hostOnly = hostWithPort.split(":")[0]; // Ambil domain/IP-nya saja tanpa port

type BrhNextConfig = NextConfig & {
  allowedDevOrigins?: string[];
};

const nextConfig: BrhNextConfig = {
  cacheComponents: true,
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "brh.co.id" }],
        destination: "https://www.brh.co.id/:path*",
        permanent: true,
      },
      {
        source: "/biografi.php",
        destination: "/biografi",
        permanent: true,
      },
      {
        source: "/diskusi.php",
        destination: "/catatan",
        permanent: true,
      },
      {
        source: "/login.php",
        destination: "/admin/login",
        permanent: true,
      },
    ];
  },
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
      },
      {
        protocol: "https",
        hostname: "**.ufs.sh",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  // Solusi Elegan untuk Server Actions Origin & Cross-Origin Dev Access
  experimental: {
    instantNavigationDevToolsToggle: true,
    serverActions: {
      allowedOrigins: [hostWithPort, "localhost:3000"],
    },
  },
  allowedDevOrigins: process.env.NODE_ENV === "development" ? [hostOnly] : [],
};

export default nextConfig;
