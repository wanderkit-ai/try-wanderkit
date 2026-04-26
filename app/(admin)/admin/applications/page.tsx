export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { formatDate } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: 'rgba(245,245,240,0.6)',
  UNDER_REVIEW: '#ffc800',
  APPROVED: '#5794ff',
  DEPOSIT_PAID: 'var(--color-accent)',
  WAITLISTED: '#ff9d57',
  REJECTED: 'var(--color-danger)',
  WITHDRAWN: 'var(--color-dim)',
  COMPLETED: '#3ca86e',
};

export default async function AdminApplicationsPage() {
  const applications = await prisma.application.findMany({
    include: {
      drop: { select: { title: true, destination: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  return (
    <div className="p-8">
      <h1 className="font-display text-3xl font-light mb-8" style={{ color: 'var(--color-white)' }}>
        All applications ({applications.length})
      </h1>

      <div className="border" style={{ borderColor: 'var(--color-border)' }}>
        {applications.map((app) => (
          <div
            key={app.id}
            className="flex items-center gap-4 px-6 py-4 border-b last:border-b-0"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium mb-0.5" style={{ color: 'var(--color-white)' }}>
                {app.firstName} {app.lastName}
              </p>
              <p className="font-mono text-xs" style={{ color: 'var(--color-dim)' }}>
                {app.email} · {app.drop.title} · {formatDate(app.createdAt)}
              </p>
            </div>
            <span
              className="font-mono text-xs px-2 py-0.5 shrink-0"
              style={{ color: STATUS_COLORS[app.status] ?? 'var(--color-dim)' }}
            >
              {app.status.replace('_', ' ')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
