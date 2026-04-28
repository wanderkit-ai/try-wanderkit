import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Avatar } from '@/components/avatar';
import { StatusPill } from '@/components/status-pill';
import {
  customers,
  operators,
  trips,
  tripLinks,
  agentEvents,
  influencers,
  quotes,
  findById,
} from '@/lib/mock-data';
import { formatRelative, formatMoney } from '@/lib/utils';
import {
  Plane,
  Users,
  Building2,
  Link2,
  Bot,
  ArrowUpRight,
  Activity,
} from 'lucide-react';

const JAMIE_ID = 'inf_jamie';

export default function HomePage() {
  const jamie = findById(influencers, JAMIE_ID);
  const myTrips = trips.filter((t) => t.influencerId === JAMIE_ID);
  const activeTrips = myTrips.filter((t) => t.status !== 'completed' && t.status !== 'cancelled');
  const myCustomers = customers.filter((c) => c.influencerId === JAMIE_ID);
  const myTripIds = new Set(myTrips.map((t) => t.id));
  const usedOperatorIds = new Set(
    quotes.filter((q) => myTripIds.has(q.tripId)).map((q) => q.operatorId)
  );
  const myOperators = operators.filter((o) => o.starred || usedOperatorIds.has(o.id));
  const myLinks = tripLinks.filter((l) => l.influencerId === JAMIE_ID && l.status === 'live');
  const recentEvents = [...agentEvents].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6);

  const stats = [
    { label: 'Active trips', value: activeTrips.length, icon: Plane, href: '/trips' },
    { label: 'Customers', value: myCustomers.length, icon: Users, href: '/people/customers' },
    { label: 'Trip Links', value: myLinks.length, icon: Link2, href: '/links' },
    { label: 'Operators', value: myOperators.length, icon: Building2, href: '/people/operators' },
  ];

  return (
    <>
      <PageHeader
        title={jamie ? `Welcome back, ${jamie.name.split(' ')[0]}` : 'Welcome back'}
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
              {activeTrips.slice(0, 5).map((t) => (
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
                  {jamie && (
                    <div className="flex items-center gap-1.5">
                      <Avatar name={jamie.name} color={jamie.avatarColor} size={20} />
                      <span className="text-xs text-ink2 hidden sm:inline">
                        {jamie.handle}
                      </span>
                    </div>
                  )}
                  <span className="text-xs text-ink2 font-mono tabular-nums">
                    {formatMoney(t.budgetPerPerson)}/pp
                  </span>
                  <StatusPill status={t.status} />
                </Link>
              ))}
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
