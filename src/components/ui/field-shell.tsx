import { cn } from "@/lib/cn";

type Props = {
  children: React.ReactNode;
  /** Tall picker row vs default */
  size?: "md" | "lg";
  className?: string;
};

const heights: Record<NonNullable<Props["size"]>, string> = {
  md: "min-h-12 px-4",
  lg: "h-[52px] px-4",
};

/**
 * Bordered surface for picker rows / text areas / dropdowns.
 * Compose inputs, selects, or buttons inside.
 */
export function FieldShell({ children, size = "lg", className }: Props) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-[10px] border-2 border-line-strong bg-panel",
        heights[size],
        className,
      )}
    >
      {children}
    </div>
  );
}
