import { cn } from "@/lib/cn";

type Props = {
  children: React.ReactNode;
  className?: string;
};

/** Page chrome: hairline bottom rule under header strips. */
export function HeaderBar({ children, className }: Props) {
  return (
    <header
      className={cn(
        "flex h-[72px] w-full shrink-0 items-center justify-between border-b border-line bg-canvas px-12",
        className,
      )}
    >
      {children}
    </header>
  );
}
