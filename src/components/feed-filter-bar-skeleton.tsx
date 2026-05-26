export function FeedFilterBarSkeleton() {
  return (
    <div
      className="flex min-h-[52px] items-center gap-3 border-b border-line/80 px-4 py-3 md:px-6"
      aria-hidden
    >
      <div className="h-8 w-24 animate-pulse rounded-full bg-line/60" />
      <div className="h-8 w-28 animate-pulse rounded-full bg-line/50" />
      <div className="h-8 w-28 animate-pulse rounded-full bg-line/50" />
      <div className="ml-auto h-8 w-20 animate-pulse rounded-full bg-line/40" />
    </div>
  );
}
