'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import {
  Plane,
  Building2,
  Bot,
  Search,
  ArrowRight,
  ArrowLeftRight,
  Clock,
  Loader2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

type Tab = 'flights' | 'hotels';

type FlightOffer = {
  price: { total: number; currency: string };
  airlines: string[];
  duration: string | null;
  stops: number;
  departure: { iataCode: string; at: string } | null;
  arrival: { iataCode: string; at: string } | null;
  booking_link?: string;
  source: string;
};

type FlightResult = {
  origin: string;
  destination: string;
  departure_date: string;
  return_date?: string;
  offers: FlightOffer[];
  count: number;
  error?: string;
};

type HotelOffer = {
  hotel_id: string;
  name: string;
  city_code: string;
  check_in: string;
  check_out: string;
  price: { total: string; currency: string };
  room: Record<string, unknown>;
  offer_count: number;
};

type HotelResult = {
  city_code: string;
  check_in: string;
  check_out: string;
  hotels: HotelOffer[];
  count: number;
  error?: string;
};

function parseDuration(raw: string | null): string {
  if (!raw) return '—';
  // PT1680M → "28h 0m", PT28H → "28h"
  const minsMatch = raw.match(/PT(\d+)M$/);
  if (minsMatch) {
    const total = parseInt(minsMatch[1]);
    const h = Math.floor(total / 60);
    const m = total % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  const hMatch = raw.match(/PT([\d.]+)H/);
  if (hMatch) return `${hMatch[1]}h`;
  return raw;
}

function formatTime(at: string | undefined): string {
  if (!at) return '—';
  // "2026-10-11T08:00:00" or "2026-10-11 08:00:00"
  const t = at.replace('T', ' ');
  const parts = t.split(' ');
  if (parts.length >= 2) return parts[1].slice(0, 5);
  return at;
}

export default function BookPage() {
  const params = useSearchParams();

  const [tab, setTab] = useState<Tab>((params.get('tab') as Tab) ?? 'flights');

  // Flight search state
  const [origin, setOrigin] = useState(params.get('origin') ?? 'JFK');
  const [destination, setDestination] = useState(params.get('destination') ?? '');
  const [departDate, setDepartDate] = useState(params.get('date') ?? '');
  const [returnDate, setReturnDate] = useState(params.get('return') ?? '');
  const [travelers, setTravelers] = useState(params.get('travelers') ?? '1');

  // Hotel search state
  const [hotelDest, setHotelDest] = useState(params.get('destination') ?? '');
  const [checkIn, setCheckIn] = useState(params.get('date') ?? '');
  const [checkOut, setCheckOut] = useState(params.get('return') ?? '');
  const [guests, setGuests] = useState(params.get('travelers') ?? '1');

  // Auto-search when pre-filled from a trip link
  useEffect(() => {
    if (params.get('destination') && params.get('date') && params.get('autosearch') === '1') {
      if (tab === 'flights') searchFlights();
      else searchHotels();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Results
  const [flightResult, setFlightResult] = useState<FlightResult | null>(null);
  const [hotelResult, setHotelResult] = useState<HotelResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function swapOriginDest() {
    const tmp = origin;
    setOrigin(destination);
    setDestination(tmp);
  }

  async function searchFlights() {
    if (!destination || !departDate) {
      setError('Please enter a destination and departure date.');
      return;
    }
    setSearching(true);
    setError(null);
    setFlightResult(null);
    try {
      const res = await fetch('/api/search/flights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin,
          destination,
          departure_date: departDate,
          return_date: returnDate || undefined,
          adults: parseInt(travelers) || 1,
          max_results: 10,
        }),
      });
      const data: FlightResult = await res.json();
      if (data.error) setError(data.error);
      else setFlightResult(data);
    } catch (e: any) {
      setError(e?.message ?? 'Search failed');
    } finally {
      setSearching(false);
    }
  }

  async function searchHotels() {
    if (!hotelDest || !checkIn || !checkOut) {
      setError('Please enter a destination, check-in, and check-out date.');
      return;
    }
    setSearching(true);
    setError(null);
    setHotelResult(null);
    try {
      const res = await fetch('/api/search/hotels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: hotelDest,
          check_in: checkIn,
          check_out: checkOut,
          adults: parseInt(guests) || 1,
          max_hotels: 10,
        }),
      });
      const data: HotelResult = await res.json();
      if (data.error) setError(data.error);
      else setHotelResult(data);
    } catch (e: any) {
      setError(e?.message ?? 'Search failed');
    } finally {
      setSearching(false);
    }
  }

  return (
    <>
      <PageHeader
        icon="🛫"
        title="Book"
        description="Search flights and hotels for your trips. Hand off to the Booker agent to confirm reservations."
      />
      <div className="px-12 pb-12 space-y-6">

        {/* Tab switcher */}
        <div className="flex gap-1 p-1 rounded-lg w-fit" style={{ background: 'hsl(var(--hover))' }}>
          {(['flights', 'hotels'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(null); }}
              className="flex items-center gap-1.5 h-8 px-4 rounded text-sm font-medium transition-all"
              style={{
                background: tab === t ? 'hsl(var(--panel))' : 'transparent',
                color: tab === t ? 'hsl(var(--ink))' : 'hsl(var(--ink-2))',
                boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {t === 'flights'
                ? <Plane className="w-3.5 h-3.5" strokeWidth={1.75} />
                : <Building2 className="w-3.5 h-3.5" strokeWidth={1.75} />}
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Search form */}
        <div className="surface p-4">
          {tab === 'flights' ? (
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-[280px]">
                <div className="flex-1">
                  <label className="text-2xs text-muted uppercase tracking-wide block mb-1">From</label>
                  <input
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value.toUpperCase())}
                    className="w-full h-9 px-3 rounded border text-sm bg-bg border-border text-ink outline-none focus:border-accent font-mono"
                    placeholder="JFK"
                    maxLength={3}
                  />
                </div>
                <button onClick={swapOriginDest} className="mt-5 w-8 h-8 grid place-items-center rounded border border-border bg-bg hover:bg-hover text-muted">
                  <ArrowLeftRight className="w-3.5 h-3.5" strokeWidth={1.75} />
                </button>
                <div className="flex-1">
                  <label className="text-2xs text-muted uppercase tracking-wide block mb-1">To</label>
                  <input
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full h-9 px-3 rounded border text-sm bg-bg border-border text-ink outline-none focus:border-accent"
                    placeholder="City or IATA code"
                  />
                </div>
              </div>
              <div>
                <label className="text-2xs text-muted uppercase tracking-wide block mb-1">Depart</label>
                <input type="date" value={departDate} onChange={(e) => setDepartDate(e.target.value)}
                  className="h-9 px-3 rounded border text-sm bg-bg border-border text-ink outline-none focus:border-accent" />
              </div>
              <div>
                <label className="text-2xs text-muted uppercase tracking-wide block mb-1">Return <span className="text-muted normal-case">(optional)</span></label>
                <input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)}
                  className="h-9 px-3 rounded border text-sm bg-bg border-border text-ink outline-none focus:border-accent" />
              </div>
              <div>
                <label className="text-2xs text-muted uppercase tracking-wide block mb-1">Travelers</label>
                <input
                  type="number" min="1" max="9"
                  value={travelers} onChange={(e) => setTravelers(e.target.value)}
                  className="h-9 px-3 rounded border text-sm bg-bg border-border text-ink outline-none focus:border-accent w-20"
                />
              </div>
              <button onClick={searchFlights} disabled={searching} className="btn btn-primary h-9 px-5 disabled:opacity-60">
                {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" strokeWidth={2} />}
                {searching ? 'Searching…' : 'Search'}
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[200px]">
                <label className="text-2xs text-muted uppercase tracking-wide block mb-1">Destination</label>
                <input
                  value={hotelDest}
                  onChange={(e) => setHotelDest(e.target.value)}
                  className="w-full h-9 px-3 rounded border text-sm bg-bg border-border text-ink outline-none focus:border-accent"
                  placeholder="City or destination"
                />
              </div>
              <div>
                <label className="text-2xs text-muted uppercase tracking-wide block mb-1">Check-in</label>
                <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)}
                  className="h-9 px-3 rounded border text-sm bg-bg border-border text-ink outline-none focus:border-accent" />
              </div>
              <div>
                <label className="text-2xs text-muted uppercase tracking-wide block mb-1">Check-out</label>
                <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)}
                  className="h-9 px-3 rounded border text-sm bg-bg border-border text-ink outline-none focus:border-accent" />
              </div>
              <div>
                <label className="text-2xs text-muted uppercase tracking-wide block mb-1">Guests</label>
                <input
                  type="number" min="1" max="9"
                  value={guests} onChange={(e) => setGuests(e.target.value)}
                  className="h-9 px-3 rounded border text-sm bg-bg border-border text-ink outline-none focus:border-accent w-20"
                />
              </div>
              <button onClick={searchHotels} disabled={searching} className="btn btn-primary h-9 px-5 disabled:opacity-60">
                {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" strokeWidth={2} />}
                {searching ? 'Searching…' : 'Search'}
              </button>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="surface p-3 flex items-start gap-2 text-sm text-danger border-danger/30">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={1.75} />
            {error}
          </div>
        )}

        {/* Flight results */}
        {tab === 'flights' && flightResult && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-muted">
                {flightResult.count} flight{flightResult.count !== 1 ? 's' : ''} found
                · {flightResult.origin} → {flightResult.destination}
              </span>
              <span className="text-2xs text-muted ml-auto">via Google Flights</span>
            </div>

            {flightResult.offers.length === 0 ? (
              <div className="surface p-6 text-center text-sm text-muted">
                No flights found for this route and date. Try adjusting your search.
              </div>
            ) : (
              <div className="space-y-2">
                {flightResult.offers.map((f, i) => (
                  <div key={i} className="surface p-4 flex items-center gap-4 hover:border-ink2/30 transition-colors">
                    <div className="w-8 h-8 rounded bg-accent-soft text-accent grid place-items-center shrink-0">
                      <Plane className="w-4 h-4" strokeWidth={1.75} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-medium text-ink text-sm">
                          {f.airlines.length > 0 ? f.airlines.join(', ') : 'Unknown airline'}
                        </span>
                        {f.stops === 0
                          ? <span className="text-2xs text-success px-1.5 py-0.5 rounded bg-success/10">Direct</span>
                          : <span className="text-2xs text-muted px-1.5 py-0.5 rounded bg-hover">{f.stops} stop{f.stops !== 1 ? 's' : ''}</span>
                        }
                      </div>
                      <div className="flex items-center gap-2 text-sm text-ink2">
                        <span className="font-mono font-medium">{f.departure?.iataCode ?? flightResult.origin}</span>
                        <span className="text-muted text-xs">{formatTime(f.departure?.at)}</span>
                        <ArrowRight className="w-3 h-3 text-muted" strokeWidth={2} />
                        <span className="font-mono font-medium">{f.arrival?.iataCode ?? flightResult.destination}</span>
                        <span className="text-muted text-xs">{formatTime(f.arrival?.at)}</span>
                        <span className="text-muted">·</span>
                        <span className="flex items-center gap-1 text-xs">
                          <Clock className="w-3 h-3" strokeWidth={1.75} />
                          {parseDuration(f.duration)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-semibold text-ink">
                        {f.price.currency === 'USD' ? '$' : f.price.currency}{Number(f.price.total).toLocaleString()}
                      </div>
                      <div className="text-xs text-muted">per person</div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {f.booking_link && (
                        <a
                          href={f.booking_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-outline h-8 text-xs gap-1"
                        >
                          View <ExternalLink className="w-3 h-3" strokeWidth={1.75} />
                        </a>
                      )}
                      <Link href="/agents/booker" className="btn btn-outline h-8 text-xs">
                        Book with AI
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Hotel results */}
        {tab === 'hotels' && hotelResult && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-muted">
                {hotelResult.count} propert{hotelResult.count !== 1 ? 'ies' : 'y'} found · {hotelResult.city_code}
              </span>
            </div>

            {hotelResult.hotels.length === 0 ? (
              <div className="surface p-6 text-center text-sm text-muted">
                No hotels found. Amadeus hotel data may not be configured — set AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {hotelResult.hotels.map((h) => {
                  const nights = checkIn && checkOut
                    ? Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)
                    : null;
                  return (
                    <div key={h.hotel_id} className="surface p-4 hover:border-ink2/30 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0 mr-3">
                          <div className="font-medium text-ink">{h.name}</div>
                          <div className="text-xs text-muted mt-0.5">{h.city_code}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-base font-semibold text-ink">
                            {h.price.currency === 'USD' ? '$' : h.price.currency}{Number(h.price.total).toLocaleString()}
                          </div>
                          <div className="text-2xs text-muted">
                            {nights ? `${nights} night${nights !== 1 ? 's' : ''}` : 'total'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-2xs text-muted mb-3">
                        <span>{h.check_in} → {h.check_out}</span>
                        {h.offer_count > 1 && (
                          <span className="px-1.5 py-0.5 rounded bg-hover text-ink2">
                            {h.offer_count} room options
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-end">
                        <Link href="/agents/booker" className="btn btn-outline h-7 text-xs">
                          Book with AI
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Empty / prompt state */}
        {!searching && !error && tab === 'flights' && !flightResult && (
          <div className="surface p-6 text-center text-sm text-muted">
            Enter an origin, destination, and departure date to search Google Flights.
          </div>
        )}
        {!searching && !error && tab === 'hotels' && !hotelResult && (
          <div className="surface p-6 text-center text-sm text-muted">
            Enter a destination and dates to search hotels.
          </div>
        )}

        {/* Booker agent CTA */}
        <div
          className="surface p-5 flex items-center gap-4"
          style={{ background: 'linear-gradient(135deg, hsl(var(--accent-soft)) 0%, hsl(var(--panel)) 100%)' }}
        >
          <div className="w-10 h-10 rounded-full bg-accent text-white grid place-items-center shrink-0">
            <Bot className="w-5 h-5" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-ink">Let the Booker agent handle it</div>
            <div className="text-xs text-ink2 mt-0.5">
              Describe what you need in plain English — flights, villas, hotels — and the agent will find and hold the best options.
            </div>
          </div>
          <Link href="/agents/booker" className="btn btn-primary shrink-0">
            Open Booker
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
          </Link>
        </div>
      </div>
    </>
  );
}
