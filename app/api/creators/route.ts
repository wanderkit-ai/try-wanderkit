import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/supabase-server';
import { resend, FROM_EMAIL, ADMIN_EMAIL } from '@/lib/resend';
import { supabaseAdmin } from '@/lib/supabase';

const schema = z.object({
  name: z.string().min(1),
  handle: z.string().min(1),
  slug: z.string().min(1),
  email: z.string().email(),
  bio: z.string().optional(),
  followerCount: z.number().int().optional(),
  primaryPlatform: z.enum(['instagram', 'youtube', 'tiktok', 'substack']).optional(),
  websiteUrl: z.string().url().optional(),
});

export async function GET(_request: NextRequest) {
  const user = await getUser();
  if (!user || user.user_metadata?.role !== 'admin') {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
  }

  const creators = await prisma.creator.findMany({
    include: { drops: { select: { id: true, status: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(creators);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const data = schema.safeParse(body);
  if (!data.success) {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', fields: data.error.flatten().fieldErrors } }, { status: 400 });
  }

  // Sign up user in Supabase Auth (send magic link later)
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: data.data.email,
    email_confirm: true,
    user_metadata: { role: 'creator', name: data.data.name },
  });

  if (authError || !authData.user) {
    return NextResponse.json(
      { error: { code: 'AUTH_ERROR', message: authError?.message ?? 'Failed to create user' } },
      { status: 400 }
    );
  }

  const creator = await prisma.creator.create({
    data: {
      ...data.data,
      userId: authData.user.id,
      status: 'PENDING',
    },
  });

  resend.emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject: `New creator signup: ${data.data.name}`,
    html: `<p>${data.data.name} (@${data.data.handle}) has signed up. Review and approve in the admin panel.</p>`,
  }).catch(console.error);

  return NextResponse.json(creator, { status: 201 });
}
