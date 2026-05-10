/**
 * Tiny pub/sub so any component can signal that the credit balance changed,
 * and the CreditsBadge (or anything else) can re-fetch.
 */

type Listener = () => void;

const listeners = new Set<Listener>();

/** Subscribe to credit-balance-changed events. Returns an unsubscribe fn. */
export function onCreditsChanged(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Notify all subscribers that credits have changed. */
export function emitCreditsChanged(): void {
  listeners.forEach((fn) => fn());
}
