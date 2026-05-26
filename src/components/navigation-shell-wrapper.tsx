"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { useNavigationGenerating } from "@/components/navigation-generating-context";
import { NavigationShell } from "@/components/navigation-shell";
import { isSuperadmin as isSuperadminEmail } from "@/lib/admin-constants";
import { useDeferUntilIdle } from "@/lib/defer-until-idle";

type NavUser = {
  id: string;
  email?: string;
  avatar_url?: string;
  display_name?: string;
} | null;

function getActiveSection(
  pathname: string,
): "home" | "feed" | "generate" | "admin" | "about" {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/about")) return "about";
  if (pathname.startsWith("/feed")) return "feed";
  if (pathname.startsWith("/g/")) return "feed";
  if (pathname.startsWith("/generate") || pathname.startsWith("/remix"))
    return "generate";
  return "home";
}

function getNavVariant(pathname: string): "marketing" | "app" {
  if (pathname.startsWith("/admin")) return "marketing";
  if (pathname === "/" || pathname.startsWith("/about")) return "marketing";
  return "app";
}

export function NavigationShellWrapper() {
  const pathname = usePathname();
  const { state: generatingNavState } = useNavigationGenerating();
  const [user, setUser] = useState<NavUser>(null);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const readyToHydrate = useDeferUntilIdle(2500);

  useEffect(() => {
    if (!readyToHydrate) return;

    let cancelled = false;

    async function hydrateUserFromSession() {
      try {
        const { createSupabaseBrowserClient } = await import(
          "@/lib/supabase/client"
        );
        const supabase = createSupabaseBrowserClient();
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (cancelled || !authUser) return;

        setUser({
          id: authUser.id,
          email: authUser.email ?? undefined,
          avatar_url: authUser.user_metadata?.avatar_url ?? undefined,
          display_name:
            authUser.user_metadata?.full_name ??
            authUser.user_metadata?.name ??
            undefined,
        });
        setIsSuperadmin(isSuperadminEmail(authUser.email));
      } catch {
        // Keep anonymous shell on transient client auth failures.
      }
    }

    void hydrateUserFromSession();

    return () => {
      cancelled = true;
    };
  }, [readyToHydrate]);

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
      user={user}
      activeSection={activeSection}
      isSuperadmin={isSuperadmin}
      isGenerationDetail={isGenerationDetail}
      variant={navVariant}
      generatingChrome={generatingChrome}
    />
  );
}
