import { notFound } from 'next/navigation';
import {
  trips,
  influencers,
  customers,
  operators,
  quotes,
  findById,
} from '@/lib/mock-data';
import type { Customer } from '@/lib/types';
import { formatMoney } from '@/lib/utils';
import {
  MapPin,
  Calendar,
  Users,
  DollarSign,
  Train,
  Bed,
  CheckCircle2,
  Minus,
  Circle,
} from 'lucide-react';
import { ProposalActions } from './actions';

export default function ProposalPage({ params }: { params: { id: string } }) {
  const trip = trips.find((t) => t.id === params.id);
  if (!trip) notFound();

  const inf = findById(influencers, trip.influencerId);
  const cs = trip.customerIds.map((id) => findById(customers, id)).filter(Boolean) as Customer[];

  const acceptedQuote = trip.acceptedQuoteId
    ? quotes.find((q) => q.id === trip.acceptedQuoteId)
    : quotes.find((q) => q.tripId === trip.id && (q.status === 'accepted' || q.status === 'received'));
  const quoteOp = acceptedQuote ? findById(operators, acceptedQuote.operatorId) : null;

  const nightCount =
    Math.round((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / 86400000);

  const styleLabel: Record<string, string> = {
    hiking: 'Hiking', expedition: 'Expedition', beach: 'Beach', cultural: 'Cultural',
    safari: 'Safari', culinary: 'Culinary', wellness: 'Wellness',
  };

  const AVATAR_COLORS = ['#e07a5f', '#81b29a', '#f2cc8f', '#3d405b', '#a8dadc', '#e76f51', '#a6b1e1', '#cdb4db'];

  function initials(name: string) {
    return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Hero */}
      <div
        className="relative w-full py-16 px-6 sm:px-12"
        style={{
          background: 'linear-gradient(135deg, hsl(168 41% 20%) 0%, hsl(168 41% 33%) 100%)',
        }}
      >
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            {trip.style.map((s) => (
              <span
                key={s}
                className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium"
                style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}
              >
                {styleLabel[s] ?? s}
              </span>
            ))}
          </div>

          <h1 className="text-3xl sm:text-4xl font-semibold text-white mb-2 leading-tight">
            {trip.title}
          </h1>

          {inf && (
            <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.75)' }}>
              Curated by <span className="font-medium text-white">{inf.handle}</span>
            </p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <Stat icon={<MapPin className="w-3.5 h-3.5" />} label="Destination" value={trip.destination.split(',')[0]} />
            <Stat icon={<Calendar className="w-3.5 h-3.5" />} label="Duration" value={`${nightCount} nights`} />
            <Stat icon={<Users className="w-3.5 h-3.5" />} label="Group size" value={`${trip.groupSize} travelers`} />
            <Stat
              icon={<DollarSign className="w-3.5 h-3.5" />}
              label="From"
              value={acceptedQuote ? `${formatMoney(acceptedQuote.perPersonCents)} /pp` : `${formatMoney(trip.budgetPerPerson)} /pp`}
            />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 sm:px-12 py-10">

        {/* Dates strip */}
        <div
          className="rounded-lg p-4 mb-8 flex items-center justify-between text-sm"
          style={{ background: 'hsl(var(--panel))', border: '1px solid hsl(var(--border))' }}
        >
          <div>
            <div className="text-xs text-muted mb-0.5 uppercase tracking-wide">Departs</div>
            <div className="font-medium text-ink font-mono">{trip.startDate}</div>
          </div>
          <div className="text-muted text-xs">— {nightCount} nights —</div>
          <div className="text-right">
            <div className="text-xs text-muted mb-0.5 uppercase tracking-wide">Returns</div>
            <div className="font-medium text-ink font-mono">{trip.endDate}</div>
          </div>
        </div>

        {/* What's included */}
        {acceptedQuote && (acceptedQuote.includes.length > 0 || acceptedQuote.excludes.length > 0) && (
          <section className="mb-8">
            <h2 className="text-xs font-medium text-muted uppercase tracking-widest mb-3">
              What&apos;s included
            </h2>
            <div
              className="rounded-lg p-4 grid sm:grid-cols-2 gap-4"
              style={{ background: 'hsl(var(--panel))', border: '1px solid hsl(var(--border))' }}
            >
              {acceptedQuote.includes.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-ink2 mb-2">Included</div>
                  <ul className="space-y-1.5">
                    {acceptedQuote.includes.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-ink">
                        <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-success shrink-0" strokeWidth={2} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {acceptedQuote.excludes.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-ink2 mb-2">Not included</div>
                  <ul className="space-y-1.5">
                    {acceptedQuote.excludes.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-ink2">
                        <Minus className="w-3.5 h-3.5 mt-0.5 text-muted shrink-0" strokeWidth={2} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            {quoteOp && (
              <p className="text-xs text-muted mt-2">
                Operated by <span className="text-ink2">{quoteOp.company}</span> · {quoteOp.country}
              </p>
            )}
          </section>
        )}

        {/* Itinerary */}
        <section className="mb-8">
          <h2 className="text-xs font-medium text-muted uppercase tracking-widest mb-3">
            Day-by-day
          </h2>

          {trip.itinerary && trip.itinerary.length > 0 ? (
            <div
              className="rounded-lg divide-y"
              style={{
                background: 'hsl(var(--panel))',
                border: '1px solid hsl(var(--border))',
                borderColor: 'hsl(var(--border))',
              }}
            >
              {trip.itinerary.map((day) => (
                <div key={day.day} className="p-4 sm:p-5">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span
                      className="text-xs font-semibold font-mono"
                      style={{ color: 'hsl(var(--accent))' }}
                    >
                      Day {day.day}
                    </span>
                    <span className="text-sm font-medium text-ink">{day.location}</span>
                    <span className="text-xs text-muted font-mono ml-auto">{day.date}</span>
                  </div>

                  <ul className="space-y-1 mb-3">
                    {day.activities.map((a) => (
                      <li key={a} className="flex items-start gap-2 text-sm text-ink2">
                        <Circle className="w-1.5 h-1.5 mt-1.5 shrink-0 fill-current text-muted" />
                        {a}
                      </li>
                    ))}
                  </ul>

                  {(day.transit !== 'None' || day.lodging) && (
                    <div className="flex flex-wrap gap-4 text-xs text-muted border-t pt-2" style={{ borderColor: 'hsl(var(--border))' }}>
                      {day.transit && day.transit !== 'None' && (
                        <span className="flex items-center gap-1">
                          <Train className="w-3 h-3" strokeWidth={1.5} />
                          {day.transit}
                        </span>
                      )}
                      {day.lodging && day.lodging !== 'None (departure day)' && (
                        <span className="flex items-center gap-1">
                          <Bed className="w-3 h-3" strokeWidth={1.5} />
                          {day.lodging}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div
              className="rounded-lg p-6 text-center text-sm text-muted"
              style={{ background: 'hsl(var(--panel))', border: '1px solid hsl(var(--border))' }}
            >
              Itinerary being prepared — check back soon.
            </div>
          )}
        </section>

        {/* Travelers */}
        {cs.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xs font-medium text-muted uppercase tracking-widest mb-3">
              Confirmed travelers
            </h2>
            <div className="flex flex-wrap gap-3">
              {cs.map((c, i) => (
                <div key={c.id} className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium"
                    style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                  >
                    {initials(c.name)}
                  </div>
                  <span className="text-sm text-ink">{c.name}</span>
                  <span className="text-xs text-muted">{c.city}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Must-haves */}
        {trip.mustHaves.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xs font-medium text-muted uppercase tracking-widest mb-3">
              Must-haves
            </h2>
            <div className="flex flex-wrap gap-2">
              {trip.mustHaves.map((m) => (
                <span key={m} className="chip chip-accent text-sm px-2.5 py-1">
                  {m}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Pricing */}
        {acceptedQuote && acceptedQuote.perPersonCents > 0 && (
          <section
            className="rounded-lg p-5 mb-8"
            style={{ background: 'hsl(var(--accent-soft))', border: '1px solid hsl(var(--accent) / 0.2)' }}
          >
            <div className="flex items-end justify-between">
              <div>
                <div className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: 'hsl(var(--accent))' }}>
                  Investment
                </div>
                <div className="text-3xl font-semibold text-ink">
                  {formatMoney(acceptedQuote.perPersonCents)}
                  <span className="text-base font-normal text-muted"> / person</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted mb-1">{trip.groupSize} travelers total</div>
                <div className="text-lg font-semibold text-ink2">
                  {formatMoney(acceptedQuote.totalCents)}
                </div>
              </div>
            </div>
            {acceptedQuote.notes && (
              <p className="text-xs text-ink2 mt-3 italic">{acceptedQuote.notes}</p>
            )}
          </section>
        )}

        {/* CTAs */}
        {inf && (
          <ProposalActions influencerEmail={inf.email} tripTitle={trip.title} />
        )}

        {/* Footer */}
        <div className="mt-12 pt-6 border-t text-center text-xs text-muted" style={{ borderColor: 'hsl(var(--border))' }}>
          Powered by{' '}
          <span className="font-medium" style={{ color: 'hsl(var(--accent))' }}>Wanderkit</span>
          {' '}· AI-coordinated travel for creators and their communities
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div
      className="rounded-lg px-3 py-2.5"
      style={{ background: 'rgba(255,255,255,0.12)' }}
    >
      <div className="flex items-center gap-1 mb-1" style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.6875rem' }}>
        {icon}
        <span className="uppercase tracking-wide font-medium">{label}</span>
      </div>
      <div className="text-sm font-medium text-white">{value}</div>
    </div>
  );
}
