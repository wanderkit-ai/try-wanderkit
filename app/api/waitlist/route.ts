import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const schema = z.object({
  dropId: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const data = schema.safeParse(body);
  if (!data.success) {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', fields: data.error.flatten().fieldErrors } }, { status: 400 });
  }

  try {
    const entry = await prisma.waitlist.create({ data: data.data });
    return NextResponse.json({ success: true, id: entry.id });
  } catch {
    return NextResponse.json({ error: { code: 'DUPLICATE', message: 'Already on waitlist' } }, { status: 409 });
  }
}
