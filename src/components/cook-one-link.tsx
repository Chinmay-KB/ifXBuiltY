import Link from "next/link";

/** Primary CTA — matches `Button` chrome variant (for use with `Link`). */
export function CookOneLink() {
  return (
    <Link
      href="/"
      className="inline-flex items-center justify-center rounded-lg border-2 border-ink bg-chrome px-4 py-3 text-[15px] font-black text-ink transition-[filter] hover:brightness-[0.98] active:brightness-95"
    >
      Cook one
    </Link>
  );
}
