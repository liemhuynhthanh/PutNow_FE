export function GET() {
  return Response.json(
    { status: "ok", service: "putnow-frontend" },
    {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
