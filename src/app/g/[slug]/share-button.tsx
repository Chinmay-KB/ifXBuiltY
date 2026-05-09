"use client";

type ShareButtonProps = {
  slug: string;
  title: string;
};

export function ShareButton({ slug, title }: ShareButtonProps) {
  return (
    <button
      type="button"
      onClick={() => {
        const url = `${window.location.origin}/g/${slug}`;
        if (navigator.share) {
          navigator.share({ title, url });
        } else {
          navigator.clipboard.writeText(url);
        }
      }}
      className="inline-flex items-center gap-2 rounded-lg border-2 border-ink px-5 py-3 text-sm font-semibold text-ink transition-colors hover:bg-panel"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path d="M13 4.5a2.5 2.5 0 11.702 1.737L6.97 9.604a2.518 2.518 0 010 .799l6.733 3.366a2.5 2.5 0 11-.671 1.341l-6.733-3.366a2.5 2.5 0 110-3.482l6.733-3.366A2.52 2.52 0 0113 4.5z" />
      </svg>
      Share
    </button>
  );
}
