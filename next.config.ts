import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: { unoptimized: true },
  // Ensure the runtime JSON catalog is packaged with server-rendered routes on Vercel.
  outputFileTracingIncludes: { "/*": ["./data/games.json"] },
};
export default nextConfig;
