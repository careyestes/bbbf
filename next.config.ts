import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Local SVGs and farm JPEGs in /public
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
