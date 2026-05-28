import { NextResponse } from "next/server";

import { AdminAuthError, requireSuperadmin } from "@/lib/admin";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

type CreateModelBody = {
  providerModel?: unknown;
  label?: unknown;
  enabled?: unknown;
  sortOrder?: unknown;
};

function parseCreateModelBody(body: CreateModelBody): {
  providerModel: string;
  label: string;
  enabled: boolean;
  sortOrder: number;
} | { error: string } {
  const providerModel =
    typeof body.providerModel === "string" ? body.providerModel.trim() : "";
  if (!providerModel) return { error: 'Field "providerModel" is required' };

  const label = typeof body.label === "string" ? body.label.trim() : "";
  const enabled = typeof body.enabled === "boolean" ? body.enabled : true;
  const sortOrderRaw =
    typeof body.sortOrder === "number" ? body.sortOrder : Number(body.sortOrder);
  const sortOrder = Number.isFinite(sortOrderRaw) ? Math.trunc(sortOrderRaw) : 0;

  return { providerModel, label, enabled, sortOrder };
}

export async function GET() {
  try {
    await requireSuperadmin();
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("admin_image_models")
    .select("id, provider_model, label, enabled, sort_order, created_at")
    .order("enabled", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "Failed to load models", detail: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json(
    (data ?? []).map((m) => ({
      id: m.id,
      providerModel: m.provider_model,
      label: m.label ?? "",
      enabled: Boolean(m.enabled),
      sortOrder: m.sort_order ?? 0,
      createdAt: m.created_at,
    })),
  );
}

export async function POST(request: Request) {
  try {
    await requireSuperadmin();
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }

  let body: CreateModelBody;
  try {
    body = (await request.json()) as CreateModelBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = parseCreateModelBody(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("admin_image_models")
    .insert({
      provider_model: parsed.providerModel,
      label: parsed.label,
      enabled: parsed.enabled,
      sort_order: parsed.sortOrder,
    })
    .select("id, provider_model, label, enabled, sort_order, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Model already exists" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Failed to create model", detail: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      id: data.id,
      providerModel: data.provider_model,
      label: data.label ?? "",
      enabled: Boolean(data.enabled),
      sortOrder: data.sort_order ?? 0,
      createdAt: data.created_at,
    },
    { status: 201 },
  );
}

