import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { resend, FROM_EMAIL, ADMIN_EMAIL } from '@/lib/resend';

const schema = z.object({
  dropId: z.string(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  instagramHandle: z.string().optional(),
  nationality: z.string().min(1),
  passportCountry: z.string().min(1),
  roomPreference: z.enum(['TWIN_SHARE', 'SINGLE_SUPPLEMENT']),
  dietaryNeeds: z.string().optional(),
  medicalNotes: z.string().optional(),
  emergencyName: z.string().min(1),
  emergencyPhone: z.string().min(1),
  motivation: z.string().min(100).max(2000),
  heardAbout: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = schema.safeParse(body);

    if (!data.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            fields: data.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const { dropId, ...applicationData } = data.data;

    const drop = await prisma.drop.findUnique({
      where: { id: dropId },
      include: {
        creator: { select: { name: true, email: true, slug: true } },
        applications: {
          where: { status: { in: ['APPROVED', 'DEPOSIT_PAID', 'COMPLETED'] } },
          select: { id: true },
        },
      },
    });

    if (!drop || drop.status !== 'LIVE') {
      return NextResponse.json(
        { error: { code: 'DROP_NOT_FOUND', message: 'Drop not found or not accepting applications' } },
        { status: 404 }
      );
    }

    // Check duplicate
    const existing = await prisma.application.findUnique({
      where: { dropId_email: { dropId, email: applicationData.email } },
    });

    if (existing) {
      return NextResponse.json(
        { error: { code: 'DUPLICATE_APPLICATION', message: 'An application with this email already exists' } },
        { status: 409 }
      );
    }

    const confirmedCount = drop.applications.length;
    const isFull = confirmedCount >= drop.totalSpots;
    const status = isFull ? 'WAITLISTED' : 'SUBMITTED';

    const application = await prisma.application.create({
      data: {
        dropId,
        ...applicationData,
        status,
      },
    });

    // Send emails (fire and forget)

    resend.emails.send({
      from: FROM_EMAIL,
      to: applicationData.email,
      subject: `Your application for ${drop.title} — we've got it.`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #f5f0e8; padding: 40px;">
          <h1 style="color: #1a1612; font-size: 28px; margin-bottom: 8px;">${drop.title}</h1>
          <p style="color: #1a1612; margin-bottom: 32px;">We've received your application and ${drop.creator.name} will review it personally within 48 hours.</p>
          <p style="color: #6b5f52; font-size: 14px;"><strong>What happens next:</strong><br>1. Review (48hrs) → 2. Approval email → 3. Deposit payment → 4. You're confirmed</p>
          <p style="color: #6b5f52; font-size: 12px; margin-top: 32px;">— The Tripdrop team, on behalf of ${drop.creator.name}</p>
        </div>
      `,
    }).catch(console.error);

    resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `New application: ${applicationData.firstName} ${applicationData.lastName} for ${drop.title}`,
      html: `
        <p>New application received.</p>
        <p><strong>Applicant:</strong> ${applicationData.firstName} ${applicationData.lastName} (${applicationData.email})</p>
        <p><strong>Drop:</strong> ${drop.title}</p>
        <p><strong>Status:</strong> ${status}</p>
      `,
    }).catch(console.error);

    return NextResponse.json({ success: true, applicationId: application.id, status });
  } catch (error) {
    console.error('Application creation error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create application' } },
      { status: 500 }
    );
  }
}
