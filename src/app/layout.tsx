import type { Metadata } from "next";
import { Archivo_Black, Inter } from "next/font/google";

import { NavigationShellWrapper } from "@/components/navigation-shell-wrapper";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const archivoBlack = Archivo_Black({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ifXBuiltY",
  description: "What if X built Y? Parody screenshot generator.",
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

  return (
    <html
      lang="en"
      className={`${inter.variable} ${archivoBlack.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col overflow-x-hidden bg-canvas font-sans text-ink">
        <NavigationShellWrapper user={navUser} />
        <main className="flex flex-1 flex-col pt-16 pb-14 md:pb-0">
          {children}
        </main>
      </body>
    </html>
  );
}
