import type { Metadata } from "next";
import { Fraunces, Outfit, Space_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { cookies } from "next/headers";

import { NavigationGeneratingProvider } from "@/components/navigation-generating-context";
import { NavigationShellWrapper } from "@/components/navigation-shell-wrapper";
import { SignInModalProvider } from "@/components/sign-in-modal-provider";
import { isSuperadmin } from "@/lib/admin-constants";
import { hasSupabaseAuthCookie } from "@/lib/supabase/auth-cookie";
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
    default: "ifXBuiltY - Cursed AI Screenshots for Bad Product Ideas",
    template: "%s · ifXBuiltY",
  },
  description:
    "Mix any brand with any product, then watch ifXBuiltY generate cursed AI UI screenshots. Browse the chaos, vote on bad ideas, and share the best accidents.",
  applicationName: "ifXBuiltY",
  keywords: [
    "AI satire generator",
    "satirical screenshot",
    "AI UI generator",
    "brand mashup",
    "cursed UI",
    "satirical UI",
    "fake app screenshot",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "ifXBuiltY",
    title: "ifXBuiltY - Cursed AI Screenshots for Bad Product Ideas",
    description:
      "Mix any brand with any product, then watch ifXBuiltY generate cursed AI UI screenshots. Browse the chaos, vote on bad ideas, and share the best accidents.",
    images: [
      {
        url: "/card-smol.png",
        width: 1200,
        height: 630,
        alt: "ifXBuiltY preview card",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ifXBuiltY - Cursed AI Screenshots for Bad Product Ideas",
    description:
      "Mix any brand with any product, then watch ifXBuiltY generate cursed AI UI screenshots. Browse the chaos, vote on bad ideas, and share the best accidents.",
    images: ["/card-smol.png"],
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
  const cookieStore = await cookies();
  const hasAuthCookie = hasSupabaseAuthCookie(cookieStore.getAll());
  const user = hasAuthCookie
    ? (await (await createSupabaseServerClient()).auth.getUser()).data.user
    : null;

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
      "A cursed product lab for AI UI screenshots, brand mashups, satirical fake-app imagery, and ideas nobody should put on a roadmap.",
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
            <main className="flex min-h-0 w-full flex-1 flex-col pb-14 md:pt-20 md:pb-0">
              {children}
            </main>
          </NavigationGeneratingProvider>
        </SignInModalProvider>
        <Analytics />
      </body>
    </html>
  );
}
