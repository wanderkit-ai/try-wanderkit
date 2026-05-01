'use client';

import { Loader2 } from 'lucide-react';
import { OperatorCard, type NomaOperator } from './operator-card';

interface Props {
  operators: NomaOperator[];
  loadingDB?: boolean;
}

export function OperatorCardGrid({ operators, loadingDB }: Props) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-sm font-semibold text-ink">Operators</h3>
        <span className="text-2xs text-muted font-mono">{operators.length}</span>
        {loadingDB && (
          <Loader2 className="w-3 h-3 text-muted animate-spin ml-1" strokeWidth={1.75} />
        )}
      </div>
      {operators.length === 0 ? (
        <div className="text-xs text-muted italic px-1">
          {loadingDB ? 'Checking database…' : 'No operators found yet.'}
        </div>
      ) : (
        <div className="grid gap-2 grid-cols-1 min-[720px]:grid-cols-2">
          {operators.map((op) => (
            <OperatorCard key={op.id} operator={op} />
          ))}
        </div>
      )}
    </div>
  );
}
