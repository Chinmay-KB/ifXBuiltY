import { useEffect, useState } from "react";

/** Mount children only after the main thread is idle (or a timeout elapses). */
export function useDeferUntilIdle(timeoutMs = 3500) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = () => {
      if (!cancelled) setReady(true);
    };

    if (typeof window.requestIdleCallback === "function") {
      const idleId = window.requestIdleCallback(run, { timeout: timeoutMs });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(idleId);
      };
    }

    const timeoutId = window.setTimeout(run, Math.min(timeoutMs, 2000));
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [timeoutMs]);

  return ready;
}
