'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Compass,
  Home,
  UserCircle2,
  Building2,
  Plane,
  Hotel,
  Inbox,
  Bot,
  Search,
  Settings,
  Users,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/trips', label: 'Trips', icon: Plane },
  {
    href: '/book',
    label: 'Book',
    icon: BookOpen,
    children: [
      { href: '/book?tab=flights', label: 'Flights', icon: Plane },
      { href: '/book?tab=hotels', label: 'Hotels', icon: Hotel },
    ],
  },
  { href: '/people/customers', label: 'Customers', icon: UserCircle2 },
  { href: '/people/operators', label: 'Operators', icon: Building2 },
  { href: '/leads/discover', label: 'Leads', icon: Users },
  { href: '/agents', label: 'AI Agents', icon: Bot },
  { href: '/inbox', label: 'Inbox', icon: Inbox, badge: '2' },
];

export function Sidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/');

  return (
    <aside className="w-[220px] shrink-0 bg-sidebar border-r border-border flex flex-col h-screen sticky top-0">
      <div className="px-3 py-3 flex items-center justify-between">
        <button className="flex items-center gap-2 px-2 h-8 rounded hover:bg-hover text-sm font-medium">
          <Compass className="w-4 h-4 text-accent" strokeWidth={2} />
          <span>Noma</span>
        </button>
        <button className="w-7 h-7 grid place-items-center rounded hover:bg-hover text-ink2">
          <Settings className="w-4 h-4" strokeWidth={1.75} />
        </button>
      </div>

      <div className="px-3 pb-2">
        <button className="w-full flex items-center gap-2 h-8 px-2 rounded text-sm text-ink2 hover:bg-hover">
          <Search className="w-4 h-4" strokeWidth={1.75} />
          <span>Search</span>
          <kbd className="ml-auto text-2xs text-muted bg-panel border px-1 rounded">⌘K</kbd>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
        {NAV.map((item) => {
          const active = isActive(item.href);
          return (
            <div key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-2 h-8 px-2 rounded text-sm',
                  active ? 'bg-hover text-ink font-medium' : 'text-ink2 hover:text-ink hover:bg-hover'
                )}
              >
                <item.icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                <span className="truncate flex-1">{item.label}</span>
                {'badge' in item && item.badge && (
                  <span className="text-2xs px-1.5 rounded bg-accent text-white font-medium">
                    {item.badge}
                  </span>
                )}
              </Link>
              {'children' in item && item.children && active && (
                <div className="ml-6 mt-0.5 space-y-0.5">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={cn(
                        'flex items-center gap-2 h-7 px-2 rounded text-xs',
                        pathname.includes(child.href.split('?')[0]) && pathname === '/book'
                          ? 'text-ink font-medium'
                          : 'text-ink2 hover:text-ink hover:bg-hover'
                      )}
                    >
                      <child.icon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-border p-2 flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-accent text-white text-xs grid place-items-center font-medium">
          {userEmail[0]?.toUpperCase() ?? 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-ink truncate">{userEmail}</div>
          <div className="text-2xs text-muted">Admin</div>
        </div>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="text-2xs text-muted hover:text-ink px-2 h-7 rounded hover:bg-hover"
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
