'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Compass,
  Home,
  Users,
  UserCircle2,
  Building2,
  Plane,
  Inbox,
  Bot,
  ChevronRight,
  Plus,
  Search,
  Settings,
  Sparkles,
  CalendarDays,
  BookOpen,
  Users2,
  HelpCircle,
  LayoutDashboard,
  ShoppingBag,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  children?: NavItem[];
  badge?: string;
}

const NAV: NavItem[] = [
  { href: '/', label: 'Home', icon: Home },
  {
    href: '/people',
    label: 'People',
    icon: Users,
    children: [
      { href: '/people/customers', label: 'Customers', icon: UserCircle2 },
      { href: '/people/influencers', label: 'Influencers', icon: Sparkles },
      { href: '/people/operators', label: 'Operators', icon: Building2 },
    ],
  },
  { href: '/trips', label: 'Trips', icon: Plane },
  { href: '/book', label: 'Book', icon: ShoppingBag },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/inbox', label: 'Inbox', icon: Inbox, badge: '2' },
  { href: '/community', label: 'Community', icon: Users2 },
];

const BOTTOM_NAV: NavItem[] = [
  { href: '/agents', label: 'AI Agents', icon: Bot },
  { href: '/manage', label: 'Manage', icon: LayoutDashboard },
  { href: '/help', label: 'Help', icon: HelpCircle },
];

export function Sidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    '/people': true,
  });

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/');

  function toggleSection(href: string) {
    setOpenSections((s) => ({ ...s, [href]: !s[href] }));
  }

  function NavLink({ item }: { item: NavItem }) {
    const active = isActive(item.href);
    return (
      <Link
        href={item.href}
        className={cn(
          'flex items-center gap-2 h-7 px-2 ml-5 rounded text-sm',
          active ? 'bg-hover text-ink font-medium' : 'text-ink2 hover:text-ink hover:bg-hover'
        )}
      >
        <item.icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
        <span className="truncate flex-1">{item.label}</span>
        {item.badge && (
          <span className="text-2xs px-1.5 rounded bg-accent text-white font-medium">
            {item.badge}
          </span>
        )}
      </Link>
    );
  }

  return (
    <aside className="w-[240px] shrink-0 bg-sidebar border-r border-border flex flex-col h-screen sticky top-0">
      <div className="px-3 py-3 flex items-center justify-between">
        <button className="flex items-center gap-2 px-2 h-8 rounded hover:bg-hover text-sm font-medium">
          <Compass className="w-4 h-4 text-accent" strokeWidth={2} />
          <span>Wanderkit</span>
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
          const open = openSections[item.href] ?? false;

          if (item.children) {
            return (
              <div key={item.href}>
                <div
                  className={cn(
                    'group flex items-center h-7 px-1 rounded text-sm cursor-pointer',
                    active ? 'text-ink' : 'text-ink2 hover:text-ink',
                    'hover:bg-hover'
                  )}
                >
                  <button
                    onClick={() => toggleSection(item.href)}
                    className="w-5 h-5 grid place-items-center rounded hover:bg-border/60 mr-0.5"
                  >
                    <ChevronRight
                      className={cn('w-3 h-3 transition-transform', open && 'rotate-90')}
                      strokeWidth={2}
                    />
                  </button>
                  <Link href={item.href} className="flex items-center gap-2 flex-1 min-w-0">
                    <item.icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                    <span className="truncate">{item.label}</span>
                  </Link>
                  <button className="opacity-0 group-hover:opacity-100 w-5 h-5 grid place-items-center rounded hover:bg-border/60">
                    <Plus className="w-3 h-3" strokeWidth={2} />
                  </button>
                </div>
                {open && (
                  <div className="ml-5 border-l border-border mt-0.5 space-y-0.5">
                    {item.children.map((child) => {
                      const childActive = isActive(child.href);
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            'flex items-center gap-2 h-7 pl-3 pr-2 rounded text-sm',
                            childActive
                              ? 'bg-hover text-ink font-medium'
                              : 'text-ink2 hover:text-ink hover:bg-hover'
                          )}
                        >
                          <child.icon className="w-3.5 h-3.5" strokeWidth={1.75} />
                          <span className="truncate">{child.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return <NavLink key={item.href} item={item} />;
        })}

        <div className="pt-3 mt-1 border-t border-border space-y-0.5">
          {BOTTOM_NAV.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>
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
