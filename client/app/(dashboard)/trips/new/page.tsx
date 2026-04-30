'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { ItineraryEditor } from '@/components/itinerary-editor';
import { AgentChat } from '@/components/agent-chat';
import { Avatar } from '@/components/avatar';
import { customers } from '@/lib/mock-data';
import { Sparkles, PencilLine, Check } from 'lucide-react';
import type { TripStyle, ItineraryDay } from '@/lib/types';

const JAMIE_ID = 'inf_jamie';
const STYLES: TripStyle[] = ['expedition', 'hiking', 'beach', 'cultural', 'safari', 'culinary', 'wellness'];

const INPUT = 'w-full px-3 py-2 rounded border border-border bg-panel text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent/50';
const LABEL = 'text-xs font-medium text-ink2 block mb-1';

type ItineraryMode = 'none' | 'ai' | 'manual';

function Section({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-panel p-5 space-y-4">
      <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
        <span className="w-5 h-5 rounded-full bg-accent/10 text-accent text-xs grid place-items-center font-bold shrink-0">{number}</span>
        {title}
      </h3>
      {children}
    </div>
  );
}

function Req() {
  return <span className="text-red-400 ml-0.5">*</span>;
}

export default function NewTripPage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [style, setStyle] = useState<TripStyle[]>([]);
  const [groupSize, setGroupSize] = useState('8');
  const [budget, setBudget] = useState('');
  const [mustHaves, setMustHaves] = useState('');

  const [itineraryMode, setItineraryMode] = useState<ItineraryMode>('none');
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);
  const [aiQuery, setAiQuery] = useState<string | null>(null);

  const myCustomers = customers.filter((c) => c.influencerId === JAMIE_ID);
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());

  const [savedDraft, setSavedDraft] = useState(false);

  const isReady = title.trim().length > 0 && destination.trim().length > 0 && !!startDate && !!endDate;

  function toggleStyle(s: TripStyle) {
    setStyle((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  }

  function toggleCustomer(id: string) {
    setSelectedCustomers((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function buildAiMessage() {
    const days = startDate && endDate
      ? Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000)
      : null;
    return [
      days ? `Build a ${days}-day itinerary` : 'Build an itinerary',
      `for a${style.length ? ' ' + style.join(' and ') : ''} trip to ${destination || '[destination]'}.`,
      startDate && endDate ? `Dates: ${startDate} to ${endDate}.` : '',
      groupSize ? `Group size: up to ${groupSize} people.` : '',
      mustHaves ? `Must-haves: ${mustHaves}.` : '',
      'Include real activities, transit, and lodging for each day.',
    ].filter(Boolean).join(' ');
  }

  function activateAI() {
    setItineraryMode('ai');
    setAiQuery(buildAiMessage());
  }

  function activateManual() {
    setItineraryMode('manual');
    if (itinerary.length === 0) {
      setItinerary([{ day: 1, date: startDate || '', location: destination, activities: [''], transit: '', lodging: '' }]);
    }
  }

  function saveAsDraft() {
    setSavedDraft(true);
  }

  function publish() {
    if (!isReady) return;
    const slug = title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 48) || 'my-trip';
    const tripData = {
      slug,
      title,
      destination,
      startDate,
      endDate,
      style,
      groupSize: parseInt(groupSize) || 8,
      budget: parseInt(budget) || 0,
      mustHaves: mustHaves.split(',').map((s) => s.trim()).filter(Boolean),
      itinerary,
      customerIds: Array.from(selectedCustomers),
      status: 'live',
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(`wanderkit:trip:${slug}`, JSON.stringify(tripData));
    router.push(`/t/${slug}`);
  }

  return (
    <>
      <PageHeader
        icon="✈️"
        title="New Trip"
        crumbs={[{ label: 'Trips', href: '/trips' }, { label: 'New' }]}
        description="Set up your trip brief, build the itinerary, and save as draft or publish a shareable link."
      />

      <div className="px-6 pb-12 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
        {/* ── Left column ── */}
        <div className="space-y-5 min-w-0">

          {/* 1. Trip basics */}
          <Section number={1} title="Trip basics">
            <label className="block">
              <span className={LABEL}>Trip title <Req /></span>
              <input
                className={INPUT}
                placeholder="e.g. Annapurna Base Camp — Oct 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
            <label className="block">
              <span className={LABEL}>Destination <Req /></span>
              <input
                className={INPUT}
                placeholder="e.g. Annapurna, Nepal"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className={LABEL}>Start date <Req /></span>
                <input type="date" className={INPUT} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </label>
              <label className="block">
                <span className={LABEL}>End date <Req /></span>
                <input type="date" className={INPUT} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className={LABEL}>Max group size</span>
                <input type="number" min="1" max="100" className={INPUT} value={groupSize} onChange={(e) => setGroupSize(e.target.value)} />
              </label>
              <label className="block">
                <span className={LABEL}>Budget / person (USD)</span>
                <input type="number" min="0" className={INPUT} placeholder="e.g. 3800" value={budget} onChange={(e) => setBudget(e.target.value)} />
              </label>
            </div>
            <div>
              <span className={LABEL}>Travel style</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {STYLES.map((s) => (
                  <button key={s} type="button" onClick={() => toggleStyle(s)}
                    className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                      style.includes(s) ? 'bg-accent text-white border-accent' : 'bg-panel text-ink2 border-border hover:border-ink2'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <label className="block">
              <span className={LABEL}>Must-haves</span>
              <input className={INPUT} placeholder="e.g. Teahouse stays, Local guide, Vegetarian-friendly" value={mustHaves} onChange={(e) => setMustHaves(e.target.value)} />
              <span className="text-2xs text-muted mt-1 block">Comma-separated list</span>
            </label>
          </Section>

          {/* 2. Itinerary */}
          <Section number={2} title="Itinerary">
            {itineraryMode === 'none' && (
              <div className="space-y-3">
                <p className="text-xs text-muted">Choose how to build the itinerary — you can add it after publishing too.</p>
                <div className="flex gap-3">
                  <button type="button" onClick={activateAI} disabled={!destination}
                    className="flex items-center gap-2 px-4 h-9 rounded border border-accent text-accent text-sm font-medium hover:bg-accent/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Sparkles className="w-4 h-4" />
                    Use AI agent
                  </button>
                  <button type="button" onClick={activateManual}
                    className="flex items-center gap-2 px-4 h-9 rounded border border-border text-ink2 text-sm font-medium hover:bg-hover transition-colors"
                  >
                    <PencilLine className="w-4 h-4" />
                    Own itinerary
                  </button>
                </div>
                {!destination && <p className="text-xs text-muted">Add a destination first to enable AI generation.</p>}
              </div>
            )}

            {itineraryMode === 'ai' && aiQuery && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-ink2 font-medium flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-accent" />
                    AI Itinerary Agent
                  </span>
                  <button type="button" onClick={() => { setItineraryMode('none'); setAiQuery(null); }} className="text-xs text-muted hover:text-ink2">
                    ← Back
                  </button>
                </div>
                <div className="border border-border rounded-lg overflow-hidden">
                  <AgentChat key={aiQuery} config={{
                    name: 'itinerary',
                    displayName: 'Research Itinerary',
                    emoji: '🗺️',
                    description: 'Building your day-by-day itinerary with live research…',
                    starters: [],
                    toolCount: 7,
                    initialMessage: aiQuery,
                  }} />
                </div>
              </div>
            )}

            {itineraryMode === 'manual' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted">{itinerary.length} day{itinerary.length !== 1 ? 's' : ''} planned</span>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={activateAI} disabled={!destination} className="flex items-center gap-1 text-xs text-accent hover:underline disabled:opacity-40">
                      <Sparkles className="w-3 h-3" /> Switch to AI
                    </button>
                    <button type="button" onClick={() => setItineraryMode('none')} className="text-xs text-muted hover:text-ink2">
                      ← Back
                    </button>
                  </div>
                </div>
                <ItineraryEditor days={itinerary} startDate={startDate} onChange={setItinerary} />
              </div>
            )}
          </Section>

          {/* 3. Customers */}
          <Section number={3} title="Assign customers">
            <p className="text-xs text-muted -mt-1">Select which customers are on this trip.</p>
            <div className="space-y-1.5">
              {myCustomers.map((c) => {
                const selected = selectedCustomers.has(c.id);
                return (
                  <button key={c.id} type="button" onClick={() => toggleCustomer(c.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded border text-left transition-colors ${
                      selected ? 'border-accent bg-accent/5' : 'border-border hover:border-ink2/40 hover:bg-hover/40'
                    }`}
                  >
                    <Avatar name={c.name} color={c.avatarColor} size={24} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-ink font-medium">{c.name}</div>
                      <div className="text-xs text-muted truncate">{c.email}</div>
                    </div>
                    <div className="flex gap-1 flex-wrap justify-end">
                      {c.interests.map((i) => <span key={i} className="chip text-2xs">{i}</span>)}
                    </div>
                    {selected && <Check className="w-4 h-4 text-accent shrink-0" strokeWidth={2.5} />}
                  </button>
                );
              })}
            </div>
            {selectedCustomers.size > 0 && (
              <p className="text-xs text-muted">{selectedCustomers.size} customer{selectedCustomers.size !== 1 ? 's' : ''} selected</p>
            )}
          </Section>
        </div>

        {/* ── Right: sticky publish rail ── */}
        <div className="space-y-3 lg:sticky lg:top-6">
          <div className="rounded-lg border border-border bg-panel p-4 space-y-3">
            <h3 className="text-sm font-semibold text-ink">Save & publish</h3>

            {!savedDraft ? (
              <>
                <button type="button" onClick={saveAsDraft}
                  className="w-full h-9 rounded border border-border text-sm text-ink2 font-medium hover:bg-hover transition-colors"
                >
                  Save as draft
                </button>
                <button type="button" onClick={publish} disabled={!isReady}
                  className="w-full h-9 rounded bg-accent text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent/90 transition-colors"
                >
                  Publish + create link
                </button>
                {!isReady && <p className="text-2xs text-muted">Fill in title, destination and dates to publish.</p>}
              </>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-2.5 rounded border border-border bg-hover/60">
                  <Check className="w-4 h-4 text-ink2 shrink-0" strokeWidth={2.5} />
                  <span className="text-sm text-ink2">Saved as draft</span>
                </div>
                <Link href="/trips"
                  className="block w-full h-9 rounded border border-border text-center text-sm text-ink2 font-medium hover:bg-hover transition-colors leading-9"
                >
                  Back to trips
                </Link>
                <button type="button" onClick={publish} disabled={!isReady}
                  className="w-full h-9 rounded bg-accent text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent/90 transition-colors"
                >
                  Publish + create link
                </button>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="rounded-lg border border-border bg-panel p-4 space-y-2 text-xs text-muted">
            <div className="flex justify-between"><span>Style</span><span className="text-ink2">{style.length ? style.join(', ') : '—'}</span></div>
            <div className="flex justify-between"><span>Dates</span><span className="text-ink2 font-mono">{startDate || '—'} → {endDate || '—'}</span></div>
            <div className="flex justify-between"><span>Group size</span><span className="text-ink2">{groupSize}</span></div>
            <div className="flex justify-between"><span>Budget / pp</span><span className="text-ink2">{budget ? `$${Number(budget).toLocaleString()}` : '—'}</span></div>
            <div className="flex justify-between"><span>Itinerary</span><span className="text-ink2">{itinerary.length ? `${itinerary.length} days` : itineraryMode === 'ai' ? 'via AI' : '—'}</span></div>
            <div className="flex justify-between"><span>Customers</span><span className="text-ink2">{selectedCustomers.size || '—'}</span></div>
          </div>
        </div>
      </div>
    </>
  );
}
