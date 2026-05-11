"use client";

import { usePathname } from "next/navigation";

import { useNavigationGenerating } from "@/components/navigation-generating-context";
import { NavigationShell } from "@/components/navigation-shell";

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

  // Don't render the main navigation on admin routes — admin uses its own AdminShell
  if (pathname.startsWith("/admin")) {
    return null;
  }

  const activeSection = getActiveSection(pathname);
  const navVariant = getNavVariant(pathname);

  const generatingChrome =
    generatingNavState.mode === "generating"
      ? { onCancel: generatingNavState.onCancel }
      : null;

  return (
    <NavigationShell
      user={user}
      activeSection={activeSection}
      isSuperadmin={isSuperadmin}
      variant={navVariant}
      generatingChrome={generatingChrome}
    />
  );
}
