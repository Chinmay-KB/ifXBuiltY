import Link from "next/link";
import type { User } from "@supabase/supabase-js";

import { SignOutButton } from "@/components/sign-out-button";
import { LogoMark, NavTextLink, Wordmark } from "@/components/ui";
import { cn } from "@/lib/cn";

type Props = {
  user: User | null;
  active?: "generate" | "feed";
};

const signInClass =
  "inline-flex items-center justify-center rounded-lg border-2 border-transparent bg-ink px-3.5 py-2.5 text-sm font-semibold leading-5 text-white transition-colors hover:bg-ink/90";

export function SiteHeader({ user, active }: Props) {
  return (
    <header className="flex h-[72px] w-full shrink-0 items-center justify-between gap-4 border-b border-line bg-canvas px-4 sm:px-12">
      <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
        <LogoMark />
        <Wordmark className="truncate" />
      </Link>
      <nav className="flex items-center gap-3 sm:gap-6">
        <NavTextLink href="/" active={active === "generate"} className="hidden sm:inline">
          Generate
        </NavTextLink>
        <NavTextLink href="/feed?sort=trending" active={active === "feed"}>
          Hot messes
        </NavTextLink>
        <NavTextLink href="/feed?sort=newest" className="hidden md:inline">
          Fresh
        </NavTextLink>
      </nav>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {user ? (
          <>
            <span className="hidden max-w-[8rem] truncate text-sm text-muted lg:inline">
              {user.email ?? user.id}
            </span>
            <SignOutButton />
          </>
        ) : (
          <Link href="/login" className={cn(signInClass, "px-3 sm:px-3.5")}>
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
