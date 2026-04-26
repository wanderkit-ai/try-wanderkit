export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getUser } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';
import { formatDate, formatCurrency } from '@/lib/utils';

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  DRAFT: { color: 'var(--color-dim)', bg: 'rgba(255,255,255,0.05)' },
  REVIEW: { color: '#ffc800', bg: 'rgba(255,200,0,0.12)' },
  LIVE: { color: 'var(--color-accent)', bg: 'var(--color-accent-dim)' },
  CLOSED: { color: 'var(--color-muted)', bg: 'rgba(255,255,255,0.05)' },
  COMPLETED: { color: '#3ca86e', bg: 'rgba(87,255,140,0.12)' },
  CANCELLED: { color: 'var(--color-danger)', bg: 'rgba(255,87,87,0.12)' },
};

export default async function DropsPage() {
  const user = await getUser();
  if (!user) redirect('/auth/login');

  const creator = await prisma.creator.findUnique({ where: { userId: user.id } });
  if (!creator) redirect('/auth/login');

  const drops = await prisma.drop.findMany({
    where: { creatorId: creator.id },
    include: {
      applications: {
        where: { status: { in: ['APPROVED', 'DEPOSIT_PAID', 'COMPLETED'] } },
        select: { id: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="font-mono text-xs tracking-widest mb-2" style={{ color: 'var(--color-accent)' }}>
            MY DROPS
          </p>
          <h1 className="font-display text-4xl font-light" style={{ color: 'var(--color-white)' }}>
            Your trips.
          </h1>
        </div>
        <Link
          href="/drops/new"
          className="px-6 py-3 text-sm font-mono"
          style={{ background: 'var(--color-accent)', color: '#080808' }}
        >
          + New drop
        </Link>
      </div>

      {drops.length === 0 ? (
        <div
          className="py-24 text-center border"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
        >
          <p className="font-display text-2xl font-light mb-4" style={{ color: 'var(--color-white)' }}>
            No drops yet.
          </p>
          <p className="text-sm mb-8" style={{ color: 'var(--color-muted)' }}>
            Create your first drop to start selling trips.
          </p>
          <Link
            href="/drops/new"
            className="inline-block px-8 py-4 text-sm font-mono"
            style={{ background: 'var(--color-accent)', color: '#080808' }}
          >
            Create first drop →
          </Link>
        </div>
      ) : (
        <div className="space-y-px" style={{ background: 'var(--color-border)' }}>
          {drops.map((drop) => {
            const confirmed = drop.applications.length;
            const style = STATUS_COLORS[drop.status] ?? STATUS_COLORS.DRAFT;
            return (
              <div
                key={drop.id}
                className="flex items-center gap-6 px-6 py-5"
                style={{ background: 'var(--color-surface)' }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span
                      className="font-mono text-xs px-2 py-0.5"
                      style={{ background: style.bg, color: style.color }}
                    >
                      {drop.status}
                    </span>
                    <h2 className="font-sans font-medium truncate" style={{ color: 'var(--color-white)' }}>
                      {drop.title}
                    </h2>
                  </div>
                  <p className="font-mono text-xs" style={{ color: 'var(--color-dim)' }}>
                    {drop.destination} · {formatDate(drop.departureDate)} · {confirmed}/{drop.totalSpots} confirmed · {formatCurrency(drop.pricePerPerson)}/person
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Link
                    href={`/drops/${drop.id}/applicants`}
                    className="font-mono text-xs px-4 py-2 border"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}
                  >
                    Applicants
                  </Link>
                  <Link
                    href={`/drops/${drop.id}`}
                    className="font-mono text-xs px-4 py-2"
                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-bright)', color: 'var(--color-white)' }}
                  >
                    Edit →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
