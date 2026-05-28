"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";

type AdminShellProps = {
  children: React.ReactNode;
};

const NAV_ITEMS = [
  { href: "/admin", label: "Companies", match: /^\/admin$/ },
  { href: "/admin/products", label: "Products", match: /^\/admin\/products/ },
  { href: "/admin/research", label: "Research", match: /^\/admin\/research/ },
  {
    href: "/admin/model-test",
    label: "Model test",
    match: /^\/admin\/model-test/,
  },
];

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-canvas">
      {/* Fixed top header */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-20 items-center justify-between border-b border-line bg-canvas px-6">
        <div className="flex items-center gap-6">
          <h1 className="text-lg font-semibold text-ink">Admin Panel</h1>
          <nav className="flex gap-1">
            {NAV_ITEMS.map(({ href, label, match }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  match.test(pathname)
                    ? "bg-ink text-chrome"
                    : "text-muted hover:text-ink",
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <Link
          href="/"
          className="text-sm font-medium text-muted transition-colors hover:text-ink"
        >
          ← Back to app
        </Link>
      </header>

      {/* Content area below header */}
      <main className="pt-20">
        <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
