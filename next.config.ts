import type { NextConfig } from "next";

const modelApiBase = process.env.HEXOCHEM_API_URL
  || (process.env.NODE_ENV === "development" ? "http://127.0.0.1:7860" : "");
const modelApi = modelApiBase.replace(/\/+$/, "");

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  images: { unoptimized: true },
  async rewrites() {
    return modelApi
      ? [{ source: "/api/:path*", destination: `${modelApi}/api/:path*` }]
      : [];
  },
};

export default nextConfig;
