'use client';

import { useRef, useState } from 'react';
import { Compass, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { AgentChat, type AgentClientConfig, type AgentChatHandle } from '@/components/agent-chat';
import { OperatorCardGrid } from '@/components/operator-card-grid';
import type { NomaOperator } from '@/components/operator-card';
import { cn } from '@/lib/utils';

export function ScoutAgentLayout({
  config,
}: {
  config: Omit<AgentClientConfig, 'sidebar' | 'onToolResult' | 'onToolUse' | 'onRunningChange'>;
}) {
  const [operators, setOperators] = useState<NomaOperator[]>([]);
  const [loadingDB, setLoadingDB] = useState(false);
  const [loadingWeb, setLoadingWeb] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const chatRef = useRef<AgentChatHandle>(null);

  const hasResults = operators.length > 0;

  function handleToolUse(name: string) {
    if (name === 'search_operators') setLoadingDB(true);
    if (name === 'web_search_operators' || name === 'firecrawl_scrape') setLoadingWeb(true);
  }

  function handleToolResult(name: string, result: unknown) {
    const data = parseResult(result);

    if (name === 'search_operators') {
      setLoadingDB(false);
      if (Array.isArray(data)) {
        setOperators((prev) => mergeOperators(prev, data as NomaOperator[]));
      }
      return;
    }

    if (name === 'web_search_operators' || name === 'firecrawl_scrape') {
      // These are intermediate research steps — results stay in the agent loop,
      // not surfaced to the influencer directly.
      setLoadingWeb(false);
      return;
    }

    if (name === 'add_operator') {
      setLoadingWeb(false);
      const added = data as { added?: boolean; operator?: NomaOperator; id?: string; company?: string } | null;
      if (!added?.added) return;
      const op: NomaOperator = added.operator ?? {
        id: added.id ?? `op_added_${Date.now()}`,
        company: added.company ?? 'Unknown operator',
      };
      setOperators((prev) => mergeOperators(prev, [op]));
    }
  }

  return (
    <div className="flex h-[calc(100vh-180px)] overflow-hidden">
      <div
        className={cn(
          'shrink-0 border-r border-border flex flex-col overflow-hidden transition-all duration-300',
          chatCollapsed ? 'w-0 border-r-0' : 'w-[400px]',
        )}
      >
        <AgentChat
          ref={chatRef}
          config={{
            ...config,
            sidebar: true,
            onToolResult: handleToolResult,
            onToolUse: handleToolUse,
            onRunningChange: setIsRunning,
          }}
        />
      </div>

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

      <div className="flex-1 overflow-y-auto bg-bg">
        {!hasResults ? (
          <EmptyPanel isLoading={isRunning} agentName={config.displayName} />
        ) : (
          <div className="px-8 py-6 max-w-3xl mx-auto">
            <ScoutHeader count={operators.length} isResearching={loadingWeb} />
            <OperatorCardGrid
              operators={operators}
              loadingDB={loadingDB}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function ScoutHeader({ count, isResearching }: { count: number; isResearching: boolean }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-semibold text-ink tracking-tight">Operators</h2>
      <p className="text-sm text-ink2 mt-1">
        {count} operator{count === 1 ? '' : 's'} found
        {isResearching && (
          <span className="text-muted"> · researching the web…</span>
        )}
      </p>
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
          <p className="text-sm font-medium text-ink">Researching operators…</p>
          <p className="text-xs text-muted mt-1">Scraping the web to find real operators — this takes a moment</p>
        </>
      ) : (
        <>
          <div className="w-14 h-14 rounded-full bg-hover grid place-items-center mb-4">
            <Compass className="w-6 h-6 text-muted" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-medium text-ink">No operators yet</p>
          <p className="text-xs text-muted mt-1 max-w-xs leading-relaxed">
            Ask {agentName} to find operators for a destination — vetted operators will appear here as cards.
          </p>
        </>
      )}
    </div>
  );
}

function mergeOperators(prev: NomaOperator[], incoming: NomaOperator[]): NomaOperator[] {
  const seen = new Set(prev.map((o) => o.id));
  const fresh = incoming.filter((o) => !seen.has(o.id));
  return [...prev, ...fresh];
}

function parseResult(result: unknown): unknown {
  if (typeof result !== 'string') return result;
  try {
    return JSON.parse(result);
  } catch {
    return null;
  }
}
