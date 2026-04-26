import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/supabase-server';

const createSchema = z.object({
  title: z.string().min(1),
  destination: z.string().min(1),
  country: z.string().min(1),
  departureDate: z.string(),
  returnDate: z.string(),
  applicationDeadline: z.string(),
  totalSpots: z.number().int().positive().default(12),
  pricePerPerson: z.number().int().positive(),
  depositAmount: z.number().int().positive(),
  slug: z.string().min(1),
  description: z.string().default(''),
  itinerary: z.any().default([]),
  included: z.any().default([]),
  excluded: z.array(z.string()).default([]),
  faqs: z.any().default([]),
});

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  const isAdmin = user.user_metadata?.role === 'admin';

  let drops;
  if (isAdmin) {
    drops = await prisma.drop.findMany({
      where: status ? { status: status as any } : undefined,
      include: { creator: true, operator: true },
      orderBy: { createdAt: 'desc' },
    });
  } else {
    const creator = await prisma.creator.findUnique({ where: { userId: user.id } });
    if (!creator) return NextResponse.json([]);

    drops = await prisma.drop.findMany({
      where: { creatorId: creator.id, ...(status ? { status: status as any } : {}) },
      include: {
        applications: {
          where: { status: { in: ['APPROVED', 'DEPOSIT_PAID', 'COMPLETED'] } },
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  return NextResponse.json(drops);
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });

  const creator = await prisma.creator.findUnique({ where: { userId: user.id } });
  if (!creator) return NextResponse.json({ error: { code: 'NOT_CREATOR' } }, { status: 403 });

  const body = await request.json();
  const data = createSchema.safeParse(body);
  if (!data.success) {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', fields: data.error.flatten().fieldErrors } }, { status: 400 });
  }

  const drop = await prisma.drop.create({
    data: {
      ...data.data,
      creatorId: creator.id,
      departureDate: new Date(data.data.departureDate),
      returnDate: new Date(data.data.returnDate),
      applicationDeadline: new Date(data.data.applicationDeadline),
    },
  });

  return NextResponse.json(drop, { status: 201 });
}
