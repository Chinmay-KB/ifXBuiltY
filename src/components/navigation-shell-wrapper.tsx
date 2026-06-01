"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { useNavigationGenerating } from "@/components/navigation-generating-context";
import { NavigationShell } from "@/components/navigation-shell";
import { isSuperadmin as isSuperadminEmail } from "@/lib/admin-constants";

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

function navUserFromAuthUser(authUser: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}): NavUser {
  return {
    id: authUser.id,
    email: authUser.email ?? undefined,
    avatar_url:
      typeof authUser.user_metadata?.avatar_url === "string"
        ? authUser.user_metadata.avatar_url
        : undefined,
    display_name:
      (typeof authUser.user_metadata?.full_name === "string"
        ? authUser.user_metadata.full_name
        : undefined) ??
      (typeof authUser.user_metadata?.name === "string"
        ? authUser.user_metadata.name
        : undefined),
  };
}

export function NavigationShellWrapper() {
  const pathname = usePathname();
  const { state: generatingNavState } = useNavigationGenerating();
  const [user, setUser] = useState<NavUser>(null);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const navVariant = getNavVariant(pathname);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    async function bindAuthSession() {
      try {
        const { createSupabaseBrowserClient } = await import(
          "@/lib/supabase/client"
        );
        const supabase = createSupabaseBrowserClient();

        async function syncUserFromSession() {
          const {
            data: { user: authUser },
          } = await supabase.auth.getUser();

          if (cancelled) return;

          if (!authUser) {
            setUser(null);
            setIsSuperadmin(false);
            return;
          }

          setUser(navUserFromAuthUser(authUser));
          setIsSuperadmin(isSuperadminEmail(authUser.email));
        }

        await syncUserFromSession();

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(() => {
          void syncUserFromSession();
        });
        unsubscribe = () => subscription.unsubscribe();
      } catch {
        // Keep anonymous shell on transient client auth failures.
      }
    }

    void bindAuthSession();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  if (pathname.startsWith("/admin")) {
    return null;
  }

  const activeSection = getActiveSection(pathname);
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
