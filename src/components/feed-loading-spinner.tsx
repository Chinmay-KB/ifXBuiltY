import { cn } from "@/lib/cn";

type FeedLoadingSpinnerProps = {
  label?: string;
  className?: string;
};

export function FeedLoadingSpinner({
  label = "Loading feed...",
  className,
}: FeedLoadingSpinnerProps) {
  return (
    <div
      className={cn("flex items-center justify-center", className)}
      role="status"
    >
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-ink" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
