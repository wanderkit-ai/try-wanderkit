import { redirect } from 'next/navigation';
import { getUser } from '@/lib/supabase-server';
import Link from 'next/link';

const ADMIN_NAV = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/creators', label: 'Creators' },
  { href: '/admin/drops', label: 'Drops' },
  { href: '/admin/applications', label: 'Applications' },
  { href: '/admin/operators', label: 'Operators' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user || user.user_metadata?.role !== 'admin') redirect('/auth/login');

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--color-bg)', color: 'var(--color-white)' }}>
      <aside
        className="fixed left-0 top-0 bottom-0 w-48 flex flex-col border-r"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <div className="p-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <Link href="/" className="font-mono text-xs tracking-widest" style={{ color: 'var(--color-accent)' }}>
            TRIPDROP
          </Link>
          <p className="font-mono text-xs mt-1" style={{ color: 'var(--color-dim)' }}>Admin</p>
        </div>
        <nav className="p-3 space-y-1">
          {ADMIN_NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="block px-3 py-2 text-sm"
              style={{ color: 'var(--color-muted)' }}
            >
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 ml-48">{children}</main>
    </div>
  );
}
