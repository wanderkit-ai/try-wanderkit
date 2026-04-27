import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL ?? 'http://127.0.0.1:8000';

export async function POST(
  request: NextRequest,
  { params }: { params: { agent: string } }
) {
  const body = await request.text();
  const upstream = await fetch(`${FASTAPI_BASE_URL}/api/agents/${params.agent}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    cache: 'no-store',
  });

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') ?? 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
