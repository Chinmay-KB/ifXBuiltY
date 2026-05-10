import { cn } from "@/lib/cn";

type Props = {
  children?: React.ReactNode;
  className?: string;
};

/** Wordmark next to `LogoMark` — Fraunces Black italic, Paper nav scale. */
export function Wordmark({ children = "ifXBuiltY", className }: Props) {
  return (
    <span
      className={cn(
        "font-display text-xl font-black italic leading-6 tracking-tight text-ink",
        className,
      )}
    >
      {children}
    </span>
  );
}
