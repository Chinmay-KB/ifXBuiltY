import type { ButtonHTMLAttributes } from "react";
import { forwardRef } from "react";

import { cn } from "@/lib/cn";

export type ButtonVariant =
  | "chrome"
  | "ink"
  | "outline"
  | "ghost"
  | "pillSolid"
  | "pillOutline";

export type ButtonSize = "sm" | "md" | "lg";

const variantClass: Record<ButtonVariant, string> = {
  chrome:
    "border-2 border-transparent bg-chrome text-ink shadow-none hover:brightness-[0.98] active:brightness-95",
  ink: "border-2 border-transparent bg-ink text-white hover:bg-ink/90 active:bg-ink/80",
  outline:
    "border-2 border-line-strong bg-canvas text-ink hover:bg-panel active:bg-panel/80",
  ghost: "border-0 bg-transparent text-muted hover:text-ink hover:bg-panel/60",
  pillSolid:
    "rounded-full border-0 bg-ink px-3.5 py-2 text-[13px] font-bold leading-[18px] text-white hover:bg-ink/90",
  pillOutline:
    "rounded-full border-[1.5px] border-line-strong bg-canvas px-3.5 py-2 text-[13px] font-bold leading-[18px] text-ink hover:bg-panel",
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "rounded-lg px-4 py-2 text-[14px] font-semibold leading-[18px]",
  md: "rounded-[10px] px-5 py-2.5 text-sm font-bold leading-5",
  lg: "rounded-[10px] px-7 py-3.5 text-base font-bold leading-snug",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variantDefaultSize: Partial<Record<ButtonVariant, ButtonSize>> = {
  pillSolid: "sm",
  pillOutline: "sm",
};

/**
 * Action primitives aligned to Paper (chrome CTA, ink nav, pills, outline).
 * `pillSolid` / `pillOutline` ignore `size` padding — use `className` to tweak.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = "chrome", size, className, type = "button", ...rest },
    ref,
  ) {
    const resolvedSize = size ?? variantDefaultSize[variant] ?? "md";
    const isPill = variant === "pillSolid" || variant === "pillOutline";

    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex cursor-pointer items-center justify-center font-semibold transition-[background-color,filter,color] disabled:pointer-events-none disabled:opacity-50",
          !isPill && variantClass[variant],
          !isPill && sizeClass[resolvedSize],
          isPill && variantClass[variant],
          className,
        )}
        {...rest}
      />
    );
  },
);
