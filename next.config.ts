import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // When this repo lives inside a monorepo, keep Turbopack/Next rooted here so builds
  // do not pick the parent `package-lock.json` as workspace root.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
