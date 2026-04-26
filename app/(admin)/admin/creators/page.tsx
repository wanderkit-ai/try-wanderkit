export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { formatDate } from '@/lib/utils';
import { AdminCreatorActions } from './AdminCreatorActions';

export default async function AdminCreatorsPage() {
  const creators = await prisma.creator.findMany({
    include: { drops: { select: { id: true, status: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="p-8">
      <h1 className="font-display text-3xl font-light mb-8" style={{ color: 'var(--color-white)' }}>
        Creators
      </h1>

      <div className="border" style={{ borderColor: 'var(--color-border)' }}>
        {creators.map((creator) => (
          <div
            key={creator.id}
            className="flex items-center gap-4 px-6 py-4 border-b last:border-b-0"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <span
                  className="font-mono text-xs px-2 py-0.5"
                  style={{
                    color: creator.status === 'APPROVED' ? 'var(--color-accent)' : creator.status === 'PENDING' ? '#ffc800' : 'var(--color-danger)',
                  }}
                >
                  {creator.status}
                </span>
                <span className="text-sm font-medium" style={{ color: 'var(--color-white)' }}>
                  {creator.name}
                </span>
                <span className="font-mono text-xs" style={{ color: 'var(--color-dim)' }}>
                  @{creator.handle}
                </span>
              </div>
              <p className="font-mono text-xs" style={{ color: 'var(--color-dim)' }}>
                {creator.email} · {creator.primaryPlatform ?? 'unknown'} ·{' '}
                {creator.followerCount?.toLocaleString() ?? '?'} followers ·{' '}
                {creator.drops.length} drops · joined {formatDate(creator.createdAt)}
              </p>
            </div>

            <AdminCreatorActions creatorId={creator.id} status={creator.status} />
          </div>
        ))}
      </div>
    </div>
  );
}
