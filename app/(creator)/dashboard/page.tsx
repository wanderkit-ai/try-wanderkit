export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getUser } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';
import { formatCurrency, formatDate } from '@/lib/utils';

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect('/auth/login');

  const creator = await prisma.creator.findUnique({
    where: { userId: user.id },
    include: {
      drops: {
        include: {
          applications: {
            select: { id: true, status: true, firstName: true, lastName: true, email: true, createdAt: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!creator) redirect('/auth/login');

  const allApps = creator.drops.flatMap((d) => d.applications.map((a) => ({ ...a, dropTitle: d.title, dropId: d.id })));
  const confirmedApps = allApps.filter((a) => ['DEPOSIT_PAID', 'COMPLETED'].includes(a.status));
  const revenueYtd = creator.drops.reduce((sum, d) => {
    const confirmed = d.applications.filter((a) => ['DEPOSIT_PAID', 'COMPLETED'].includes(a.status)).length;
    return sum + confirmed * d.depositAmount;
  }, 0);
  const openApplications = allApps.filter((a) => a.status === 'SUBMITTED').length;

  const liveDrops = creator.drops.filter((d) => d.status === 'LIVE');
  const nextDrop = creator.drops
    .filter((d) => ['LIVE', 'REVIEW', 'DRAFT'].includes(d.status) && new Date(d.departureDate) > new Date())
    .sort((a, b) => new Date(a.departureDate).getTime() - new Date(b.departureDate).getTime())[0];

  const daysUntilDeparture = nextDrop
    ? Math.max(0, Math.ceil((new Date(nextDrop.departureDate).getTime() - Date.now()) / 86400000))
    : null;

  const recentApps = allApps.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 10);

  const stats = [
    { label: 'Revenue YTD', value: formatCurrency(revenueYtd) },
    { label: 'Active bookings', value: confirmedApps.length.toString() },
    { label: 'Open applications', value: openApplications.toString() },
    { label: 'Next departure', value: daysUntilDeparture !== null ? `${daysUntilDeparture}d` : '—' },
  ];

  return (
    <div className="p-8">
      <div className="mb-10">
        <p className="font-mono text-xs tracking-widest mb-2" style={{ color: 'var(--color-accent)' }}>
          DASHBOARD
        </p>
        <h1 className="font-display text-4xl font-light" style={{ color: 'var(--color-white)' }}>
          Welcome back, {creator.name.split(' ')[0]}.
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px mb-10" style={{ background: 'var(--color-border)' }}>
        {stats.map(({ label, value }) => (
          <div key={label} className="p-6" style={{ background: 'var(--color-surface)' }}>
            <p className="font-mono text-xs tracking-widest mb-2" style={{ color: 'var(--color-dim)' }}>
              {label.toUpperCase()}
            </p>
            <p className="font-mono text-3xl font-bold" style={{ color: 'var(--color-white)' }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Active live drop */}
      {liveDrops.length > 0 && (
        <div className="mb-10">
          <p className="font-mono text-xs tracking-widest mb-4" style={{ color: 'var(--color-dim)' }}>
            ACTIVE DROP
          </p>
          {liveDrops.map((drop) => {
            const confirmed = drop.applications.filter((a) => ['APPROVED', 'DEPOSIT_PAID', 'COMPLETED'].includes(a.status)).length;
            const pct = Math.round((confirmed / drop.totalSpots) * 100);
            return (
              <div
                key={drop.id}
                className="p-6 border"
                style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="font-display text-2xl font-light mb-1" style={{ color: 'var(--color-white)' }}>
                      {drop.title}
                    </h2>
                    <p className="font-mono text-xs" style={{ color: 'var(--color-muted)' }}>
                      {drop.destination} · {formatDate(drop.departureDate)}
                    </p>
                  </div>
                  <span
                    className="font-mono text-xs px-2 py-1"
                    style={{ background: 'var(--color-accent-dim)', color: 'var(--color-accent)', border: '1px solid var(--color-accent)' }}
                  >
                    LIVE
                  </span>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-xs font-mono mb-1" style={{ color: 'var(--color-muted)' }}>
                    <span>{confirmed} confirmed</span>
                    <span>{drop.totalSpots} total spots</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
                    <div
                      className="h-full"
                      style={{ width: `${pct}%`, background: 'var(--color-accent)' }}
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Link
                    href={`/creator/${creator.slug}/${drop.slug}`}
                    target="_blank"
                    className="text-xs font-mono px-4 py-2 border"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}
                  >
                    View page →
                  </Link>
                  <Link
                    href={`/drops/${drop.id}/applicants`}
                    className="text-xs font-mono px-4 py-2"
                    style={{ background: 'var(--color-accent)', color: '#080808' }}
                  >
                    Review applications
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recent applications */}
      <div>
        <p className="font-mono text-xs tracking-widest mb-4" style={{ color: 'var(--color-dim)' }}>
          RECENT APPLICATIONS
        </p>
        <div className="border" style={{ borderColor: 'var(--color-border)' }}>
          {recentApps.length === 0 ? (
            <div className="p-8 text-center" style={{ color: 'var(--color-dim)' }}>
              <p className="text-sm">No applications yet.</p>
            </div>
          ) : (
            recentApps.map((app, i) => (
              <div
                key={app.id}
                className="flex items-center justify-between px-6 py-4 border-b last:border-b-0"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-white)' }}>
                    {app.firstName} {app.lastName}
                  </p>
                  <p className="font-mono text-xs" style={{ color: 'var(--color-dim)' }}>
                    {app.dropTitle} · {formatDate(app.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <StatusBadge status={app.status} />
                  {app.status === 'SUBMITTED' && (
                    <Link
                      href={`/drops/${app.dropId}/applicants`}
                      className="font-mono text-xs"
                      style={{ color: 'var(--color-accent)' }}
                    >
                      Review →
                    </Link>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    SUBMITTED: { bg: 'rgba(255,255,255,0.08)', color: 'rgba(245,245,240,0.6)' },
    UNDER_REVIEW: { bg: 'rgba(255,200,0,0.12)', color: '#ffc800' },
    APPROVED: { bg: 'rgba(87,148,255,0.12)', color: '#5794ff' },
    DEPOSIT_PAID: { bg: 'rgba(200,255,87,0.12)', color: 'var(--color-accent)' },
    WAITLISTED: { bg: 'rgba(255,157,87,0.12)', color: '#ff9d57' },
    REJECTED: { bg: 'rgba(255,87,87,0.12)', color: 'var(--color-danger)' },
    WITHDRAWN: { bg: 'rgba(255,255,255,0.05)', color: 'var(--color-dim)' },
    COMPLETED: { bg: 'rgba(87,255,140,0.12)', color: '#3ca86e' },
  };
  const style = colors[status] ?? colors.SUBMITTED;
  return (
    <span
      className="font-mono text-xs px-2 py-0.5"
      style={{ background: style.bg, color: style.color }}
    >
      {status.replace('_', ' ')}
    </span>
  );
}
