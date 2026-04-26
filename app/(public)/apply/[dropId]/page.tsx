import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ApplicationForm } from './ApplicationForm';

interface PageProps {
  params: { dropId: string };
}

export default async function ApplyPage({ params }: PageProps) {
  const drop = await prisma.drop.findUnique({
    where: { id: params.dropId },
    include: {
      creator: { select: { name: true, slug: true } },
      applications: {
        where: { status: { in: ['APPROVED', 'DEPOSIT_PAID', 'COMPLETED'] } },
        select: { id: true },
      },
    },
  });

  if (!drop || drop.status !== 'LIVE') notFound();

  const spotsRemaining = drop.totalSpots - drop.applications.length;
  const isOpen = new Date(drop.applicationDeadline) > new Date();

  if (!isOpen || spotsRemaining <= 0) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-8 text-center"
        style={{ background: 'var(--color-bg)', color: 'var(--color-white)' }}
      >
        <p className="font-mono text-xs tracking-widest mb-6" style={{ color: 'var(--color-dim)' }}>
          APPLICATIONS CLOSED
        </p>
        <h1 className="font-display text-5xl font-light">
          {spotsRemaining <= 0 ? 'This drop is full.' : 'Applications have closed.'}
        </h1>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--color-bg)', color: 'var(--color-white)' }}
    >
      <ApplicationForm
        drop={{
          id: drop.id,
          title: drop.title,
          destination: drop.destination,
          departureDate: drop.departureDate.toISOString(),
          returnDate: drop.returnDate.toISOString(),
          depositAmount: drop.depositAmount,
          singleSupplement: drop.singleSupplement,
          creatorName: drop.creator.name,
          spotsRemaining,
        }}
      />
    </div>
  );
}
