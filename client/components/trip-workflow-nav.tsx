'use client';

import {
  Plane, Building2, DollarSign, MapPin, ChevronRight,
  Check, Loader2, Navigation,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EnhancedItineraryResult, ItineraryDay } from '@/lib/types';

export type WorkflowNodeKind = 'flights' | 'hotel' | 'day' | 'transit' | 'budget';
export type NodeStatus = 'waiting' | 'active' | 'done';

export interface WorkflowNode {
  id: string;
  kind: WorkflowNodeKind;
  label: string;
  sublabel?: string;
  icon: LucideIcon;
  status: NodeStatus;
}

// ─── Build nodes from a completed itinerary result ───────────────────────────

export function buildResultNodes(data: EnhancedItineraryResult): WorkflowNode[] {
  const nodes: WorkflowNode[] = [];

  nodes.push({
    id: 'flights',
    kind: 'flights',
    label: 'Flights',
    sublabel: data.outbound_flight?.airline,
    icon: Plane,
    status: 'done',
  });

  nodes.push({
    id: 'hotel',
    kind: 'hotel',
    label: 'Hotel',
    sublabel: data.hotel?.name,
    icon: Building2,
    status: 'done',
  });

  let prevLocation = '';
  for (const day of data.itinerary) {
    if (day.location && day.location !== prevLocation && prevLocation !== '') {
      nodes.push({
        id: `transit-day${day.day}`,
        kind: 'transit',
        label: day.location,
        sublabel: `from ${prevLocation}`,
        icon: Navigation,
        status: 'done',
      });
    }
    nodes.push({
      id: `day-${day.day}`,
      kind: 'day',
      label: `Day ${day.day}`,
      sublabel: day.location || undefined,
      icon: MapPin,
      status: 'done',
    });
    if (day.location) prevLocation = day.location;
  }

  nodes.push({
    id: 'budget',
    kind: 'budget',
    label: 'Budget',
    sublabel: data.cost_breakdown?.total_usd
      ? `$${data.cost_breakdown.total_usd.toLocaleString()} total`
      : undefined,
    icon: DollarSign,
    status: 'done',
  });

  return nodes;
}

// ─── Build nodes for planning progress ───────────────────────────────────────

const PLANNING_STEPS: Array<{
  id: string;
  label: string;
  icon: LucideIcon;
  triggerTools: string[];
}> = [
  {
    id: 'flights',
    label: 'Flights',
    icon: Plane,
    triggerTools: ['amadeus_search_flights', 'skyscanner_search_flights', 'kiwi_search_flights', 'search_flights', 'google_search_flights'],
  },
  {
    id: 'hotel',
    label: 'Hotel',
    icon: Building2,
    triggerTools: ['booking_search_hotels', 'amadeus_search_hotels', 'search_hotels', 'google_search_hotels'],
  },
  {
    id: 'budget',
    label: 'Building',
    icon: MapPin,
    triggerTools: ['preview_itinerary', 'build_itinerary', 'save_itinerary'],
  },
];

export function buildPlanningNodes(
  activeTools: Set<string>,
  completedTools: Set<string>,
): WorkflowNode[] {
  return PLANNING_STEPS.map((step) => {
    const isDone = step.triggerTools.some((t) => completedTools.has(t));
    const isActive = !isDone && step.triggerTools.some((t) => activeTools.has(t));
    return {
      id: step.id,
      kind: step.id === 'budget' ? 'budget' : (step.id as WorkflowNodeKind),
      label: step.label,
      icon: step.icon,
      status: isDone ? 'done' : isActive ? 'active' : 'waiting',
    };
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  nodes: WorkflowNode[];
  activeId?: string;
  onSelect?: (id: string) => void;
  /** If true, nodes are clickable navigation. If false, just status display. */
  interactive?: boolean;
}

export function TripWorkflowNav({ nodes, activeId, onSelect, interactive = false }: Props) {
  return (
    <div className="flex items-center overflow-x-auto border-b border-border bg-panel px-4 py-0 shrink-0 scrollbar-none">
      {nodes.map((node, i) => (
        <div key={node.id} className="flex items-center shrink-0">
          <WorkflowNodeButton
            node={node}
            isActive={activeId === node.id}
            interactive={interactive && node.status === 'done'}
            onClick={onSelect ? () => onSelect(node.id) : undefined}
          />
          {i < nodes.length - 1 && (
            <ChevronRight className="w-3 h-3 text-muted/40 shrink-0 mx-0.5" strokeWidth={2} />
          )}
        </div>
      ))}
    </div>
  );
}

function WorkflowNodeButton({
  node,
  isActive,
  interactive,
  onClick,
}: {
  node: WorkflowNode;
  isActive: boolean;
  interactive: boolean;
  onClick?: () => void;
}) {
  const Icon = node.icon;

  const statusIcon = (() => {
    if (node.status === 'done') return <Check className="w-3 h-3 text-accent" strokeWidth={2.5} />;
    if (node.status === 'active') return <Loader2 className="w-3 h-3 text-accent animate-spin" strokeWidth={2} />;
    return null;
  })();

  const content = (
    <div
      className={cn(
        'flex items-center gap-1.5 px-3 py-2.5 transition-colors relative',
        isActive && 'text-accent',
        !isActive && node.status === 'done' && 'text-ink2',
        node.status === 'waiting' && 'text-muted',
        interactive && node.status === 'done' && 'hover:text-ink cursor-pointer',
        isActive && 'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-accent',
      )}
    >
      <div className="flex items-center gap-1">
        {statusIcon ?? <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />}
      </div>
      <div>
        <span className="text-xs font-medium whitespace-nowrap leading-none">{node.label}</span>
        {node.sublabel && (
          <span className="block text-2xs text-muted leading-none mt-0.5 max-w-[80px] truncate">
            {node.sublabel}
          </span>
        )}
      </div>
    </div>
  );

  if (interactive && onClick) {
    return (
      <button type="button" onClick={onClick} className="focus:outline-none">
        {content}
      </button>
    );
  }
  return <div>{content}</div>;
}
