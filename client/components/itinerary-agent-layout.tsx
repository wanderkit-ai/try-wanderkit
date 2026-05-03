'use client';

import { useState } from 'react';
import {
  MapPin, Calendar, Loader2,
  Plane, Building2, DollarSign, Star, Check, UtensilsCrossed,
  RefreshCw, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Navigation,
} from 'lucide-react';
import { AgentChat, type AgentClientConfig } from '@/components/agent-chat';
import { ItineraryTimeline } from '@/components/itinerary-timeline';
import { ItineraryForm, type TripFormData } from '@/components/itinerary-form';
import { TripWorkflowNav, buildResultNodes, buildPlanningNodes } from '@/components/trip-workflow-nav';
import type { EnhancedItineraryResult, FlightOption, HotelOption, CostBreakdown } from '@/lib/types';
import { cn } from '@/lib/utils';
import { labelWithCode } from '@/lib/airport-codes';

type Phase = 'form' | 'planning' | 'results';

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
  const [activeNode, setActiveNode] = useState<string>('flights');

  function handleFormSubmit(data: TripFormData) {
    setFormData(data);
    setInitialMessage(buildAgentMessage(data));
    setPhase('planning');
  }

  function handleToolUse(name: string) {
    setActiveTools((prev) => new Set([...Array.from(prev), name]));
  }

  function handleToolResult(name: string, result: unknown) {
    setActiveTools((prev) => { const n = new Set(prev); n.delete(name); return n; });
    setCompletedTools((prev) => new Set([...Array.from(prev), name]));

    if (!ITINERARY_TOOLS.has(name)) return;
    try {
      const data = (typeof result === 'string' ? JSON.parse(result) : result) as any;
      if (!Array.isArray(data?.itinerary)) return;
      const enriched: EnhancedItineraryResult = {
        ...data,
        status: name === 'save_itinerary' || data?.saved ? 'saved' : 'draft',
        cost_breakdown: data.cost_breakdown ?? computeCosts(data),
      };
      setItineraryData(enriched);
      setActiveNode('flights');
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

  // Build workflow nodes
  const workflowNodes = phase === 'results' && itineraryData
    ? buildResultNodes(itineraryData)
    : buildPlanningNodes(activeTools, completedTools);

  const destinationLabel = formData
    ? formData.destinations.map((d) => labelWithCode(d)).join(' → ')
    : itineraryData?.destination;

  return (
    <div className="flex h-[calc(100vh-180px)] overflow-hidden">
      {/* ── Chat sidebar ── */}
      <div
        className={cn(
          'shrink-0 border-r border-border flex flex-col overflow-hidden transition-all duration-300',
          chatCollapsed ? 'w-0 border-r-0' : 'w-[380px]',
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
        {chatCollapsed
          ? <ChevronRight className="w-3.5 h-3.5" strokeWidth={2} />
          : <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2} />}
      </button>

      {/* ── Right panel ── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-bg">
        {/* Header row */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            {destinationLabel && (
              <h2 className="text-sm font-semibold text-ink">{destinationLabel}</h2>
            )}
            {itineraryData && (
              <span className={cn(
                'text-2xs font-medium uppercase tracking-wide px-1.5 py-0.5 rounded-full',
                itineraryData.status === 'saved'
                  ? 'bg-success/15 text-success'
                  : 'bg-accent-soft text-accent',
              )}>
                {itineraryData.status === 'saved' ? 'Saved' : 'Draft'}
              </span>
            )}
            {itineraryData && (
              <span className="flex items-center gap-1 text-xs text-muted">
                <Calendar className="w-3 h-3" strokeWidth={1.75} />
                {(itineraryData.totalDays ?? itineraryData.itinerary.length)} days
              </span>
            )}
          </div>
          {phase === 'results' && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs text-muted hover:text-ink border border-border rounded px-2.5 py-1.5 hover:bg-hover transition-colors"
            >
              <RefreshCw className="w-3 h-3" strokeWidth={2} />
              New trip
            </button>
          )}
        </div>

        {/* Workflow nav */}
        <TripWorkflowNav
          nodes={workflowNodes}
          activeId={phase === 'results' ? activeNode : undefined}
          onSelect={phase === 'results' ? setActiveNode : undefined}
          interactive={phase === 'results'}
        />

        {/* Panel body */}
        <div className="flex-1 overflow-y-auto">
          {phase === 'planning' && (
            <PlanningView
              activeTools={activeTools}
              completedTools={completedTools}
              destination={destinationLabel}
              isRunning={isRunning}
            />
          )}
          {phase === 'results' && itineraryData && (
            <NodePanel
              nodeId={activeNode}
              data={itineraryData}
              formData={formData}
            />
          )}
          {phase === 'results' && !itineraryData && (
            <div className="h-full flex flex-col items-center justify-center text-center px-8">
              <Loader2 className="w-6 h-6 text-accent animate-spin mb-3" />
              <p className="text-sm text-muted">Building your plan…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Planning view ─────────────────────────────────────────────────────────────

function PlanningView({
  activeTools, completedTools, destination, isRunning,
}: {
  activeTools: Set<string>;
  completedTools: Set<string>;
  destination?: string;
  isRunning: boolean;
}) {
  const flightDone = ['amadeus_search_flights', 'skyscanner_search_flights', 'kiwi_search_flights', 'search_flights', 'google_search_flights'].some((t) => completedTools.has(t));
  const hotelDone = ['booking_search_hotels', 'amadeus_search_hotels', 'search_hotels', 'google_search_hotels'].some((t) => completedTools.has(t));
  const buildingDone = ['preview_itinerary', 'build_itinerary'].some((t) => completedTools.has(t));

  const steps = [
    { label: 'Searching flights', done: flightDone },
    { label: 'Finding hotels', done: hotelDone },
    { label: 'Discovering activities', done: completedTools.has('tripadvisor_activities') },
    { label: 'Checking weather', done: completedTools.has('openmeteo_forecast') || completedTools.has('openweathermap_forecast') },
    { label: 'Building itinerary', done: buildingDone },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <div className="h-full flex items-center justify-center px-8">
      <div className="w-full max-w-xs text-center">
        <div className="w-12 h-12 rounded-full bg-accent-soft grid place-items-center mx-auto mb-4">
          <Loader2 className={cn('w-5 h-5 text-accent', isRunning && 'animate-spin')} strokeWidth={2} />
        </div>
        <p className="text-sm font-semibold text-ink mb-1">
          {destination ? `Planning ${destination}` : 'Planning your trip…'}
        </p>
        <p className="text-xs text-muted mb-6">{doneCount} of {steps.length} steps complete</p>
        <div className="space-y-2 text-left">
          {steps.map((s) => (
            <div key={s.label} className="flex items-center gap-2 text-xs">
              <div className={cn(
                'w-4 h-4 rounded-full border flex items-center justify-center shrink-0',
                s.done ? 'border-accent bg-accent-soft' : 'border-border',
              )}>
                {s.done && <Check className="w-2.5 h-2.5 text-accent" strokeWidth={2.5} />}
              </div>
              <span className={s.done ? 'text-ink' : 'text-muted'}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Node panel (drives right-pane content by selected workflow node) ─────────

function NodePanel({
  nodeId, data, formData,
}: {
  nodeId: string;
  data: EnhancedItineraryResult;
  formData: TripFormData | null;
}) {
  const days = data.totalDays ?? data.itinerary.length;

  if (nodeId === 'flights') {
    return (
      <div className="px-6 py-5 space-y-4 max-w-2xl">
        {/* Cost quick strip */}
        <CostStrip data={data} />

        {data.outbound_flight && (
          <Section title="Outbound flight" recommended={data.outbound_flight.recommended}>
            <FlightCard flight={data.outbound_flight} expanded />
          </Section>
        )}
        {data.return_flight && (
          <Section title="Return flight" recommended={data.return_flight.recommended}>
            <FlightCard flight={data.return_flight} expanded />
          </Section>
        )}
        {!data.outbound_flight && !data.return_flight && (
          <EmptySection label="No flight data" hint="Ask the agent to search for flights" />
        )}
        {data.ai_summary && (
          <div className="bg-accent-soft/40 border border-accent/20 rounded-lg px-4 py-3">
            <p className="text-sm text-ink leading-relaxed">{data.ai_summary}</p>
          </div>
        )}
      </div>
    );
  }

  if (nodeId === 'hotel') {
    return (
      <div className="px-6 py-5 space-y-4 max-w-2xl">
        <CostStrip data={data} />
        {data.hotel ? (
          <Section title="Recommended hotel" recommended={data.hotel.recommended}>
            <HotelCard hotel={data.hotel} expanded />
          </Section>
        ) : (
          <EmptySection label="No hotel data" hint="Ask the agent to search for hotels" />
        )}
      </div>
    );
  }

  if (nodeId === 'budget') {
    return (
      <div className="px-6 py-5 max-w-2xl">
        <BudgetPanel breakdown={data.cost_breakdown} days={days} travelers={formData?.travelers ?? 2} />
      </div>
    );
  }

  // Day node
  if (nodeId.startsWith('day-')) {
    const dayNum = parseInt(nodeId.replace('day-', ''), 10);
    const day = data.itinerary.find((d) => d.day === dayNum);
    if (!day) return <EmptySection label={`Day ${dayNum} not found`} />;
    return (
      <div className="px-6 py-5 max-w-2xl">
        <ItineraryTimeline days={[day]} />
      </div>
    );
  }

  // Transit node
  if (nodeId.startsWith('transit-')) {
    const afterDay = parseInt(nodeId.replace('transit-day', ''), 10);
    const day = data.itinerary.find((d) => d.day === afterDay);
    if (!day) return <EmptySection label="Transit info not found" />;
    return (
      <div className="px-6 py-5 max-w-2xl">
        <div className="surface rounded-lg px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <Navigation className="w-4 h-4 text-accent" strokeWidth={1.75} />
            <span className="text-sm font-semibold text-ink">In transit to {day.location}</span>
          </div>
          <p className="text-sm text-ink2">{day.transit || 'Travel day between destinations.'}</p>
          <div className="mt-3 space-y-1">
            {day.activities.map((a, i) => (
              <p key={i} className="text-xs text-muted flex items-start gap-2">
                <span className="text-accent mt-0.5">·</span>{a}
              </p>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Fallback: show full timeline
  return (
    <div className="px-6 py-5 max-w-2xl">
      <ItineraryTimeline days={data.itinerary} />
    </div>
  );
}

// ─── Cost quick strip ────────────────────────────────────────────────────────

function CostStrip({ data }: { data: EnhancedItineraryResult }) {
  const breakdown = data.cost_breakdown;
  if (!breakdown) return null;
  return (
    <div className="grid grid-cols-3 gap-3 mb-1">
      <MiniStat
        icon={<Plane className="w-3.5 h-3.5 text-accent" strokeWidth={1.75} />}
        label="Flight / pp"
        value={data.outbound_flight?.per_pax_usd ? `$${data.outbound_flight.per_pax_usd.toLocaleString()}` : '—'}
      />
      <MiniStat
        icon={<Building2 className="w-3.5 h-3.5 text-accent" strokeWidth={1.75} />}
        label="Hotel / night"
        value={data.hotel?.price_per_night_usd ? `$${data.hotel.price_per_night_usd.toLocaleString()}` : '—'}
      />
      <MiniStat
        icon={<DollarSign className="w-3.5 h-3.5 text-accent" strokeWidth={1.75} />}
        label="Est. total"
        value={breakdown.total_usd ? `$${breakdown.total_usd.toLocaleString()}` : '—'}
      />
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="surface rounded-lg px-3 py-2.5">
      <div className="flex items-center gap-1.5 mb-1">{icon}<span className="text-2xs text-muted uppercase tracking-wide">{label}</span></div>
      <p className="text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}

// ─── Budget panel ────────────────────────────────────────────────────────────

function BudgetPanel({ breakdown, days, travelers }: { breakdown?: CostBreakdown; days: number; travelers: number }) {
  if (!breakdown) return <EmptySection label="No cost estimate available" hint="Ask the agent to compute costs" />;

  const nights = Math.max(1, days - 1);
  const items = [
    { label: `Flights (round trip × ${travelers})`, usd: breakdown.flights_usd, icon: Plane },
    { label: `Hotel (${nights} night${nights !== 1 ? 's' : ''})`, usd: breakdown.hotel_usd, icon: Building2 },
    { label: 'Activities & experiences', usd: breakdown.activities_usd, icon: MapPin },
    { label: 'Meals estimate', usd: breakdown.meals_usd, icon: UtensilsCrossed },
  ].filter((i) => i.usd && i.usd > 0);

  const total = breakdown.total_usd ?? items.reduce((s, i) => s + (i.usd ?? 0), 0);
  const perPerson = travelers > 1 ? Math.round(total / travelers) : null;

  return (
    <div className="surface rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <p className="text-sm font-medium text-ink">Cost breakdown</p>
        <p className="text-xs text-muted mt-0.5">{travelers} traveller{travelers !== 1 ? 's' : ''} · {days} days</p>
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
          <div>
            <span className="text-sm font-semibold text-ink">Total estimate</span>
            {perPerson && <p className="text-xs text-muted">${perPerson.toLocaleString()} per person</p>}
          </div>
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
          <span className="text-2xs bg-accent-soft text-accent px-1.5 py-0.5 rounded-full font-medium">AI pick</span>
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
              {flight.flight_number && <span className="ml-2 text-xs font-normal text-muted">{flight.flight_number}</span>}
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
              {hotel.rating && <span className="text-xs text-muted">{hotel.rating}/5</span>}
              {hotel.price_per_night_usd && <span className="text-xs text-muted">${hotel.price_per_night_usd.toLocaleString()}/night</span>}
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
                {hotel.total_usd && <p className="text-base font-bold text-ink">${hotel.total_usd.toLocaleString()} total</p>}
                <p className="text-xs text-muted">${hotel.price_per_night_usd.toLocaleString()}/night</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EmptySection({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="surface rounded-lg px-4 py-6 text-center">
      <p className="text-sm text-muted">{label}</p>
      {hint && <p className="text-xs text-muted mt-1">{hint}</p>}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildAgentMessage(data: TripFormData): string {
  const styleStr = data.styles.length > 0 ? data.styles.join(', ') : 'general';
  const mustStr = data.mustHaves ? `\nMust-haves: ${data.mustHaves}` : '';
  const destStr = data.destinations.length > 1
    ? data.destinations.join(' → ')
    : data.destinations[0] ?? data.destination;
  return [
    `Plan a trip from ${data.origin} to ${destStr}.`,
    `Travel dates: ${data.dates}`,
    `${data.travelers} traveller${data.travelers !== 1 ? 's' : ''} · ${data.budget} budget`,
    `Trip style: ${styleStr}`,
    mustStr,
    '',
    'Please search for flights, hotels, activities, and weather. Recommend the best flight and hotel with your reasoning, then build a complete day-by-day itinerary with accurate cost breakdown.',
  ]
    .filter((l) => l !== undefined)
    .join('\n')
    .trim();
}

/** Compute cost breakdown from flight + hotel data when the LLM omits it. */
function computeCosts(data: any): CostBreakdown | undefined {
  const flight = data.outbound_flight as FlightOption | undefined;
  const hotel = data.hotel as HotelOption | undefined;
  const days = (data.totalDays ?? data.itinerary?.length ?? 7) as number;
  const travelers = 2; // default — form data not available here

  if (!flight && !hotel) return undefined;

  const nights = Math.max(1, days - 1);
  const flights_usd = flight?.per_pax_usd ? flight.per_pax_usd * 2 * travelers : 0;
  const hotel_usd = hotel?.price_per_night_usd ? hotel.price_per_night_usd * nights : 0;
  const activities_usd = 70 * days * travelers;
  const meals_usd = 45 * days * travelers;
  const total_usd = flights_usd + hotel_usd + activities_usd + meals_usd;

  return { flights_usd, hotel_usd, activities_usd, meals_usd, total_usd };
}
