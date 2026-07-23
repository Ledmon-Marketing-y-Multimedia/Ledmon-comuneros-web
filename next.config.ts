import type { NextConfig } from "next";

const apiProxyTarget =
  process.env.API_PROXY_TARGET ?? "http://localhost:8080/comuneros/api/v1";

const nextConfig: NextConfig = {
  async rewrites() {
    // Equivalente al proxy.conf.json de Angular: /api/* -> backend.
    // Aplica cuando NEXT_PUBLIC_API_URL es la ruta relativa "/api".
    return [
      {
        source: "/api/:path*",
        destination: `${apiProxyTarget}/:path*`,
      },
    ];
  },
};

export default nextConfig;
