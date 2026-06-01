"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/cn";

type User = {
  id: string;
  email?: string;
  avatar_url?: string;
  display_name?: string;
};

type UserMenuProps = {
  user: User;
};

export function UserMenu({ user }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const displayName = user.display_name ?? user.email ?? "User";
  const initial = displayName.charAt(0).toUpperCase();

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  const handleSignOut = useCallback(async () => {
    setSigningOut(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.refresh();
  }, [router]);

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full p-0.5 transition-colors hover:bg-panel"
        aria-expanded={open ? true : undefined}
        aria-haspopup="true"
        aria-label="User menu"
      >
        {user.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatar_url}
            alt=""
            className="size-8 rounded-full object-cover"
          />
        ) : (
          <div className="flex size-8 items-center justify-center rounded-full bg-panel text-xs font-semibold text-ink">
            {initial}
          </div>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-line bg-canvas shadow-modal"
          role="menu"
        >
          {/* User info header */}
          <div className="border-b border-line px-4 py-3">
            <p className="truncate text-sm font-semibold text-ink">
              {displayName}
            </p>
            {user.email && user.display_name && (
              <p className="truncate text-xs text-muted">{user.email}</p>
            )}
          </div>

          {/* Menu items */}
          <div className="py-1">
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className={cn(
                "flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-ink transition-colors hover:bg-panel",
              )}
              role="menuitem"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-4 text-muted"
                aria-hidden="true"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              My Profile
            </Link>

            <button
              onClick={() => void handleSignOut()}
              disabled={signingOut}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-ink transition-colors hover:bg-panel disabled:opacity-50"
              role="menuitem"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-4 text-muted"
                aria-hidden="true"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
