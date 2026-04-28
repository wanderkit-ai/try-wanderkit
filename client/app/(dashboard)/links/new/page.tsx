'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { ItineraryEditor } from '@/components/itinerary-editor';
import { Copy, Check, Eye, Sparkles, PencilLine, GripVertical } from 'lucide-react';
import type { TripStyle, ItineraryDay, JoinQuestionKey, JoinQuestion } from '@/lib/types';

const STYLES: TripStyle[] = ['expedition', 'hiking', 'beach', 'cultural', 'safari', 'culinary', 'wellness'];

const INPUT = 'w-full px-3 py-2 rounded border border-border bg-panel text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent/50';
const LABEL = 'text-xs font-medium text-ink2 block mb-1';

// All configurable join-question keys with metadata
const ALL_JOIN_QUESTIONS: { key: JoinQuestionKey; label: string; hint: string; group: string }[] = [
  { key: 'partySize', label: 'Party size', hint: 'How many people in their group', group: 'Logistics' },
  { key: 'roomPreference', label: 'Room preference', hint: 'Single / double / twin share / open to sharing', group: 'Logistics' },
  { key: 'roommateName', label: 'Roommate name', hint: 'If traveling with a specific person', group: 'Logistics' },
  { key: 'phone', label: 'Phone / WhatsApp', hint: 'For trip coordination', group: 'Logistics' },
  { key: 'dietaryRestrictions', label: 'Dietary restrictions', hint: 'Vegetarian, vegan, halal, kosher, etc.', group: 'Health & Safety' },
  { key: 'allergies', label: 'Allergies', hint: 'Food or environmental allergies', group: 'Health & Safety' },
  { key: 'mobilityNeeds', label: 'Mobility / accessibility', hint: 'Any physical considerations', group: 'Health & Safety' },
  { key: 'emergencyContact', label: 'Emergency contact', hint: 'Name + phone number', group: 'Health & Safety' },
  { key: 'travelInsurance', label: 'Travel insurance', hint: 'Have, need help, or not sure', group: 'Health & Safety' },
  { key: 'fitnessLevel', label: 'Fitness level', hint: 'Low / Moderate / High / Athletic', group: 'Trip-Specific' },
  { key: 'priorExperience', label: 'Prior experience', hint: "Most challenging trip they've done", group: 'Trip-Specific' },
  { key: 'surfLevel', label: 'Surf level', hint: 'Never surfed / Beginner / Intermediate / Advanced', group: 'Trip-Specific' },
  { key: 'nationality', label: 'Nationality', hint: 'Country on passport (visa awareness)', group: 'Trip-Specific' },
  { key: 'passport', label: 'Passport details', hint: 'Passport number + expiry date', group: 'Trip-Specific' },
  { key: 'dateOfBirth', label: 'Date of birth', hint: 'For travel insurance', group: 'Trip-Specific' },
  { key: 'whyInterested', label: 'Why interested', hint: "What draws them to this trip", group: 'Personal' },
  { key: 'heardAboutUs', label: 'How they heard', hint: 'Instagram, YouTube, friend, etc.', group: 'Personal' },
  { key: 'tshirtSize', label: 'T-shirt size', hint: 'If trip includes merch', group: 'Personal' },
  { key: 'specialRequests', label: 'Special requests', hint: 'Anything else to know', group: 'Personal' },
];

function smartDefaults(style: TripStyle[]): JoinQuestion[] {
  const always: JoinQuestionKey[] = ['partySize', 'roomPreference', 'dietaryRestrictions', 'allergies', 'emergencyContact', 'whyInterested'];
  const alwaysRequired: JoinQuestionKey[] = ['partySize', 'roomPreference', 'dietaryRestrictions', 'emergencyContact', 'whyInterested'];

  const hiking = style.some((s) => s === 'hiking' || s === 'expedition');
  const beach = style.some((s) => s === 'beach' || s === 'wellness');
  const cultural = style.some((s) => s === 'cultural' || s === 'culinary' || s === 'safari');

  const extras: JoinQuestionKey[] = [];
  const extrasRequired: JoinQuestionKey[] = [];

  if (hiking) { extras.push('fitnessLevel', 'priorExperience', 'travelInsurance'); extrasRequired.push('fitnessLevel'); }
  if (beach) { extras.push('surfLevel', 'travelInsurance'); }
  if (cultural) { extras.push('nationality', 'travelInsurance'); extrasRequired.push('nationality'); }

  const enabled = new Set([...always, ...extras]);
  const required = new Set([...alwaysRequired, ...extrasRequired]);

  return ALL_JOIN_QUESTIONS.map((q) => ({
    key: q.key,
    enabled: enabled.has(q.key),
    required: required.has(q.key),
  }));
}

