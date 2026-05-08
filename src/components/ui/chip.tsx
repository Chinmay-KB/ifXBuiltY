import { cn } from "@/lib/cn";

type Variant = "default" | "active" | "muted";

const variants: Record<Variant, string> = {
  default: "bg-panel text-ink font-semibold",
  active: "bg-ink text-white font-extrabold",
  muted: "bg-panel text-ink font-semibold",
};

type Props = {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
};

/** Rounded prompt / filter tag. */
export function Chip({ children, variant = "default", className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-2 text-[13px] leading-[18px]",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
