import { cn } from "@/lib/cn";

type Props = {
  children: React.ReactNode;
  /** Tall picker row vs default */
  size?: "md" | "lg";
  className?: string;
};

const heights: Record<NonNullable<Props["size"]>, string> = {
  md: "min-h-12 px-3",
  lg: "h-[68px] px-4",
};

/**
 * Bordered surface for picker rows / text areas (not a native input —
 * compose inputs or buttons inside).
 */
export function FieldShell({ children, size = "lg", className }: Props) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-lg border border-line-strong bg-canvas",
        heights[size],
        className,
      )}
    >
      {children}
    </div>
  );
}
