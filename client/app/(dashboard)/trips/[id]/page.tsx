import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Avatar } from '@/components/avatar';
import { StatusPill } from '@/components/status-pill';
import { SendProposalBtn } from './send-proposal-btn';
import { ConnectorsPanel } from './connectors-panel';
import {
  trips,
  influencers,
  customers,
  operators,
  quotes,
  messages,
  agentEvents,
  waitlist,
  findById,
} from '@/lib/mock-data';
import { formatMoney, formatRelative } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import type { Customer } from '@/lib/types';
import {
  Calendar,
  MapPin,
  Users as UsersIcon,
  DollarSign,
  Bot,
  MessageCircle,
  Mail,
  CheckCircle2,
  Circle,
  MapPinned,
  Train,
  Bed,
  Clock,
  UserCheck,
  UserX,
  Plug2,
} from 'lucide-react';

export default function TripDetailPage({ params }: { params: { id: string } }) {
  const trip = trips.find((t) => t.id === params.id);
  if (!trip) notFound();

  const inf = findById(influencers, trip.influencerId);
  const members = trip.customerIds
    .map((id) => findById(customers, id))
    .filter((customer): customer is Customer => Boolean(customer));
  const tripWaitlist = waitlist.filter((w) => w.tripId === trip.id);
  const tripQuotes = quotes.filter((q) => q.tripId === trip.id);
  const tripMessages = messages.filter((m) => m.tripId === trip.id);
  const tripEvents = agentEvents.filter((e) => e.tripId === trip.id);

  const stages = ['brief', 'sourcing', 'quoting', 'approved', 'booked'] as const;
  const currentIdx = stages.indexOf(trip.status as any);

  const bookedSeats = members.reduce((acc, m) => acc + Math.max(m.groupSize ?? 1, 1), 0);
  const waitlistedSeats = tripWaitlist.reduce((acc, w) => acc + Math.max(w.partySize, 1), 0);
  const spotsLeft = Math.max(trip.groupSize - bookedSeats, 0);

  return (
    <>
      <PageHeader
        icon="✈️"
        title={trip.title}
        crumbs={[{ label: 'Trips' }, { label: trip.title }]}
        actions={
          ['quoting', 'approved', 'booked'].includes(trip.status)
            ? <SendProposalBtn tripId={trip.id} />
            : undefined
        }
      />

      <div className="px-12 pb-12">
        <div className="flex items-center gap-2 mb-6">
          <StatusPill status={trip.status} />
          {inf && (
            <span className="inline-flex items-center gap-1.5 text-xs text-ink2">
              <Avatar name={inf.name} color={inf.avatarColor} size={18} />
              {inf.handle}
            </span>
          )}
        </div>

        {/* Property table — Notion-style */}
        <div className="grid grid-cols-[140px_1fr] gap-y-1 text-sm mb-8 max-w-2xl">
          <Prop icon={MapPin} label="Destination" />
          <div className="text-ink">{trip.destination}</div>

          <Prop icon={Calendar} label="Dates" />
          <div className="text-ink font-mono tabular-nums text-xs">
            {trip.startDate} → {trip.endDate}
          </div>

          <Prop icon={UsersIcon} label="Group size" />
          <div className="text-ink">
            {bookedSeats} / {trip.groupSize} spots booked
            {tripWaitlist.length > 0 && (
              <span className="text-muted ml-2">· {waitlistedSeats} waiting</span>
            )}
          </div>

          <Prop icon={DollarSign} label="Budget / pp" />
          <div className="text-ink font-mono tabular-nums text-xs">
            {formatMoney(trip.budgetPerPerson)}
          </div>

          <Prop icon={Circle} label="Style" />
          <div className="flex gap-1 flex-wrap">
            {trip.style.map((s) => <span key={s} className="chip">{s}</span>)}
          </div>

          <Prop icon={CheckCircle2} label="Must-haves" />
          <div className="flex gap-1 flex-wrap">
            {trip.mustHaves.map((m) => <span key={m} className="chip">{m}</span>)}
          </div>
        </div>

        {/* Members + Waitlist */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Members */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-sm font-medium text-ink2 uppercase tracking-wide">
                Members
              </h2>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-2xs font-medium bg-[#d3eada] text-[#1f5742]">
                {members.length} booking{members.length !== 1 ? 's' : ''}
              </span>
              {spotsLeft > 0 && (
                <span className="text-2xs text-muted">{spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left</span>
              )}
            </div>
            <div className="surface divide-y divide-border">
              {members.length === 0 && (
                <div className="p-4 text-sm text-muted flex items-center gap-2">
                  <UserCheck className="w-4 h-4" strokeWidth={1.5} />
                  No members yet.
                </div>
              )}
              {members.map((m) => (
                <div key={m.id} className="p-3 flex items-start gap-3">
                  <Avatar name={m.name} color={m.avatarColor} size={32} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-medium text-ink">{m.name}</span>
                      <StatusPill status={m.status} />
                    </div>
                    <div className="text-xs text-muted mt-0.5">{m.email}</div>
                    <div className="flex items-center gap-3 mt-1 text-2xs text-muted">
                      <span>{m.city}, {m.country}</span>
                      <span className="flex items-center gap-0.5">
                        <UsersIcon className="w-2.5 h-2.5" strokeWidth={1.75} />
                        Party of {m.groupSize}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/people/customers/${m.id}`}
                    className="text-2xs text-accent underline underline-offset-2 shrink-0"
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Waitlist */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-sm font-medium text-ink2 uppercase tracking-wide">
                Waitlist
              </h2>
              {tripWaitlist.length > 0 && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-2xs font-medium bg-[#fff3d4] text-[#7a5410]">
                  {tripWaitlist.length} request{tripWaitlist.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="surface divide-y divide-border">
              {tripWaitlist.length === 0 && (
                <div className="p-4 text-sm text-muted flex items-center gap-2">
                  <UserX className="w-4 h-4" strokeWidth={1.5} />
                  No one on the waitlist.
                </div>
              )}
              {tripWaitlist.map((w, i) => (
                <div key={w.id} className="p-3 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-hover text-muted grid place-items-center text-xs font-mono font-medium shrink-0">
                    #{i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink">{w.name}</div>
                    <div className="text-xs text-muted mt-0.5">{w.email}</div>
                    <div className="flex items-center gap-3 mt-1 text-2xs text-muted">
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" strokeWidth={1.75} />
                        {w.joinedAt}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <UsersIcon className="w-2.5 h-2.5" strokeWidth={1.75} />
                        Party of {w.partySize}
                      </span>
                    </div>
                    {w.notes && (
                      <div className="mt-1 text-2xs text-ink2 italic">{w.notes}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Itinerary */}
        <div className="mb-8">
          <h2 className="text-sm font-medium text-ink2 uppercase tracking-wide mb-3">
            Itinerary
          </h2>
          {trip.itinerary && trip.itinerary.length > 0 ? (
            <div className="surface divide-y divide-border">
              {trip.itinerary.map((day) => (
                <div key={day.day} className="p-4">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-xs font-mono font-medium text-accent">Day {day.day}</span>
                    <span className="text-xs text-muted">·</span>
                    <span className="text-sm font-medium text-ink">{day.location}</span>
                    <span className="text-xs text-muted font-mono">{day.date}</span>
                  </div>
                  <ul className="space-y-0.5 mb-2">
                    {day.activities.map((a) => (
                      <li key={a} className="flex items-start gap-1.5 text-xs text-ink2">
                        <Circle className="w-1.5 h-1.5 mt-1 shrink-0 fill-current" />
                        {a}
                      </li>
                    ))}
                  </ul>
                  {(day.transit !== 'None' || day.lodging) && (
                    <div className="flex gap-4 text-2xs text-muted mt-1">
                      {day.transit && day.transit !== 'None' && (
                        <span className="flex items-center gap-1">
                          <Train className="w-3 h-3" strokeWidth={1.5} />
                          {day.transit}
                        </span>
                      )}
                      {day.lodging && (
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
            <div className="surface p-4 text-sm text-muted flex items-center gap-2">
              <MapPinned className="w-4 h-4 text-muted" strokeWidth={1.5} />
              No itinerary yet.{' '}
              <Link href={`/agents/itinerary?trip=${trip.id}`} className="text-accent underline underline-offset-2">
                Open in Itinerary agent
              </Link>
            </div>
          )}

          {trip.itinerary && trip.itinerary.length > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <Link
                href={`/proposals/${trip.id}`}
                target="_blank"
                className="text-xs text-accent underline underline-offset-2 inline-flex items-center gap-1"
              >
                Preview client proposal →
              </Link>
            </div>
          )}
        </div>

        {/* Stage tracker */}
        <div className="surface p-4 mb-8">
          <div className="text-xs font-medium text-ink2 uppercase tracking-wide mb-3">
            Pipeline
          </div>
          <div className="flex items-center gap-1">
            {stages.map((s, i) => (
              <div key={s} className="flex-1 flex items-center gap-1">
                <div
                  className={`flex-1 h-1.5 rounded ${
                    i <= currentIdx ? 'bg-accent' : 'bg-hover'
                  }`}
                />
                <div
                  className={`text-2xs uppercase tracking-wide font-medium ${
                    i <= currentIdx ? 'text-accent' : 'text-muted'
                  }`}
                >
                  {s}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* Quotes */}
          <div className="col-span-2">
            <h2 className="text-sm font-medium text-ink2 uppercase tracking-wide mb-2">
              Operator quotes
            </h2>
            <div className="surface divide-y divide-border">
              {tripQuotes.length === 0 && (
                <div className="p-4 text-sm text-muted">No quotes yet.</div>
              )}
              {tripQuotes.map((q) => {
                const op = findById(operators, q.operatorId);
                return (
                  <div key={q.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium text-ink">{op?.company}</div>
                        <div className="text-xs text-muted">{op?.country} · {op?.region}</div>
                      </div>
                      <div className="text-right">
                        <StatusPill status={q.status} />
                        {q.totalCents > 0 && (
                          <div className="font-mono tabular-nums text-sm mt-1 text-ink">
                            {formatMoney(q.perPersonCents)}
                            <span className="text-muted text-xs"> /pp</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {q.includes.length > 0 && (
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <div className="text-muted mb-1">Includes</div>
                          <ul className="space-y-0.5">
                            {q.includes.map((i) => (
                              <li key={i} className="flex items-start gap-1 text-ink2">
                                <CheckCircle2 className="w-3 h-3 mt-0.5 text-success" strokeWidth={2} />
                                {i}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <div className="text-muted mb-1">Excludes</div>
                          <ul className="space-y-0.5">
                            {q.excludes.map((i) => (
                              <li key={i} className="text-ink2">— {i}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                    {q.notes && (
                      <div className="mt-3 text-xs text-ink2 italic">{q.notes}</div>
                    )}
                  </div>
                );
              })}
            </div>

            {tripMessages.length > 0 && (
              <>
                <h2 className="text-sm font-medium text-ink2 uppercase tracking-wide mb-2 mt-8">
                  Operator thread
                </h2>
                <div className="surface p-4 space-y-3">
                  {tripMessages.map((m) => {
                    const op = findById(operators, m.operatorId ?? '');
                    return (
                      <div
                        key={m.id}
                        className={`flex gap-2 text-sm ${
                          m.direction === 'out' ? 'flex-row-reverse text-right' : ''
                        }`}
                      >
                        <div className="shrink-0 mt-0.5">
                          {m.fromAgent ? (
                            <div className="w-6 h-6 rounded bg-accent-soft text-accent grid place-items-center">
                              <Bot className="w-3 h-3" strokeWidth={2} />
                            </div>
                          ) : op ? (
                            <Avatar name={op.contactName} color="#999" size={24} />
                          ) : null}
                        </div>
                        <div className="flex-1">
                          <div
                            className={`inline-block max-w-md px-3 py-2 rounded-lg text-sm ${
                              m.direction === 'out'
                                ? 'bg-accent-soft text-ink'
                                : 'bg-hover text-ink'
                            }`}
                          >
                            {m.body}
                          </div>
                          <div className="text-2xs text-muted mt-1 flex items-center gap-1">
                            {m.channel === 'whatsapp' ? (
                              <MessageCircle className="w-2.5 h-2.5" />
                            ) : (
                              <Mail className="w-2.5 h-2.5" />
                            )}
                            {m.fromAgent && <span className="capitalize">{m.fromAgent} agent · </span>}
                            <span>{formatRelative(m.sentAt)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Agent activity */}
          <div>
            <h2 className="text-sm font-medium text-ink2 uppercase tracking-wide mb-2">
              Agent log
            </h2>
            <div className="surface p-3 space-y-3">
              {tripEvents.length === 0 && (
                <div className="text-sm text-muted">No agent activity yet.</div>
              )}
              {tripEvents.map((e) => (
                <div key={e.id} className="text-xs">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <div className="w-4 h-4 rounded bg-accent-soft text-accent grid place-items-center">
                      <Bot className="w-2.5 h-2.5" strokeWidth={2} />
                    </div>
                    <span className="font-medium capitalize text-ink">{e.agent}</span>
                    <span className="text-muted">·</span>
                    <span className="text-muted">{formatRelative(e.at)}</span>
                  </div>
                  <div className="text-ink2 leading-snug">{e.summary}</div>
                  {e.detail && (
                    <div className="text-muted leading-snug mt-0.5">{e.detail}</div>
                  )}
                </div>
              ))}
            </div>

            <Link
              href={`/agents/itinerary?trip=${trip.id}`}
              className="btn btn-outline w-full mt-3 h-9"
            >
              <Bot className="w-3.5 h-3.5" strokeWidth={1.75} />
              Research Itinerary
            </Link>
            <Link
              href={`/agents/scout?trip=${trip.id}`}
              className="btn btn-outline w-full mt-2 h-9"
            >
              <Bot className="w-3.5 h-3.5" strokeWidth={1.75} />
              Scout Operators
            </Link>
          </div>
        </div>

        {/* Connectors */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-medium text-ink2 uppercase tracking-wide">
              Connectors
            </h2>
            <span className="inline-flex items-center gap-1 text-2xs font-medium px-1.5 py-0.5 rounded bg-[#eef] text-[#446]">
              <Plug2 className="w-2.5 h-2.5" strokeWidth={2} />
              MCP
            </span>
          </div>
          <p className="text-xs text-muted mb-3">
            Connect external tools so agents can read and write on your behalf.
          </p>
          <ConnectorsPanel tripId={trip.id} />
        </div>
      </div>
    </>
  );
}

function Prop({
  icon: Icon,
  label,
}: {
  icon: LucideIcon;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted">
      <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
      {label}
    </div>
  );
}
