import type { NextConfig } from "next";
const nextConfig: NextConfig = { output: "standalone", transpilePackages: ["@exam/shared-types"] };
export default nextConfig;
