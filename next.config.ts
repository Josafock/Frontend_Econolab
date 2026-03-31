import type { NextConfig } from "next";

const desktopExport = process.env.ECONOLAB_DESKTOP_EXPORT === "true";

const nextConfig: NextConfig = {
  ...(desktopExport
    ? {
        output: "export",
        images: {
          unoptimized: true,
        },
      }
    : {}),
};

export default nextConfig;
