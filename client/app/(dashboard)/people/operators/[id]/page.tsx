import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { StatusPill } from '@/components/status-pill';
import { operators, trips, quotes, findById } from '@/lib/mock-data';
import { formatMoney } from '@/lib/utils';
import {
  MessageCircle,
  Mail,
  MapPin,
  Star,
  Clock,
  DollarSign,
  Plane,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

function Prop({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted">
      <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
      {label}
    </div>
  );
}

export default function OperatorDetailPage({ params }: { params: { id: string } }) {
  const operator = operators.find((o) => o.id === params.id);
  if (!operator) notFound();

  const relatedQuotes = quotes.filter((q) => q.operatorId === operator.id);
  const relatedTripIds = new Set(relatedQuotes.map((q) => q.tripId));
  const relatedTrips = trips.filter((t) => relatedTripIds.has(t.id));
  const acceptedRevenue = relatedQuotes
    .filter((q) => q.status === 'accepted')
    .reduce((sum, q) => sum + q.totalCents, 0);

  return (
    <>
      <PageHeader
        icon="🏔️"
        title={operator.company}
        crumbs={[
          { label: 'Operators', href: '/people/operators' },
          { label: operator.company },
        ]}
      />

      <div className="px-12 pb-12">
        <div className="flex items-center gap-3 mb-6">
          <span className="inline-flex items-center gap-1 text-sm font-mono tabular-nums">
            <Star className="w-3.5 h-3.5 fill-warn text-warn" strokeWidth={0} />
            {operator.rating.toFixed(1)}
          </span>
          <span className="text-sm font-mono text-ink2">{operator.priceTier}</span>
        </div>

        <div className="grid grid-cols-[160px_1fr] gap-y-2 text-sm mb-8 max-w-2xl">
          <Prop icon={MapPin} label="Location" />
          <div className="text-ink">{operator.region}, {operator.country}</div>

          <Prop icon={MessageCircle} label="WhatsApp" />
          <div className="text-ink font-mono text-xs">{operator.whatsapp}</div>

          <Prop icon={Mail} label="Email" />
          <div className="text-ink text-xs">{operator.email}</div>

          <Prop icon={Clock} label="Avg. reply time" />
          <div className="text-ink">~{operator.responseHours}h</div>

          <Prop icon={DollarSign} label="Specialties" />
          <div className="flex gap-1 flex-wrap">
            {operator.specialties.map((s) => (
              <span key={s} className="chip capitalize">{s}</span>
            ))}
          </div>

          {operator.notes && (
            <>
              <div className="text-xs text-muted pt-1">Notes</div>
              <div className="text-ink2 text-xs pt-1">{operator.notes}</div>
            </>
          )}
        </div>

        {relatedTrips.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-sm font-medium text-ink2 uppercase tracking-wide">Trips</h2>
              {acceptedRevenue > 0 && (
                <span className="text-xs text-success font-mono">{formatMoney(acceptedRevenue)} booked</span>
              )}
            </div>
            <div className="surface divide-y divide-border">
              {relatedTrips.map((t) => {
                const tripQuote = relatedQuotes.find((q) => q.tripId === t.id);
                return (
                  <Link
                    key={t.id}
                    href={`/trips/${t.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-hover/60 transition-colors group"
                  >
                    <Plane className="w-4 h-4 text-muted shrink-0" strokeWidth={1.75} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-ink group-hover:text-accent transition-colors">
                        {t.title}
                      </div>
                      <div className="text-xs text-muted">{t.destination} · {t.startDate}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {tripQuote && (
                        <span className="text-xs text-ink2 font-mono">
                          {formatMoney(tripQuote.perPersonCents)}/pp
                        </span>
                      )}
                      <StatusPill status={t.status} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
