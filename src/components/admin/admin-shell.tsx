import Link from "next/link";

type AdminShellProps = {
  children: React.ReactNode;
};

/**
 * Layout shell for the admin panel.
 * Renders a fixed header with title and back-to-app link,
 * plus a scrollable content area below.
 */
export function AdminShell({ children }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-canvas">
      {/* Fixed top header */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-20 items-center justify-between border-b border-line bg-canvas px-6">
        <h1 className="text-lg font-semibold text-ink">Admin Panel</h1>
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
