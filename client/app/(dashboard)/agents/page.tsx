import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { AGENT_LIST } from '@/lib/agents/registry';
import { agentEvents } from '@/lib/mock-data';
import { formatRelative } from '@/lib/utils';
import { Bot, ArrowRight } from 'lucide-react';

export default function AgentsOverview() {
  const recent = [...agentEvents].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8);
  return (
    <>
      <PageHeader
        icon="🤖"
        title="AI agents"
        description="AI agents that research destinations and find operators — so you can focus on the trips, not the legwork."
      />
      <div className="px-12 pb-12 space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {AGENT_LIST.map((a) => (
            <Link
              key={a.name}
              href={`/agents/${a.name}`}
              className="surface p-4 hover:border-ink2/30 transition-colors group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="text-2xl">{a.emoji}</div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-dot" />
                  <span className="text-2xs uppercase tracking-wide text-muted">live</span>
                </div>
              </div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-medium text-ink">{a.displayName}</h3>
                <ArrowRight className="w-3.5 h-3.5 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-xs text-ink2 leading-relaxed">{a.description}</p>
              <div className="mt-3 flex items-center gap-1 text-2xs text-muted">
                <Bot className="w-3 h-3" strokeWidth={2} />
                {a.tools.length} tools
              </div>
            </Link>
          ))}
        </div>

        <div>
          <h2 className="text-sm font-medium text-ink2 uppercase tracking-wide mb-2">
            Recent activity
          </h2>
          <div className="surface divide-y divide-border">
            {recent.map((e) => (
              <div key={e.id} className="px-4 py-3 flex items-start gap-3 text-sm">
                <div className="w-7 h-7 rounded bg-accent-soft text-accent grid place-items-center shrink-0">
                  <Bot className="w-3.5 h-3.5" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-ink">{e.summary}</div>
                  {e.detail && <div className="text-xs text-muted mt-0.5">{e.detail}</div>}
                </div>
                <div className="text-2xs text-muted text-right shrink-0">
                  <div className="capitalize text-ink2 font-medium">{e.agent}</div>
                  <div>{formatRelative(e.at)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