export default function NewTripLinkPage() {
  // Trip basics
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [style, setStyle] = useState<TripStyle[]>([]);
  const [capacity, setCapacity] = useState('8');

  // Itinerary
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);
  const [itineraryMode, setItineraryMode] = useState<'none' | 'manual'>('none');

  // Marketing
  const [coverImage, setCoverImage] = useState('');
  const [audienceDescription, setAudienceDescription] = useState('');

  // Join questions
  const [joinQuestions, setJoinQuestions] = useState<JoinQuestion[]>(smartDefaults([]));

  // Generate link
  const [generated, setGenerated] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<'draft' | 'live'>('draft');

  function toggleStyle(s: TripStyle) {
    const next = style.includes(s) ? style.filter((x) => x !== s) : [...style, s];
    setStyle(next);
    setJoinQuestions(smartDefaults(next));
  }

  function toggleEnabled(key: JoinQuestionKey) {
    setJoinQuestions((prev) =>
      prev.map((q) => q.key === key ? { ...q, enabled: !q.enabled, required: q.enabled ? false : q.required } : q)
    );
  }

  function toggleRequired(key: JoinQuestionKey) {
    setJoinQuestions((prev) =>
      prev.map((q) => q.key === key && q.enabled ? { ...q, required: !q.required } : q)
    );
  }

  function resetToSmartDefaults() {
    setJoinQuestions(smartDefaults(style));
  }

  function generateLink() {
    const slug = title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 48) || 'my-trip';
    setGenerated(`/t/${slug}`);
  }

  function copyLink() {
    if (!generated) return;
    navigator.clipboard.writeText(window.location.origin + generated);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const isReady = title.trim().length > 0 && destination.trim().length > 0 && startDate && endDate;

  // Group join questions
  const groups = ['Logistics', 'Health & Safety', 'Trip-Specific', 'Personal'];
  const grouped = groups.map((g) => ({
    group: g,
    questions: ALL_JOIN_QUESTIONS.filter((q) => q.group === g),
  }));

  const agentMessage = encodeURIComponent(
    [
      destination && startDate && endDate
        ? `Build a ${Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000)}-day itinerary for a ${style.length ? style.join(' and ') + ' ' : ''}trip to ${destination}.`
        : destination
        ? `Build an itinerary for a${style.length ? ' ' + style.join(' and ') : ''} trip to ${destination}.`
        : 'Build a day-by-day travel itinerary.',
      startDate && endDate ? `Dates: ${startDate} to ${endDate}.` : '',
      capacity ? `Group size: up to ${capacity} people.` : '',
      'Include activities, lodging suggestions, and transit notes for each day.',
    ].filter(Boolean).join(' ')
  );

  return (
    <>
      <PageHeader
        icon="🔗"
        title="New Trip Link"
        crumbs={[{ label: 'Trip Links', href: '/links' }, { label: 'New' }]}
        description="Define your trip, build the itinerary, and publish a shareable sign-up page."
      />

      <div className="px-6 pb-12 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        {/* ── Left: main content ── */}
        <div className="space-y-6 min-w-0">

          {/* 1. Trip basics */}
          <Section number={1} title="Trip basics">
            <label className="block">
              <span className={LABEL}>Campaign title <Req /></span>
              <input className={INPUT} placeholder="e.g. Nepal Expedition — Oct 2026" value={title} onChange={(e) => setTitle(e.target.value)} />
            </label>
            <label className="block">
              <span className={LABEL}>Destination <Req /></span>
              <input className={INPUT} placeholder="e.g. Pokhara & Kathmandu, Nepal" value={destination} onChange={(e) => setDestination(e.target.value)} />
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
            <div>
              <span className={LABEL}>Travel style</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {STYLES.map((s) => (
                  <button
                    key={s}
                    onClick={() => toggleStyle(s)}
                    className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                      style.includes(s)
                        ? 'bg-accent text-white border-accent'
                        : 'bg-panel text-ink2 border-border hover:border-ink2'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {style.length > 0 && (
                <p className="text-xs text-muted mt-1.5">Join-form questions auto-updated for: {style.join(', ')}</p>
              )}
            </div>
            <label className="block">
              <span className={LABEL}>Max capacity (spots)</span>
              <input type="number" min="1" max="100" className={`${INPUT} w-28`} value={capacity} onChange={(e) => setCapacity(e.target.value)} />
            </label>
          </Section>

          {/* 2. Itinerary */}
          <Section number={2} title="Itinerary">
            {itineraryMode === 'none' && (
              <div className="flex gap-3">
                <Link
                  href={`/agents/itinerary?message=${agentMessage}`}
                  className="flex items-center gap-2 px-4 h-9 rounded border border-accent text-accent text-sm font-medium hover:bg-accent/5 transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate with AI
                </Link>
                <button
                  onClick={() => { setItineraryMode('manual'); if (itinerary.length === 0) setItinerary([{ day: 1, date: startDate, location: '', activities: [''], transit: '', lodging: '' }]); }}
                  className="flex items-center gap-2 px-4 h-9 rounded border border-border text-ink2 text-sm font-medium hover:bg-hover transition-colors"
                >
                  <PencilLine className="w-4 h-4" />
                  Build manually
                </button>
              </div>
            )}

            {itineraryMode === 'manual' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted">{itinerary.length} day{itinerary.length !== 1 ? 's' : ''} planned</span>
                  <Link
                    href={`/agents/itinerary?message=${agentMessage}`}
                    className="flex items-center gap-1 text-xs text-accent hover:underline"
                  >
                    <Sparkles className="w-3 h-3" /> Switch to AI generation
                  </Link>
                </div>
                <ItineraryEditor days={itinerary} startDate={startDate} onChange={setItinerary} />
              </div>
            )}

            {itineraryMode === 'none' && itinerary.length === 0 && (
              <p className="text-xs text-muted mt-2">You can also add the itinerary after generating the link.</p>
            )}
          </Section>

          {/* 3. Marketing */}
          <Section number={3} title="Marketing">
            <label className="block">
              <span className={LABEL}>Cover image URL</span>
              <input className={INPUT} placeholder="https://…" value={coverImage} onChange={(e) => setCoverImage(e.target.value)} />
              {coverImage && (
                <div className="mt-2 rounded-lg overflow-hidden h-44">
                  <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                </div>
              )}
            </label>
            <label className="block">
              <span className={LABEL}>Description for your audience <Req /></span>
              <textarea
                rows={6}
                className={`${INPUT} resize-none`}
                placeholder="Tell your audience what this trip is about, who it's for, and why they should come…"
                value={audienceDescription}
                onChange={(e) => setAudienceDescription(e.target.value)}
              />
            </label>
            <div>
              <span className={LABEL}>Photo gallery (one URL per line)</span>
              <textarea
                rows={3}
                className={`${INPUT} resize-none font-mono text-xs`}
                placeholder={'https://example.com/photo1.jpg\nhttps://example.com/photo2.jpg'}
              />
            </div>
          </Section>

          {/* 4. Join form */}
          <Section number={4} title="Join form questions">
            <p className="text-xs text-muted -mt-1">
              <strong className="text-ink2">Name</strong> and <strong className="text-ink2">email</strong> are always collected.
              Toggle which additional questions to ask.
            </p>

            {/* Always-on fields */}
            {(['Full name', 'Email address'] as const).map((l) => (
              <div key={l} className="flex items-center justify-between h-9 px-2.5 rounded bg-hover/60 border border-border/60">
                <span className="text-sm text-ink">{l}</span>
                <span className="text-xs text-muted">always required</span>
              </div>
            ))}

            {grouped.map(({ group, questions }) => (
              <div key={group} className="space-y-1">
                <div className="text-xs font-semibold text-ink2 uppercase tracking-wide pt-1">{group}</div>
                {questions.map((meta) => {
                  const cfg = joinQuestions.find((q) => q.key === meta.key)!;
                  if (!cfg) return null;
                  return (
                    <div
                      key={meta.key}
                      className={`flex items-center gap-2 h-9 px-2.5 rounded border transition-colors ${
                        cfg.enabled ? 'border-border bg-panel' : 'border-transparent opacity-40'
                      }`}
                    >
                      <GripVertical className="w-3.5 h-3.5 text-muted shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-ink">{meta.label}</span>
                        <span className="text-xs text-muted ml-1.5 truncate hidden sm:inline">{meta.hint}</span>
                      </div>
                      {cfg.enabled && (
                        <button
                          onClick={() => toggleRequired(meta.key)}
                          className={`text-xs px-1.5 py-0.5 rounded border shrink-0 transition-colors ${
                            cfg.required ? 'bg-accent/10 text-accent border-accent/30 font-medium' : 'text-muted border-border hover:border-ink2'
                          }`}
                        >
                          {cfg.required ? 'Required' : 'Optional'}
                        </button>
                      )}
                      <button
                        onClick={() => toggleEnabled(meta.key)}
                        className={`relative w-8 h-4 rounded-full transition-colors shrink-0 ${cfg.enabled ? 'bg-accent' : 'bg-border'}`}
                      >
                        <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${cfg.enabled ? 'left-[18px]' : 'left-0.5'}`} />
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}

            <button onClick={resetToSmartDefaults} className="text-xs text-accent hover:underline mt-1">
              ↺ Reset to smart defaults for {style.length ? style.join(', ') : 'selected'} style
            </button>
          </Section>
        </div>

        {/* ── Right: sticky publish rail ── */}
        <div className="space-y-3 lg:sticky lg:top-6">
          <div className="rounded-lg border border-border bg-panel p-4 space-y-3">
            <h3 className="text-sm font-semibold text-ink">Publish</h3>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setStatus('draft')}
                className={`flex-1 h-8 rounded text-xs font-medium border transition-colors ${status === 'draft' ? 'bg-panel border-ink2 text-ink' : 'border-border text-muted hover:border-ink2'}`}
              >
                Draft
              </button>
              <button
                onClick={() => setStatus('live')}
                className={`flex-1 h-8 rounded text-xs font-medium border transition-colors ${status === 'live' ? 'bg-green-50 border-green-400 text-green-700' : 'border-border text-muted hover:border-ink2'}`}
              >
                Live
              </button>
            </div>

            <button
              onClick={generateLink}
              disabled={!isReady}
              className="w-full h-9 rounded bg-accent text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent/90 transition-colors"
            >
              Generate link
            </button>

            {generated && (
              <div className="flex items-center gap-2 p-2.5 rounded border border-green-200 bg-green-50">
                <code className="text-xs text-green-700 flex-1 truncate font-mono">{generated}</code>
                <button onClick={copyLink} className="shrink-0 text-green-700 hover:text-green-900">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
                <a href={generated} target="_blank" rel="noreferrer" className="shrink-0 text-green-700 hover:text-green-900">
                  <Eye className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="rounded-lg border border-border bg-panel p-4 space-y-2 text-xs text-muted">
            <div className="flex justify-between"><span>Style</span><span className="text-ink2">{style.length ? style.join(', ') : '—'}</span></div>
            <div className="flex justify-between"><span>Dates</span><span className="text-ink2 font-mono">{startDate || '—'} → {endDate || '—'}</span></div>
            <div className="flex justify-between"><span>Capacity</span><span className="text-ink2">{capacity} spots</span></div>
            <div className="flex justify-between"><span>Itinerary days</span><span className="text-ink2">{itinerary.length}</span></div>
            <div className="flex justify-between"><span>Join questions</span><span className="text-ink2">{joinQuestions.filter((q) => q.enabled).length + 2} active</span></div>
          </div>
        </div>
      </div>
    </>
  );
}

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
