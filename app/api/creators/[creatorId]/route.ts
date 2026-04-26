import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/supabase-server';
import { resend, FROM_EMAIL } from '@/lib/resend';
import { supabaseAdmin } from '@/lib/supabase';

const patchSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'SUSPENDED']).optional(),
  name: z.string().optional(),
  bio: z.string().optional(),
  payoutEmail: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { creatorId: string } }
) {
  const user = await getUser();
  if (!user || user.user_metadata?.role !== 'admin') {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
  }

  const body = await request.json();
  const data = patchSchema.safeParse(body);
  if (!data.success) {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR' } }, { status: 400 });
  }

  const creator = await prisma.creator.update({
    where: { id: params.creatorId },
    data: {
      ...data.data,
      approvedAt: data.data.status === 'APPROVED' ? new Date() : undefined,
    },
  });

  if (data.data.status === 'APPROVED') {
    // Send magic link welcome email
    const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: creator.email,
      options: { redirectTo: `${process.env.NEXT_PUBLIC_URL}/dashboard` },
    });

    resend.emails.send({
      from: FROM_EMAIL,
      to: creator.email,
      subject: `Welcome to Tripdrop, ${creator.name} 🎉`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #f5f0e8; padding: 40px;">
          <h1 style="color: #1a1612;">You're approved, ${creator.name}!</h1>
          <p style="color: #1a1612;">Your Tripdrop creator account is ready. Click below to sign in and start building your first drop.</p>
          ${linkData?.properties?.action_link ? `
            <div style="margin: 32px 0;">
              <a href="${linkData.properties.action_link}" style="background: #c8600a; color: white; padding: 16px 32px; text-decoration: none; display: inline-block; font-weight: bold;">
                Sign in to Tripdrop →
              </a>
            </div>
          ` : ''}
          <p style="color: #6b5f52; font-size: 12px; margin-top: 32px;">— The Tripdrop team</p>
        </div>
      `,
    }).catch(console.error);
  }

  return NextResponse.json(creator);
}
