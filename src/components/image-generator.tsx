"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button, Chip, FieldShell, MicroLabel, Surface } from "@/components/ui";
import { useCreditProduct } from "@/hooks/use-credit-product";
import { cn } from "@/lib/cn";

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

const DEFAULTS = {
  extraDetails: "",
} as const;

function titleCase(s: string) {
  return s
    .split(" ")
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

const STAGES = [
  { id: "prompt", label: "Cooking prompt", atMs: 0 },
  { id: "layout", label: "Sketching layout", atMs: 18_000 },
  { id: "render", label: "Rendering pixels", atMs: 45_000 },
  { id: "jokes", label: "Adding tiny jokes", atMs: 78_000 },
] as const;

type SeedExample = {
  id: string;
  builder: string;
  target: string;
};

const SEED_EXAMPLES: SeedExample[] = [
  { id: "duolingo-airport", builder: "Duolingo", target: "airport security" },
  { id: "ikea-taxes", builder: "IKEA", target: "tax filing software" },
  { id: "spotify-dental", builder: "Spotify", target: "dental records" },
];

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function buildMeanwhileCards(builder: string, target: string) {
  const b = builder.trim() || "your builder";
  const t = target.trim() || "your target";
  return [
    {
      k: "borrow",
      eyebrow: "Meanwhile",
      title: `Borrowing ${b}’s visual tics.`,
      body: "Expect overconfident nudges, badge energy, and one line that shouldn’t have shipped.",
    },
    {
      k: "target",
      eyebrow: "Likely moves",
      title: `${t}, but with extra rituals.`,
      body: "The obvious buttons will be obvious. The weird ones will be very intentional.",
    },
    {
      k: "caption",
      eyebrow: "Caption draft",
      title: "“This is too real.”",
      body: "Copy it when the screenshot lands.",
    },
    {
      k: "queue",
      eyebrow: "Next up",
      title: "Queue a remix idea.",
      body: "You can keep browsing — we’ll keep cooking.",
    },
  ];
}

export function ImageGenerator({ signedIn }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialBuilder = searchParams.get("b") ?? "Duolingo";
  const initialTarget = searchParams.get("t") ?? "airport security";

  const [builder, setBuilder] = useState(initialBuilder);
  const [target, setTarget] = useState(initialTarget);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [result, setResult] = useState<GenResult | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);

  const [credits, setCredits] = useState<number | null>(null);
  const [creditsLoading, setCreditsLoading] = useState(false);
  const [creditsSyncing, setCreditsSyncing] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const { product: creditProduct, priceLabel, creditsLabel: productCreditsLabel } = useCreditProduct();

  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [stageIdx, setStageIdx] = useState(0);
  const [meanwhileIdx, setMeanwhileIdx] = useState(0);

  const pendingCheckoutKey = "ifxb_dodo_checkout_session_id";

  const creditsLabel = useMemo(() => {
    if (!signedIn) return "Credits: sign in";
    if (creditsLoading) return "Credits: …";
    if (credits == null) return "Credits: —";
    return `Credits: ${credits}`;
  }, [credits, creditsLoading, signedIn]);

  const seeds = SEED_EXAMPLES;

  const meanwhileCards = useMemo(
    () => buildMeanwhileCards(builder, target),
    [builder, target],
  );

  const reset = useCallback(() => {
    setError(null);
    setToast(null);
    setResult(null);
    setPublishedSlug(null);
    setShowPaywall(false);
    setStartedAt(null);
    setStageIdx(0);
    setMeanwhileIdx(0);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(t);
  }, [toast]);

  const refreshCredits = useCallback(async () => {
    if (!signedIn) return;
    setCreditsLoading(true);
    try {
      const res = await fetch("/api/credits/balance", { method: "GET" });
      const data = (await res.json()) as { credits?: number; error?: string };
      if (res.ok && typeof data.credits === "number") {
        setCredits(data.credits);
      } else if (res.status === 401) {
        setCredits(null);
      }
    } catch {
      // ignore; UI will show unknown state
    }
    setCreditsLoading(false);
  }, [signedIn]);

  useEffect(() => {
    if (!signedIn) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshCredits();
  }, [refreshCredits, signedIn]);

  useEffect(() => {
    if (!signedIn) return;
    if (typeof window === "undefined") return;

    const sessionId = window.localStorage.getItem(pendingCheckoutKey);
    if (!sessionId) return;

    let cancelled = false;
    (async () => {
      setCreditsSyncing(true);
      try {
        const res = await fetch("/api/credits/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        if (!cancelled && res.ok) {
          window.localStorage.removeItem(pendingCheckoutKey);
          await refreshCredits();
        }
      } catch {
        // ignore; user can hit Refresh
      }
      if (!cancelled) setCreditsSyncing(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [refreshCredits, signedIn]);

  useEffect(() => {
    if (!loading || startedAt == null) return;

    const id = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const idx = clamp(
        STAGES.reduce((acc, s, i) => (elapsed >= s.atMs ? i : acc), 0),
        0,
        STAGES.length - 1,
      );
      setStageIdx(idx);
    }, 600);

    return () => window.clearInterval(id);
  }, [loading, startedAt]);

  useEffect(() => {
    if (!loading) return;
    const id = window.setInterval(() => {
      setMeanwhileIdx((v) => (v + 1) % meanwhileCards.length);
    }, 6800);
    return () => window.clearInterval(id);
  }, [loading, meanwhileCards.length]);

  async function startCheckout() {
    const productId = process.env.NEXT_PUBLIC_DODO_IMAGE_CREDITS_PRODUCT_ID?.trim();
    if (!productId) {
      setError("Missing NEXT_PUBLIC_DODO_IMAGE_CREDITS_PRODUCT_ID");
      return;
    }
    setCheckoutLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          returnUrl: window.location.href,
        }),
      });
      const data = (await res.json()) as { error?: string; url?: string | null };
      if (!res.ok) {
        setError(data.error ?? "Checkout failed");
        setCheckoutLoading(false);
        return;
      }
      const sessionId =
        typeof (data as { sessionId?: unknown }).sessionId === "string"
          ? String((data as { sessionId?: unknown }).sessionId)
          : null;

      if (sessionId) {
        window.localStorage.setItem(pendingCheckoutKey, sessionId);
      }

      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError("Checkout did not return a URL");
    } catch {
      setError("Checkout request failed");
    }
    setCheckoutLoading(false);
  }

  async function generate() {
    if (!signedIn) {
      router.push(`/login?next=${encodeURIComponent("/images")}`);
      return;
    }

    // Pre-check credits before starting the expensive generation
    if (credits != null && credits <= 0) {
      setShowPaywall(true);
      return;
    }

    reset();
    setLoading(true);
    setStartedAt(Date.now());

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          builder,
          target,
          extraDetails: DEFAULTS.extraDetails,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        code?: string;
        id?: number;
        slug?: string;
        imageUrl?: string | null;
        prompt?: { builder?: string; target?: string };
      };

      if (!res.ok) {
        if (data.code === "insufficient_credits") {
          setShowPaywall(true);
          setError(null);
          setLoading(false);
          void refreshCredits();
          return;
        }
        if (data.code === "billing_debit_failed") {
          setToast("Couldn’t deduct a credit. Nothing was charged — please retry.");
        }
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
    void refreshCredits();
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

  const onSelectSeed = useCallback((ex: SeedExample) => {
    setBuilder(ex.builder);
    setTarget(ex.target);
    reset();
  }, [reset]);

  const stageLabel = STAGES[stageIdx]?.label ?? STAGES[0].label;
  const currentMeanwhile = meanwhileCards[meanwhileIdx] ?? meanwhileCards[0];

  const headlineBuilder = (result?.builder ?? builder).trim();
  const headlineTarget = (result?.target ?? target).trim();

  const captionIdeas = useMemo(() => {
    return [
      "This is too real.",
      "Why does this look launch-ready?",
      "I would hate-use this.",
      "The alternate timeline is hiring.",
    ];
  }, []);

  const shareUrl = useMemo(() => {
    if (!publishedSlug) return null;
    if (typeof window === "undefined") return null;
    return `${window.location.origin}/g/${publishedSlug}`;
  }, [publishedSlug]);

  const shareRef = useRef<HTMLButtonElement | null>(null);

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setToast("Copied.");
    } catch {
      setToast("Couldn’t copy — your browser blocked it.");
      shareRef.current?.focus();
    }
  }

  const previewHeadline = result
    ? `if ${result.builder} built ${result.target}`
    : "Sample interfaces";
  const previewSubtitle = result
    ? "Freshly forged."
    : "Random combos from the vault — yours next.";

  return (
    <div className="flex w-full flex-col gap-6 lg:flex-row lg:gap-7">
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <Surface variant="panel" className="flex min-h-[360px] flex-col p-4 sm:min-h-[520px] sm:p-5">
          <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden rounded-lg bg-ink p-5 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <MicroLabel tone="chrome-on-dark">{previewHeadline}</MicroLabel>
                <p className="mt-1.5 text-sm text-on-dark-muted">{previewSubtitle}</p>
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
                  className="max-h-[520px] w-full rounded-lg object-contain"
                />
              ) : loading ? (
                <div className="flex flex-col gap-3">
                  <p className="text-on-dark-soft">Summoning pixels…</p>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full w-1/2 rounded-full bg-white/30"
                      style={{
                        transform: `translateX(${(meanwhileIdx % 2) * 100}%)`,
                        transition: "transform 900ms ease-out",
                      }}
                    />
                  </div>
                  <p className="text-sm text-on-dark-muted">
                    Current step: <span className="text-white">{stageLabel}</span>
                  </p>
                </div>
              ) : (
                <p className="text-on-dark-soft text-sm">
                  Pick a builder and target, then hit Generate.
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <span className="rounded-full bg-[#E8E306] px-3 py-2 text-[13px] font-black text-ink">
                ifXbuiltY
              </span>
            </div>
          </div>
        </Surface>
      </div>

      <div className="flex w-full shrink-0 flex-col gap-5 lg:max-w-[460px]">
        <div>
          <h1 className="font-display text-4xl leading-tight text-ink sm:text-5xl sm:leading-[1.06]">
            If
            <br />
            {headlineBuilder || "—"}
            <br />
            built
            <br />
            {headlineTarget ? (
              <>
                <span className="underline decoration-[#E8E306] decoration-[10px] underline-offset-[12px]">
                  {titleCase(headlineTarget)}
                </span>
              </>
            ) : (
              "—"
            )}
          </h1>
          <p className="mt-2 text-base leading-6 text-subtle">
            Two inputs, one alternate-timeline screenshot. Expect ~1–2 minutes when it’s busy.
          </p>
        </div>

        <Surface variant="composer" className="flex flex-col gap-3.5">
          {toast ? (
            <div
              className="rounded-lg border border-line-strong bg-panel px-3 py-2 text-sm font-semibold text-ink"
              role="status"
            >
              {toast}
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-black uppercase tracking-[0.12em] text-muted">
              {creditsSyncing ? "Credits: syncing…" : creditsLabel}
            </span>
            {signedIn ? (
              <button
                type="button"
                onClick={() => void refreshCredits()}
                className="text-xs font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink"
              >
                Refresh
              </button>
            ) : null}
          </div>

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
              onClick={reset}
              aria-label="Reset"
            >
              ↻
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {seeds.map((ex) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => onSelectSeed(ex)}
                className={cn("cursor-pointer rounded-full border-0 bg-transparent p-0")}
              >
                <Chip>{ex.builder} × {ex.target}</Chip>
              </button>
            ))}
          </div>

          {error ? (
            <p className="text-sm font-medium text-barrier" role="alert">
              {error}
            </p>
          ) : null}

          {showPaywall ? (
            <div className="rounded-lg border border-line-strong bg-panel p-3.5">
              <p className="text-sm font-semibold text-ink">You’re out of credits.</p>
              <p className="mt-1 text-sm text-subtle">
                {creditProduct
                  ? `Get ${productCreditsLabel} for ${priceLabel} to keep generating.`
                  : "Buy a credit pack to keep generating."}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="chrome"
                  size="sm"
                  disabled={checkoutLoading}
                  onClick={() => void startCheckout()}
                >
                  {checkoutLoading
                    ? "Opening checkout…"
                    : creditProduct
                      ? `Buy ${productCreditsLabel} — ${priceLabel}`
                      : "Buy credits"}
                </Button>
                <button
                  type="button"
                  className="text-sm font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink"
                  onClick={reset}
                >
                  Not now
                </button>
              </div>
            </div>
          ) : null}
        </Surface>

        {loading ? (
          <Surface variant="panel" className="flex flex-col gap-3 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-black uppercase tracking-[0.12em] text-muted">
                In progress
              </span>
              <span className="text-xs font-semibold text-ink">~ 1–2 min</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {STAGES.map((s, i) => {
                const active = i === stageIdx;
                const done = i < stageIdx;
                return (
                  <span
                    key={s.id}
                    className={cn(
                      "rounded-full px-3 py-2 text-[13px] font-extrabold",
                      active
                        ? "bg-ink text-white"
                        : done
                          ? "bg-panel text-ink"
                          : "border border-line-strong bg-canvas text-ink",
                    )}
                  >
                    {done ? "✓ " : ""}
                    {s.label}
                  </span>
                );
              })}
            </div>

            <div className="rounded-lg border border-line-strong bg-canvas p-3">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-muted">
                {currentMeanwhile.eyebrow}
              </p>
              <p className="mt-1 text-sm font-extrabold text-ink">
                {currentMeanwhile.title}
              </p>
              <p className="mt-1 text-sm text-subtle">{currentMeanwhile.body}</p>
            </div>

            <p className="text-sm text-subtle">
              You can keep browsing — we’ll keep cooking.
            </p>
          </Surface>
        ) : result?.imageUrl ? (
          <Surface variant="panel" className="flex flex-col gap-3 p-4">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (result?.imageUrl) void copyText(result.imageUrl);
                }}
                ref={shareRef}
              >
                Copy image URL
              </Button>
              {publishedSlug ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (shareUrl) void copyText(shareUrl);
                  }}
                >
                  Copy public link
                </Button>
              ) : null}
              {result.imageUrl ? (
                <a
                  href={result.imageUrl}
                  download
                  className="inline-flex h-8 items-center rounded-lg border border-line-strong bg-canvas px-3 text-[13px] font-semibold leading-[18px] text-ink hover:bg-panel"
                >
                  Download
                </a>
              ) : null}
            </div>

            <div className="rounded-lg border border-line-strong bg-canvas p-3">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-muted">
                Caption ideas
              </p>
              <div className="mt-2 flex flex-col gap-2">
                {captionIdeas.slice(0, 4).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => void copyText(c)}
                    className="text-left text-sm font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </Surface>
        ) : null}
      </div>
    </div>
  );
}

