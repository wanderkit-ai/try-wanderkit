import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Avatar } from '@/components/avatar';
import { tripLinks, influencers, findById } from '@/lib/mock-data';
import { MapPin, Calendar, Users, Bed, Train, Circle } from 'lucide-react';

const STATUS_STYLES: Record<string, string> = {
  live: 'bg-green-50 text-green-700 border border-green-200',
  draft: 'bg-stone-100 text-stone-500 border border-stone-200',
  closed: 'bg-red-50 text-red-600 border border-red-200',
};

const ALL_JOIN_QUESTION_META: Record<string, string> = {
  partySize: 'Party size', roomPreference: 'Room preference', roommateName: 'Roommate name',
  phone: 'Phone / WhatsApp', dietaryRestrictions: 'Dietary restrictions', allergies: 'Allergies',
  mobilityNeeds: 'Mobility / accessibility', emergencyContact: 'Emergency contact',
  travelInsurance: 'Travel insurance', fitnessLevel: 'Fitness level',
  priorExperience: 'Prior experience', surfLevel: 'Surf level',
  nationality: 'Nationality', passport: 'Passport details', dateOfBirth: 'Date of birth',
  whyInterested: 'Why interested', heardAboutUs: 'How they heard',
  tshirtSize: 'T-shirt size', specialRequests: 'Special requests',
};

function buildItineraryMessage(link: ReturnType<typeof tripLinks.find> & object) {
  if (!link) return '';
  const nights = link.startDate && link.endDate
    ? Math.round((new Date(link.endDate).getTime() - new Date(link.startDate).getTime()) / 86400000)
    : null;
  const parts = [
    `Build a${nights ? ` ${nights}-day` : ''} itinerary for a ${link.style.join(' and ')} trip to ${link.destination}.`,
    link.startDate && link.endDate ? `Dates: ${link.startDate} to ${link.endDate}.` : '',
    `Group size: up to ${link.capacity} people.`,
    link.style.length ? `Travel style: ${link.style.join(', ')}.` : '',
    'Build a detailed day-by-day plan with activities, lodging suggestions, and transit notes for each day.',
  ].filter(Boolean);
  return parts.join(' ');
}

