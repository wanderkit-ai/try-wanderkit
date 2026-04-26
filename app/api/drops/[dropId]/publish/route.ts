import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { getUser } from '@/lib/supabase-server';
import { resend, FROM_EMAIL, ADMIN_EMAIL } from '@/lib/resend';
import { formatDateRange } from '@/lib/utils';

export async function POST(
  _req: NextRequest,
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

  // Creator can submit for review; admin can publish
  if (isCreator && drop.status === 'DRAFT') {
    await prisma.drop.update({
      where: { id: params.dropId },
      data: { status: 'REVIEW' },
    });

    resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `Drop submitted for review: ${drop.title}`,
      html: `<p>${drop.creator.name} has submitted "${drop.title}" for review.</p>`,
    }).catch(console.error);

    return NextResponse.json({ success: true, status: 'REVIEW' });
  }

  if (isAdmin && drop.status === 'REVIEW') {
    // Create Stripe products if not already created
    let stripeProductId = drop.stripeProductId;
    let stripeDepositPriceId = drop.stripeDepositPriceId;
    let stripeFullPriceId = drop.stripeFullPriceId;

    if (!stripeProductId) {
      const product = await stripe.products.create({
        name: drop.title,
        description: `${drop.destination} · ${formatDateRange(drop.departureDate, drop.returnDate)}`,
        metadata: { dropId: drop.id },
      });

      const depositPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: drop.depositAmount,
        currency: 'usd',
        metadata: { type: 'deposit' },
      });

      const fullPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: drop.pricePerPerson,
        currency: 'usd',
        metadata: { type: 'full' },
      });

      stripeProductId = product.id;
      stripeDepositPriceId = depositPrice.id;
      stripeFullPriceId = fullPrice.id;
    }

    await prisma.drop.update({
      where: { id: params.dropId },
      data: {
        status: 'LIVE',
        publishedAt: new Date(),
        stripeProductId,
        stripeDepositPriceId,
        stripeFullPriceId,
      },
    });

    return NextResponse.json({ success: true, status: 'LIVE' });
  }

  return NextResponse.json({ error: { code: 'INVALID_STATE', message: 'Cannot publish in current state' } }, { status: 422 });
}
