'use client';

import { useEffect, useState } from 'react';
import { MapPin, CalendarDays, Users, Bed, Train, Check } from 'lucide-react';

interface DynamicTrip {
  slug: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  style: string[];
  groupSize: number;
  budget: number;
  mustHaves: string[];
  itinerary: { day: number; date: string; location: string; activities: string[]; transit: string; lodging: string }[];
  status: string;
  createdAt: string;
}

function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return iso; }
}

function Chip({ icon, text, danger }: { icon: React.ReactNode; text: string; danger?: boolean }) {
  return (
    <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium ${
      danger ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-stone-200 text-stone-600'
    }`}>
      {icon}{text}
    </span>
  );
}

export function DynamicTripPage({ slug }: { slug: string }) {
  const [trip, setTrip] = useState<DynamicTrip | null | 'loading'>('loading');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(`noma:trip:${slug}`);
    setTrip(raw ? (JSON.parse(raw) as DynamicTrip) : null);
  }, [slug]);

  if (trip === 'loading') {
    return (
      <div className="min-h-screen bg-[#f7f6f3] flex items-center justify-center">
        <p className="text-stone-400 text-sm">Loading…</p>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-[#f7f6f3] flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-2xl">🗺️</p>
          <h1 className="text-xl font-semibold text-stone-800">Trip not found</h1>
          <p className="text-sm text-stone-500">This link may have expired or the trip hasn&apos;t been published yet.</p>
        </div>
      </div>
    );
  }

  const nights = trip.startDate && trip.endDate
    ? Math.round((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / 86400000)
    : null;

  const formattedDates = trip.startDate && trip.endDate
    ? `${fmtDate(trip.startDate)} – ${fmtDate(trip.endDate)}`
    : null;

  return (
    <div className="min-h-screen bg-[#f7f6f3] text-[#1c1917]">
      {/* Hero */}
      <div className="bg-[#1c1917] px-6 sm:px-10 py-14">
        <p className="text-white/60 text-sm mb-2">Jamie Chen · @travelwithjamie</p>
        <h1 className="text-white text-3xl sm:text-4xl font-bold leading-tight">{trip.title}</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* At a glance */}
        <div className="flex flex-wrap gap-3">
          {trip.destination && (
            <Chip icon={<MapPin className="w-3.5 h-3.5" />} text={trip.destination} />
          )}
          {formattedDates && (
            <Chip icon={<CalendarDays className="w-3.5 h-3.5" />} text={`${formattedDates}${nights ? ` · ${nights} nights` : ''}`} />
          )}
          <Chip icon={<Users className="w-3.5 h-3.5" />} text={`Up to ${trip.groupSize} spots`} />
          {trip.style.map((s) => (
            <span key={s} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-stone-200 text-xs text-stone-600 capitalize">
              {s}
            </span>
          ))}
        </div>

        {/* Budget + must-haves */}
        {(trip.budget > 0 || trip.mustHaves.length > 0) && (
          <div className="rounded-xl border border-stone-200 bg-white p-5 space-y-3">
            {trip.budget > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Budget / person</span>
                <span className="font-semibold text-[#1c1917]">${trip.budget.toLocaleString()}</span>
              </div>
            )}
            {trip.mustHaves.length > 0 && (
              <div>
                <p className="text-xs font-medium text-stone-500 mb-2">Included</p>
                <ul className="space-y-1">
                  {trip.mustHaves.map((m, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-[#44403c]">
                      <span className="w-1.5 h-1.5 rounded-full bg-stone-300 shrink-0" />
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Itinerary */}
        {trip.itinerary.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-[#1c1917] mb-4">Day-by-day itinerary</h2>
            <div className="space-y-3">
              {trip.itinerary.map((day) => (
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

        {/* Reserve */}
        <div id="reserve">
          <h2 className="text-lg font-bold text-[#1c1917] mb-4">Reserve your spot</h2>
          {submitted ? (
            <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-green-100 grid place-items-center mx-auto">
                <Check className="w-5 h-5 text-green-600" strokeWidth={2.5} />
              </div>
              <h3 className="font-semibold text-green-800">You&apos;re on the list!</h3>
              <p className="text-sm text-green-700">Jamie&apos;s team will be in touch within 48 hours.</p>
            </div>
          ) : (
            <form
              onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}
              className="rounded-xl border border-stone-200 bg-white p-6 space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-medium text-stone-600 block mb-1">First name</span>
                  <input required className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-stone-50 text-sm outline-none focus:border-stone-400" />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-stone-600 block mb-1">Last name</span>
                  <input required className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-stone-50 text-sm outline-none focus:border-stone-400" />
                </label>
              </div>
              <label className="block">
                <span className="text-xs font-medium text-stone-600 block mb-1">Email</span>
                <input type="email" required className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-stone-50 text-sm outline-none focus:border-stone-400" />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-stone-600 block mb-1">Party size</span>
                <select className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-stone-50 text-sm outline-none focus:border-stone-400">
                  {[1,2,3,4].map(n => <option key={n}>{n}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-medium text-stone-600 block mb-1">Why do you want to join this trip?</span>
                <textarea rows={3} className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-stone-50 text-sm outline-none focus:border-stone-400 resize-none" />
              </label>
              <button type="submit" className="w-full h-11 rounded-lg bg-[#1c1917] text-white text-sm font-semibold hover:bg-[#292524] transition-colors">
                Request a spot
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-stone-400 pb-4">
          Powered by <span className="font-medium text-stone-500">Noma</span>
        </p>
      </div>
    </div>
  );
}
