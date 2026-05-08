import { cn } from "@/lib/cn";

type Size = "sm" | "md";

const sizes: Record<Size, { box: string; text: string }> = {
  sm: {
    box: "size-8 rounded-lg border-2 border-ink",
    text: "text-[17px] leading-[1.35]",
  },
  md: {
    box: "size-9 rounded-lg border-2 border-ink",
    text: "text-lg leading-5",
  },
};

type Props = {
  size?: Size;
  className?: string;
};

/** Yellow “if” mark — matches Paper nav / system header. */
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
      <span className={cn("font-display text-ink", s.text)}>if</span>
    </div>
  );
}
