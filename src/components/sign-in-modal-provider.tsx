"use client";

import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";

const SignInModal = dynamic(
  () => import("@/components/sign-in-modal").then((mod) => mod.SignInModal),
  { ssr: false },
);

type SignInModalContextValue = {
  openSignIn: () => void;
};

const SignInModalContext = createContext<SignInModalContextValue>({
  openSignIn: () => {},
});

export function useSignInModal() {
  return useContext(SignInModalContext);
}

export function SignInModalProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const authError = searchParams.get("sign_in_error");
  const [open, setOpen] = useState(false);

  const openSignIn = useCallback(() => setOpen(true), []);
  const closeSignIn = useCallback(() => {
    setOpen(false);

    if (authError) {
      const qs = new URLSearchParams(searchParams.toString());
      qs.delete("sign_in_error");
      const suffix = qs.toString();
      router.replace(suffix ? `${pathname}?${suffix}` : pathname, { scroll: false });
    }
  }, [authError, pathname, router, searchParams]);

  return (
    <SignInModalContext.Provider value={{ openSignIn }}>
      {children}
      {open || authError ? (
        <SignInModal open authError={authError} onClose={closeSignIn} />
      ) : null}
    </SignInModalContext.Provider>
  );
}
