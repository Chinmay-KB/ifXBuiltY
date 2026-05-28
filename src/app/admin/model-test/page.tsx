"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import Zoom from "@/components/image-zoom";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { cn } from "@/lib/cn";

type CompanyProfile = {
  id: string;
  name: string;
  profileType: "company" | "product" | string;
};

type AdminImageModel = {
  id: number;
  providerModel: string;
  label: string;
  enabled: boolean;
  sortOrder: number;
};

type AdminModelTestRun = {
  id: string;
  builder: string;
  target: string;
  tone: string;
  screenType: string;
  extraDetails: string;
  generatedPrompt: string | null;
  model: string;
  quality: string;
  status: "queued" | "processing" | "completed" | "failed" | string;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
  imageUrl: string | null;
  publishState: "draft" | "published" | string;
  publishedGenerationId: number | null;
  createdAt: string;
};

function msToPretty(ms: number | null): string {
  if (ms == null || !Number.isFinite(ms)) return "—";
  if (ms < 1000) return `${ms}ms`;
  const s = Math.round(ms / 10) / 100;
  return `${s}s`;
}

async function safeJson(res: Response): Promise<unknown> {
  return await res.json().catch(() => null as unknown);
}

function errorFromBody(body: unknown): string | null {
  if (typeof body !== "object" || body == null) return null;
  if (!("error" in body)) return null;
  const v = (body as { error?: unknown }).error;
  return typeof v === "string" ? v : null;
}