export default function TripLinkDetailPage({ params }: { params: { id: string } }) {
  const link = tripLinks.find((l) => l.id === params.id);
  if (!link) notFound();

  const inf = findById(influencers, link.influencerId);
  const spotsLeft = link.capacity - link.responseCount;
  const enabledQuestions = link.joinQuestions.filter((q) => q.enabled);
  const agentMessage = encodeURIComponent(buildItineraryMessage(link));

  return (
    <>
      <PageHeader
        icon="🔗"
        title={link.title}
        crumbs={[{ label: 'Trip Links', href: '/links' }, { label: link.title }]}
        description={link.destination}
        actions={
          <Link
            href={`/t/${link.slug}`}
            target="_blank"
            className="flex items-center gap-1.5 h-8 px-3 rounded bg-accent text-white text-sm font-medium hover:bg-accent/90"
          >
            Open form ↗
          </Link>
        }
      />

      <div className="px-12 pb-12 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">
        {/* Main */}
        <div className="space-y-5">
          {/* Cover image */}
          {link.coverImage && (
            <div className="relative rounded-xl overflow-hidden h-56">
              <Image src={link.coverImage} alt={link.title} fill className="object-cover" unoptimized />
            </div>
          )}

          {/* Description */}
          <div className="rounded-lg border border-border bg-panel p-5 space-y-2">
            <h3 className="text-sm font-semibold text-ink">Audience description</h3>
            <p className="text-sm text-ink2 leading-relaxed whitespace-pre-line">{link.audienceDescription}</p>
          </div>

          {/* Itinerary */}
          <div className="rounded-lg border border-border bg-panel overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink">
                Itinerary
                <span className="ml-2 text-xs font-normal text-muted">{link.itinerary.length} days · {link.itinerarySource}</span>
              </h3>
              <Link
                href={`/agents/itinerary?message=${agentMessage}`}
                className="text-xs text-accent hover:underline"
              >
                ✨ Edit with AI
              </Link>
            </div>
            {link.itinerary.length > 0 ? (
              <div className="divide-y divide-border">
                {link.itinerary.map((day) => (
                  <div key={day.day} className="p-4">
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-xs font-mono font-semibold text-accent">Day {day.day}</span>
                      <span className="text-sm font-medium text-ink">{day.location}</span>
                      <span className="text-xs text-muted font-mono">{day.date}</span>
                    </div>
                    <ul className="space-y-0.5 mb-2">
                      {day.activities.map((a, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-ink2">
                          <Circle className="w-1.5 h-1.5 mt-1.5 shrink-0 fill-current text-muted" />
                          {a}
                        </li>
                      ))}
                    </ul>
                    <div className="flex gap-4 text-xs text-muted mt-1">
                      {day.transit && day.transit !== 'None' && (
                        <span className="flex items-center gap-1"><Train className="w-3 h-3" />{day.transit}</span>
                      )}
                      {day.lodging && (
                        <span className="flex items-center gap-1"><Bed className="w-3 h-3" />{day.lodging}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-sm text-muted text-center">
                No itinerary yet.{' '}
                <Link href={`/agents/itinerary?message=${agentMessage}`} className="text-accent hover:underline">
                  Generate with AI ↗
                </Link>
              </div>
            )}
          </div>

          {/* Join form questions */}
          <div className="rounded-lg border border-border bg-panel p-5 space-y-3">
            <h3 className="text-sm font-semibold text-ink">Join form — {enabledQuestions.length + 2} questions</h3>
            <div className="space-y-1">
              {(['Full name', 'Email address'] as const).map((l) => (
                <div key={l} className="flex items-center justify-between h-8 px-3 rounded bg-hover/60 text-sm">
                  <span className="text-ink">{l}</span>
                  <span className="text-xs text-muted">always required</span>
                </div>
              ))}
              {link.joinQuestions.map((q) => (
                <div
                  key={q.key}
                  className={`flex items-center justify-between h-8 px-3 rounded border text-sm ${
                    q.enabled ? 'border-border bg-panel text-ink' : 'border-transparent text-muted opacity-40 line-through'
                  }`}
                >
                  <span>{ALL_JOIN_QUESTION_META[q.key] ?? q.key}</span>
                  {q.enabled && (
                    <span className={`text-xs ${q.required ? 'text-accent font-medium' : 'text-muted'}`}>
                      {q.required ? 'Required' : 'Optional'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-3 lg:sticky lg:top-6">
          <div className="rounded-lg border border-border bg-panel p-4 space-y-3">
            <h3 className="text-xs font-semibold text-ink2 uppercase tracking-wide">Details</h3>

            <Row label="Status">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[link.status]}`}>
                {link.status}
              </span>
            </Row>
            <Row label="Creator">
              {inf && (
                <div className="flex items-center gap-1.5">
                  <Avatar name={inf.name} color={inf.avatarColor} size={16} />
                  <span className="text-xs text-ink">{inf.handle}</span>
                </div>
              )}
            </Row>
            <Row label="Destination">
              <span className="text-xs text-ink2 flex items-center gap-1">
                <MapPin className="w-3 h-3" />{link.destination}
              </span>
            </Row>
            <Row label="Dates">
              <span className="text-xs font-mono text-ink2">
                {link.startDate} → {link.endDate}
              </span>
            </Row>
            <Row label="Style">
              <div className="flex gap-1 flex-wrap justify-end">
                {link.style.map((s) => <span key={s} className="chip">{s}</span>)}
              </div>
            </Row>
            <Row label="Spots">
              <span className={`text-sm font-semibold ${spotsLeft <= 2 ? 'text-red-500' : 'text-ink'}`}>
                {spotsLeft} / {link.capacity} left
              </span>
            </Row>
            <Row label="Responses"><span className="text-sm font-semibold text-ink">{link.responseCount}</span></Row>
            <Row label="Created"><span className="text-xs text-ink2">{link.createdAt}</span></Row>
          </div>

          <div className="rounded-lg border border-border bg-panel p-4 space-y-2">
            <h3 className="text-xs font-semibold text-ink2 uppercase tracking-wide">Shareable link</h3>
            <code className="block text-xs font-mono text-accent break-all">/t/{link.slug}</code>
            <Link
              href={`/t/${link.slug}`}
              target="_blank"
              className="block w-full h-8 rounded border border-border text-xs text-ink2 hover:bg-hover text-center leading-8 transition-colors"
            >
              Open public page ↗
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-2 text-sm">
      <span className="text-muted shrink-0">{label}</span>
      <div className="text-right">{children}</div>
    </div>
  );
}
