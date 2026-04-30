import Image from 'next/image';
import { tripLinks, influencers, findById } from '@/lib/mock-data';
import { TripLinkForm } from './form';
import { DynamicTripPage } from './dynamic-page';
import { MapPin, CalendarDays, Users, Bed, Train } from 'lucide-react';

export default function PublicTripLinkPage({ params }: { params: { slug: string } }) {
  const link = tripLinks.find((l) => l.slug === params.slug && l.status !== 'draft');

  // For dynamically created trips (saved to localStorage from /trips/new), delegate to client component
  if (!link) {
    return <DynamicTripPage slug={params.slug} />;
  }

  const inf = findById(influencers, link.influencerId);
  const spotsLeft = link.capacity - link.responseCount;
  const isFull = spotsLeft <= 0 || link.status === 'closed';

  const nights = link.startDate && link.endDate
    ? Math.round((new Date(link.endDate).getTime() - new Date(link.startDate).getTime()) / 86400000)
    : null;

  const formattedDates = link.startDate && link.endDate
    ? `${fmtDate(link.startDate)} – ${fmtDate(link.endDate)}`
    : null;

  return (
    <div className="min-h-screen bg-[#f7f6f3] text-[#1c1917]">
      {/* Hero */}
      <div className="relative">
        {link.coverImage ? (
          <>
            <div className="relative h-72 sm:h-96 overflow-hidden">
              <Image src={link.coverImage} alt={link.title} fill className="object-cover" unoptimized />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
              {inf && (
                <p className="text-white/70 text-sm mb-1">{inf.name} · {inf.handle}</p>
              )}
              <h1 className="text-white text-3xl sm:text-4xl font-bold leading-tight drop-shadow">
                {link.title}
              </h1>
            </div>
          </>
        ) : (
          <div className="bg-[#1c1917] px-6 sm:px-10 py-12">
            {inf && <p className="text-white/60 text-sm mb-1">{inf.name} · {inf.handle}</p>}
            <h1 className="text-white text-3xl font-bold">{link.title}</h1>
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* At a glance */}
        <div className="flex flex-wrap gap-3">
          {link.destination && (
            <Chip icon={<MapPin className="w-3.5 h-3.5" />} text={link.destination} />
          )}
          {formattedDates && (
            <Chip icon={<CalendarDays className="w-3.5 h-3.5" />} text={`${formattedDates}${nights ? ` · ${nights} nights` : ''}`} />
          )}
          <Chip icon={<Users className="w-3.5 h-3.5" />} text={isFull ? 'Trip full' : `${spotsLeft} of ${link.capacity} spots left`} danger={isFull} />
          {link.style.map((s) => (
            <span key={s} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-stone-200 text-xs text-stone-600 capitalize">
              {s}
            </span>
          ))}
        </div>

        {/* Description */}
        <div>
          <p className="text-[#44403c] leading-relaxed whitespace-pre-line">{link.audienceDescription}</p>
        </div>

        {/* Itinerary */}
        {link.itinerary.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-[#1c1917] mb-4">Day-by-day itinerary</h2>
            <div className="space-y-3">
              {link.itinerary.map((day) => (
                <div key={day.day} className="rounded-xl border border-stone-200 bg-white overflow-hidden">
                  <div className="flex items-baseline gap-2 px-4 py-3 bg-stone-50 border-b border-stone-100">
                    <span className="text-xs font-mono font-bold text-stone-400">Day {day.day}</span>
                    <span className="font-semibold text-[#1c1917]">{day.location}</span>
                    {day.date && <span className="text-xs text-stone-400 font-mono ml-auto">{day.date}</span>}
                  </div>
                  <div className="px-4 py-3 space-y-2">
                    <ul className="space-y-1">
                      {day.activities.filter(Boolean).map((a, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[#44403c]">
                          <span className="w-1.5 h-1.5 rounded-full bg-stone-300 mt-1.5 shrink-0" />
                          {a}
                        </li>
                      ))}
                    </ul>
                    {(day.transit || day.lodging) && (
                      <div className="flex flex-wrap gap-3 pt-1 border-t border-stone-100 mt-2">
                        {day.transit && day.transit !== 'None' && (
                          <span className="flex items-center gap-1 text-xs text-stone-400">
                            <Train className="w-3 h-3" />{day.transit}
                          </span>
                        )}
                        {day.lodging && (
                          <span className="flex items-center gap-1 text-xs text-stone-400">
                            <Bed className="w-3 h-3" />{day.lodging}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gallery */}
        {link.galleryImages && link.galleryImages.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {link.galleryImages.map((url, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-stone-100">
                <Image src={url} alt={`Photo ${i + 1}`} fill className="object-cover" unoptimized />
              </div>
            ))}
          </div>
        )}

        {/* Join form or full state */}
        <div id="reserve">
          {isFull ? (
            <div className="rounded-xl border border-stone-200 bg-white p-6 text-center space-y-3">
              <div className="text-3xl">😔</div>
              <h2 className="font-semibold text-[#1c1917]">This trip is full</h2>
              <p className="text-sm text-stone-500">
                All {link.capacity} spots have been taken. Join the waitlist and we&apos;ll let you know if a spot opens up.
              </p>
              <input
                type="email"
                placeholder="your@email.com"
                className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-stone-50 text-sm outline-none focus:border-stone-400"
              />
              <button className="w-full h-10 rounded-lg bg-[#1c1917] text-white text-sm font-semibold hover:bg-[#292524] transition-colors">
                Join waitlist
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-bold text-[#1c1917] mb-4">Reserve your spot</h2>
              <TripLinkForm
                joinQuestions={link.joinQuestions}
                influencerName={inf?.name}
                tripStyle={link.style}
              />
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-stone-400 pb-4">
          Powered by <span className="font-medium text-stone-500">Noma</span>
        </p>
      </div>
    </div>
  );
}

function Chip({ icon, text, danger }: { icon: React.ReactNode; text: string; danger?: boolean }) {
  return (
    <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium ${
      danger
        ? 'bg-red-50 border-red-200 text-red-600'
        : 'bg-white border-stone-200 text-stone-600'
    }`}>
      {icon}{text}
    </span>
  );
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}
