import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ error?: string; next?: string }>;
};

/**
 * The sign-in flow now uses an inline modal (SignInModal).
 * This page exists only as a fallback for direct links / bookmarks —
 * it redirects to the homepage and preserves auth error / next hints in the query string.
 */
export default async function LoginPage({ searchParams }: Props) {
  const { error, next } = await searchParams;
  const qs = new URLSearchParams();
  if (error) qs.set("sign_in_error", error);
  if (next?.startsWith("/") && !next.startsWith("//")) qs.set("next", next);
  const suffix = qs.toString();
  redirect(suffix ? `/?${suffix}` : "/");
}
