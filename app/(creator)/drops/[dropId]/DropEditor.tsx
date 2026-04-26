'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { ItineraryDay, IncludedItem, FAQ } from '@/types';

const TABS = ['Basics', 'Story', 'Itinerary', 'Included', 'FAQs', 'Publish'];

interface DropData {
  id: string;
  title: string;
  subtitle: string | null;
  description: string;
  creatorNote: string | null;
  destination: string;
  country: string;
  heroImageUrl: string | null;
  departureDate: string;
  returnDate: string;
  applicationDeadline: string;
  depositDeadline: string | null;
  totalSpots: number;
  pricePerPerson: number;
  depositAmount: number;
  singleSupplement: number | null;
  itinerary: ItineraryDay[];
  included: IncludedItem[];
  excluded: string[];
  faqs: FAQ[];
  status: string;
  stripeProductId: string | null;
}

export function DropEditor({ drop: initial }: { drop: DropData }) {
  const [tab, setTab] = useState(0);
  const [drop, setDrop] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  // AI generation state
  const [generating, setGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState('');
  const [aiForm, setAiForm] = useState({
    tripStyle: 'Adventure',
    fitnessLevel: 'Moderate',
    keyHighlights: '',
    operatorContext: '',
    creatorVoiceSamples: '',
  });

  const autoSave = useCallback(async (data: Partial<DropData>) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      try {
        const body: any = { ...data };
        if (body.pricePerPerson) body.pricePerPerson = Math.round(body.pricePerPerson);
        if (body.depositAmount) body.depositAmount = Math.round(body.depositAmount);
        if (body.singleSupplement) body.singleSupplement = Math.round(body.singleSupplement);
        await fetch(`/api/drops/${drop.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch {}
      setSaving(false);
    }, 800);
  }, [drop.id]);

  function update(field: string, value: any) {
    setDrop((d) => ({ ...d, [field]: value }));
    autoSave({ [field]: value });
  }

  async function generateItinerary() {
    setGenerating(true);
    setGeneratedText('');
    const duration = Math.ceil(
      (new Date(drop.returnDate).getTime() - new Date(drop.departureDate).getTime()) / 86400000
    ) + 1;

    const res = await fetch('/api/ai/generate-itinerary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dropId: drop.id,
        destination: drop.destination,
        country: drop.country,
        durationDays: duration,
        departureDate: drop.departureDate,
        ...aiForm,
      }),
    });

    if (!res.body) { setGenerating(false); return; }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let full = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      full += chunk;
      setGeneratedText(full);
    }

    try {
      const parsed: ItineraryDay[] = JSON.parse(full);
      update('itinerary', parsed);
    } catch {
      setError('Failed to parse itinerary. Check the generated JSON.');
    }
    setGenerating(false);
  }

  async function submitForReview() {
    setPublishing(true);
    const res = await fetch(`/api/drops/${drop.id}/publish`, { method: 'POST' });
    const json = await res.json();
    if (res.ok) {
      setDrop((d) => ({ ...d, status: json.status }));
      router.refresh();
    } else {
      setError(json.error?.message ?? 'Failed to submit');
    }
    setPublishing(false);
  }

  const checklist = [
    { label: 'Hero image uploaded', done: !!drop.heroImageUrl },
    { label: 'All basic details complete', done: !!(drop.title && drop.destination && drop.country) },
    { label: '7+ itinerary days', done: drop.itinerary.length >= 7 },
    { label: 'Creator note 100+ words', done: (drop.creatorNote?.split(' ').length ?? 0) >= 100 },
    { label: '4+ included items', done: drop.included.length >= 4 },
    { label: '3+ FAQs', done: drop.faqs.length >= 3 },
    { label: 'Stripe product created', done: !!drop.stripeProductId },
  ];

  const checklistPassed = checklist.filter((c) => c.done).length;

  return (
    <div>
      {/* Save indicator */}
      <div className="fixed top-4 right-4 z-50 font-mono text-xs" style={{ color: saving ? 'var(--color-dim)' : saved ? 'var(--color-accent)' : 'transparent' }}>
        {saving ? 'Saving...' : saved ? '✓ Saved' : '·'}
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-8" style={{ borderColor: 'var(--color-border)' }}>
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className="px-5 py-3 font-mono text-xs tracking-widest border-b-2 transition-colors"
            style={{
              borderBottomColor: tab === i ? 'var(--color-accent)' : 'transparent',
              color: tab === i ? 'var(--color-accent)' : 'var(--color-dim)',
            }}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Tab 1 — Basics */}
      {tab === 0 && (
        <div className="space-y-6 max-w-2xl">
          <F label="Title"><input className="ef" value={drop.title} onChange={(e) => update('title', e.target.value)} /></F>
          <F label="Subtitle"><input className="ef" value={drop.subtitle ?? ''} onChange={(e) => update('subtitle', e.target.value)} /></F>
          <div className="grid grid-cols-2 gap-4">
            <F label="Destination"><input className="ef" value={drop.destination} onChange={(e) => update('destination', e.target.value)} /></F>
            <F label="Country"><input className="ef" value={drop.country} onChange={(e) => update('country', e.target.value)} /></F>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <F label="Departure"><input type="date" className="ef" value={drop.departureDate} onChange={(e) => update('departureDate', e.target.value)} /></F>
            <F label="Return"><input type="date" className="ef" value={drop.returnDate} onChange={(e) => update('returnDate', e.target.value)} /></F>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <F label="Application deadline"><input type="date" className="ef" value={drop.applicationDeadline} onChange={(e) => update('applicationDeadline', e.target.value)} /></F>
            <F label="Deposit deadline"><input type="date" className="ef" value={drop.depositDeadline ?? ''} onChange={(e) => update('depositDeadline', e.target.value)} /></F>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <F label="Total spots"><input type="number" className="ef" value={drop.totalSpots} onChange={(e) => update('totalSpots', parseInt(e.target.value))} /></F>
            <F label="Price / person (cents)"><input type="number" className="ef" value={drop.pricePerPerson} onChange={(e) => update('pricePerPerson', parseInt(e.target.value))} /></F>
            <F label="Deposit (cents)"><input type="number" className="ef" value={drop.depositAmount} onChange={(e) => update('depositAmount', parseInt(e.target.value))} /></F>
          </div>
          <F label="Hero image URL"><input className="ef" value={drop.heroImageUrl ?? ''} onChange={(e) => update('heroImageUrl', e.target.value)} placeholder="https://images.unsplash.com/..." /></F>
        </div>
      )}

      {/* Tab 2 — Story (creator note) */}
      {tab === 1 && (
        <div className="max-w-2xl">
          <p className="text-sm mb-4" style={{ color: 'var(--color-muted)' }}>
            Write your personal note to followers. Aim for 200–600 words. This is what turns browsers into applicants.
          </p>
          <textarea
            className="w-full h-96 p-4 text-sm leading-relaxed outline-none resize-none"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-white)' }}
            value={drop.creatorNote ?? ''}
            onChange={(e) => update('creatorNote', e.target.value)}
            placeholder="Tell your audience why this trip matters to you personally..."
          />
          <p className="font-mono text-xs mt-2" style={{ color: 'var(--color-dim)' }}>
            {drop.creatorNote?.split(' ').filter(Boolean).length ?? 0} words
          </p>
        </div>
      )}

      {/* Tab 3 — Itinerary */}
      {tab === 2 && (
        <div>
          <div className="max-w-2xl mb-8">
            <p className="font-sans font-medium mb-4" style={{ color: 'var(--color-white)' }}>
              Generate with AI
            </p>
            <div className="space-y-4 p-6 border mb-4" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
              <div className="grid grid-cols-2 gap-4">
                <F label="Trip style">
                  <select className="ef" value={aiForm.tripStyle} onChange={(e) => setAiForm((f) => ({ ...f, tripStyle: e.target.value }))}>
                    {['Adventure', 'Cultural', 'Trekking', 'Photography', 'Culinary', 'Wellness'].map((s) => <option key={s}>{s}</option>)}
                  </select>
                </F>
                <F label="Fitness level">
                  <select className="ef" value={aiForm.fitnessLevel} onChange={(e) => setAiForm((f) => ({ ...f, fitnessLevel: e.target.value }))}>
                    {['Easy', 'Moderate', 'Challenging', 'Strenuous'].map((s) => <option key={s}>{s}</option>)}
                  </select>
                </F>
              </div>
              <F label="Key highlights">
                <input className="ef" value={aiForm.keyHighlights} onChange={(e) => setAiForm((f) => ({ ...f, keyHighlights: e.target.value }))} placeholder="Annapurna Base Camp, teahouse dinners, sunrise at Poon Hill..." />
              </F>
              <F label="Operator context">
                <input className="ef" value={aiForm.operatorContext} onChange={(e) => setAiForm((f) => ({ ...f, operatorContext: e.target.value }))} placeholder="TAAN-licensed guide, 15 years Nepal experience..." />
              </F>
              <button
                onClick={generateItinerary}
                disabled={generating}
                className="px-6 py-3 text-sm font-mono disabled:opacity-50"
                style={{ background: 'var(--color-accent)', color: '#080808' }}
              >
                {generating ? 'Generating...' : 'Generate itinerary →'}
              </button>
            </div>

            {generating && generatedText && (
              <div className="p-4 border mb-4" style={{ borderColor: 'var(--color-border)', background: 'var(--color-card)' }}>
                <p className="font-mono text-xs mb-2" style={{ color: 'var(--color-accent)' }}>GENERATING...</p>
                <pre className="text-xs overflow-auto max-h-48" style={{ color: 'var(--color-muted)' }}>{generatedText.slice(-500)}</pre>
              </div>
            )}
          </div>

          {drop.itinerary.length > 0 && (
            <div className="max-w-2xl">
              <p className="font-mono text-xs tracking-widest mb-4" style={{ color: 'var(--color-dim)' }}>
                ITINERARY ({drop.itinerary.length} days)
              </p>
              <div className="space-y-2">
                {drop.itinerary.map((day, i) => (
                  <div key={i} className="p-4 border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono font-bold" style={{ color: 'var(--color-accent)' }}>
                        Day {day.dayNumber}
                      </span>
                      <input
                        className="ef flex-1 text-sm"
                        value={day.title}
                        onChange={(e) => {
                          const updated = [...drop.itinerary];
                          updated[i] = { ...updated[i], title: e.target.value };
                          update('itinerary', updated);
                        }}
                      />
                    </div>
                    <textarea
                      className="w-full text-xs p-2 resize-none outline-none"
                      rows={2}
                      value={day.description}
                      style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}
                      onChange={(e) => {
                        const updated = [...drop.itinerary];
                        updated[i] = { ...updated[i], description: e.target.value };
                        update('itinerary', updated);
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4 — Included */}
      {tab === 3 && (
        <div className="max-w-2xl">
          <div className="flex items-center justify-between mb-4">
            <p className="font-mono text-xs tracking-widest" style={{ color: 'var(--color-dim)' }}>
              INCLUDED ITEMS
            </p>
            <button
              onClick={() => {
                const newItem: IncludedItem = {
                  index: String(drop.included.length + 1).padStart(2, '0'),
                  title: 'New item',
                  description: '',
                  included: true,
                };
                update('included', [...drop.included, newItem]);
              }}
              className="font-mono text-xs px-3 py-1.5"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}
            >
              + Add item
            </button>
          </div>

          <div className="space-y-2">
            {drop.included.map((item, i) => (
              <div key={i} className="p-4 border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
                <div className="flex items-center gap-3 mb-2">
                  <button
                    onClick={() => {
                      const updated = [...drop.included];
                      updated[i] = { ...updated[i], included: !updated[i].included };
                      update('included', updated);
                    }}
                    className="w-6 h-6 flex items-center justify-center text-xs font-mono"
                    style={{
                      background: item.included ? 'var(--color-accent)' : 'transparent',
                      border: `1px solid ${item.included ? 'var(--color-accent)' : 'var(--color-danger)'}`,
                      color: item.included ? '#080808' : 'var(--color-danger)',
                    }}
                  >
                    {item.included ? '✓' : '✕'}
                  </button>
                  <input
                    className="ef flex-1 text-sm font-medium"
                    value={item.title}
                    onChange={(e) => {
                      const updated = [...drop.included];
                      updated[i] = { ...updated[i], title: e.target.value };
                      update('included', updated);
                    }}
                  />
                  <button
                    onClick={() => update('included', drop.included.filter((_, j) => j !== i))}
                    className="font-mono text-xs"
                    style={{ color: 'var(--color-dim)' }}
                  >
                    ✕
                  </button>
                </div>
                <input
                  className="ef text-xs w-full"
                  value={item.description}
                  placeholder="Description..."
                  onChange={(e) => {
                    const updated = [...drop.included];
                    updated[i] = { ...updated[i], description: e.target.value };
                    update('included', updated);
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5 — FAQs */}
      {tab === 4 && (
        <div className="max-w-2xl">
          <div className="flex items-center justify-between mb-4">
            <p className="font-mono text-xs tracking-widest" style={{ color: 'var(--color-dim)' }}>FAQs</p>
            <button
              onClick={() => update('faqs', [...drop.faqs, { question: '', answer: '' }])}
              className="font-mono text-xs px-3 py-1.5"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}
            >
              + Add FAQ
            </button>
          </div>

          <div className="space-y-4">
            {drop.faqs.map((faq, i) => (
              <div key={i} className="p-4 border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
                <div className="flex items-start gap-2 mb-2">
                  <input
                    className="ef flex-1 font-medium text-sm"
                    value={faq.question}
                    placeholder="Question..."
                    onChange={(e) => {
                      const updated = [...drop.faqs];
                      updated[i] = { ...updated[i], question: e.target.value };
                      update('faqs', updated);
                    }}
                  />
                  <button onClick={() => update('faqs', drop.faqs.filter((_, j) => j !== i))} className="font-mono text-xs shrink-0" style={{ color: 'var(--color-dim)' }}>✕</button>
                </div>
                <textarea
                  className="w-full text-xs p-2 resize-none outline-none"
                  rows={3}
                  value={faq.answer}
                  placeholder="Answer..."
                  style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}
                  onChange={(e) => {
                    const updated = [...drop.faqs];
                    updated[i] = { ...updated[i], answer: e.target.value };
                    update('faqs', updated);
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6 — Publish */}
      {tab === 5 && (
        <div className="max-w-lg">
          <div className="space-y-3 mb-8">
            {checklist.map(({ label, done }) => (
              <div key={label} className="flex items-center gap-3 py-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
                <span
                  className="w-5 h-5 flex items-center justify-center text-xs font-mono shrink-0"
                  style={{
                    background: done ? 'var(--color-accent)' : 'var(--color-surface)',
                    border: `1px solid ${done ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    color: done ? '#080808' : 'var(--color-dim)',
                  }}
                >
                  {done ? '✓' : ''}
                </span>
                <span className="text-sm" style={{ color: done ? 'var(--color-white)' : 'var(--color-dim)' }}>
                  {label}
                </span>
              </div>
            ))}
          </div>

          <p className="font-mono text-xs mb-6" style={{ color: 'var(--color-dim)' }}>
            {checklistPassed}/{checklist.length} checks passed
          </p>

          {error && (
            <p className="text-sm mb-4" style={{ color: 'var(--color-danger)' }}>{error}</p>
          )}

          {drop.status === 'DRAFT' && (
            <button
              onClick={submitForReview}
              disabled={publishing || checklistPassed < 5}
              className="w-full py-4 text-sm font-mono disabled:opacity-40"
              style={{ background: 'var(--color-accent)', color: '#080808' }}
            >
              {publishing ? 'Submitting...' : 'Submit for review →'}
            </button>
          )}

          {drop.status === 'REVIEW' && (
            <div className="p-4 border text-center" style={{ borderColor: '#ffc800', background: 'rgba(255,200,0,0.08)' }}>
              <p className="font-mono text-xs" style={{ color: '#ffc800' }}>Under review by Tripdrop admin</p>
            </div>
          )}

          {drop.status === 'LIVE' && (
            <div className="p-4 border text-center" style={{ borderColor: 'var(--color-accent)', background: 'var(--color-accent-dim)' }}>
              <p className="font-mono text-xs" style={{ color: 'var(--color-accent)' }}>This drop is live ✓</p>
            </div>
          )}
        </div>
      )}

      <style jsx global>{`
        .ef {
          width: 100%;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          color: var(--color-white);
          padding: 0.6rem 0.875rem;
          font-family: var(--font-sans);
          font-size: 0.875rem;
          outline: none;
        }
        .ef:focus { border-color: var(--color-accent); }
        .ef::placeholder { color: var(--color-dim); }
        .ef option { background: var(--color-surface); }
      `}</style>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block font-mono text-xs tracking-widest mb-1.5" style={{ color: 'var(--color-dim)' }}>
        {label.toUpperCase()}
      </label>
      {children}
    </div>
  );
}
