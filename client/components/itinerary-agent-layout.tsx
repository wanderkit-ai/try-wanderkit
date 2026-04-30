'use client';

import { useState } from 'react';
import { MapPin, Calendar, Loader2, Map, ChevronLeft, ChevronRight } from 'lucide-react';
import { AgentChat, type AgentClientConfig } from '@/components/agent-chat';
import { ItineraryTimeline } from '@/components/itinerary-timeline';
import type { ItineraryDay } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ItineraryData {
  destination?: string;
  totalDays?: number;
  itinerary: ItineraryDay[];
}

export function ItineraryAgentLayout({ config }: { config: Omit<AgentClientConfig, 'sidebar' | 'onToolResult' | 'onRunningChange'> }) {
  const [itineraryData, setItineraryData] = useState<ItineraryData | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [chatCollapsed, setChatCollapsed] = useState(false);

  function handleToolResult(name: string, result: unknown) {
    if (name !== 'build_itinerary') return;
    try {
      const data = (typeof result === 'string' ? JSON.parse(result) : result) as any;
      if (Array.isArray(data?.itinerary)) {
        setItineraryData({
          destination: data.destination,
          totalDays: data.totalDays ?? data.itinerary.length,
          itinerary: data.itinerary,
        });
      }
    } catch {
      // non-itinerary result, ignore
    }
  }

  return (
    <div className="flex h-[calc(100vh-180px)] overflow-hidden">
      {/* ── Chat sidebar ── */}
      <div
        className={cn(
          'shrink-0 border-r border-border flex flex-col overflow-hidden transition-all duration-300',
          chatCollapsed ? 'w-0 border-r-0' : 'w-[400px]',
        )}
      >
        <AgentChat
          config={{
            ...config,
            sidebar: true,
            onToolResult: handleToolResult,
            onRunningChange: setIsRunning,
          }}
        />
      </div>

      {/* ── Toggle button ── */}
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

      {/* ── Itinerary panel ── */}
      <div className="flex-1 overflow-y-auto bg-bg">
        {!itineraryData ? (
          <EmptyPanel isLoading={isRunning} agentName={config.displayName} />
        ) : (
          <div className="px-8 py-6 max-w-2xl mx-auto">
            <ItineraryHeader data={itineraryData} />
            <ItineraryTimeline days={itineraryData.itinerary} />
          </div>
        )}
      </div>
    </div>
  );
}

function ItineraryHeader({ data }: { data: ItineraryData }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-semibold text-ink tracking-tight">
        {data.destination ?? 'Your Itinerary'}
      </h2>
      <div className="flex items-center gap-4 mt-1.5">
        {data.destination && (
          <span className="inline-flex items-center gap-1.5 text-sm text-ink2">
            <MapPin className="w-3.5 h-3.5 text-accent" strokeWidth={1.75} />
            {data.destination}
          </span>
        )}
        {data.totalDays && (
          <span className="inline-flex items-center gap-1.5 text-sm text-ink2">
            <Calendar className="w-3.5 h-3.5 text-accent" strokeWidth={1.75} />
            {data.totalDays} days
          </span>
        )}
      </div>
      <div className="mt-4 h-px bg-border" />
    </div>
  );
}

function EmptyPanel({ isLoading, agentName }: { isLoading: boolean; agentName: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-8">
      {isLoading ? (
        <>
          <div className="w-14 h-14 rounded-full bg-accent-soft grid place-items-center mb-4">
            <Loader2 className="w-6 h-6 text-accent animate-spin" strokeWidth={1.75} />
          </div>
          <p className="text-sm font-medium text-ink">Building your itinerary…</p>
          <p className="text-xs text-muted mt-1">Days will appear here as the agent works</p>
        </>
      ) : (
        <>
          <div className="w-14 h-14 rounded-full bg-hover grid place-items-center mb-4">
            <Map className="w-6 h-6 text-muted" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-medium text-ink">No itinerary yet</p>
          <p className="text-xs text-muted mt-1 max-w-xs leading-relaxed">
            Ask {agentName} to build a trip plan — the day-by-day cards will appear here.
          </p>
        </>
      )}
    </div>
  );
}
