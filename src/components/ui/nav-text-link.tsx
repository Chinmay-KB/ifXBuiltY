import Link from "next/link";
import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

type Props = Omit<ComponentProps<typeof Link>, "className"> & {
  active?: boolean;
  className?: string;
};

/** Top-nav text link (Generate / Hot messes / …). */
export function NavTextLink({ active, className, ...rest }: Props) {
  return (
    <Link
      className={cn(
        "text-sm font-semibold leading-5 transition-colors",
        active ? "text-ink" : "text-muted hover:text-ink",
        className,
      )}
      {...rest}
    />
  );
}
