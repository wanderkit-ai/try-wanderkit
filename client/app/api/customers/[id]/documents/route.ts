import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL ?? 'http://127.0.0.1:8000';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.text();
  const upstream = await fetch(`${FASTAPI_BASE_URL}/api/customers/${params.id}/documents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    cache: 'no-store',
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json',
    },
  });
}
