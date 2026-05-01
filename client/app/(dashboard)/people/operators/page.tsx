'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { TableShell, Th, Td } from '@/components/table-shell';
import { ScoutAgentLayout } from '@/components/scout-agent-layout';
import { operators, trips, quotes } from '@/lib/mock-data';
import { Search, Star, MessageCircle, X } from 'lucide-react';

const JAMIE_ID = 'inf_jamie';

const jamieTrips = trips.filter((t) => t.influencerId === JAMIE_ID);
const usedOperatorIds = new Set(
  quotes
    .filter((q) => jamieTrips.some((t) => t.id === q.tripId))
    .map((q) => q.operatorId)
);
const knownOperators = operators.filter(
  (o) => o.starred || usedOperatorIds.has(o.id)
);

export default function OperatorsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState<string | null>(null);

  function handleSearch() {
    const q = searchQuery.trim();
    if (!q) return;
    setActiveSearch(q);
  }

  function clearSearch() {
    setActiveSearch(null);
    setSearchQuery('');
  }

  return (
    <>
      <PageHeader
        icon="🏔️"
        title="Operators"
        crumbs={[{ label: 'Operators' }]}
        description="Local operators you've worked with or starred. Search below to find new ones."
      />

      <TableShell>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <Th>Company</Th>
                <Th>Contact</Th>
                <Th>Country / Region</Th>
                <Th>Specialties</Th>
                <Th>Rating</Th>
                <Th>Tier</Th>
                <Th>Reply time</Th>
                <Th>WhatsApp</Th>
              </tr>
            </thead>
            <tbody>
              {knownOperators.map((o) => (
                <tr key={o.id} className="hover:bg-hover/60 cursor-pointer">
                  <Td>
                    <Link href={`/people/operators/${o.id}`} className="block">
                      <div className="flex items-center gap-1.5">
                        {o.starred && (
                          <Star className="w-3 h-3 fill-warn text-warn shrink-0" strokeWidth={0} />
                        )}
                        <span className="font-medium text-ink hover:underline">{o.company}</span>
                        {usedOperatorIds.has(o.id) && (
                          <span className="chip text-2xs">used</span>
                        )}
                      </div>
                      {o.notes && (
                        <div className="text-xs text-muted truncate max-w-xs mt-0.5">{o.notes}</div>
                      )}
                    </Link>
                  </Td>
                  <Td className="text-ink2">{o.contactName}</Td>
                  <Td className="text-ink2">
                    {o.country}
                    <span className="text-muted"> · {o.region}</span>
                  </Td>
                  <Td>
                    <div className="flex gap-1 flex-wrap">
                      {o.specialties.map((s) => <span key={s} className="chip">{s}</span>)}
                    </div>
                  </Td>
                  <Td>
                    <span className="inline-flex items-center gap-1 font-mono tabular-nums text-xs">
                      <Star className="w-3 h-3 fill-warn text-warn" strokeWidth={0} />
                      {o.rating.toFixed(1)}
                    </span>
                  </Td>
                  <Td className="font-mono">{o.priceTier}</Td>
                  <Td className="text-ink2 text-xs">~{o.responseHours}h</Td>
                  <Td>
                    <span className="inline-flex items-center gap-1 text-xs text-ink2">
                      <MessageCircle className="w-3 h-3" strokeWidth={1.75} />
                      {o.whatsapp}
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TableShell>

      {/* AI Operator Search */}
      <div className="px-12 pb-12 mt-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-ink2 uppercase tracking-wide">
            Find more operators with AI
          </h2>
          {activeSearch && (
            <button
              onClick={clearSearch}
              className="text-xs text-muted hover:text-ink2 flex items-center gap-1"
            >
              <X className="w-3 h-3" strokeWidth={2} />
              Clear search
            </button>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex gap-2"
        >
          <div className="flex-1 flex items-center gap-2 surface px-3 py-2">
            <Search className="w-4 h-4 text-muted shrink-0" strokeWidth={1.75} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. hiking operators in Nepal, cultural guides in Morocco…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted text-ink"
            />
          </div>
          <button
            type="submit"
            disabled={!searchQuery.trim()}
            className="px-4 py-2 bg-ink text-bg text-sm rounded disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            Search with AI
          </button>
        </form>

        {activeSearch && (
          <div className="surface overflow-hidden">
            <ScoutAgentLayout
              key={activeSearch}
              config={{
                name: 'scout',
                displayName: 'Scout Operators',
                emoji: '🧭',
                description: `Searching for operators matching: "${activeSearch}"`,
                starters: [],
                toolCount: 5,
                initialMessage: `Find operators for: ${activeSearch}`,
              }}
            />
          </div>
        )}
      </div>
    </>
  );
}
