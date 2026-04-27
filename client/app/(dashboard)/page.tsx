import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Avatar } from '@/components/avatar';
import { StatusPill } from '@/components/status-pill';
import {
  customers,
  influencers,
  operators,
  trips,
  agentEvents,
  findById,
} from '@/lib/mock-data';
import { formatRelative, formatMoney } from '@/lib/utils';
import {
  Plane,
  Users,
  Building2,
  Sparkles,
  Bot,
  ArrowUpRight,
  Activity,
} from 'lucide-react';

export default function HomePage() {
  const activeTrips = trips.filter((t) => t.status !== 'completed' && t.status !== 'cancelled');
  const recentEvents = [...agentEvents].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6);

  const stats = [
    { label: 'Active trips', value: activeTrips.length, icon: Plane, href: '/trips' },
    { label: 'Customers', value: customers.length, icon: Users, href: '/people/customers' },
    { label: 'Influencers', value: influencers.length, icon: Sparkles, href: '/people/influencers' },
    { label: 'Operators', value: operators.length, icon: Building2, href: '/people/operators' },
  ];

  return (
    <>
      <PageHeader
        title="Welcome back"
        description="Five AI agents are running in the background. Here's what they're working on."
      />

      <div className="px-12 pb-12 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {stats.map((s) => (
            <Link
              key={s.label}
              href={s.href}
              className="surface p-4 group hover:border-ink2/30 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <s.icon className="w-4 h-4 text-ink2" strokeWidth={1.75} />
                <ArrowUpRight className="w-3.5 h-3.5 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-2xl font-medium text-ink">{s.value}</div>
              <div className="text-xs text-ink2 mt-0.5">{s.label}</div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Active trips */}
          <div className="col-span-2 space-y-2">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium text-ink2 uppercase tracking-wide">
                Active trips
              </h2>
              <Link
                href="/trips"
                className="text-xs text-muted hover:text-ink2"
              >
                View all
              </Link>
            </div>
            <div className="surface divide-y divide-border">
              {activeTrips.slice(0, 5).map((t) => {
                const inf = findById(influencers, t.influencerId);
                return (
                  <Link
                    key={t.id}
                    href={`/trips/${t.id}`}
                    className="flex items-center px-4 h-12 hover:bg-hover gap-3"
                  >
                    <Plane className="w-4 h-4 text-ink2" strokeWidth={1.75} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-ink truncate">{t.title}</div>
                      <div className="text-xs text-muted truncate">{t.destination}</div>
                    </div>
                    {inf && (
                      <div className="flex items-center gap-1.5">
                        <Avatar name={inf.name} color={inf.avatarColor} size={20} />
                        <span className="text-xs text-ink2 hidden sm:inline">
                          {inf.handle}
                        </span>
                      </div>
                    )}
                    <span className="text-xs text-ink2 font-mono tabular-nums">
                      {formatMoney(t.budgetPerPerson)}/pp
                    </span>
                    <StatusPill status={t.status} />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Agent activity */}
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium text-ink2 uppercase tracking-wide flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" strokeWidth={2} />
                Agent activity
              </h2>
              <Link
                href="/agents"
                className="text-xs text-muted hover:text-ink2"
              >
                Open
              </Link>
            </div>
            <div className="surface p-3 space-y-3">
              {recentEvents.map((e) => (
                <div key={e.id} className="flex gap-2.5 text-xs">
                  <div className="mt-0.5">
                    <div className="w-5 h-5 rounded bg-accent-soft text-accent grid place-items-center">
                      <Bot className="w-3 h-3" strokeWidth={2} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-ink leading-snug">{e.summary}</div>
                    {e.detail && (
                      <div className="text-muted mt-0.5 leading-snug">{e.detail}</div>
                    )}
                    <div className="text-muted text-2xs mt-1 flex items-center gap-1.5">
                      <span className="font-medium capitalize">{e.agent}</span>
                      <span>·</span>
                      <span>{formatRelative(e.at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
