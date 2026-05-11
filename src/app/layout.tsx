import type { Metadata } from "next";
import { Fraunces, Outfit, Space_Mono } from "next/font/google";

import { NavigationGeneratingProvider } from "@/components/navigation-generating-context";
import { NavigationShellWrapper } from "@/components/navigation-shell-wrapper";
import { SignInModalProvider } from "@/components/sign-in-modal-provider";
import { isSuperadmin } from "@/lib/admin-constants";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";

import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "ifXBuiltY — Parody screenshot generator",
    template: "%s · ifXBuiltY",
  },
  description:
    "What if X built Y? Combine any brand with any product and get an AI-generated parody UI screenshot. Browse the feed, vote, remix, and share.",
  applicationName: "ifXBuiltY",
  keywords: [
    "parody screenshot",
    "AI UI generator",
    "brand mashup",
    "satirical UI",
    "fake app screenshot",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "ifXBuiltY",
    title: "ifXBuiltY — Parody screenshot generator",
    description:
      "What if X built Y? AI-generated parody UI screenshots. Vote, remix, and share.",
    images: [
      {
        url: "/icon.png",
        width: 512,
        height: 512,
        alt: "ifXBuiltY",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ifXBuiltY — Parody screenshot generator",
    description:
      "What if X built Y? AI-generated parody UI screenshots. Vote, remix, and share.",
    images: ["/icon.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Map Supabase user to the shape NavigationShell expects
  const navUser = user
    ? {
        id: user.id,
        email: user.email ?? undefined,
        avatar_url: user.user_metadata?.avatar_url ?? undefined,
        display_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? undefined,
      }
    : null;

  const siteUrl = getSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "ifXBuiltY",
    url: siteUrl,
    description:
      "What if X built Y? AI-generated parody UI screenshots. Combine brands and products for satirical fake-app imagery.",
  };

  return (
    <html
      lang="en"
      className={`${outfit.variable} ${fraunces.variable} ${spaceMono.variable} min-h-dvh antialiased`}
    >
      <body className="flex min-h-dvh flex-col bg-canvas font-sans text-ink">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <SignInModalProvider>
          <NavigationGeneratingProvider>
            <NavigationShellWrapper user={navUser} isSuperadmin={isSuperadmin(user?.email)} />
            {/* flex 1 1 auto: fill leftover space on short pages, but min height follows content on tall pages */}
            <main className="flex min-h-0 w-full flex-1 flex-col pt-20 pb-14 md:pb-0">
              {children}
            </main>
          </NavigationGeneratingProvider>
        </SignInModalProvider>
      </body>
    </html>
  );
}
