export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';

export default async function SettingsPage() {
  const user = await getUser();
  if (!user) redirect('/auth/login');

  const creator = await prisma.creator.findUnique({ where: { userId: user.id } });
  if (!creator) redirect('/auth/login');

  return (
    <div className="p-8 max-w-2xl">
      <p className="font-mono text-xs tracking-widest mb-2" style={{ color: 'var(--color-accent)' }}>
        SETTINGS
      </p>
      <h1 className="font-display text-4xl font-light mb-10" style={{ color: 'var(--color-white)' }}>
        Your profile.
      </h1>

      <div className="space-y-px" style={{ background: 'var(--color-border)' }}>
        {[
          { label: 'Name', value: creator.name },
          { label: 'Handle', value: `@${creator.handle}` },
          { label: 'Email', value: creator.email },
          { label: 'Platform', value: creator.primaryPlatform ?? '—' },
          { label: 'Status', value: creator.status },
          { label: 'Slug', value: `tripdrop.co/${creator.slug}` },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between p-4" style={{ background: 'var(--color-surface)' }}>
            <span className="font-mono text-xs" style={{ color: 'var(--color-dim)' }}>
              {label.toUpperCase()}
            </span>
            <span className="text-sm" style={{ color: 'var(--color-white)' }}>
              {value}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-6 text-xs" style={{ color: 'var(--color-dim)' }}>
        To update your profile, email founders@tripdrop.co
      </p>
    </div>
  );
}
