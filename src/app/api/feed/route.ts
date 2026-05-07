export function GET(request: Request) {
  const url = new URL(request.url);
  const sort = url.searchParams.get("sort") ?? "newest";
  return Response.json(
    {
      error: "Not implemented",
      route: "GET /api/feed",
      sort,
    },
    { status: 501 },
  );
}
