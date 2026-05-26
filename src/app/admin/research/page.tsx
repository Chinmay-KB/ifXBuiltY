"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import {
  getResearchSeedCompanies,
  getResearchSeedCategories,
  getResearchWaves,
  defaultMaxProductsForWave,
} from "@/lib/research/seeds";

type Run = {
  id: string;
  seed_company_name: string | null;
  seed_category: string | null;
  max_products: number;
  status: string;
  error_message: string | null;
  created_at: string;
};

type Draft = {
  id: string;
  product_slug: string;
  name: string;
  research_status: string;
};

export default function AdminResearchPage() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [seed, setSeed] = useState("Google");
  const [maxProducts, setMaxProducts] = useState(3);
  const [waveId, setWaveId] = useState("wave-1");
  const seedCompanies = getResearchSeedCompanies();
  const seedCategories = getResearchSeedCategories();
  const waves = getResearchWaves();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [runsRes, draftsRes] = await Promise.all([
      fetch("/api/admin/research/runs"),
      fetch("/api/admin/research/drafts"),
    ]);
    if (runsRes.ok) setRuns(await runsRes.json());
    if (draftsRes.ok) setDrafts(await draftsRes.json());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function startDiscovery() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/workflows/discover-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seedCompanyName: seed, maxProducts }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `Failed (${res.status})`);
      }
      const data = (await res.json()) as { workflowRunId?: string };
      if (data.workflowRunId) {
        setError("");
        // Workflow runs in background; refresh list after a short delay
        setTimeout(() => void load(), 3000);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start run");
    } finally {
      setBusy(false);
    }
  }

  async function approveDraft(id: string) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/research/drafts/${id}/approve`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `Approve failed (${res.status})`);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Approve failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 p-6">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-black text-ink">Product research</h1>
        <p className="text-sm text-muted">
          Start agent discovery runs and approve drafts before they publish to the generator catalog.
        </p>
      </header>

      <Surface className="flex flex-col gap-4 p-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-ink">Expansion wave</span>
          <select
            value={waveId}
            onChange={(e) => {
              setWaveId(e.target.value);
              setMaxProducts(defaultMaxProductsForWave(e.target.value));
            }}
            className="rounded-lg border border-line bg-panel px-3 py-2"
          >
            {waves.map((w) => (
              <option key={w.id} value={w.id}>{w.label}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-ink">Seed company</span>
          <input list="research-seed-companies" value={seed} onChange={(e) => setSeed(e.target.value)} className="rounded-lg border border-line bg-panel px-3 py-2" />
          <datalist id="research-seed-companies">
            {seedCompanies.map((c) => (<option key={c.name} value={c.name} />))}
          </datalist>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-ink">Max products</span>
          <input type="number" min={1} max={15} value={maxProducts} onChange={(e) => setMaxProducts(Number(e.target.value) || 3)} className="rounded-lg border border-line bg-panel px-3 py-2" />
        </label>
        <p className="text-xs text-muted">Category seeds: {seedCategories.map((c) => c.name).join(", ")}</p>
        <Button disabled={busy} onClick={() => void startDiscovery()}>
          {busy ? "Running…" : `Discover products (max ${maxProducts})`}
        </Button>
        {error ? <p className="text-sm text-barrier">{error}</p> : null}
      </Surface>

      <section>
        <h2 className="mb-3 font-semibold text-ink">Research runs</h2>
        <ul className="flex flex-col gap-2">
          {runs.map((r) => (
            <li key={r.id} className="rounded-lg border border-line bg-panel px-3 py-2 text-sm">
              <span className="font-mono text-xs text-muted">{r.status}</span>{" "}
              {r.seed_company_name ?? r.seed_category ?? "—"} · {new Date(r.created_at).toLocaleString()}
              {r.error_message ? <p className="text-barrier">{r.error_message}</p> : null}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 font-semibold text-ink">Drafts needing review</h2>
        <ul className="flex flex-col gap-2">
          {drafts.map((d) => (
            <li key={d.id} className="flex items-center justify-between rounded-lg border border-line bg-panel px-3 py-2">
              <span className="text-sm font-medium">{d.name}</span>
              <Button size="sm" disabled={busy} onClick={() => void approveDraft(d.id)}>
                Approve & publish
              </Button>
            </li>
          ))}
        </ul>
      </section>

      <Link href="/admin/products" className="text-sm text-muted underline">
        ← Products admin
      </Link>
    </div>
  );
}
