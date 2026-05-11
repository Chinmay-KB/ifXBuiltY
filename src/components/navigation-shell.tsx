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
  activeSection: "home" | "feed" | "generate" | "admin" | "about";
  isSuperadmin: boolean;
  /** Marketing (home/about) vs full Paper app chrome (feed, generate, detail, …) */
  variant: "marketing" | "app";
  /** Desktop Generate flow — Paper header “Generating” + Cancel */
  generatingChrome?: { onCancel: () => void } | null;
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

function AdminIcon({ className }: { className?: string }) {
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
      <path d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2z" />
      <path d="M8 11V7a4 4 0 1 1 8 0v4" />
    </svg>
  );
}

const marketingNavItems = [
  { section: "generate" as const, label: "Generate", href: "/generate" },
  { section: "feed" as const, label: "Feed", href: "/feed" },
];

const appNavItems: {
  label: string;
  href: string;
  activeMatch: "generate" | "feed" | "admin" | null;
}[] = [
  { label: "Generate", href: "/generate", activeMatch: "generate" },
  { label: "Feed", href: "/feed", activeMatch: "feed" },
];

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

function AppNavLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "relative text-sm font-medium transition-colors",
        active ? "text-ink" : "text-muted hover:text-ink",
      )}
      aria-current={active ? "page" : undefined}
    >
      {label}
      {active ? (
        <span className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-chrome" />
      ) : null}
    </Link>
  );
}

export function NavigationShell({
  user,
  activeSection,
  isSuperadmin,
  variant,
  generatingChrome = null,
}: NavigationShellProps) {
  const { openSignIn } = useSignInModal();
  const isSuperadminUser = isSuperadmin;

  return (
    <>
      {/* Desktop */}
      <header className="fixed inset-x-0 top-0 z-50 hidden h-20 border-b border-line bg-canvas md:block">
        <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between gap-4 px-6 lg:gap-6 lg:px-10">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <LogoMark size="sm" />
            <Wordmark className="text-[22px] leading-7" />
          </Link>

          {variant === "marketing" ? (
            <nav
              className="flex flex-1 items-center justify-center gap-9"
              aria-label="Main navigation"
            >
              {marketingNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "text-sm font-medium transition-colors duration-200",
                    activeSection === item.section
                      ? "text-ink"
                      : "text-muted hover:text-ink",
                  )}
                  aria-current={activeSection === item.section ? "page" : undefined}
                >
                  {item.label}
                </Link>
              ))}
              {isSuperadminUser && (
                <Link
                  href="/admin"
                  className={cn(
                    "text-sm font-medium transition-colors duration-200",
                    activeSection === "admin"
                      ? "text-ink"
                      : "text-muted hover:text-ink",
                  )}
                  aria-current={activeSection === "admin" ? "page" : undefined}
                >
                  Admin
                </Link>
              )}
            </nav>
          ) : generatingChrome ? (
            <div className="flex flex-1 justify-center">
              <div className="flex items-center gap-2 rounded-full border border-chrome/35 bg-chrome/12 px-4 py-2">
                <span className="size-2 shrink-0 rounded-full bg-chrome" aria-hidden />
                <span className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-chrome">
                  Generating
                </span>
              </div>
            </div>
          ) : (
            <nav
              className="flex flex-1 items-center justify-center gap-9"
              aria-label="Main navigation"
            >
              {appNavItems.map((item) => {
                const active =
                  item.activeMatch != null && activeSection === item.activeMatch;
                return (
                  <AppNavLink
                    key={item.label + item.href}
                    href={item.href}
                    label={item.label}
                    active={active}
                  />
                );
              })}
              {isSuperadminUser && (
                <AppNavLink
                  href="/admin"
                  label="Admin"
                  active={activeSection === "admin"}
                />
              )}
            </nav>
          )}

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {variant === "app" && generatingChrome ? (
              <button
                type="button"
                onClick={generatingChrome.onCancel}
                className="rounded-full border border-line bg-panel px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-ink transition-colors hover:bg-line"
              >
                Cancel
              </button>
            ) : null}


            {user ? (
              <>
                <CreditsBadge />
                <UserMenu user={user} />
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={openSignIn}
                  className="rounded-full px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-ink lg:px-4"
                >
                  Sign in
                </button>
                <Link
                  href="/generate"
                  className="rounded-full bg-ink px-4 py-2.5 text-[13px] font-bold text-chrome transition-opacity hover:opacity-90 lg:px-[18px]"
                >
                  Get started →
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-50 flex h-14 items-center justify-around border-t border-line bg-canvas md:hidden"
        aria-label="Mobile navigation"
      >
        {[
          { section: "home" as const, label: "Home", href: "/" },
          { section: "generate" as const, label: "Generate", href: "/generate" },
          { section: "feed" as const, label: "Feed", href: "/feed" },
          ...(isSuperadminUser
            ? [{ section: "admin" as const, label: "Admin", href: "/admin" }]
            : []),
        ].map((item) => {
          const isActive = activeSection === item.section;
          const Icon =
            item.section === "home"
              ? HomeIcon
              : item.section === "feed"
                ? FeedIcon
                : item.section === "admin"
                  ? AdminIcon
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
