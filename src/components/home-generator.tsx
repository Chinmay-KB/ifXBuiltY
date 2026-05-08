"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { Button, Chip, FieldShell, MicroLabel, Surface } from "@/components/ui";
import { cn } from "@/lib/cn";

const TONE_CHIPS = ["absurdly polished", "dead serious", "unhinged"] as const;
const SCREEN_CHIPS = ["mobile app", "desktop web", "kiosk"] as const;
const REGION_CHIPS = ["US", "EU", "Global south"] as const;

type GenResult = {
  id: number;
  slug: string;
  imageUrl: string | null;
  builder: string;
  target: string;
};

type Props = {
  signedIn: boolean;
};

export function HomeGenerator({ signedIn }: Props) {
  const router = useRouter();
  const [builder, setBuilder] = useState("Duolingo");
  const [target, setTarget] = useState("airport security");
  const [tone, setTone] = useState<string>("absurdly polished");
  const [screenType, setScreenType] = useState("mobile app");
  const [region, setRegion] = useState("US");
  const [extraDetails, setExtraDetails] = useState(
    "Make it feel like a serious onboarding flow with one line that should not have shipped.",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenResult | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setError(null);
    setResult(null);
    setPublishedSlug(null);
  }, []);

  async function generate() {
    if (!signedIn) {
      router.push(`/login?next=${encodeURIComponent("/")}`);
      return;
    }
    setError(null);
    setPublishedSlug(null);
    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          builder,
          target,
          tone,
          screenType,
          region,
          extraDetails,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        id?: number;
        slug?: string;
        imageUrl?: string | null;
        prompt?: { builder?: string; target?: string };
      };
      if (!res.ok) {
        setError(data.error ?? "Generation failed");
        setLoading(false);
        return;
      }
      if (data.id != null && data.slug) {
        setResult({
          id: data.id,
          slug: data.slug,
          imageUrl: data.imageUrl ?? null,
          builder: data.prompt?.builder ?? builder,
          target: data.prompt?.target ?? target,
        });
      }
    } catch {
      setError("Network error");
    }
    setLoading(false);
  }

  async function publish() {
    if (!result || !signedIn) return;
    setPublishing(true);
    setError(null);
    try {
      const res = await fetch(`/api/generations/${result.id}/publish`, {
        method: "POST",
      });
      const data = (await res.json()) as { error?: string; slug?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not publish");
        setPublishing(false);
        return;
      }
      setPublishedSlug(data.slug ?? result.slug);
    } catch {
      setError("Publish request failed");
    }
    setPublishing(false);
  }

  const headline = result
    ? "Freshly forged"
    : "Your next bad interface";
  const subtitle = result
    ? `if ${result.builder} built ${result.target}`
    : "Pick a builder, pick a victim, add one cursed detail.";

  return (
    <div className="flex w-full flex-col gap-6 lg:flex-row lg:gap-7">
      <div className="flex w-full shrink-0 flex-col gap-5 lg:max-w-[440px]">
        <div>
          <h1 className="font-display text-4xl leading-tight text-ink sm:text-5xl sm:leading-[1.1]">
            If X built Y
          </h1>
          <p className="mt-2 text-base leading-6 text-subtle">
            Choose a builder, choose a target, then let it overthink the interface.
          </p>
        </div>

        <Surface variant="composer" className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <MicroLabel htmlFor="builder">Builder</MicroLabel>
            <FieldShell>
              <input
                id="builder"
                value={builder}
                onChange={(e) => setBuilder(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-xl font-semibold text-ink outline-none"
                autoComplete="off"
              />
              <span
                className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-panel text-lg font-black text-ink"
                aria-hidden
              >
                ⌕
              </span>
            </FieldShell>
          </div>
          <div className="flex flex-col gap-1.5">
            <MicroLabel htmlFor="target">Target</MicroLabel>
            <FieldShell>
              <input
                id="target"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-xl font-semibold text-ink outline-none"
                autoComplete="off"
              />
              <span
                className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-panel text-lg font-black text-ink"
                aria-hidden
              >
                ⌕
              </span>
            </FieldShell>
          </div>
          <div className="flex flex-wrap gap-2">
            {TONE_CHIPS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTone(t)}
                className={cn(
                  "cursor-pointer rounded-full border-0 bg-transparent p-0",
                  tone === t ? "[&>span]:bg-ink [&>span]:text-white" : "",
                )}
              >
                <Chip variant={tone === t ? "active" : "default"}>{t}</Chip>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {SCREEN_CHIPS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setScreenType(s)}
                className={cn(
                  "cursor-pointer rounded-full border-0 bg-transparent p-0",
                  screenType === s ? "[&>span]:bg-ink [&>span]:text-white" : "",
                )}
              >
                <Chip variant={screenType === s ? "active" : "default"}>{s}</Chip>
              </button>
            ))}
            {REGION_CHIPS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRegion(r)}
                className={cn(
                  "cursor-pointer rounded-full border-0 bg-transparent p-0",
                  region === r ? "[&>span]:bg-ink [&>span]:text-white" : "",
                )}
              >
                <Chip variant={region === r ? "active" : "default"}>{r}</Chip>
              </button>
            ))}
          </div>
          <label className="flex min-h-[88px] flex-col rounded-lg border border-line-strong p-3.5">
            <span className="sr-only">Extra directions</span>
            <textarea
              value={extraDetails}
              onChange={(e) => setExtraDetails(e.target.value)}
              rows={3}
              className="w-full resize-none bg-transparent text-[15px] leading-snug text-subtle outline-none"
            />
          </label>
          <div className="flex gap-2.5">
            <Button
              variant="chrome"
              size="lg"
              className="min-w-0 flex-1 font-black"
              disabled={loading}
              onClick={() => void generate()}
            >
              {loading ? "Generating…" : signedIn ? "Generate" : "Sign in to generate"}
            </Button>
            <button
              type="button"
              className="flex size-[52px] shrink-0 items-center justify-center rounded-lg border border-line-strong text-xl font-black text-ink hover:bg-panel"
              onClick={resetForm}
              aria-label="Reset"
            >
              ↻
            </button>
          </div>
          {error ? (
            <p className="text-sm font-medium text-barrier" role="alert">
              {error}
            </p>
          ) : null}
        </Surface>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <Surface variant="panel" className="flex min-h-[320px] flex-col p-4 sm:min-h-[400px] sm:p-5">
          <div className="flex min-h-0 flex-1 flex-col justify-between gap-4 rounded-lg bg-ink p-5 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <MicroLabel tone="chrome-on-dark">{headline}</MicroLabel>
                <p className="mt-1.5 text-sm text-on-dark-muted">{subtitle}</p>
              </div>
              {result ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/remix/${result.id}`}
                    className="inline-flex h-8 items-center rounded-full border border-white/20 bg-white/10 px-2.5 text-[13px] font-semibold text-white hover:bg-white/15"
                  >
                    Remix
                  </Link>
                  {publishedSlug ? (
                    <Link
                      href={`/g/${publishedSlug}`}
                      className="inline-flex h-8 items-center rounded-full border border-white/20 bg-white/10 px-2.5 text-[13px] font-semibold text-white hover:bg-white/15"
                    >
                      View public
                    </Link>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 border-white/25 bg-white/10 text-white hover:bg-white/15"
                      disabled={publishing || !signedIn}
                      onClick={() => void publish()}
                    >
                      {publishing ? "Publishing…" : "Publish"}
                    </Button>
                  )}
                </div>
              ) : null}
            </div>

            <div className="flex flex-col gap-4">
              {result?.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={result.imageUrl}
                  alt={`Generated: if ${result.builder} built ${result.target}`}
                  className="max-h-[420px] w-full rounded-lg object-contain"
                />
              ) : (
                <div className="grid max-w-lg gap-3 sm:grid-cols-3">
                  <div className="h-24 rounded-tile bg-chrome sm:h-28" />
                  <div className="h-24 rounded-tile bg-vote sm:h-28" />
                  <div className="h-24 rounded-tile bg-barrier sm:h-28" />
                </div>
              )}
              {!result?.imageUrl && !loading ? (
                <p className="max-w-lg font-display text-2xl leading-tight text-white sm:text-4xl sm:leading-tight">
                  Security owl wants your shoes.
                </p>
              ) : null}
              {loading && !result?.imageUrl ? (
                <p className="text-on-dark-soft">Summoning pixels…</p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="max-w-xl rounded-full bg-white/10 px-2.5 py-2 text-[13px] text-on-dark-soft">
                Suggested excuse: “{target} but with streak anxiety.”
              </p>
              <span className="rounded-full bg-white px-3 py-2 text-[13px] font-black text-ink">
                ifXbuiltY
              </span>
            </div>
          </div>
        </Surface>
      </div>
    </div>
  );
}
