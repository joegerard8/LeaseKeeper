import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export ("output: export") is incompatible with the Server
  // Actions and dynamic routes the MVP app uses. The vinext/Cloudflare
  // Sites build path this scaffold shipped with is unused for the class
  // MVP (see plan doc); this config now targets plain "next dev"/"next build".
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
