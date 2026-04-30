import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL ?? 'http://127.0.0.1:8000';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const upstream = await fetch(`${FASTAPI_BASE_URL}/api/search/hotels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    cache: 'no-store',
  });
  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
