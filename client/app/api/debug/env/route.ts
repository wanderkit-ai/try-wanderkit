export const runtime = 'nodejs';

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL ?? 'http://127.0.0.1:8000';

export async function GET() {
  const upstream = await fetch(`${FASTAPI_BASE_URL}/api/debug/env`, {
    cache: 'no-store',
  });
  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json',
    },
  });
}
