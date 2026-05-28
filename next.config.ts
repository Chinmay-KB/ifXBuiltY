import { withWorkflow } from "workflow/next";
import type { NextConfig } from "next";

function supabaseImageHostname(): string | null {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) return null;
  try {
    return new URL(raw).hostname;
  } catch {
    return null;
  }
}

const supabaseHostname = supabaseImageHostname();

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        pathname: "/api/generations/**",
      },
    ],
    // Generated images are served from the public Supabase Storage CDN.
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: "https",
            hostname: supabaseHostname,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
  async redirects() {
    return [
      {
        source: "/favicon.ico",
        destination: "/icon.png",
        permanent: false,
      },
    ];
  },
};

export default withWorkflow(nextConfig);
