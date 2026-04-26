import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { resend, FROM_EMAIL } from '@/lib/resend';
import { formatCurrency } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature')!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error('Webhook signature error:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const { applicationId } = session.metadata ?? {};

      if (!applicationId) {
        return NextResponse.json({ received: true });
      }

      const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: { drop: { include: { creator: true } } },
      });

      if (!application) {
        console.error('Application not found for session:', session.id);
        return NextResponse.json({ received: true });
      }

      await prisma.application.update({
        where: { id: applicationId },
        data: {
          status: 'DEPOSIT_PAID',
          depositPaid: true,
          depositPaidAt: new Date(),
          depositAmount: session.amount_total,
          stripePaymentIntentId: session.payment_intent,
        },
      });

      const drop = application.drop;

      // Send deposit confirmation to applicant
      resend.emails.send({
        from: FROM_EMAIL,
        to: application.email,
        subject: `You're in. See you in ${drop.destination}.`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #f5f0e8; padding: 40px;">
            <h1 style="color: #1a1612;">You're confirmed! ✓</h1>
            <p style="color: #1a1612; margin-bottom: 24px;">Your deposit of <strong>${formatCurrency(session.amount_total)}</strong> has been received. Your spot on <strong>${drop.title}</strong> is confirmed.</p>
            <div style="background: #ede8e0; padding: 20px; margin: 24px 0;">
              <p style="margin: 0; color: #1a1612; font-size: 14px;"><strong>Trip:</strong> ${drop.title}</p>
              <p style="margin: 4px 0 0; color: #1a1612; font-size: 14px;"><strong>Dates:</strong> ${new Date(drop.departureDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} → ${new Date(drop.returnDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
              <p style="margin: 4px 0 0; color: #1a1612; font-size: 14px;"><strong>Deposit paid:</strong> ${formatCurrency(session.amount_total)}</p>
            </div>
            <p style="color: #6b5f52; font-size: 14px;">Pre-trip information will be sent closer to departure. Welcome to the group.</p>
            <p style="color: #6b5f52; font-size: 12px; margin-top: 32px;">— The Tripdrop team, on behalf of ${drop.creator.name}</p>
          </div>
        `,
      }).catch(console.error);

      // Notify creator
      resend.emails.send({
        from: FROM_EMAIL,
        to: drop.creator.email,
        subject: `${application.firstName} just confirmed their spot on ${drop.title}`,
        html: `
          <p><strong>${application.firstName} ${application.lastName}</strong> just paid their deposit and is confirmed for ${drop.title}.</p>
          <p>Deposit: ${formatCurrency(session.amount_total)}</p>
        `,
      }).catch(console.error);
    }

    if (event.type === 'payment_intent.payment_failed') {
      const intent = event.data.object as any;
      const application = await prisma.application.findFirst({
        where: { stripePaymentIntentId: intent.id },
        include: { drop: true },
      });

      if (application) {
        resend.emails.send({
          from: FROM_EMAIL,
          to: application.email,
          subject: `Payment failed — ${application.drop.title}`,
          html: `<p>Your payment for ${application.drop.title} failed. Please try again using the link in your approval email.</p>`,
        }).catch(console.error);
      }
    }
  } catch (error) {
    console.error('Webhook processing error:', error);
  }

  return NextResponse.json({ received: true });
}
