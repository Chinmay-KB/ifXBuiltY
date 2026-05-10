"use client";

import { createContext, useCallback, useContext, useState } from "react";

import { SignInModal } from "@/components/sign-in-modal";

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
      <SignInModal open={open} onClose={closeSignIn} />
    </SignInModalContext.Provider>
  );
}
