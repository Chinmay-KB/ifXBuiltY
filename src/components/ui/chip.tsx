import { cn } from "@/lib/cn";

type Variant = "default" | "active" | "muted" | "chrome" | "danger";

const variants: Record<Variant, string> = {
  default: "bg-panel border-[1.5px] border-line-strong text-ink font-normal",
  active: "bg-ink text-white font-bold",
  muted: "bg-panel text-ink font-normal",
  chrome: "bg-chrome text-ink font-bold",
  danger: "bg-barrier text-white font-bold",
};

type Props = {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
};

/** Rounded tone/filter tag — uses Space Mono for that code-y prompt feel. */
export function Chip({ children, variant = "default", className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3.5 py-1.5 font-mono text-[12px] uppercase leading-[18px] tracking-[0.03em]",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
