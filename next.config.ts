import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Project root is this directory; a parent lockfile elsewhere was triggering
  // a workspace-root inference warning.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
