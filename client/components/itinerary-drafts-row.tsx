'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Plane } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DraftSummary {
  key: string;
  destination: string;
  origin: string;
  totalDays: number;
  status: 'draft' | 'saved';
  createdAt: string;
}

function loadDrafts(): DraftSummary[] {
  if (typeof window === 'undefined') return [];
  const drafts: DraftSummary[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    if (!k?.startsWith('wanderkit:draft:')) continue;
    try {
      const raw = window.localStorage.getItem(k);
      if (!raw) continue;
      const d = JSON.parse(raw);
      drafts.push({
        key: k,
        destination: d.destination ?? 'Unknown',
        origin: d.origin ?? '',
        totalDays: d.totalDays ?? d.itinerary?.length ?? 0,
        status: d.status ?? 'draft',
        createdAt: d.createdAt ?? new Date().toISOString(),
      });
    } catch { /* skip bad entries */ }
  }
  return drafts.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function ItineraryDraftsSection() {
  const [drafts, setDrafts] = useState<DraftSummary[]>([]);

  useEffect(() => {
    setDrafts(loadDrafts());
  }, []);

  if (drafts.length === 0) return null;

  return (
    <>
      {drafts.map((d) => (
        <tr key={d.key} className="hover:bg-hover/60">
          <td className="px-4 py-3 text-sm">
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-muted shrink-0" strokeWidth={1.75} />
              <span className="font-medium text-ink">
                {d.destination ?? 'Untitled trip'}
              </span>
            </div>
          </td>
          <td className="px-4 py-3">
            <span className={cn(
              'inline-flex items-center text-2xs font-medium uppercase tracking-wide px-1.5 py-0.5 rounded-full',
              d.status === 'saved'
                ? 'bg-success/15 text-success'
                : 'bg-accent-soft text-accent',
            )}>
              {d.status === 'saved' ? 'Saved' : 'Draft'}
            </span>
          </td>
          <td className="px-4 py-3">
            <span className="text-xs text-muted italic">AI itinerary</span>
          </td>
          <td className="px-4 py-3">—</td>
          <td className="px-4 py-3 text-ink2 text-sm">
            {d.origin && d.destination ? (
              <span className="flex items-center gap-1 text-xs">
                <Plane className="w-3 h-3 text-muted" strokeWidth={1.75} />
                {d.origin} → {d.destination}
              </span>
            ) : (
              <span className="text-xs text-muted">{d.destination}</span>
            )}
          </td>
          <td className="px-4 py-3 text-xs text-muted font-mono tabular-nums">
            {new Date(d.createdAt).toLocaleDateString()}
          </td>
          <td className="px-4 py-3 text-ink2 text-sm">{d.totalDays ? `${d.totalDays}d` : '—'}</td>
          <td className="px-4 py-3">—</td>
          <td className="px-4 py-3">—</td>
        </tr>
      ))}
    </>
  );
}
