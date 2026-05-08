import { cn } from "@/lib/cn";

type Variant = "panel" | "composer" | "modal";

const shells: Record<Variant, string> = {
  panel: "rounded-lg bg-panel",
  composer: "rounded-lg border-2 border-ink bg-canvas p-5",
  modal:
    "rounded-lg border-2 border-ink bg-canvas shadow-[var(--shadow-modal)]",
};

type Props = {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
};

/** Grouping surfaces: gray panel, bordered composer, elevated modal shell. */
export function Surface({ children, variant = "panel", className }: Props) {
  return (
    <div className={cn(shells[variant], className)}>{children}</div>
  );
}
