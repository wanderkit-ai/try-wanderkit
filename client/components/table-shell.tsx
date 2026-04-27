'use client';

import { Filter, ArrowUpDown, Plus, LayoutGrid, Table as TableIcon } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function TableShell({
  views,
  children,
  rightActions,
}: {
  views?: string[];
  children: React.ReactNode;
  rightActions?: React.ReactNode;
}) {
  const [activeView, setActiveView] = useState(0);
  return (
    <div className="px-12">
      <div className="flex items-center justify-between border-b border-border h-9">
        <div className="flex items-center gap-3 text-sm">
          {(views ?? ['Table']).map((v, i) => (
            <button
              key={v}
              onClick={() => setActiveView(i)}
              className={cn(
                'h-9 px-2 -mb-px border-b-2 flex items-center gap-1.5',
                i === activeView
                  ? 'border-ink text-ink font-medium'
                  : 'border-transparent text-ink2 hover:text-ink'
              )}
            >
              {i === 0 ? (
                <TableIcon className="w-3.5 h-3.5" strokeWidth={1.75} />
              ) : (
                <LayoutGrid className="w-3.5 h-3.5" strokeWidth={1.75} />
              )}
              {v}
            </button>
          ))}
          <button className="h-7 w-7 grid place-items-center rounded text-muted hover:bg-hover hover:text-ink">
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button className="btn btn-ghost h-7 px-2 text-xs">
            <Filter className="w-3 h-3" strokeWidth={2} />
            Filter
          </button>
          <button className="btn btn-ghost h-7 px-2 text-xs">
            <ArrowUpDown className="w-3 h-3" strokeWidth={2} />
            Sort
          </button>
          {rightActions}
          <button className="btn btn-primary h-7 px-2 text-xs">
            <Plus className="w-3 h-3" strokeWidth={2} />
            New
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}

export function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        'text-left text-2xs uppercase tracking-wide font-medium text-muted px-3 py-2 border-b border-border',
        className
      )}
    >
      {children}
    </th>
  );
}

export function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={cn('px-3 py-2 text-sm text-ink border-b border-border align-middle', className)}>
      {children}
    </td>
  );
}
