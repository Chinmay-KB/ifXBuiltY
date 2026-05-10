import { NextResponse } from "next/server";

import { getDodoClient } from "@/lib/dodo/client";

export const runtime = "nodejs";

/**
 * Returns the credit product details (name, price, credits granted) from Dodo.
 * This is a public endpoint — no auth required since it's just product info.
 * Response is cached for 5 minutes via Cache-Control.
 */
export async function GET() {
  const productId = process.env.NEXT_PUBLIC_DODO_IMAGE_CREDITS_PRODUCT_ID?.trim();
  if (!productId) {
    return NextResponse.json(
      { error: "Credit product not configured" },
      { status: 503 },
    );
  }

  const dodo = getDodoClient();

  try {
    const product = await dodo.products.retrieve(productId);

    // Extract price info
    let priceAmount: number | null = null;
    let currency: string | null = null;

    if (product.price) {
      if (product.price.type === "one_time_price") {
        priceAmount = product.price.price;
        currency = product.price.currency;
      } else if (product.price.type === "recurring_price") {
        priceAmount = product.price.price;
        currency = product.price.currency;
      }
    }

    // Extract credits granted from credit_entitlements
    let creditsGranted: number | null = null;
    if (product.credit_entitlements?.length) {
      const amount = product.credit_entitlements[0].credits_amount;
      creditsGranted = amount ? Number(amount) : null;
    }

    const res = NextResponse.json({
      productId: product.product_id,
      name: product.name ?? "Credits",
      description: product.description ?? null,
      priceAmount,
      currency,
      creditsGranted,
    });

    // Cache for 5 minutes, stale-while-revalidate for 1 hour
    res.headers.set(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=3600",
    );

    return res;
  } catch (e) {
    console.error("[products:credits] failed to retrieve product", {
      message: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json(
      { error: "Unable to load product info" },
      { status: 503 },
    );
  }
}
