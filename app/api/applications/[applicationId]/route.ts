import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/supabase-server';

const patchSchema = z.object({
  status: z.enum(['UNDER_REVIEW', 'WAITLISTED', 'REJECTED', 'WITHDRAWN']).optional(),
  reviewNote: z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { applicationId: string } }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });

  const application = await prisma.application.findUnique({
    where: { id: params.applicationId },
    include: { drop: { include: { creator: true } } },
  });

  if (!application) return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 });

  const isAdmin = user.user_metadata?.role === 'admin';
  const isCreator = application.drop.creator.userId === user.id;
  if (!isAdmin && !isCreator) return NextResponse.json({ error: { code: 'FORBIDDEN' } }, { status: 403 });

  return NextResponse.json(application);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { applicationId: string } }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });

  const body = await request.json();
  const data = patchSchema.safeParse(body);
  if (!data.success) {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', fields: data.error.flatten().fieldErrors } }, { status: 400 });
  }

  const application = await prisma.application.findUnique({
    where: { id: params.applicationId },
    include: { drop: { include: { creator: true } } },
  });

  if (!application) return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 });

  const isAdmin = user.user_metadata?.role === 'admin';
  const isCreator = application.drop.creator.userId === user.id;
  if (!isAdmin && !isCreator) return NextResponse.json({ error: { code: 'FORBIDDEN' } }, { status: 403 });

  const updated = await prisma.application.update({
    where: { id: params.applicationId },
    data: {
      ...data.data,
      reviewedAt: data.data.status ? new Date() : undefined,
    },
  });

  return NextResponse.json(updated);
}
