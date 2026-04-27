'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { mockFlights, mockHotels } from '@/lib/mock-data';
import {
  Plane,
  Building2,
  Star,
  Bot,
  Search,
  ArrowRight,
  ArrowLeftRight,
  Clock,
  Wifi,
  Dumbbell,
  ChevronDown,
} from 'lucide-react';

type Tab = 'flights' | 'hotels';

export default function BookPage() {
  const [tab, setTab] = useState<Tab>('flights');
  const [origin, setOrigin] = useState('JFK');
  const [destination, setDestination] = useState('KTM');
  const [checkIn, setCheckIn] = useState('2026-10-11');
  const [checkOut, setCheckOut] = useState('2026-10-25');
  const [travelers, setTravelers] = useState('2');
  const [searched, setSearched] = useState(true);
  const [selectedClass, setSelectedClass] = useState<'all' | 'economy' | 'business'>('all');

  const flights = mockFlights.filter(
    (f) => selectedClass === 'all' || f.class === selectedClass
  );

  function swapOriginDest() {
    const tmp = origin;
    setOrigin(destination);
    setDestination(tmp);
  }

  const AMENITY_ICONS: Record<string, React.ReactNode> = {
    Pool: '🏊',
    'Lake view': '🏞️',
    Spa: '💆',
    Hammam: '🛁',
    WiFi: <Wifi className="w-3 h-3" />,
    Gym: <Dumbbell className="w-3 h-3" />,
    Beachfront: '🏖️',
    'Mountain views': '⛰️',
    'Ocean views': '🌊',
  };

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
              onClick={() => setTab(t)}
              className="flex items-center gap-1.5 h-8 px-4 rounded text-sm font-medium transition-all"
              style={{
                background: tab === t ? 'hsl(var(--panel))' : 'transparent',
                color: tab === t ? 'hsl(var(--ink))' : 'hsl(var(--ink-2))',
                boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {t === 'flights' ? <Plane className="w-3.5 h-3.5" strokeWidth={1.75} /> : <Building2 className="w-3.5 h-3.5" strokeWidth={1.75} />}
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
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full h-9 px-3 rounded border text-sm bg-bg border-border text-ink outline-none focus:border-accent"
                    placeholder="JFK"
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
                    placeholder="KTM"
                  />
                </div>
              </div>
              <div>
                <label className="text-2xs text-muted uppercase tracking-wide block mb-1">Depart</label>
                <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)}
                  className="h-9 px-3 rounded border text-sm bg-bg border-border text-ink outline-none focus:border-accent" />
              </div>
              <div>
                <label className="text-2xs text-muted uppercase tracking-wide block mb-1">Return</label>
                <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)}
                  className="h-9 px-3 rounded border text-sm bg-bg border-border text-ink outline-none focus:border-accent" />
              </div>
              <div>
                <label className="text-2xs text-muted uppercase tracking-wide block mb-1">Travelers</label>
                <div className="relative">
                  <input value={travelers} onChange={(e) => setTravelers(e.target.value)}
                    className="h-9 px-3 pr-7 rounded border text-sm bg-bg border-border text-ink outline-none focus:border-accent w-20" />
                  <ChevronDown className="absolute right-2 top-2.5 w-3.5 h-3.5 text-muted pointer-events-none" />
                </div>
              </div>
              <button onClick={() => setSearched(true)} className="btn btn-primary h-9 px-5">
                <Search className="w-3.5 h-3.5" strokeWidth={2} />
                Search
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[200px]">
                <label className="text-2xs text-muted uppercase tracking-wide block mb-1">Destination</label>
                <input
                  defaultValue="Nepal"
                  className="w-full h-9 px-3 rounded border text-sm bg-bg border-border text-ink outline-none focus:border-accent"
                  placeholder="City or destination"
                />
              </div>
              <div>
                <label className="text-2xs text-muted uppercase tracking-wide block mb-1">Check-in</label>
                <input type="date" defaultValue="2026-10-12"
                  className="h-9 px-3 rounded border text-sm bg-bg border-border text-ink outline-none focus:border-accent" />
              </div>
              <div>
                <label className="text-2xs text-muted uppercase tracking-wide block mb-1">Check-out</label>
                <input type="date" defaultValue="2026-10-14"
                  className="h-9 px-3 rounded border text-sm bg-bg border-border text-ink outline-none focus:border-accent" />
              </div>
              <div>
                <label className="text-2xs text-muted uppercase tracking-wide block mb-1">Guests</label>
                <input defaultValue="2"
                  className="h-9 px-3 rounded border text-sm bg-bg border-border text-ink outline-none focus:border-accent w-20" />
              </div>
              <button onClick={() => setSearched(true)} className="btn btn-primary h-9 px-5">
                <Search className="w-3.5 h-3.5" strokeWidth={2} />
                Search
              </button>
            </div>
          )}
        </div>

        {/* Results */}
        {searched && tab === 'flights' && (
          <div>
            {/* Filter strip */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-muted">{flights.length} flights found</span>
              <div className="flex gap-1 ml-auto">
                {(['all', 'economy', 'business'] as const).map((c) => (
                  <button key={c} onClick={() => setSelectedClass(c)}
                    className="h-7 px-3 rounded text-xs font-medium border transition-colors"
                    style={{
                      background: selectedClass === c ? 'hsl(var(--ink))' : 'hsl(var(--panel))',
                      color: selectedClass === c ? 'hsl(var(--bg))' : 'hsl(var(--ink-2))',
                      borderColor: selectedClass === c ? 'hsl(var(--ink))' : 'hsl(var(--border))',
                    }}>
                    {c === 'all' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {flights.map((f) => (
                <div key={f.id} className="surface p-4 flex items-center gap-4 hover:border-ink2/30 transition-colors">
                  <div className="w-8 h-8 rounded bg-accent-soft text-accent grid place-items-center shrink-0">
                    <Plane className="w-4 h-4" strokeWidth={1.75} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-medium text-ink text-sm">{f.airline}</span>
                      <span className="text-2xs text-muted capitalize px-1.5 py-0.5 rounded bg-hover">{f.class}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-ink2">
                      <span className="font-mono font-medium">{f.origin}</span>
                      <ArrowRight className="w-3 h-3 text-muted" strokeWidth={2} />
                      <span className="font-mono font-medium">{f.destination}</span>
                      <span className="text-muted">·</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" strokeWidth={1.75} />{f.duration}</span>
                      <span className="text-muted">·</span>
                      <span>{f.stops === 0 ? 'Direct' : `${f.stops} stop`}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-semibold text-ink">${f.priceUsd.toLocaleString()}</div>
                    <div className="text-xs text-muted">per person</div>
                  </div>
                  <Link href={`/agents/booker`} className="btn btn-outline h-8 text-xs shrink-0">
                    Book with AI
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {searched && tab === 'hotels' && (
          <div>
            <div className="text-xs text-muted mb-3">{mockHotels.length} properties found</div>
            <div className="grid grid-cols-2 gap-3">
              {mockHotels.map((h) => (
                <div key={h.id} className="surface p-4 hover:border-ink2/30 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-medium text-ink">{h.name}</div>
                      <div className="text-xs text-muted mt-0.5">{h.location}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-semibold text-ink">${h.pricePerNightUsd}</div>
                      <div className="text-2xs text-muted">/ night</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: h.stars }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-warn text-warn" />
                      ))}
                    </div>
                    <span className="text-xs font-medium text-ink">{h.rating}</span>
                    <span className="text-xs text-muted">({h.reviewCount.toLocaleString()} reviews)</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {h.amenities.slice(0, 4).map((a) => (
                      <span key={a} className="chip text-2xs">{a}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xs text-muted italic">{h.style}</span>
                    <Link href="/agents/booker" className="btn btn-outline h-7 text-xs">
                      Book with AI
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Booker agent CTA */}
        <div className="surface p-5 flex items-center gap-4"
          style={{ background: 'linear-gradient(135deg, hsl(var(--accent-soft)) 0%, hsl(var(--panel)) 100%)' }}>
          <div className="w-10 h-10 rounded-full bg-accent text-white grid place-items-center shrink-0">
            <Bot className="w-5 h-5" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-ink">Let the Booker agent handle it</div>
            <div className="text-xs text-ink2 mt-0.5">Describe what you need in plain English — flights, villas, hotels — and the agent will find and hold the best options.</div>
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
