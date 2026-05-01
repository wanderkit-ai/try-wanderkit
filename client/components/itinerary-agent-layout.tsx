'use client';

import { useState } from 'react';
import {
  MapPin, Calendar, Loader2, Map, ChevronLeft, ChevronRight,
  Plane, Building2, DollarSign, Star, Clock, Check, Wifi, UtensilsCrossed,
  RefreshCw, ChevronDown, ChevronUp,
} from 'lucide-react';
import { AgentChat, type AgentClientConfig } from '@/components/agent-chat';
import { ItineraryTimeline } from '@/components/itinerary-timeline';
import { ItineraryForm, type TripFormData } from '@/components/itinerary-form';
import { WorkflowProgress } from '@/components/workflow-progress';
import type { EnhancedItineraryResult, FlightOption, HotelOption, CostBreakdown } from '@/lib/types';
import { cn } from '@/lib/utils';

type Phase = 'form' | 'planning' | 'results';
type ResultTab = 'overview' | 'flights' | 'hotel' | 'schedule' | 'budget';

const ITINERARY_TOOLS = new Set(['preview_itinerary', 'save_itinerary', 'build_itinerary']);

export function ItineraryAgentLayout({
  config,
}: {
  config: Omit<AgentClientConfig, 'sidebar' | 'onToolResult' | 'onRunningChange'>;
}) {
  const [phase, setPhase] = useState<Phase>('form');
  const [formData, setFormData] = useState<TripFormData | null>(null);
  const [activeTools, setActiveTools] = useState<Set<string>>(new Set());
  const [completedTools, setCompletedTools] = useState<Set<string>>(new Set());
  const [itineraryData, setItineraryData] = useState<EnhancedItineraryResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const [initialMessage, setInitialMessage] = useState<string | undefined>();

  function handleFormSubmit(data: TripFormData) {
    setFormData(data);
    const msg = buildAgentMessage(data);
    setInitialMessage(msg);
    setPhase('planning');
  }

  function handleToolUse(name: string) {
    setActiveTools((prev) => new Set([...Array.from(prev), name]));
  }

  function handleToolResult(name: string, result: unknown) {
    // Move from active → completed
    setActiveTools((prev) => { const next = new Set(prev); next.delete(name); return next; });
    setCompletedTools((prev) => new Set([...Array.from(prev), name]));

    if (!ITINERARY_TOOLS.has(name)) return;
    try {
      const data = (typeof result === 'string' ? JSON.parse(result) : result) as any;
      if (!Array.isArray(data?.itinerary)) return;
      setItineraryData({
        ...data,
        status: name === 'save_itinerary' || data?.saved ? 'saved' : 'draft',
      });
      setPhase('results');
    } catch {
      // non-itinerary result
    }
  }

  function handleReset() {
    setPhase('form');
    setFormData(null);
    setInitialMessage(undefined);
    setActiveTools(new Set());
    setCompletedTools(new Set());
    setItineraryData(null);
    setIsRunning(false);
  }

  if (phase === 'form') {
    return <ItineraryForm onSubmit={handleFormSubmit} agentName={config.displayName} />;
  }

  const chatConfig: AgentClientConfig = {
    ...config,
    sidebar: true,
    initialMessage,
    onToolResult: handleToolResult,
    onToolUse: handleToolUse,
    onRunningChange: setIsRunning,
  };

  return (
    <div className="flex h-[calc(100vh-180px)] overflow-hidden">
      {/* ── Chat sidebar ── */}
      <div
        className={cn(
          'shrink-0 border-r border-border flex flex-col overflow-hidden transition-all duration-300',
          chatCollapsed ? 'w-0 border-r-0' : 'w-[400px]',
        )}
      >
        <AgentChat config={chatConfig} />
      </div>

      {/* ── Toggle ── */}
      <button
        onClick={() => setChatCollapsed((c) => !c)}
        className="shrink-0 w-5 flex items-center justify-center border-r border-border bg-panel hover:bg-hover text-muted hover:text-ink transition-colors"
        title={chatCollapsed ? 'Show chat' : 'Hide chat'}
      >
        {chatCollapsed ? (
          <ChevronRight className="w-3.5 h-3.5" strokeWidth={2} />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2} />
        )}
      </button>

      {/* ── Right panel ── */}
      <div className="flex-1 overflow-y-auto bg-bg relative">
        {phase === 'planning' && (
          <WorkflowProgress
            activeTools={activeTools}
            completedTools={completedTools}
            destination={formData?.destination}
            isRunning={isRunning}
          />
        )}
        {phase === 'results' && itineraryData && (
          <ItineraryResultPanel data={itineraryData} onReset={handleReset} />
        )}
        {phase === 'results' && !itineraryData && (
          <div className="h-full flex flex-col items-center justify-center text-center px-8">
            <Loader2 className="w-6 h-6 text-accent animate-spin mb-3" />
            <p className="text-sm text-muted">Building your plan…</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Result panel ─────────────────────────────────────────────────────────────

function ItineraryResultPanel({ data, onReset }: { data: EnhancedItineraryResult; onReset: () => void }) {
  const [tab, setTab] = useState<ResultTab>('overview');
  const isSaved = data.status === 'saved';
  const days = data.totalDays ?? data.itinerary.length;

  return (
    <div className="px-6 py-5 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold text-ink tracking-tight">
              {data.destination ?? 'Your Trip'}
            </h2>
            <span
              className={cn(
                'inline-flex items-center text-2xs font-medium uppercase tracking-wide px-1.5 py-0.5 rounded-full',
                isSaved ? 'bg-success/15 text-success' : 'bg-accent-soft text-accent',
              )}
            >
              {isSaved ? 'Saved' : 'Draft'}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-1">
            {data.origin && (
              <span className="inline-flex items-center gap-1 text-sm text-ink2">
                <Plane className="w-3 h-3 text-muted" strokeWidth={1.75} />
                {data.origin} → {data.destination}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-sm text-ink2">
              <Calendar className="w-3 h-3 text-muted" strokeWidth={1.75} />
              {days} days
            </span>
          </div>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-xs text-muted hover:text-ink border border-border rounded px-2.5 py-1.5 hover:bg-hover transition-colors"
        >
          <RefreshCw className="w-3 h-3" strokeWidth={2} />
          New trip
        </button>
      </div>

      {/* AI Summary */}
      {data.ai_summary && (
        <div className="bg-accent-soft/50 border border-accent/20 rounded-lg px-4 py-3 mb-5">
          <p className="text-sm text-ink leading-relaxed">{data.ai_summary}</p>
        </div>
      )}

      {/* Quick-pick cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <QuickCard
          icon={<Plane className="w-4 h-4 text-accent" strokeWidth={1.75} />}
          label="Recommended flight"
          value={data.outbound_flight?.airline ?? '—'}
          sub={data.outbound_flight ? `$${data.outbound_flight.per_pax_usd?.toLocaleString() ?? '—'} / person` : '—'}
        />
        <QuickCard
          icon={<Building2 className="w-4 h-4 text-accent" strokeWidth={1.75} />}
          label="Recommended hotel"
          value={data.hotel?.name ?? '—'}
          sub={data.hotel ? `$${data.hotel.price_per_night_usd?.toLocaleString() ?? '—'} / night` : '—'}
        />
        <QuickCard
          icon={<DollarSign className="w-4 h-4 text-accent" strokeWidth={1.75} />}
          label="Est. total cost"
          value={data.cost_breakdown?.total_usd ? `$${data.cost_breakdown.total_usd.toLocaleString()}` : '—'}
          sub="per person (all-in)"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-5 overflow-x-auto">
        {(['overview', 'flights', 'hotel', 'schedule', 'budget'] as ResultTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors',
              tab === t
                ? 'border-accent text-accent'
                : 'border-transparent text-ink2 hover:text-ink',
            )}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && <OverviewTab data={data} />}
      {tab === 'flights' && (
        <FlightsTab outbound={data.outbound_flight} returnFlight={data.return_flight} />
      )}
      {tab === 'hotel' && <HotelTab hotel={data.hotel} />}
      {tab === 'schedule' && <ItineraryTimeline days={data.itinerary} />}
      {tab === 'budget' && <BudgetTab breakdown={data.cost_breakdown} days={days} />}
    </div>
  );
}

// ─── Quick card ───────────────────────────────────────────────────────────────

function QuickCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="surface rounded-lg px-3 py-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon}
        <span className="text-2xs font-medium text-muted uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-sm font-semibold text-ink leading-snug">{value}</p>
      <p className="text-xs text-muted mt-0.5">{sub}</p>
    </div>
  );
}

// ─── Overview tab ─────────────────────────────────────────────────────────────

function OverviewTab({ data }: { data: EnhancedItineraryResult }) {
  return (
    <div className="space-y-4">
      {data.outbound_flight && (
        <Section title="✈ Outbound flight" recommended>
          <FlightCard flight={data.outbound_flight} />
        </Section>
      )}
      {data.hotel && (
        <Section title="🏨 Hotel" recommended>
          <HotelCard hotel={data.hotel} />
        </Section>
      )}
      {data.itinerary.length > 0 && (
        <Section title="📅 Day-by-day snapshot">
          <div className="space-y-1.5">
            {data.itinerary.slice(0, 4).map((d) => (
              <div key={d.day} className="flex items-baseline gap-2 text-sm">
                <span className="text-muted w-12 shrink-0">Day {d.day}</span>
                <span className="text-ink2 font-medium">{d.location}</span>
                <span className="text-muted text-xs truncate">{d.activities[0]}</span>
              </div>
            ))}
            {data.itinerary.length > 4 && (
              <p className="text-xs text-muted pl-14">+{data.itinerary.length - 4} more days · see Schedule tab</p>
            )}
          </div>
        </Section>
      )}
    </div>
  );
}

// ─── Flights tab ──────────────────────────────────────────────────────────────

function FlightsTab({ outbound, returnFlight }: { outbound?: FlightOption; returnFlight?: FlightOption }) {
  if (!outbound && !returnFlight) {
    return <EmptySection label="No flight data available" />;
  }
  return (
    <div className="space-y-4">
      {outbound && (
        <Section title="Outbound flight" recommended={outbound.recommended}>
          <FlightCard flight={outbound} expanded />
        </Section>
      )}
      {returnFlight && (
        <Section title="Return flight" recommended={returnFlight.recommended}>
          <FlightCard flight={returnFlight} expanded />
        </Section>
      )}
    </div>
  );
}

// ─── Hotel tab ────────────────────────────────────────────────────────────────

function HotelTab({ hotel }: { hotel?: HotelOption }) {
  if (!hotel) return <EmptySection label="No hotel data available" />;
  return (
    <div className="space-y-4">
      <Section title="Recommended hotel" recommended={hotel.recommended}>
        <HotelCard hotel={hotel} expanded />
      </Section>
    </div>
  );
}

// ─── Budget tab ───────────────────────────────────────────────────────────────

function BudgetTab({ breakdown, days }: { breakdown?: CostBreakdown; days: number }) {
  if (!breakdown) return <EmptySection label="No cost estimate available" />;

  const items = [
    { label: 'Flights (round trip)', usd: breakdown.flights_usd, icon: Plane },
    { label: `Hotel (${days - 1} nights)`, usd: breakdown.hotel_usd, icon: Building2 },
    { label: 'Activities & experiences', usd: breakdown.activities_usd, icon: MapPin },
    { label: 'Meals estimate', usd: breakdown.meals_usd, icon: UtensilsCrossed },
  ].filter((i) => i.usd && i.usd > 0);

  const total = breakdown.total_usd ?? items.reduce((s, i) => s + (i.usd ?? 0), 0);

  return (
    <div className="surface rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <p className="text-sm font-medium text-ink">Cost breakdown — per person</p>
      </div>
      <div className="divide-y divide-border">
        {items.map(({ label, usd, icon: Icon }) => (
          <div key={label} className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <Icon className="w-3.5 h-3.5 text-muted" strokeWidth={1.75} />
              <span className="text-sm text-ink2">{label}</span>
            </div>
            <span className="text-sm font-medium text-ink">${usd?.toLocaleString()}</span>
          </div>
        ))}
        <div className="flex items-center justify-between px-4 py-3 bg-accent-soft/30">
          <span className="text-sm font-semibold text-ink">Total estimate</span>
          <span className="text-base font-bold text-accent">${total.toLocaleString()}</span>
        </div>
      </div>
      <p className="px-4 py-2 text-xs text-muted">Estimates only · actual prices vary · ask the agent to adjust</p>
    </div>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function Section({ title, recommended, children }: { title: string; recommended?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        {recommended && (
          <span className="text-2xs bg-accent-soft text-accent px-1.5 py-0.5 rounded-full font-medium">
            AI pick
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function FlightCard({ flight, expanded }: { flight: FlightOption; expanded?: boolean }) {
  const [open, setOpen] = useState(!!expanded);
  return (
    <div className="surface rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-hover transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-accent-soft grid place-items-center shrink-0">
            <Plane className="w-3.5 h-3.5 text-accent" strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">
              {flight.airline}
              {flight.flight_number && (
                <span className="ml-2 text-xs font-normal text-muted">{flight.flight_number}</span>
              )}
            </p>
            <p className="text-xs text-muted">
              {flight.layovers === 0 ? 'Nonstop' : `${flight.layovers} stop${flight.layovers! > 1 ? 's' : ''}`}
              {flight.duration_hours && ` · ${flight.duration_hours}h`}
              {flight.per_pax_usd && ` · $${flight.per_pax_usd.toLocaleString()}/pp`}
            </p>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-border">
          {(flight.departure_time || flight.arrival_time) && (
            <div className="flex items-center gap-4 mt-3 mb-3">
              <div className="text-center">
                <p className="text-lg font-bold text-ink">{flight.departure_time ?? '—'}</p>
                <p className="text-xs text-muted">{flight.origin ?? 'Origin'}</p>
              </div>
              <div className="flex-1 flex flex-col items-center">
                <div className="w-full h-px bg-border relative">
                  <Plane className="w-3 h-3 text-accent absolute -top-1.5 left-1/2 -translate-x-1/2" />
                </div>
                <p className="text-xs text-muted mt-1">
                  {flight.duration_hours ? `${flight.duration_hours}h` : ''}
                  {flight.layovers === 0 ? ' nonstop' : ` · ${flight.layovers} stop`}
                </p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-ink">{flight.arrival_time ?? '—'}</p>
                <p className="text-xs text-muted">{flight.destination ?? 'Destination'}</p>
              </div>
            </div>
          )}
          {flight.ai_reason && (
            <div className="bg-accent-soft/40 rounded px-3 py-2 mt-2">
              <p className="text-xs text-ink2 leading-relaxed">
                <span className="font-medium text-accent">Why this flight: </span>
                {flight.ai_reason}
              </p>
            </div>
          )}
          {flight.per_pax_usd && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <span className="text-xs text-muted">Per person</span>
              <span className="text-base font-bold text-ink">${flight.per_pax_usd.toLocaleString()}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function HotelCard({ hotel, expanded }: { hotel: HotelOption; expanded?: boolean }) {
  const [open, setOpen] = useState(!!expanded);
  return (
    <div className="surface rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-hover transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-accent-soft grid place-items-center shrink-0">
            <Building2 className="w-3.5 h-3.5 text-accent" strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">{hotel.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {hotel.stars && (
                <span className="flex items-center gap-0.5 text-xs text-muted">
                  {Array.from({ length: hotel.stars }).map((_, i) => (
                    <Star key={i} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                  ))}
                </span>
              )}
              {hotel.rating && (
                <span className="text-xs text-muted">{hotel.rating} / 5</span>
              )}
              {hotel.price_per_night_usd && (
                <span className="text-xs text-muted">${hotel.price_per_night_usd.toLocaleString()}/night</span>
              )}
            </div>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-border">
          {hotel.amenities && hotel.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {hotel.amenities.map((a) => (
                <span key={a} className="inline-flex items-center gap-1 text-xs bg-hover rounded px-2 py-0.5 text-ink2">
                  <Check className="w-2.5 h-2.5 text-accent" strokeWidth={2.5} />
                  {a}
                </span>
              ))}
            </div>
          )}
          {hotel.ai_reason && (
            <div className="bg-accent-soft/40 rounded px-3 py-2 mt-3">
              <p className="text-xs text-ink2 leading-relaxed">
                <span className="font-medium text-accent">Why this hotel: </span>
                {hotel.ai_reason}
              </p>
            </div>
          )}
          {hotel.price_per_night_usd && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <span className="text-xs text-muted">
                {hotel.total_nights ? `${hotel.total_nights} nights` : 'Per night'}
              </span>
              <div className="text-right">
                {hotel.total_usd && (
                  <p className="text-base font-bold text-ink">${hotel.total_usd.toLocaleString()} total</p>
                )}
                <p className="text-xs text-muted">${hotel.price_per_night_usd.toLocaleString()}/night</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EmptySection({ label }: { label: string }) {
  return (
    <div className="surface rounded-lg px-4 py-6 text-center">
      <p className="text-sm text-muted">{label}</p>
      <p className="text-xs text-muted mt-1">Ask the agent to search for options</p>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildAgentMessage(data: TripFormData): string {
  const styleStr = data.styles.length > 0 ? data.styles.join(', ') : 'general';
  const mustStr = data.mustHaves ? `\nMust-haves: ${data.mustHaves}` : '';
  return [
    `Plan a trip from ${data.origin} to ${data.destination}.`,
    `Travel dates: ${data.dates}`,
    `${data.travelers} traveller${data.travelers !== 1 ? 's' : ''} · ${data.budget} budget`,
    `Trip style: ${styleStr}`,
    mustStr,
    '',
    'Please search for flights, hotels, activities, and weather in parallel. Recommend the best flight and hotel with your reasoning, then build a complete day-by-day itinerary.',
  ]
    .filter((l) => l !== undefined)
    .join('\n')
    .trim();
}
