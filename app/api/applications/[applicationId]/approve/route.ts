import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { resend, FROM_EMAIL } from '@/lib/resend';
import { getUser } from '@/lib/supabase-server';
import { formatCurrency, formatDate } from '@/lib/utils';

const BASE_URL = process.env.NEXT_PUBLIC_URL!;

export async function POST(
  request: NextRequest,
  { params }: { params: { applicationId: string } }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const application = await prisma.application.findUnique({
      where: { id: params.applicationId },
      include: {
        drop: {
          include: {
            creator: true,
            applications: {
              where: { status: { in: ['APPROVED', 'DEPOSIT_PAID', 'COMPLETED'] } },
              select: { id: true },
            },
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Application not found' } }, { status: 404 });
    }

    const drop = application.drop;
    const isAdmin = user.user_metadata?.role === 'admin';
    const isCreator = drop.creator.userId === user.id;

    if (!isAdmin && !isCreator) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Access denied' } }, { status: 403 });
    }

    const confirmedCount = drop.applications.filter((a) => a.id !== application.id).length;
    if (confirmedCount >= drop.totalSpots) {
      return NextResponse.json(
        { error: { code: 'NO_SPOTS', message: 'No spots remaining' } },
        { status: 422 }
      );
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Deposit — ${drop.title}`,
              description: drop.depositDeadline
                ? `Refundable until ${formatDate(drop.depositDeadline)}`
                : undefined,
            },
            unit_amount: drop.depositAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${BASE_URL}/booking-confirmed?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/${drop.creator.slug}/${drop.slug}`,
      customer_email: application.email,
      metadata: {
        applicationId: application.id,
        dropId: drop.id,
        type: 'deposit',
      },
    });

    // Update application
    await prisma.application.update({
      where: { id: application.id },
      data: {
        status: 'APPROVED',
        reviewedAt: new Date(),
        stripeSessionId: session.id,
      },
    });

    // Send approval email
    resend.emails.send({
      from: FROM_EMAIL,
      to: application.email,
      subject: `You're approved for ${drop.title} — one step left.`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #f5f0e8; padding: 40px;">
          <h1 style="color: #1a1612;">You're approved! 🎉</h1>
          <p style="color: #1a1612;">Congratulations, ${application.firstName}. Your spot on <strong>${drop.title}</strong> is approved — but it's not confirmed until your deposit is paid.</p>
          <div style="margin: 32px 0;">
            <a href="${session.url}" style="background: #c8600a; color: white; padding: 16px 32px; text-decoration: none; display: inline-block; font-weight: bold;">
              Pay ${formatCurrency(drop.depositAmount)} deposit →
            </a>
          </div>
          ${drop.depositDeadline ? `<p style="color: #8a7a6a; font-size: 14px;">Your spot is held until ${formatDate(drop.depositDeadline)}.</p>` : ''}
          <p style="color: #6b5f52; font-size: 12px; margin-top: 32px;">— The Tripdrop team, on behalf of ${drop.creator.name}</p>
        </div>
      `,
    }).catch(console.error);

    return NextResponse.json({ success: true, checkoutUrl: session.url });
  } catch (error) {
    console.error('Approval error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to process approval' } },
      { status: 500 }
    );
  }
}
