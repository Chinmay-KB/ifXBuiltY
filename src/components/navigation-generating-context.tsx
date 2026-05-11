"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type GeneratingNavState =
  | { mode: "idle" }
  | { mode: "generating"; onCancel: () => void };

type NavigationGeneratingContextValue = {
  state: GeneratingNavState;
  setGenerating: (onCancel: () => void) => void;
  clearGenerating: () => void;
};

const NavigationGeneratingContext =
  createContext<NavigationGeneratingContextValue | null>(null);

export function NavigationGeneratingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GeneratingNavState>({ mode: "idle" });

  const setGenerating = useCallback((onCancel: () => void) => {
    setState({ mode: "generating", onCancel });
  }, []);

  const clearGenerating = useCallback(() => {
    setState({ mode: "idle" });
  }, []);

  const value = useMemo(
    () => ({ state, setGenerating, clearGenerating }),
    [state, setGenerating, clearGenerating],
  );

  return (
    <NavigationGeneratingContext.Provider value={value}>
      {children}
    </NavigationGeneratingContext.Provider>
  );
}

/** Safe no-op when used outside `NavigationGeneratingProvider`. */
export function useNavigationGenerating(): NavigationGeneratingContextValue {
  const ctx = useContext(NavigationGeneratingContext);
  if (!ctx) {
    return {
      state: { mode: "idle" },
      setGenerating: () => {},
      clearGenerating: () => {},
    };
  }
  return ctx;
}
