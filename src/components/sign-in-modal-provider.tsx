"use client";

import dynamic from "next/dynamic";
import { createContext, useCallback, useContext, useState } from "react";

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
  const [open, setOpen] = useState(false);

  const openSignIn = useCallback(() => setOpen(true), []);
  const closeSignIn = useCallback(() => setOpen(false), []);

  return (
    <SignInModalContext.Provider value={{ openSignIn }}>
      {children}
      {open ? <SignInModal open onClose={closeSignIn} /> : null}
    </SignInModalContext.Provider>
  );
}