export default function AdminModelTestPage() {
  const [profiles, setProfiles] = useState<CompanyProfile[]>([]);
  const [models, setModels] = useState<AdminImageModel[]>([]);
  const [runs, setRuns] = useState<AdminModelTestRun[]>([]);

  const [builderId, setBuilderId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [tone, setTone] = useState("");
  const [screenType, setScreenType] = useState<"desktop" | "mobile">("desktop");
  const [extraDetails, setExtraDetails] = useState("");

  const [selectedModels, setSelectedModels] = useState<Record<string, boolean>>({});
  const [newModelProvider, setNewModelProvider] = useState("");
  const [newModelLabel, setNewModelLabel] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const enabledModels = useMemo(
    () => models.filter((m) => m.enabled),
    [models],
  );

  const selectedModelList = useMemo(() => {
    const list = enabledModels
      .map((m) => m.providerModel)
      .filter((m) => selectedModels[m]);
    return list;
  }, [enabledModels, selectedModels]);

  const builder = useMemo(
    () => profiles.find((p) => p.id === builderId) ?? null,
    [profiles, builderId],
  );
  const target = useMemo(
    () => profiles.find((p) => p.id === targetId) ?? null,
    [profiles, targetId],
  );

  const loadProfiles = useCallback(async () => {
    const res = await fetch("/api/admin/companies");
    const maybeErrBody = !res.ok ? await safeJson(res) : null;
    if (!res.ok) {
      const msg =
        typeof maybeErrBody === "object" &&
        maybeErrBody != null &&
        "error" in maybeErrBody &&
        typeof (maybeErrBody as { error?: unknown }).error === "string"
          ? String((maybeErrBody as { error?: string }).error)
          : "Failed to load profiles";
      throw new Error(msg);
    }
    const raw = (await res.json()) as unknown;
    const data = Array.isArray(raw) ? raw : [];
    const mapped: CompanyProfile[] = data.map((r) => {
      const obj = (typeof r === "object" && r != null ? r : {}) as Record<string, unknown>;
      const id = typeof obj.id === "string" ? obj.id : String(obj.id ?? "");
      const name = typeof obj.name === "string" ? obj.name : String(obj.name ?? id);
      const profileType =
        typeof obj.profileType === "string" ? obj.profileType : "company";
      return { id, name, profileType };
    });
    setProfiles(mapped);
  }, []);

  const loadModels = useCallback(async () => {
    const res = await fetch("/api/admin/model-test/models");
    const body = !res.ok ? await safeJson(res) : null;
    if (!res.ok) throw new Error(errorFromBody(body) ?? "Failed to load models");
    const data = (await res.json()) as AdminImageModel[];
    setModels(data);
    setSelectedModels((prev) => {
      const next: Record<string, boolean> = { ...prev };
      for (const m of data) {
        if (m.enabled && next[m.providerModel] == null) next[m.providerModel] = true;
        if (!m.enabled) delete next[m.providerModel];
      }
      return next;
    });
  }, []);

  const loadRuns = useCallback(async () => {
    const res = await fetch("/api/admin/model-test/runs?limit=60");
    const body = !res.ok ? await safeJson(res) : null;
    if (!res.ok) throw new Error(errorFromBody(body) ?? "Failed to load runs");
    const data = (await res.json()) as AdminModelTestRun[];
    setRuns(data);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await Promise.all([loadProfiles(), loadModels(), loadRuns()]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load admin data");
      }
    })();
  }, [loadModels, loadProfiles, loadRuns]);

  useEffect(() => {
    const t = window.setInterval(() => {
      void loadRuns().catch(() => {});
    }, 2500);
    return () => window.clearInterval(t);
  }, [loadRuns]);

  async function createRuns() {
    setBusy(true);
    setError("");
    try {
      if (!builderId || !targetId) throw new Error("Pick both builder and target");
      if (selectedModelList.length === 0) throw new Error("Select at least one model");

      const res = await fetch("/api/admin/model-test/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          builderId,
          targetId,
          tone,
          screenType,
          extraDetails,
          models: selectedModelList,
        }),
      });
      if (!res.ok) {
        const body = await safeJson(res);
        throw new Error(errorFromBody(body) ?? `Failed (${res.status})`);
      }
      await loadRuns();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start runs");
    } finally {
      setBusy(false);
    }
  }

  async function addModel() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/model-test/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerModel: newModelProvider,
          label: newModelLabel,
          enabled: true,
          sortOrder: 100,
        }),
      });
      if (!res.ok) {
        const body = await safeJson(res);
        throw new Error(errorFromBody(body) ?? `Failed (${res.status})`);
      }
      setNewModelProvider("");
      setNewModelLabel("");
      await loadModels();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add model");
    } finally {
      setBusy(false);
    }
  }

  async function deleteModel(id: number) {
    const ok = window.confirm("Delete this model from the list?");
    if (!ok) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/model-test/models/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await safeJson(res);
        throw new Error(errorFromBody(body) ?? `Failed (${res.status})`);
      }
      await loadModels();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete model");
    } finally {
      setBusy(false);
    }
  }

  async function copyPrompt(run: AdminModelTestRun) {
    const text = run.generatedPrompt ?? "";
    if (!text.trim()) {
      alert("No prompt stored for this run.");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // fallback
      window.prompt("Copy prompt:", text);
    }
  }

  async function publishRun(runId: string) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/model-test/runs/${runId}/publish`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = await safeJson(res);
        throw new Error(errorFromBody(body) ?? `Failed (${res.status})`);
      }
      await loadRuns();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not publish run");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <header className="flex flex-col gap-2">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-black text-ink">Model test lab</h1>
            <p className="mt-1 text-sm text-muted">
              Generate the same prompt across models, compare results, and publish winners.
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wide text-muted">Quality</div>
            <div className="mt-1 inline-flex items-center gap-2 rounded-full bg-panel px-3 py-1 text-sm font-semibold text-ink">
              High
              <span className="h-1 w-1 rounded-full bg-muted/60" />
              Fixed
            </div>
          </div>
        </div>
        {error ? (
          <Surface className="mt-3 border-barrier/30 bg-barrier/5 p-3">
            <p className="text-sm text-barrier">{error}</p>
          </Surface>
        ) : null}
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Surface className="lg:col-span-7">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">Prompt inputs</h2>
            <span className="text-xs text-muted">Uses profile merge when IDs are picked</span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-ink">Builder</span>
              <select
                value={builderId}
                onChange={(e) => setBuilderId(e.target.value)}
                className="rounded-lg border border-line bg-panel px-3 py-2"
              >
                <option value="">Select…</option>
                {profiles
                  .filter((p) => p.profileType !== "product")
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.id})
                    </option>
                  ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-ink">Target (company or product)</span>
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="rounded-lg border border-line bg-panel px-3 py-2"
              >
                <option value="">Select…</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.profileType})
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-ink">Screen type</span>
              <div className="flex gap-2">
                {(["desktop", "mobile"] as const).map((k) => (
                  <button
                    key={k}
                    onClick={() => setScreenType(k)}
                    className={cn(
                      "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                      screenType === k
                        ? "border-ink bg-ink text-chrome"
                        : "border-line bg-panel text-muted hover:text-ink",
                    )}
                    type="button"
                  >
                    {k}
                  </button>
                ))}
              </div>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-ink">Tone (optional)</span>
              <input
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                placeholder="e.g. deadpan, savage, earnest…"
                className="rounded-lg border border-line bg-panel px-3 py-2"
              />
            </label>
          </div>

          <label className="mt-4 flex flex-col gap-1 text-sm">
            <span className="font-medium text-ink">Extra details (optional)</span>
            <textarea
              value={extraDetails}
              onChange={(e) => setExtraDetails(e.target.value)}
              rows={5}
              placeholder="Add constraints, include/exclude details, vibe nudges…"
              className="resize-y rounded-lg border border-line bg-panel px-3 py-2"
            />
          </label>

          <div className="mt-5 flex items-center justify-between gap-3">
            <div className="text-xs text-muted">
              <div>
                <span className="font-medium text-ink">Builder:</span>{" "}
                {builder ? builder.name : "—"}
              </div>
              <div>
                <span className="font-medium text-ink">Target:</span>{" "}
                {target ? target.name : "—"}
              </div>
            </div>
            <Button
              variant="ink"
              disabled={busy}
              onClick={() => void createRuns()}
              className="min-w-44"
            >
              {busy ? "Starting…" : `Run ${selectedModelList.length || 0} models`}
            </Button>
          </div>
        </Surface>

        <Surface className="lg:col-span-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">Models</h2>
            <Button variant="ghost" size="sm" disabled={busy} onClick={() => void loadModels()}>
              Refresh
            </Button>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            {enabledModels.map((m) => (
              <label
                key={m.providerModel}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-line bg-panel px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-ink">
                    {m.label || m.providerModel}
                  </div>
                  <div className="truncate font-mono text-xs text-muted">{m.providerModel}</div>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(selectedModels[m.providerModel])}
                  onChange={(e) =>
                    setSelectedModels((prev) => ({
                      ...prev,
                      [m.providerModel]: e.target.checked,
                    }))
                  }
                />
              </label>
            ))}
            {enabledModels.length === 0 ? (
              <div className="rounded-lg border border-line bg-panel p-4 text-sm text-muted">
                No enabled models. Add one below.
              </div>
            ) : null}
          </div>

          <div className="mt-6 border-t border-line pt-4">
            <h3 className="text-sm font-semibold text-ink">Manage list</h3>
            <div className="mt-3 grid grid-cols-1 gap-2">
              <input
                value={newModelProvider}
                onChange={(e) => setNewModelProvider(e.target.value)}
                placeholder="provider/model (e.g. openai/gpt-image-2)"
                className="rounded-lg border border-line bg-panel px-3 py-2 text-sm"
              />
              <input
                value={newModelLabel}
                onChange={(e) => setNewModelLabel(e.target.value)}
                placeholder="Label (optional)"
                className="rounded-lg border border-line bg-panel px-3 py-2 text-sm"
              />
              <div className="flex items-center gap-2">
                <Button disabled={busy} onClick={() => void addModel()}>
                  Add model
                </Button>
                <div className="text-xs text-muted">
                  Delete via list below.
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              {models.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-line bg-panel px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-ink">
                      {m.label || m.providerModel}
                    </div>
                    <div className="truncate font-mono text-xs text-muted">
                      {m.providerModel}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    disabled={busy}
                    onClick={() => void deleteModel(m.id)}
                  >
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </Surface>
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Recent runs</h2>
          <Button variant="ghost" size="sm" disabled={busy} onClick={() => void loadRuns()}>
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {runs.map((r) => (
            <Surface key={r.id} className="overflow-hidden p-0">
              <div className="border-b border-line bg-canvas px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-ink">
                      {r.model}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 font-medium",
                          r.status === "completed"
                            ? "bg-emerald-500/10 text-emerald-700"
                            : r.status === "failed"
                              ? "bg-red-500/10 text-red-700"
                              : "bg-ink/5 text-muted",
                        )}
                      >
                        {r.status}
                      </span>
                      <span className="rounded-full bg-ink/5 px-2 py-0.5">
                        {msToPretty(r.durationMs)}
                      </span>
                      <span className="rounded-full bg-ink/5 px-2 py-0.5">
                        {r.publishState}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => void copyPrompt(r)}>
                      Copy prompt
                    </Button>
                    {r.publishState !== "published" ? (
                      <Button
                        size="sm"
                        disabled={busy || r.status !== "completed" || !r.imageUrl}
                        onClick={() => void publishRun(r.id)}
                      >
                        Publish
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (r.publishedGenerationId) {
                            window.open(`/g/${String(r.publishedGenerationId)}`, "_blank");
                          }
                        }}
                        disabled={!r.publishedGenerationId}
                      >
                        View
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4">
                {r.imageUrl ? (
                  <Zoom>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={r.imageUrl}
                      alt={`${r.model} output`}
                      className="h-56 w-full rounded-lg border border-line object-cover"
                      loading="lazy"
                    />
                  </Zoom>
                ) : (
                  <div className="flex h-56 w-full items-center justify-center rounded-lg border border-line bg-panel text-sm text-muted">
                    {r.status === "failed"
                      ? "Failed"
                      : r.status === "processing" || r.status === "queued"
                        ? "Generating…"
                        : "No preview"}
                  </div>
                )}

                <div className="mt-3 text-xs text-muted">
                  <div className="truncate">
                    <span className="font-medium text-ink">Builder:</span> {r.builder}
                  </div>
                  <div className="truncate">
                    <span className="font-medium text-ink">Target:</span> {r.target}
                  </div>
                  {r.errorMessage ? (
                    <div className="mt-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-red-700">
                      {r.errorMessage}
                    </div>
                  ) : null}
                </div>
              </div>
            </Surface>
          ))}
        </div>
      </section>
    </div>
  );
}

