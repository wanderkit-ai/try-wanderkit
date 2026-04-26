export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { formatDate, formatCurrency } from '@/lib/utils';
import { AdminDropActions } from './AdminDropActions';

export default async function AdminDropsPage() {
  const drops = await prisma.drop.findMany({
    include: {
      creator: { select: { name: true, slug: true } },
      operator: { select: { name: true } },
      applications: { where: { status: { in: ['APPROVED', 'DEPOSIT_PAID', 'COMPLETED'] } }, select: { id: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const STATUS_COLORS: Record<string, string> = {
    DRAFT: 'var(--color-dim)',
    REVIEW: '#ffc800',
    LIVE: 'var(--color-accent)',
    CLOSED: 'var(--color-muted)',
    COMPLETED: '#3ca86e',
    CANCELLED: 'var(--color-danger)',
  };

  return (
    <div className="p-8">
      <h1 className="font-display text-3xl font-light mb-8" style={{ color: 'var(--color-white)' }}>
        All drops
      </h1>

      <div className="border" style={{ borderColor: 'var(--color-border)' }}>
        {drops.map((drop) => (
          <div
            key={drop.id}
            className="flex items-center gap-4 px-6 py-4 border-b last:border-b-0"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <span
                  className="font-mono text-xs px-2 py-0.5"
                  style={{ color: STATUS_COLORS[drop.status] ?? 'var(--color-dim)' }}
                >
                  {drop.status}
                </span>
                <span className="text-sm font-medium truncate" style={{ color: 'var(--color-white)' }}>
                  {drop.title}
                </span>
              </div>
              <p className="font-mono text-xs" style={{ color: 'var(--color-dim)' }}>
                {drop.creator.name} · {drop.destination} · {formatDate(drop.departureDate)} · {drop.applications.length}/{drop.totalSpots} spots · {formatCurrency(drop.pricePerPerson)}/person
              </p>
            </div>

            <AdminDropActions dropId={drop.id} status={drop.status} />
          </div>
        ))}
      </div>
    </div>
  );
}
