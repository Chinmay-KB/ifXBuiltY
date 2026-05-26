"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { useNavigationGenerating } from "@/components/navigation-generating-context";
import { NavigationShell } from "@/components/navigation-shell";
import { isSuperadmin as isSuperadminEmail } from "@/lib/admin-constants";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type User = {
  id: string;
  email?: string;
  avatar_url?: string;
  display_name?: string;
} | null;

type NavigationShellWrapperProps = {
  user: User;
  isSuperadmin: boolean;
};

function getActiveSection(
  pathname: string,
): "home" | "feed" | "generate" | "admin" | "about" {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/about")) return "about";
  if (pathname.startsWith("/feed")) return "feed";
  if (pathname.startsWith("/g/")) return "feed";
  if (pathname.startsWith("/generate") || pathname.startsWith("/remix")) return "generate";
  return "home";
}

function getNavVariant(pathname: string): "marketing" | "app" {
  if (pathname.startsWith("/admin")) return "marketing";
  if (pathname === "/" || pathname.startsWith("/about")) return "marketing";
  return "app";
}

export function NavigationShellWrapper({ user, isSuperadmin }: NavigationShellWrapperProps) {
  const pathname = usePathname();
  const { state: generatingNavState } = useNavigationGenerating();
  const [resolvedUser, setResolvedUser] = useState(user);
  const [resolvedIsSuperadmin, setResolvedIsSuperadmin] = useState(isSuperadmin);

  useEffect(() => {
    if (user) return;

    let cancelled = false;

    async function hydrateUserFromSession() {
      try {
        const supabase = createSupabaseBrowserClient();
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (cancelled || !authUser) return;

        setResolvedUser({
          id: authUser.id,
          email: authUser.email ?? undefined,
          avatar_url: authUser.user_metadata?.avatar_url ?? undefined,
          display_name: authUser.user_metadata?.full_name ?? authUser.user_metadata?.name ?? undefined,
        });
        setResolvedIsSuperadmin(isSuperadminEmail(authUser.email));
      } catch {
        // Keep anonymous shell on transient client auth failures.
      }
    }

    void hydrateUserFromSession();

    return () => {
      cancelled = true;
    };
  }, [user]);

  // Don't render the main navigation on admin routes — admin uses its own AdminShell
  if (pathname.startsWith("/admin")) {
    return null;
  }

  const activeSection = getActiveSection(pathname);
  const navVariant = getNavVariant(pathname);
  const isGenerationDetail = pathname.startsWith("/g/");

  const generatingChrome =
    generatingNavState.mode === "generating"
      ? { onCancel: generatingNavState.onCancel }
      : null;

  return (
    <NavigationShell
      user={resolvedUser}
      activeSection={activeSection}
      isSuperadmin={resolvedIsSuperadmin}
      isGenerationDetail={isGenerationDetail}
      variant={navVariant}
      generatingChrome={generatingChrome}
    />
  );
}
