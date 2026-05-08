import { cn } from "@/lib/cn";

type Props = {
  children?: React.ReactNode;
  className?: string;
};

/** Wordmark next to `LogoMark` — Inter black, Paper nav scale. */
export function Wordmark({ children = "ifXbuiltY", className }: Props) {
  return (
    <span
      className={cn(
        "font-sans text-xl font-black leading-6 tracking-tight text-ink",
        className,
      )}
    >
      {children}
    </span>
  );
}
