import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    cpus: 1,
    workerThreads: false,
  },
  allowedDevOrigins: ["127.0.0.1", "localhost", ".ngrok-free.app", ".ngrok-free.dev", ".trycloudflare.com"],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.LARAVEL_BACKEND_URL || "http://localhost:8000"}/api/:path*`,
      },
      {
        source: "/storage/:path*",
        destination: `${process.env.LARAVEL_BACKEND_URL || "http://localhost:8000"}/storage/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "jorsastech.com",
      },
      {
        protocol: "https",
        hostname: "api.jorsastech.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/portfolio",
        destination: "/projects",
        permanent: true,
      },
      {
        source: "/portfolio/:slug",
        destination: "/projects/:slug",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;