"use client";

import Link from "next/link";

import { ProductForm } from "@/components/admin/product-form";

export default function AddProductPage() {
  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/products"
          className="text-sm text-muted transition-colors hover:text-ink"
        >
          ← Back to products
        </Link>
        <h2 className="mt-2 text-xl font-semibold text-ink">Add Product</h2>
      </div>

      <div className="max-w-2xl">
        <ProductForm mode="create" />
      </div>
    </div>
  );
}
