'use client';

import { Plane, Building2, Cloud, Compass, Sparkles, Map, Check, Loader2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type StepStatus = 'waiting' | 'active' | 'done';

interface WorkflowStep {
  id: string;
  label: string;
  sublabel: string;
  icon: LucideIcon;
  // tool names that mark this step as active/done
  triggerTools: string[];
}

const STEPS: WorkflowStep[] = [
  {
    id: 'parsing',
    label: 'Parsing request',
    sublabel: 'Understanding your trip',
    icon: Sparkles,
    triggerTools: [], // always done after first message
  },
  {
    id: 'flights',
    label: 'Searching flights',
    sublabel: 'Finding best routes & prices',
    icon: Plane,
    triggerTools: ['amadeus_search_flights', 'skyscanner_search_flights', 'kiwi_search_flights'],
  },
  {
    id: 'hotels',
    label: 'Finding hotels',
    sublabel: 'Checking availability & ratings',
    icon: Building2,
    triggerTools: ['booking_search_hotels', 'amadeus_search_hotels'],
  },
  {
    id: 'weather',
    label: 'Checking weather',
    sublabel: 'Forecast for your dates',
    icon: Cloud,
    triggerTools: ['openweathermap_forecast', 'openmeteo_forecast'],
  },
  {
    id: 'activities',
    label: 'Discovering experiences',
    sublabel: 'Top activities & attractions',
    icon: Compass,
    triggerTools: ['viator_search_activities', 'tripadvisor_activities'],
  },
  {
    id: 'analyzing',
    label: 'AI ranking options',
    sublabel: 'Selecting best flight & hotel',
    icon: Sparkles,
    triggerTools: [], // auto-active after searches complete
  },
  {
    id: 'building',
    label: 'Building your itinerary',
    sublabel: 'Day-by-day plan assembling',
    icon: Map,
    triggerTools: ['preview_itinerary', 'build_itinerary'],
  },
];

const SEARCH_STEP_IDS = new Set(['flights', 'hotels', 'weather', 'activities']);

interface Props {
  activeTools: Set<string>;
  completedTools: Set<string>;
  destination?: string;
  isRunning: boolean;
}

export function WorkflowProgress({ activeTools, completedTools, destination, isRunning }: Props) {
  function getStatus(step: WorkflowStep): StepStatus {
    if (step.id === 'parsing') return 'done';

    if (step.id === 'analyzing') {
      const anySearchDone = STEPS.filter((s) => SEARCH_STEP_IDS.has(s.id)).some((s) =>
        s.triggerTools.some((t) => completedTools.has(t))
      );
      const buildingStarted = STEPS.find((s) => s.id === 'building')?.triggerTools.some((t) =>
        activeTools.has(t) || completedTools.has(t)
      );
      if (buildingStarted) return 'done';
      if (anySearchDone) return 'active';
      return 'waiting';
    }

    const isDone = step.triggerTools.some((t) => completedTools.has(t));
    if (isDone) return 'done';

    const isActive = step.triggerTools.some((t) => activeTools.has(t));
    if (isActive) return 'active';

    return 'waiting';
  }

  const doneCount = STEPS.filter((s) => getStatus(s) === 'done').length;

  return (
    <div className="h-full flex items-center justify-center bg-bg px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-accent-soft grid place-items-center mx-auto mb-3">
            <Loader2 className={cn('w-5 h-5 text-accent', isRunning && 'animate-spin')} strokeWidth={2} />
          </div>
          <h3 className="text-base font-semibold text-ink">
            {destination ? `Planning your trip to ${destination}` : 'Planning your trip…'}
          </h3>
          <p className="text-xs text-muted mt-1">{doneCount} of {STEPS.length} steps complete</p>
        </div>

        <div className="relative">
          {/* Connector line */}
          <div className="absolute left-[17px] top-5 bottom-5 w-px bg-border" />

          <div className="space-y-4">
            {STEPS.map((step) => {
              const status = getStatus(step);
              const Icon = step.icon;
              return (
                <div key={step.id} className="flex items-start gap-3 relative">
                  {/* Icon node */}
                  <div
                    className={cn(
                      'w-9 h-9 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300 bg-bg z-10',
                      status === 'done' && 'border-accent bg-accent-soft',
                      status === 'active' && 'border-accent bg-accent-soft',
                      status === 'waiting' && 'border-border',
                    )}
                  >
                    {status === 'done' ? (
                      <Check className="w-3.5 h-3.5 text-accent" strokeWidth={2.5} />
                    ) : status === 'active' ? (
                      <Loader2 className="w-3.5 h-3.5 text-accent animate-spin" strokeWidth={2} />
                    ) : (
                      <Icon className="w-3.5 h-3.5 text-muted" strokeWidth={1.75} />
                    )}
                  </div>

                  {/* Label */}
                  <div className="pt-1.5">
                    <p
                      className={cn(
                        'text-sm font-medium leading-none transition-colors',
                        status === 'done' && 'text-ink',
                        status === 'active' && 'text-accent',
                        status === 'waiting' && 'text-muted',
                      )}
                    >
                      {step.label}
                    </p>
                    {status !== 'waiting' && (
                      <p className="text-xs text-muted mt-0.5">{step.sublabel}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-center text-xs text-muted mt-8">
          Results will appear once the plan is ready ·{' '}
          <span className="text-ink2">chat to refine afterwards</span>
        </p>
      </div>
    </div>
  );
}
