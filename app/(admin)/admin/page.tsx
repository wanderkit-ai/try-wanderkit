export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { formatCurrency } from '@/lib/utils';

export default async function AdminPage() {
  const [drops, applications, creators] = await Promise.all([
    prisma.drop.findMany({
      include: {
        creator: { select: { name: true } },
        applications: { where: { status: { in: ['DEPOSIT_PAID', 'COMPLETED'] } }, select: { depositAmount: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.application.count(),
    prisma.creator.findMany({ orderBy: { createdAt: 'desc' } }),
  ]);

  const gmv = drops.reduce((sum, d) => {
    return sum + d.applications.reduce((s, a) => s + (a.depositAmount ?? 0), 0);
  }, 0);

  const liveDrops = drops.filter((d) => d.status === 'LIVE').length;
  const pendingReview = drops.filter((d) => d.status === 'REVIEW').length;
  const pendingCreators = creators.filter((c) => c.status === 'PENDING').length;

  return (
    <div className="p-8">
      <p className="font-mono text-xs tracking-widest mb-2" style={{ color: 'var(--color-accent)' }}>
        ADMIN
      </p>
      <h1 className="font-display text-4xl font-light mb-10" style={{ color: 'var(--color-white)' }}>
        Operations.
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-px mb-10" style={{ background: 'var(--color-border)' }}>
        {[
          { label: 'GMV (all time)', value: formatCurrency(gmv) },
          { label: 'Live drops', value: liveDrops.toString() },
          { label: 'Drops in review', value: pendingReview.toString() },
          { label: 'Pending creators', value: pendingCreators.toString() },
        ].map(({ label, value }) => (
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

      {pendingReview > 0 && (
        <div
          className="p-4 border mb-6"
          style={{ borderColor: '#ffc800', background: 'rgba(255,200,0,0.08)' }}
        >
          <p className="font-mono text-xs" style={{ color: '#ffc800' }}>
            {pendingReview} drop(s) awaiting review →{' '}
            <a href="/admin/drops" style={{ textDecoration: 'underline' }}>Review now</a>
          </p>
        </div>
      )}

      {pendingCreators > 0 && (
        <div
          className="p-4 border"
          style={{ borderColor: '#ff9d57', background: 'rgba(255,157,87,0.08)' }}
        >
          <p className="font-mono text-xs" style={{ color: '#ff9d57' }}>
            {pendingCreators} creator(s) pending approval →{' '}
            <a href="/admin/creators" style={{ textDecoration: 'underline' }}>Approve now</a>
          </p>
        </div>
      )}
    </div>
  );
}
