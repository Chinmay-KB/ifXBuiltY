"use client";

import { usePathname } from "next/navigation";

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
): "home" | "feed" | "generate" | "admin" {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/feed")) return "feed";
  if (pathname.startsWith("/generate") || pathname.startsWith("/remix")) return "generate";
  return "home";
}

export function NavigationShellWrapper({ user, isSuperadmin }: NavigationShellWrapperProps) {
  const pathname = usePathname();

  // Don't render the main navigation on admin routes — admin uses its own AdminShell
  if (pathname.startsWith("/admin")) {
    return null;
  }

  const activeSection = getActiveSection(pathname);

  return <NavigationShell user={user} activeSection={activeSection} isSuperadmin={isSuperadmin} />;
}
