import type { NextConfig } from "next";

// Assessment 1 is frontend-only. Next.js exports all five routes as static pages.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
};

export default nextConfig;
