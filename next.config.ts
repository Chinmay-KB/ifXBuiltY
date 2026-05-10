import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Next.js 16+: local src with query strings must be explicitly allowed
    // (@see https://nextjs.org/docs/messages/next-image-unconfigured-localpatterns)
    localPatterns: [
      {
        pathname: "/api/generations/**",
        search: "?variant=card",
      },
      {
        pathname: "/api/generations/**",
        search: "?variant=detail",
      },
      {
        pathname: "/api/generations/**",
        search: "?variant=full",
      },
    ],
  },
};

export default nextConfig;
