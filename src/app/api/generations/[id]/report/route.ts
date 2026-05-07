type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  return Response.json(
    {
      error: "Not implemented",
      route: "POST /api/generations/:id/report",
      id,
    },
    { status: 501 },
  );
}
