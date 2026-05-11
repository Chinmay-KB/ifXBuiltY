import { cn } from "@/lib/cn";

type Size = "sm" | "md";

const sizes: Record<Size, { box: string; text: string }> = {
  sm: {
    box: "size-7 rounded-md",
    text: "text-sm font-black",
  },
  md: {
    box: "size-8 rounded-md",
    text: "text-base font-black",
  },
};

type Props = {
  size?: Size;
  className?: string;
};

/** Yellow "x" mark — matches Paper nav / system header. */
export function LogoMark({ size = "md", className }: Props) {
  const s = sizes[size];
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center bg-chrome",
        s.box,
        className,
      )}
      aria-hidden
    >
      <span className={cn("font-display text-ink", s.text)}>x</span>
    </div>
  );
}
