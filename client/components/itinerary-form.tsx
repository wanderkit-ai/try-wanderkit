'use client';

import { useState } from 'react';
import { Plane, MapPin, Users, Wallet, Sparkles, ArrowRight, Calendar, Plus, X, ArrowRight as Arrow } from 'lucide-react';
import { cn } from '@/lib/utils';
import { labelWithCode, resolveIATA } from '@/lib/airport-codes';
import type { TripStyle } from '@/lib/types';

const TRIP_STYLES: { value: TripStyle; label: string; emoji: string }[] = [
  { value: 'cultural', label: 'Cultural', emoji: '🏛️' },
  { value: 'culinary', label: 'Culinary', emoji: '🍜' },
  { value: 'hiking', label: 'Hiking', emoji: '🥾' },
  { value: 'beach', label: 'Beach', emoji: '🏖️' },
  { value: 'safari', label: 'Safari', emoji: '🦁' },
  { value: 'wellness', label: 'Wellness', emoji: '🧘' },
  { value: 'expedition', label: 'Expedition', emoji: '⛰️' },
];

const BUDGET_OPTIONS = [
  { value: 'budget', label: 'Budget', sub: '< $80 / day pp' },
  { value: 'mid-range', label: 'Mid-range', sub: '$80–200 / day pp' },
  { value: 'premium', label: 'Premium', sub: '$200–500 / day pp' },
  { value: 'luxury', label: 'Luxury', sub: '$500+ / day pp' },
];

export interface TripFormData {
  origin: string;
  destinations: string[];
  dates: string;
  travelers: number;
  budget: string;
  styles: TripStyle[];
  mustHaves: string;
  /** @deprecated use destinations[0] */
  destination: string;
}

interface Props {
  onSubmit: (data: TripFormData) => void;
  agentName: string;
}

function IATABadge({ value }: { value: string }) {
  const code = resolveIATA(value);
  if (!code || value.trim().toUpperCase() === code) return null;
  return (
    <span className="ml-1.5 text-2xs font-mono bg-accent/15 text-accent px-1 py-0.5 rounded">
      {code}
    </span>
  );
}

