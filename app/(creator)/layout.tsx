import { redirect } from 'next/navigation';
import { getUser } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';
import { DashboardSidebar } from './DashboardSidebar';

export default async function CreatorLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect('/auth/login');

  const role = user.user_metadata?.role;
  if (role !== 'creator' && role !== 'admin') redirect('/');

  const creator = role === 'creator'
    ? await prisma.creator.findUnique({ where: { userId: user.id } })
    : null;

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--color-bg)', color: 'var(--color-white)' }}>
      <DashboardSidebar
        creator={creator ? { name: creator.name, handle: creator.handle, photoUrl: creator.photoUrl } : null}
        isAdmin={role === 'admin'}
      />
      <main className="flex-1 ml-56 min-h-screen overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
