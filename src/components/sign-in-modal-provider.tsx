"use client";

import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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
  const [open, setOpen] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const openSignIn = useCallback(() => setOpen(true), []);
  const closeSignIn = useCallback(() => {
    setOpen(false);
    setAuthError(null);
  }, []);

  useEffect(() => {
    const error = searchParams.get("sign_in_error");
    if (!error) return;

    setAuthError(error);
    setOpen(true);

    const qs = new URLSearchParams(searchParams.toString());
    qs.delete("sign_in_error");
    const suffix = qs.toString();
    router.replace(suffix ? `${pathname}?${suffix}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  return (
    <SignInModalContext.Provider value={{ openSignIn }}>
      {children}
      {open ? (
        <SignInModal open authError={authError} onClose={closeSignIn} />
      ) : null}
    </SignInModalContext.Provider>
  );
}
