import { useEffect, useRef, useState } from "react";

type UseEnhanceWhenNearViewportOptions = {
  /** e.g. `"320px 0px"` — expands the intersection root upward/downward */
  rootMargin?: string;
  /** When true, enhancement activates immediately (skips the observer). */
  immediate?: boolean;
};

/**
 * Fires once when `ref` enters (or nears) the viewport. Disconnects after trigger.
 */
export function useEnhanceWhenNearViewport({
  rootMargin = "320px 0px",
  immediate = false,
}: UseEnhanceWhenNearViewportOptions = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const [enhanced, setEnhanced] = useState(immediate);

  useEffect(() => {
    if (immediate) setEnhanced(true);
  }, [immediate]);

  useEffect(() => {
    if (immediate || enhanced) return;

    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      setEnhanced(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setEnhanced(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [immediate, enhanced, rootMargin]);

  return { ref, enhanced };
}
