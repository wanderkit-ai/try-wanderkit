import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getUser } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';
import { formatDate, formatCurrency } from '@/lib/utils';
import { ApplicantKanban } from './ApplicantKanban';

interface PageProps {
  params: { dropId: string };
}

export default async function ApplicantsPage({ params }: PageProps) {
  const user = await getUser();
  if (!user) redirect('/auth/login');

  const drop = await prisma.drop.findUnique({
    where: { id: params.dropId },
    include: {
      creator: true,
      applications: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!drop) redirect('/drops');

  const isAdmin = user.user_metadata?.role === 'admin';
  const isCreator = drop.creator.userId === user.id;
  if (!isAdmin && !isCreator) redirect('/drops');

  const confirmed = drop.applications.filter((a) => ['DEPOSIT_PAID', 'COMPLETED'].includes(a.status)).length;
  const approved = drop.applications.filter((a) => a.status === 'APPROVED').length;
  const submitted = drop.applications.filter((a) => a.status === 'SUBMITTED').length;
  const revenueConfirmed = confirmed * drop.depositAmount;

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/drops" className="font-mono text-xs" style={{ color: 'var(--color-dim)' }}>
          ← All drops
        </Link>
        <div className="flex items-start justify-between mt-4">
          <div>
            <h1 className="font-display text-4xl font-light" style={{ color: 'var(--color-white)' }}>
              {drop.title}
            </h1>
            <p className="font-mono text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
              {drop.destination} · Applicants
            </p>
          </div>
          <Link
            href={`/drops/${drop.id}`}
            className="font-mono text-xs px-4 py-2 border"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}
          >
            Edit drop →
          </Link>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px mb-8" style={{ background: 'var(--color-border)' }}>
        {[
          { label: 'Confirmed', value: `${confirmed}/${drop.totalSpots}` },
          { label: 'Awaiting deposit', value: approved.toString() },
          { label: 'New applications', value: submitted.toString() },
          { label: 'Revenue confirmed', value: formatCurrency(revenueConfirmed) },
        ].map(({ label, value }) => (
          <div key={label} className="p-4" style={{ background: 'var(--color-surface)' }}>
            <p className="font-mono text-xs tracking-widest mb-1" style={{ color: 'var(--color-dim)' }}>
              {label.toUpperCase()}
            </p>
            <p className="font-mono text-xl font-bold" style={{ color: 'var(--color-white)' }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      <ApplicantKanban
        dropId={drop.id}
        applications={drop.applications}
        depositAmount={drop.depositAmount}
      />
    </div>
  );
}
