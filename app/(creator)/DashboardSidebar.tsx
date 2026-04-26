'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Props {
  creator: { name: string; handle: string; photoUrl: string | null } | null;
  isAdmin: boolean;
}

const NAV = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/drops', label: 'My drops' },
  { href: '/drops/new', label: 'New drop' },
  { href: '/settings', label: 'Settings' },
];

export function DashboardSidebar({ creator, isAdmin }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await supabase.auth.signOut();
    router.push('/');
  }

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 w-56 flex flex-col border-r"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
    >
      {/* Logo */}
      <div className="p-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <Link href="/" className="font-mono text-sm tracking-widest" style={{ color: 'var(--color-accent)' }}>
          TRIPDROP
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {NAV.map(({ href, label }) => {
          const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="block px-4 py-2 text-sm rounded-sm transition-colors"
              style={{
                background: active ? 'var(--color-accent-dim)' : 'transparent',
                color: active ? 'var(--color-accent)' : 'var(--color-muted)',
                border: active ? '1px solid var(--color-accent)' : '1px solid transparent',
              }}
            >
              {label}
            </Link>
          );
        })}

        {isAdmin && (
          <Link
            href="/admin"
            className="block px-4 py-2 text-sm"
            style={{ color: 'var(--color-dim)' }}
          >
            Admin panel →
          </Link>
        )}
      </nav>

      {/* Creator info */}
      {creator && (
        <div className="p-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <p className="text-sm font-medium mb-0.5 truncate" style={{ color: 'var(--color-white)' }}>
            {creator.name}
          </p>
          <p className="text-xs truncate mb-3" style={{ color: 'var(--color-dim)' }}>
            @{creator.handle}
          </p>
          <button
            onClick={logout}
            className="text-xs font-mono"
            style={{ color: 'var(--color-dim)' }}
          >
            Sign out
          </button>
        </div>
      )}
    </aside>
  );
}
