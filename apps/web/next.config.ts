import type { NextConfig } from "next";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

// The dashboard is a workspace package, while operator secrets live at the
// repository root. Next only discovers env files beside the app by default.
const rootEnvironmentPath = fileURLToPath(new URL("../../.env.local", import.meta.url));
if (existsSync(rootEnvironmentPath)) process.loadEnvFile(rootEnvironmentPath);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@aurendor/db",
    "@aurendor/engine",
    "@aurendor/observability",
    "@aurendor/schemas",
  ],
  serverExternalPackages: ["@electric-sql/pglite"],
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
