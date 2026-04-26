import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/supabase-server';

const patchSchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  creatorNote: z.string().optional(),
  destination: z.string().optional(),
  country: z.string().optional(),
  heroImageUrl: z.string().optional(),
  galleryImages: z.array(z.string()).optional(),
  departureDate: z.string().optional(),
  returnDate: z.string().optional(),
  applicationDeadline: z.string().optional(),
  totalSpots: z.number().optional(),
  pricePerPerson: z.number().optional(),
  depositAmount: z.number().optional(),
  depositDeadline: z.string().optional(),
  singleSupplement: z.number().optional(),
  itinerary: z.any().optional(),
  included: z.any().optional(),
  excluded: z.array(z.string()).optional(),
  faqs: z.any().optional(),
  status: z.enum(['DRAFT', 'REVIEW', 'LIVE', 'CLOSED', 'COMPLETED', 'CANCELLED']).optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  operatorId: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { dropId: string } }
) {
  const drop = await prisma.drop.findUnique({
    where: { id: params.dropId },
    include: {
      creator: true,
      operator: true,
      applications: {
        where: { status: { in: ['APPROVED', 'DEPOSIT_PAID', 'COMPLETED'] } },
        select: { id: true },
      },
    },
  });

  if (!drop) return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 });

  const user = await getUser();
  if (drop.status !== 'LIVE') {
    if (!user) return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 });
    const isAdmin = user.user_metadata?.role === 'admin';
    const isCreator = drop.creator.userId === user.id;
    if (!isAdmin && !isCreator) return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 });
  }

  const confirmedBookings = drop.applications.length;
  return NextResponse.json({
    ...drop,
    confirmedBookings,
    spotsRemaining: drop.totalSpots - confirmedBookings,
    percentFilled: Math.round((confirmedBookings / drop.totalSpots) * 100),
    isSoldOut: confirmedBookings >= drop.totalSpots,
    isApplicationOpen: drop.status === 'LIVE' && new Date(drop.applicationDeadline) > new Date(),
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { dropId: string } }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });

  const drop = await prisma.drop.findUnique({
    where: { id: params.dropId },
    include: { creator: true },
  });

  if (!drop) return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 });

  const isAdmin = user.user_metadata?.role === 'admin';
  const isCreator = drop.creator.userId === user.id;
  if (!isAdmin && !isCreator) return NextResponse.json({ error: { code: 'FORBIDDEN' } }, { status: 403 });

  const body = await request.json();
  const data = patchSchema.safeParse(body);
  if (!data.success) {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', fields: data.error.flatten().fieldErrors } }, { status: 400 });
  }

  const updateData: any = { ...data.data };
  if (updateData.departureDate) updateData.departureDate = new Date(updateData.departureDate);
  if (updateData.returnDate) updateData.returnDate = new Date(updateData.returnDate);
  if (updateData.applicationDeadline) updateData.applicationDeadline = new Date(updateData.applicationDeadline);
  if (updateData.depositDeadline) updateData.depositDeadline = new Date(updateData.depositDeadline);

  const updated = await prisma.drop.update({
    where: { id: params.dropId },
    data: updateData,
  });

  return NextResponse.json(updated);
}
