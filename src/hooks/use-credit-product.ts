"use client";

import { useCallback, useEffect, useState } from "react";

export type CreditProduct = {
  productId: string;
  name: string;
  description: string | null;
  /** Price in lowest denomination (e.g. cents) */
  priceAmount: number | null;
  /** ISO currency code (e.g. "USD") */
  currency: string | null;
  /** Number of credits granted on purchase */
  creditsGranted: number | null;
};

// Module-level cache so multiple components share the same fetch
let cachedProduct: CreditProduct | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function formatPrice(amount: number | null, currency: string | null): string {
  if (amount == null || currency == null) return "—";
  // amount is in lowest denomination (cents for USD)
  const value = amount / 100;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    }).format(value);
  } catch {
    return `$${value}`;
  }
}

export function useCreditProduct() {
  const [product, setProduct] = useState<CreditProduct | null>(cachedProduct);
  const [loading, setLoading] = useState(!cachedProduct);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = useCallback(async () => {
    // Use cache if fresh
    if (cachedProduct && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
      setProduct(cachedProduct);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/products/credits");
      if (!res.ok) {
        setError("Could not load product info");
        setLoading(false);
        return;
      }
      const data = (await res.json()) as CreditProduct;
      cachedProduct = data;
      cacheTimestamp = Date.now();
      setProduct(data);
    } catch {
      setError("Failed to fetch product info");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchProduct();
  }, [fetchProduct]);

  const priceLabel = formatPrice(product?.priceAmount ?? null, product?.currency ?? null);
  const creditsLabel = product?.creditsGranted
    ? `${product.creditsGranted} credits`
    : product?.name ?? "Credits";

  return {
    product,
    loading,
    error,
    priceLabel,
    creditsLabel,
    refetch: fetchProduct,
  };
}
