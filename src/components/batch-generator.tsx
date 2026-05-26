"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import Zoom from "@/components/image-zoom";
import { Button, Surface } from "@/components/ui";
import {
  profilePairKey,
  type MergedGenerationFields,
  type SlotWithFields,
} from "@/lib/prompt/merge-company-pair";

type GenOk = {
  ok: true;
  id: number;
  slug: string;
  imageUrl: string | null;
  status: string;
};

type GenErr = {
  ok: false;
  error: string;
  code?: string;
};

type RowResult = GenOk | GenErr | null;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function postGenerate(
  slot: SlotWithFields,
  delayMs: number,
): Promise<RowResult> {
  await sleep(delayMs);
  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        builder: slot.fields.builder,
        target: slot.fields.target,
        builderId: slot.builderId,
        targetId: slot.targetId,
        extraDetails: slot.fields.extraDetails,
      }),
    });
    const data = (await res.json()) as {
      error?: string;
      code?: string;
      id?: number;
      slug?: string;
      imageUrl?: string | null;
    };

    if (!res.ok) {
      return {
        ok: false,
        error: data.error ?? `HTTP ${res.status}`,
        code: data.code,
      };
    }
    if (data.id == null || !data.slug) {
      return { ok: false, error: "Malformed response" };
    }
    return {
      ok: true,
      id: data.id,
      slug: data.slug,
      imageUrl: data.imageUrl ?? null,
      status: (data as { status?: string }).status ?? "queued",
    };
  } catch {
    return { ok: false, error: "Network error" };
  }
}

async function fetchFourSlots(): Promise<SlotWithFields[]> {
  const res = await fetch("/api/slots");
  if (!res.ok) {
    throw new Error("Failed to fetch slots");
  }
  const data = (await res.json()) as { slots: SlotWithFields[] };
  return data.slots;
}

async function fetchSingleSlot(): Promise<SlotWithFields> {
  const res = await fetch("/api/slots/single");
  if (!res.ok) {
    throw new Error("Failed to fetch single slot");
  }
  const data = (await res.json()) as { slot: SlotWithFields };
  return data.slot;
}

export function BatchGenerator() {
  const [slots, setSlots] = useState<SlotWithFields[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [results, setResults] = useState<RowResult[]>([
    null,
    null,
    null,
    null,
  ]);
  const [loading, setLoading] = useState(false);
  // Load initial slots on mount
  useEffect(() => {
    let cancelled = false;
    setSlotsLoading(true);
    fetchFourSlots()
      .then((s) => {
        if (!cancelled) {
          setSlots(s);
          setSlotsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setSlotsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const reshuffleAll = useCallback(async () => {
    setSlotsLoading(true);
    try {
      const newSlots = await fetchFourSlots();
      setSlots(newSlots);
      setResults([null, null, null, null]);
    } finally {
      setSlotsLoading(false);
    }
  }, []);

  const reshuffleSlot = useCallback(async (index: number) => {
    try {
      const newSlot = await fetchSingleSlot();
      setSlots((prev) => {
        const used = new Set(
          prev.map((s) => profilePairKey(s.builderId, s.targetId)),
        );
        // If the new slot collides with an existing one, still use it
        // (server-side randomness makes collisions rare)
        const key = profilePairKey(newSlot.builderId, newSlot.targetId);
        if (used.has(key)) {
          // Try once more
          return prev;
        }
        const next = [...prev];
        next[index] = newSlot;
        return next;
      });
      setResults((r) => {
        const copy = [...r];
        copy[index] = null;
        return copy;
      });
    } catch {
      // Silently fail — slot stays unchanged
    }
  }, []);

  const generateFour = useCallback(async () => {
    setLoading(true);
    setResults([null, null, null, null]);
    const staggerMs = 180;
    const promises = slots.map((slot, i) =>
      postGenerate(slot, i * staggerMs),
    );
    const out = await Promise.all(promises);
    setResults(out);
    setLoading(false);
  }, [slots]);

  const pairLabels = useMemo(
    () =>
      slots.map(
        (s) =>
          `${s.fields.builder} → ${s.fields.target}`,
      ),
    [slots],
  );

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl text-ink">Batch generate</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Four random company/product pairs (approved profiles from Supabase). Each{" "}
          <strong>Generate four</strong> runs four API requests — typically{" "}
          <strong>four credits</strong>. Creations save as drafts under your
          account; generations open on{" "}
          <code className="rounded bg-panel px-1 text-xs">/g/…</code> link.
        </p>
      </div>

      <Surface variant="composer" className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="ink"
            disabled={slotsLoading}
            onClick={() => void reshuffleAll()}
          >
            {slotsLoading ? "Loading…" : "Reshuffle all four"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={loading || slotsLoading || slots.length === 0}
            onClick={() => void generateFour()}
          >
            {loading ? "Generating…" : "Generate four"}
          </Button>
        </div>

        {slotsLoading && slots.length === 0 ? (
          <p className="text-sm text-muted-foreground">Loading profile pairs…</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {slots.map((slot, i) => (
              <li
                key={`${slot.builderId}-${slot.targetId}-${i}`}
                className="flex flex-col gap-2 rounded-lg border border-line bg-canvas px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium text-ink">{pairLabels[i]}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {slot.fields.builder} → {slot.fields.target}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="shrink-0 self-start sm:self-center"
                  disabled={loading}
                  onClick={() => void reshuffleSlot(i)}
                >
                  Reshuffle
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Surface>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-lg text-ink">Outputs</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {results.map((res, i) => (
            <Surface key={i} className="flex flex-col gap-2 p-3">
              <p className="text-xs font-medium text-muted-foreground">
                Slot {i + 1}: {pairLabels[i] ?? "—"}
              </p>
              {res == null && !loading ? (
                <p className="text-sm text-muted-foreground">Not generated yet.</p>
              ) : null}
              {loading && res == null ? (
                <p className="text-sm text-muted-foreground">…</p>
              ) : null}
              {res && !res.ok ? (
                <p className="text-sm text-red-600">
                  {res.error}
                  {res.code ? ` (${res.code})` : ""}
                </p>
              ) : null}
              {res && res.ok ? (
                <>
                  {res.imageUrl ? (
                    <Zoom>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={res.imageUrl}
                        alt=""
                        className="max-h-64 w-full rounded-md object-contain"
                      />
                    </Zoom>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Saved — preview URL unavailable.
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/g/${encodeURIComponent(res.slug)}`}
                      className="inline-flex items-center text-sm font-semibold text-ink underline"
                    >
                      View /g/{res.slug}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {res.status === "completed" ? "Ready" : "Rendering…"}
                    </span>
                  </div>
                </>
              ) : null}
            </Surface>
          ))}
        </div>
      </section>
    </div>
  );
}
