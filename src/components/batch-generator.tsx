"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import { Button, Surface } from "@/components/ui";
import {
  fillFourUniqueSlots,
  mergeCompanyPair,
  profilePairKey,
  randomDistinctPairIds,
  type MergedGenerationFields,
  type SlotWithFields,
} from "@/lib/prompt/merge-company-pair";

type GenOk = {
  ok: true;
  id: number;
  slug: string;
  imageUrl: string | null;
  published: boolean;
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
  body: MergedGenerationFields,
  delayMs: number,
): Promise<RowResult> {
  await sleep(delayMs);
  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        builder: body.builder,
        target: body.target,
        tone: body.tone,
        screenType: body.screenType,
        region: body.region,
        extraDetails: body.extraDetails,
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
      published: false,
    };
  } catch {
    return { ok: false, error: "Network error" };
  }
}

export function BatchGenerator() {
  const [slots, setSlots] = useState<SlotWithFields[]>(() =>
    fillFourUniqueSlots(),
  );
  const [results, setResults] = useState<RowResult[]>([
    null,
    null,
    null,
    null,
  ]);
  const [loading, setLoading] = useState(false);
  const [publishingIdx, setPublishingIdx] = useState<number | null>(null);

  const reshuffleAll = useCallback(() => {
    setSlots(fillFourUniqueSlots());
    setResults([null, null, null, null]);
  }, []);

  const reshuffleSlot = useCallback((index: number) => {
    setSlots((prev) => {
      const next = [...prev];
      const used = new Set(
        prev.map((s) => profilePairKey(s.builderId, s.targetId)),
      );
      used.delete(profilePairKey(prev[index]!.builderId, prev[index]!.targetId));

      let attempts = 0;
      while (attempts++ < 300) {
        const { builderId, targetId } = randomDistinctPairIds();
        const key = profilePairKey(builderId, targetId);
        if (used.has(key)) continue;
        used.add(key);
        next[index] = {
          builderId,
          targetId,
          fields: mergeCompanyPair(builderId, targetId),
        };
        break;
      }
      return next;
    });
    setResults((r) => {
      const copy = [...r];
      copy[index] = null;
      return copy;
    });
  }, []);

  const generateFour = useCallback(async () => {
    setLoading(true);
    setResults([null, null, null, null]);
    const staggerMs = 180;
    const promises = slots.map((slot, i) =>
      postGenerate(slot.fields, i * staggerMs),
    );
    const out = await Promise.all(promises);
    setResults(out);
    setLoading(false);
  }, [slots]);

  const publishSlot = useCallback(async (index: number) => {
    const res = results[index];
    if (!res || !res.ok || res.published) return;
    setPublishingIdx(index);
    try {
      const r = await fetch(`/api/generations/${res.id}/publish`, {
        method: "POST",
      });
      const data = (await r.json()) as { error?: string };
      if (!r.ok) {
        alert(data.error ?? "Publish failed");
        return;
      }
      setResults((prev) => {
        const next = [...prev];
        const cur = next[index];
        if (cur && cur.ok) {
          next[index] = { ...cur, published: true };
        }
        return next;
      });
    } finally {
      setPublishingIdx(null);
    }
  }, [results]);

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
          Four random company pairs (from the profile library). Each{" "}
          <strong>Generate four</strong> runs four API requests — typically{" "}
          <strong>four credits</strong>. Creations save as drafts under your
          account; publish to get a public{" "}
          <code className="rounded bg-panel px-1 text-xs">/g/…</code> link.
        </p>
      </div>

      <Surface variant="composer" className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="ink" onClick={reshuffleAll}>
            Reshuffle all four
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => void generateFour()}
          >
            {loading ? "Generating…" : "Generate four"}
          </Button>
        </div>

        <ul className="flex flex-col gap-3">
          {slots.map((slot, i) => (
            <li
              key={`${slot.builderId}-${slot.targetId}-${i}`}
              className="flex flex-col gap-2 rounded-lg border border-line bg-canvas px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-medium text-ink">{pairLabels[i]}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {slot.fields.screenType} · {slot.fields.region}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0 self-start sm:self-center"
                disabled={loading}
                onClick={() => reshuffleSlot(i)}
              >
                Reshuffle
              </Button>
            </li>
          ))}
        </ul>
      </Surface>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-lg text-ink">Outputs</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {results.map((res, i) => (
            <Surface key={i} className="flex flex-col gap-2 p-3">
              <p className="text-xs font-medium text-muted-foreground">
                Slot {i + 1}: {pairLabels[i]}
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
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={res.imageUrl}
                      alt=""
                      className="max-h-64 w-full rounded-md object-contain"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Saved — preview URL unavailable.
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {!res.published ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={publishingIdx === i}
                        onClick={() => void publishSlot(i)}
                      >
                        {publishingIdx === i ? "Publishing…" : "Publish"}
                      </Button>
                    ) : null}
                    {res.published ? (
                      <Link
                        href={`/g/${encodeURIComponent(res.slug)}`}
                        className="inline-flex items-center text-sm font-semibold text-ink underline"
                      >
                        View /g/{res.slug}
                      </Link>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Draft · slug <code className="rounded bg-panel px-1">{res.slug}</code>
                      </span>
                    )}
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