export function ItineraryForm({ onSubmit, agentName }: Props) {
  const [origin, setOrigin] = useState('');
  const [destinations, setDestinations] = useState<string[]>(['']);
  const [dates, setDates] = useState('');
  const [travelers, setTravelers] = useState(2);
  const [budget, setBudget] = useState('mid-range');
  const [styles, setStyles] = useState<TripStyle[]>([]);
  const [mustHaves, setMustHaves] = useState('');
  const [error, setError] = useState('');

  function toggleStyle(s: TripStyle) {
    setStyles((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  function addDestination() {
    setDestinations((prev) => [...prev, '']);
  }

  function removeDestination(idx: number) {
    setDestinations((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateDestination(idx: number, val: string) {
    setDestinations((prev) => prev.map((d, i) => (i === idx ? val : d)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!origin.trim()) { setError('Please enter your departure city.'); return; }
    const filledDests = destinations.map((d) => d.trim()).filter(Boolean);
    if (filledDests.length === 0) { setError('Please enter at least one destination.'); return; }
    if (!dates.trim()) { setError('Please enter your travel dates.'); return; }
    setError('');
    onSubmit({
      origin: origin.trim(),
      destinations: filledDests,
      destination: filledDests[0],
      dates: dates.trim(),
      travelers,
      budget,
      styles,
      mustHaves: mustHaves.trim(),
    });
  }

  return (
    <div className="h-full flex items-center justify-center bg-bg px-4 py-10 overflow-y-auto">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🗺️</div>
          <h1 className="text-2xl font-semibold text-ink tracking-tight">Plan your trip</h1>
          <p className="text-sm text-ink2 mt-1.5 max-w-md mx-auto leading-relaxed">
            {agentName} will search flights, hotels, and activities in parallel — then recommend the best options with full reasoning.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Origin */}
          <FieldWrapper label="Flying from" icon={<Plane className="w-3.5 h-3.5" />}>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="New York, London, Kathmandu…"
                className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
              />
              <IATABadge value={origin} />
            </div>
          </FieldWrapper>

          {/* Destinations — multi-stop */}
          <div className="surface rounded-lg px-4 py-3">
            <label className="flex items-center gap-1.5 text-xs font-medium text-ink2 mb-3">
              <span className="text-accent"><MapPin className="w-3.5 h-3.5" /></span>
              {destinations.length > 1 ? 'Destinations (multi-stop)' : 'Going to'}
            </label>

            {/* Destination chain */}
            <div className="space-y-2">
              {destinations.map((dest, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  {idx > 0 && (
                    <div className="flex items-center gap-1 text-muted shrink-0">
                      <Arrow className="w-3 h-3" />
                    </div>
                  )}
                  <div className={cn('flex items-center gap-1.5 flex-1', idx > 0 && 'pl-2')}>
                    <input
                      type="text"
                      value={dest}
                      onChange={(e) => updateDestination(idx, e.target.value)}
                      placeholder={idx === 0 ? 'Kathmandu, Morocco, Bali…' : 'Next stop…'}
                      className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
                    />
                    <IATABadge value={dest} />
                  </div>
                  {destinations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDestination(idx)}
                      className="shrink-0 w-5 h-5 rounded hover:bg-hover flex items-center justify-center text-muted hover:text-ink transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Multi-stop preview pill */}
            {destinations.filter(Boolean).length > 1 && (
              <div className="mt-2.5 flex items-center gap-1 text-xs text-muted flex-wrap">
                {destinations.filter(Boolean).map((d, i) => (
                  <span key={i} className="flex items-center gap-1">
                    {i > 0 && <Arrow className="w-2.5 h-2.5 text-muted/50" />}
                    <span className="font-medium text-ink2">{labelWithCode(d)}</span>
                  </span>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={addDestination}
              className="mt-3 flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors"
            >
              <Plus className="w-3 h-3" strokeWidth={2.5} />
              Add stop
            </button>
          </div>

          {/* Dates */}
          <FieldWrapper label="Travel dates" icon={<Calendar className="w-3.5 h-3.5" />}>
            <input
              type="text"
              value={dates}
              onChange={(e) => setDates(e.target.value)}
              placeholder="Oct 15–22, 2026  ·  or  ·  'first week of November'  ·  '7 days in January'"
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
            />
          </FieldWrapper>

          {/* Travelers + Budget */}
          <div className="grid grid-cols-2 gap-3">
            <FieldWrapper label="Travellers" icon={<Users className="w-3.5 h-3.5" />}>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setTravelers((n) => Math.max(1, n - 1))}
                  className="w-6 h-6 rounded border border-border text-ink2 hover:bg-hover flex items-center justify-center text-sm font-medium"
                >−</button>
                <span className="text-sm font-medium text-ink w-4 text-center">{travelers}</span>
                <button
                  type="button"
                  onClick={() => setTravelers((n) => Math.min(20, n + 1))}
                  className="w-6 h-6 rounded border border-border text-ink2 hover:bg-hover flex items-center justify-center text-sm font-medium"
                >+</button>
              </div>
            </FieldWrapper>

            <FieldWrapper label="Budget level" icon={<Wallet className="w-3.5 h-3.5" />}>
              <select
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full bg-transparent text-sm text-ink outline-none cursor-pointer"
              >
                {BUDGET_OPTIONS.map((b) => (
                  <option key={b.value} value={b.value}>{b.label} — {b.sub}</option>
                ))}
              </select>
            </FieldWrapper>
          </div>

          {/* Trip style */}
          <div className="surface rounded-lg px-4 py-3">
            <label className="flex items-center gap-1.5 text-xs font-medium text-ink2 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-accent" strokeWidth={1.75} />
              Trip style (pick all that apply)
            </label>
            <div className="flex flex-wrap gap-2">
              {TRIP_STYLES.map(({ value, label, emoji }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleStyle(value)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                    styles.includes(value)
                      ? 'bg-accent text-bg border-accent'
                      : 'border-border text-ink2 hover:bg-hover hover:text-ink'
                  )}
                >
                  <span>{emoji}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Must-haves */}
          <FieldWrapper label="Must-haves (optional)" icon={<span className="text-xs">✨</span>}>
            <input
              type="text"
              value={mustHaves}
              onChange={(e) => setMustHaves(e.target.value)}
              placeholder="cooking class, riad stay, sunrise hike, private guide…"
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
            />
          </FieldWrapper>

          {error && (
            <p className="text-xs text-red-500 px-1">{error}</p>
          )}

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-ink text-bg rounded-lg py-3 text-sm font-medium hover:bg-ink/90 transition-colors"
          >
            Plan my trip
            <ArrowRight className="w-4 h-4" strokeWidth={2} />
          </button>

          <p className="text-center text-xs text-muted">
            AI will search flights, hotels &amp; activities · takes ~15 seconds
          </p>
        </form>
      </div>
    </div>
  );
}

function FieldWrapper({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="surface rounded-lg px-4 py-3">
      <label className="flex items-center gap-1.5 text-xs font-medium text-ink2 mb-2">
        <span className="text-accent">{icon}</span>
        {label}
      </label>
      {children}
    </div>
  );
}
