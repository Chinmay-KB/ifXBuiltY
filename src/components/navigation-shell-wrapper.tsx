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
};

function getActiveSection(
  pathname: string,
): "home" | "feed" | "generate" {
  if (pathname.startsWith("/feed")) return "feed";
  if (pathname.startsWith("/generate") || pathname.startsWith("/remix")) return "generate";
  return "home";
}

export function NavigationShellWrapper({ user }: NavigationShellWrapperProps) {
  const pathname = usePathname();
  const activeSection = getActiveSection(pathname);

  return <NavigationShell user={user} activeSection={activeSection} />;
}
