"use client";

import { useSignInModal } from "@/components/sign-in-modal-provider";
import { cn } from "@/lib/cn";

type Props = {
  className?: string;
  children?: React.ReactNode;
};

export function SignInButton({ className, children = "Sign in" }: Props) {
  const { openSignIn } = useSignInModal();

  return (
    <button
      type="button"
      onClick={openSignIn}
      className={cn(
        "inline-flex items-center justify-center rounded-lg border-2 border-transparent bg-ink px-3.5 py-2.5 text-sm font-semibold leading-5 text-white transition-colors hover:bg-ink/90",
        className,
      )}
    >
      {children}
    </button>
  );
}
