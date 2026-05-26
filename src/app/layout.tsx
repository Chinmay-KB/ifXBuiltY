import type { Metadata } from "next";
import { Fraunces, Outfit, Space_Mono } from "next/font/google";
import Link from "next/link";

import { DeferredAnalytics } from "@/components/deferred-analytics";
import { NavigationGeneratingProvider } from "@/components/navigation-generating-context";
import { NavigationShellWrapper } from "@/components/navigation-shell-wrapper";
import { SignInModalProvider } from "@/components/sign-in-modal-provider";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
            <NavigationShellWrapper user={null} isSuperadmin={false} />
            {/* flex 1 1 auto: fill leftover space on short pages, but min height follows content on tall pages */}
            <main className="flex min-h-0 w-full flex-1 flex-col pb-14 md:pt-20 md:pb-0">
              {children}
            </main>
          </NavigationGeneratingProvider>
        </SignInModalProvider>
        <footer className="border-t border-ink/10 px-4 py-5 text-center text-sm text-ink/70">
          <p>
            Made with questionable sleep decisions by{" "}
            <Link
              href="https://chinmaykabi.com"
              target="_blank"
              rel="noreferrer"
              className="inline-block font-medium text-ink transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
            >
              Chinmay Kabi
            </Link>
            .
          </p>
        </footer>
        <DeferredAnalytics />
      </body>
    </html>
  );
}
