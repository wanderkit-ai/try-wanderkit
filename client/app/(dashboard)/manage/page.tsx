'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Avatar } from '@/components/avatar';
import { StatusPill } from '@/components/status-pill';
import {
  influencers,
  customers,
  trips,
  quotes,
  findById,
} from '@/lib/mock-data';
import { formatMoney, formatRelative } from '@/lib/utils';
import {
  Plane,
  Users,
  DollarSign,
  TrendingUp,
  Star,
  MapPin,
  Calendar,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';

function StatCard({ label, value, sub, icon: Icon }: { label: string; value: string; sub?: string; icon: any }) {
  return (
    <div className="surface p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="text-xs text-muted uppercase tracking-wide">{label}</div>
        <Icon className="w-4 h-4 text-muted" strokeWidth={1.75} />
      </div>
      <div className="text-2xl font-semibold text-ink">{value}</div>
      {sub && <div className="text-xs text-muted mt-0.5">{sub}</div>}
    </div>
  );
}

export default function ManagePage() {
  const [selectedInfluencer, setSelectedInfluencer] = useState<string | null>(null);
  const [customerTab, setCustomerTab] = useState<'active' | 'past'>('active');

  const inf = selectedInfluencer ? findById(influencers, selectedInfluencer) : null;

  // ── Influencer detail view ────────────────────────────────────────────────
  if (inf) {
    const infTrips = trips.filter((t) => t.influencerId === inf.id);
    const infCustomers = customers.filter(
      (c) => c.influencerId === inf.id || infTrips.some((t) => t.customerIds.includes(c.id))
    );
    const activeCustomers = infCustomers.filter((c) =>
      ['lead', 'briefed', 'matched', 'travelling'].includes(c.status)
    );
    const pastCustomers = infCustomers.filter((c) => ['paid', 'returned'].includes(c.status));
    const completedTrips = infTrips.filter((t) => ['booked', 'completed'].includes(t.status));
    const totalRevenue = quotes
      .filter((q) => q.status === 'accepted' && infTrips.some((t) => t.id === q.tripId))
      .reduce((sum, q) => sum + q.totalCents, 0);
    const displayCustomers = customerTab === 'active' ? activeCustomers : pastCustomers;

    return (
      <>
        <PageHeader
          icon="📊"
          title="Manage"
          crumbs={[{ label: 'Manage' }, { label: inf.name }]}
        />
        <div className="px-12 pb-12 space-y-6">
          <button
            onClick={() => setSelectedInfluencer(null)}
            className="flex items-center gap-1.5 text-xs text-muted hover:text-ink transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
            All influencers
          </button>

          {/* Profile header */}
          <div className="surface p-5 flex items-start gap-5">
            <Avatar name={inf.name} color={inf.avatarColor} size={56} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-0.5">
                <h2 className="text-xl font-semibold text-ink">{inf.name}</h2>
                <span className="text-sm text-muted">{inf.handle}</span>
              </div>
              <p className="text-sm text-ink2 leading-relaxed mb-3">{inf.bio}</p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" strokeWidth={1.75} />
                  {(inf.followers / 1000).toFixed(1)}k followers
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" strokeWidth={1.75} />
                  {inf.regions.join(', ')}
                </span>
                {inf.niches.map((n) => (
                  <span key={n} className="chip chip-accent capitalize">{n}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            <StatCard icon={Users} label="Total customers" value={String(infCustomers.length)} sub={`${activeCustomers.length} active`} />
            <StatCard icon={Plane} label="Total trips" value={String(infTrips.length)} sub={`${completedTrips.length} completed`} />
            <StatCard icon={DollarSign} label="Revenue booked" value={totalRevenue > 0 ? formatMoney(totalRevenue) : '—'} sub="Accepted quotes" />
            <StatCard icon={Star} label="Platform rating" value="4.9" sub="Based on trip reviews" />
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Trips */}
            <div>
              <h3 className="text-sm font-semibold text-ink mb-3">
                Trips <span className="text-muted font-normal">({infTrips.length})</span>
              </h3>
              <div className="surface divide-y divide-border">
                {infTrips.length === 0 && (
                  <div className="px-4 py-3 text-sm text-muted">No trips yet.</div>
                )}
                {infTrips.map((t) => {
                  const cs = t.customerIds.map((id) => findById(customers, id)).filter(Boolean) as any[];
                  return (
                    <Link
                      key={t.id}
                      href={`/trips/${t.id}`}
                      className="block px-4 py-3 hover:bg-hover/60 transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="text-sm font-medium text-ink truncate group-hover:text-accent transition-colors">
                          {t.title}
                        </div>
                        <StatusPill status={t.status} />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" strokeWidth={1.75} />
                          {t.destination.split(',')[0]}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" strokeWidth={1.75} />
                          {t.startDate}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" strokeWidth={1.75} />
                          {t.groupSize} pax
                        </span>
                      </div>
                      {cs.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {cs.slice(0, 4).map((c: any) => (
                            <Avatar key={c.id} name={c.name} color={c.avatarColor} size={20} />
                          ))}
                          {cs.length > 4 && (
                            <span className="text-xs text-muted ml-1">+{cs.length - 4}</span>
                          )}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Customers */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-sm font-semibold text-ink">Customers</h3>
                <div className="flex gap-1 p-0.5 rounded" style={{ background: 'hsl(var(--hover))' }}>
                  {(['active', 'past'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setCustomerTab(t)}
                      className="h-6 px-3 rounded text-xs font-medium capitalize transition-all"
                      style={{
                        background: customerTab === t ? 'hsl(var(--panel))' : 'transparent',
                        color: customerTab === t ? 'hsl(var(--ink))' : 'hsl(var(--ink-2))',
                      }}
                    >
                      {t} ({t === 'active' ? activeCustomers.length : pastCustomers.length})
                    </button>
                  ))}
                </div>
              </div>
              <div className="surface divide-y divide-border">
                {displayCustomers.length === 0 && (
                  <div className="px-4 py-3 text-sm text-muted">No {customerTab} customers.</div>
                )}
                {displayCustomers.map((c) => (
                  <Link
                    key={c.id}
                    href={`/people/customers/${c.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-hover/60 transition-colors group"
                  >
                    <Avatar name={c.name} color={c.avatarColor} size={32} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-ink">{c.name}</div>
                      <div className="text-xs text-muted">{c.city}, {c.country}</div>
                      <div className="text-xs text-muted">{c.interests.join(' · ')}</div>
                    </div>
                    <div className="text-right shrink-0 space-y-1">
                      <StatusPill status={c.status} />
                      <div className="text-xs text-muted font-mono">
                        ${(c.budgetMin / 100).toFixed(0)}–${(c.budgetMax / 100).toFixed(0)}/day
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" strokeWidth={1.75} />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── Overview: all influencers ─────────────────────────────────────────────
  return (
    <>
      <PageHeader
        icon="📊"
        title="Manage"
        description="Influencer profiles, customer rosters, and full trip history — all in one place."
      />
      <div className="px-12 pb-12 space-y-8">

        {/* Platform-wide stats */}
        <div className="grid grid-cols-4 gap-3">
          <StatCard icon={Star} label="Influencers" value={String(influencers.length)} sub="Active on platform" />
          <StatCard
            icon={Users}
            label="Total customers"
            value={String(customers.length)}
            sub={`${customers.filter((c) => c.status === 'lead').length} new leads`}
          />
          <StatCard
            icon={Plane}
            label="Total trips"
            value={String(trips.length)}
            sub={`${trips.filter((t) => t.status === 'booked').length} booked`}
          />
          <StatCard
            icon={DollarSign}
            label="Revenue booked"
            value={formatMoney(quotes.filter((q) => q.status === 'accepted').reduce((s, q) => s + q.totalCents, 0))}
            sub="From accepted quotes"
          />
        </div>

        {/* Influencer cards */}
        <div>
          <h2 className="text-sm font-medium text-ink2 uppercase tracking-wide mb-3">Influencer profiles</h2>
          <div className="grid grid-cols-3 gap-4">
            {influencers.map((inf) => {
              const infTrips = trips.filter((t) => t.influencerId === inf.id);
              const infCustomers = customers.filter((c) => c.influencerId === inf.id);
              const bookedRevenue = quotes
                .filter((q) => q.status === 'accepted' && infTrips.some((t) => t.id === q.tripId))
                .reduce((s, q) => s + q.totalCents, 0);
              const activeTrips = infTrips.filter((t) => !['completed', 'cancelled'].includes(t.status));

              return (
                <button
                  key={inf.id}
                  onClick={() => setSelectedInfluencer(inf.id)}
                  className="surface p-5 text-left hover:border-ink2/30 transition-colors group"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar name={inf.name} color={inf.avatarColor} size={44} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-ink group-hover:text-accent transition-colors">{inf.name}</div>
                      <div className="text-xs text-muted">{inf.handle}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" strokeWidth={1.75} />
                  </div>

                  <p className="text-xs text-ink2 leading-relaxed mb-3 line-clamp-2">{inf.bio}</p>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {inf.niches.map((n) => (
                      <span key={n} className="chip text-2xs capitalize">{n}</span>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border text-center">
                    <div>
                      <div className="text-base font-semibold text-ink">{(inf.followers / 1000).toFixed(0)}k</div>
                      <div className="text-2xs text-muted">followers</div>
                    </div>
                    <div>
                      <div className="text-base font-semibold text-ink">{infCustomers.length}</div>
                      <div className="text-2xs text-muted">customers</div>
                    </div>
                    <div>
                      <div className="text-base font-semibold text-ink">{activeTrips.length}</div>
                      <div className="text-2xs text-muted">active trips</div>
                    </div>
                  </div>

                  {bookedRevenue > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-success mt-3 pt-3 border-t border-border">
                      <CheckCircle2 className="w-3 h-3 shrink-0" strokeWidth={2} />
                      {formatMoney(bookedRevenue)} booked
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* All customers table */}
        <div>
          <h2 className="text-sm font-medium text-ink2 uppercase tracking-wide mb-3">All customers</h2>
          <div className="surface divide-y divide-border">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_80px] px-4 py-2 text-2xs text-muted uppercase tracking-wide font-medium border-b border-border">
              <div>Customer</div>
              <div>Influencer</div>
              <div>Budget</div>
              <div>Interests</div>
              <div>Status</div>
            </div>
            {[...customers]
              .sort((a, b) => b.joinedAt.localeCompare(a.joinedAt))
              .map((c) => {
                const theirInf = findById(influencers, c.influencerId ?? '');
                return (
                  <Link
                    key={c.id}
                    href={`/people/customers/${c.id}`}
                    className="grid grid-cols-[2fr_1fr_1fr_1fr_80px] px-4 py-3 items-center hover:bg-hover/60 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar name={c.name} color={c.avatarColor} size={28} />
                      <div>
                        <div className="text-sm font-medium text-ink">{c.name}</div>
                        <div className="text-xs text-muted">{c.city} · {formatRelative(c.joinedAt)}</div>
                      </div>
                    </div>
                    <div className="text-xs text-ink2">{theirInf?.handle ?? '—'}</div>
                    <div className="text-xs text-ink2 font-mono">
                      ${(c.budgetMin / 100).toFixed(0)}–${(c.budgetMax / 100).toFixed(0)}/day
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {c.interests.slice(0, 2).map((i) => (
                        <span key={i} className="chip text-2xs">{i}</span>
                      ))}
                    </div>
                    <StatusPill status={c.status} />
                  </Link>
                );
              })}
          </div>
        </div>

        {/* Trip history */}
        <div>
          <h2 className="text-sm font-medium text-ink2 uppercase tracking-wide mb-3">Trip history</h2>
          <div className="surface divide-y divide-border">
            <div className="grid grid-cols-[2fr_1fr_1fr_80px_80px] px-4 py-2 text-2xs text-muted uppercase tracking-wide font-medium border-b border-border">
              <div>Trip</div>
              <div>Influencer</div>
              <div>Dates</div>
              <div>Group</div>
              <div>Status</div>
            </div>
            {[...trips]
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
              .map((t) => {
                const tInf = findById(influencers, t.influencerId);
                return (
                  <Link
                    key={t.id}
                    href={`/trips/${t.id}`}
                    className="grid grid-cols-[2fr_1fr_1fr_80px_80px] px-4 py-3 items-center hover:bg-hover/60 transition-colors"
                  >
                    <div>
                      <div className="text-sm font-medium text-ink">{t.title}</div>
                      <div className="text-xs text-muted">{t.destination.split(',')[0]}</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {tInf && <Avatar name={tInf.name} color={tInf.avatarColor} size={20} />}
                      <span className="text-xs text-ink2">{tInf?.handle ?? '—'}</span>
                    </div>
                    <div className="text-xs text-ink2 font-mono">
                      {t.startDate}<br /><span className="text-muted">→ {t.endDate}</span>
                    </div>
                    <div className="text-sm font-medium text-ink">{t.groupSize} pax</div>
                    <StatusPill status={t.status} />
                  </Link>
                );
              })}
          </div>
        </div>
      </div>
    </>
  );
}
