"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";

type Product = {
  id: string;
  name: string;
  parentCompanyId: string | null;
  category: string;
  popularityTier: number;
  researchStatus: string;
  memeStrength: number;
};

type Status = "loading" | "error" | "success";

const STATUS_COLORS: Record<string, string> = {
  seed: "bg-gray-100 text-gray-700",
  researched: "bg-blue-100 text-blue-700",
  reviewed: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default function AdminProductListPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const fetchProducts = useCallback(async () => {
    setStatus("loading");
    setErrorMessage("");
    try {
      const res = await fetch("/api/admin/products");
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(
          body?.error ?? `Failed to load products (${res.status})`,
        );
      }
      const data: Product[] = await res.json();
      setProducts(data);
      setStatus("success");
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Could not load product data",
      );
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProducts();
  }, [fetchProducts]);

  const filtered = filter === "all"
    ? products
    : products.filter((p) => p.researchStatus === filter);

  const statusCounts = products.reduce((acc, p) => {
    acc[p.researchStatus] = (acc[p.researchStatus] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div>
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-ink">Product Research</h2>
        <Link href="/admin/products/new">
          <Button variant="ink" size="sm">
            + Add Product
          </Button>
        </Link>
      </div>

      {/* Status filter tabs */}
      <div className="mb-4 flex gap-2">
        {[
          { key: "all", label: `All (${products.length})` },
          { key: "seed", label: `Seed (${statusCounts.seed ?? 0})` },
          { key: "researched", label: `Researched (${statusCounts.researched ?? 0})` },
          { key: "reviewed", label: `Reviewed (${statusCounts.reviewed ?? 0})` },
          { key: "approved", label: `Approved (${statusCounts.approved ?? 0})` },
          { key: "rejected", label: `Rejected (${statusCounts.rejected ?? 0})` },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === key
                ? "bg-ink text-chrome"
                : "bg-panel text-muted hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {status === "loading" && (
        <Surface className="p-8 text-center">
          <p className="text-muted">Loading products…</p>
        </Surface>
      )}

      {/* Error state */}
      {status === "error" && (
        <Surface className="p-8 text-center">
          <p className="text-red-600">{errorMessage}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={fetchProducts}
          >
            Retry
          </Button>
        </Surface>
      )}

      {/* Empty state */}
      {status === "success" && filtered.length === 0 && (
        <Surface className="p-8 text-center">
          <p className="text-muted">
            {filter === "all"
              ? "No products exist yet. Run a research workflow or add one manually."
              : `No products with status "${filter}".`}
          </p>
        </Surface>
      )}

      {/* Product list */}
      {status === "success" && filtered.length > 0 && (
        <Surface className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-canvas text-xs font-medium uppercase tracking-wide text-muted">
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Parent</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Tier</th>
                  <th className="px-4 py-3">Memes</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((product) => (
                  <tr
                    key={product.id}
                    className="transition-colors hover:bg-canvas/60"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-ink">
                          {product.name}
                        </span>
                      </div>
                      <code className="mt-0.5 block rounded bg-canvas px-1.5 py-0.5 text-xs text-muted">
                        {product.id}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {product.parentCompanyId || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {product.category || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {product.popularityTier}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {"●".repeat(product.memeStrength)}
                      {"○".repeat(5 - product.memeStrength)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          STATUS_COLORS[product.researchStatus] ?? "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {product.researchStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/products/${product.id}`}>
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Surface>
      )}
    </div>
  );
}
