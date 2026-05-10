"use client";

import Link from "next/link";

import { CreditsBadge } from "@/components/credits-badge";
import { useSignInModal } from "@/components/sign-in-modal-provider";
import { UserMenu } from "@/components/user-menu";
import { LogoMark, Wordmark } from "@/components/ui";
import { cn } from "@/lib/cn";

type User = {
  id: string;
  email?: string;
  avatar_url?: string;
  display_name?: string;
} | null;

type NavigationShellProps = {
  user: User;
  activeSection: "home" | "feed" | "generate";
};

/* ─── Icons (inline SVG, no emoji) ─── */

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-5", className)}
      aria-hidden="true"
    >
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function FeedIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-5", className)}
      aria-hidden="true"
    >
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  );
}

function GenerateIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-5", className)}
      aria-hidden="true"
    >
      <path d="M12 3v3m0 12v3M3 12h3m12 0h3" />
      <circle cx="12" cy="12" r="4" />
      <path d="M5.6 5.6l2.1 2.1m8.6 8.6l2.1 2.1M5.6 18.4l2.1-2.1m8.6-8.6l2.1-2.1" />
    </svg>
  );
}

/* ─── Desktop Nav Links ─── */

const navItems = [
  { section: "generate" as const, label: "Generate", href: "/generate" },
  { section: "feed" as const, label: "Feed", href: "/feed" },
];

/* ─── User Avatar (kept for mobile) ─── */

function UserAvatarMobile({ user }: { user: NonNullable<User> }) {
  const displayName = user.display_name ?? user.email ?? "User";

  return (
    <Link href="/profile" className="flex items-center gap-2">
      {user.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary OAuth avatar URLs
        <img
          src={user.avatar_url}
          alt=""
          className="size-7 rounded-full object-cover"
        />
      ) : (
        <div className="flex size-7 items-center justify-center rounded-full bg-panel text-xs font-semibold text-ink">
          {displayName.charAt(0).toUpperCase()}
        </div>
      )}
    </Link>
  );
}

/* ─── Main Component ─── */

export function NavigationShell({ user, activeSection }: NavigationShellProps) {
  const { openSignIn } = useSignInModal();

  return (
    <>
      {/* Desktop top nav — hidden below md (768px) */}
      <header className="fixed inset-x-0 top-0 z-50 hidden h-16 border-b border-line bg-canvas md:block">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo + Wordmark */}
          <Link href="/" className="flex items-center gap-2.5">
            <LogoMark size="sm" />
            <Wordmark className="text-lg" />
          </Link>

          {/* Nav Links */}
          <nav className="flex items-center gap-6" aria-label="Main navigation">
            {navItems.map((item) => (
              <Link
                key={item.section}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors duration-200",
                  activeSection === item.section
                    ? "font-semibold text-ink"
                    : "text-muted hover:text-ink",
                )}
                aria-current={
                  activeSection === item.section ? "page" : undefined
                }
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* User area */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <CreditsBadge />
                <UserMenu user={user} />
              </>
            ) : (
              <button
                type="button"
                onClick={openSignIn}
                className="inline-flex items-center justify-center rounded-lg bg-ink px-3.5 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-ink/90"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile bottom tab bar — visible below md (768px) */}
      <nav
        className="fixed inset-x-0 bottom-0 z-50 flex h-14 items-center justify-around border-t border-line bg-canvas md:hidden"
        aria-label="Mobile navigation"
      >
        {[
          { section: "home" as const, label: "Home", href: "/" },
          { section: "generate" as const, label: "Generate", href: "/generate" },
          { section: "feed" as const, label: "Feed", href: "/feed" },
        ].map((item) => {
          const isActive = activeSection === item.section;
          const Icon =
            item.section === "home"
              ? HomeIcon
              : item.section === "feed"
                ? FeedIcon
                : GenerateIcon;

          return (
            <Link
              key={item.section}
              href={item.href}
              className={cn(
                "flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 px-3 py-1 transition-colors duration-200",
                isActive ? "text-ink" : "text-muted",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className={isActive ? "stroke-[2.5]" : undefined} />
              <span
                className={cn(
                  "text-[10px] leading-tight",
                  isActive ? "font-bold" : "font-medium",
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
        {user && <UserAvatarMobile user={user} />}
      </nav>
    </>
  );
}
