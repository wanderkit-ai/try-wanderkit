'use client';

interface ScarcityBarProps {
  confirmedBookings: number;
  totalSpots: number;
}

export function ScarcityBar({ confirmedBookings, totalSpots }: ScarcityBarProps) {
  const pct = Math.round((confirmedBookings / totalSpots) * 100);
  const remaining = totalSpots - confirmedBookings;
  const isSoldOut = remaining <= 0;

  const barColor =
    pct >= 80 ? 'var(--color-accent)' : pct >= 50 ? 'var(--color-accent)' : 'rgba(255,255,255,0.3)';

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-xs" style={{ color: 'var(--color-muted)' }}>
          {isSoldOut ? 'SOLD OUT' : `${remaining} of ${totalSpots} spots left`}
        </span>
        <span
          className="font-mono text-xs"
          style={{ color: pct >= 80 ? 'var(--color-accent)' : 'var(--color-muted)' }}
        >
          {pct}% filled
          {pct >= 80 && !isSoldOut && (
            <span className="ml-2 inline-block w-1.5 h-1.5 rounded-full bg-accent animate-pulse-accent" />
          )}
        </span>
      </div>
      <div
        className="h-1 w-full rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.08)' }}
      >
        <div
          className="h-full transition-all duration-700"
          style={{
            width: `${Math.min(pct, 100)}%`,
            background: barColor,
            boxShadow: pct >= 80 ? '0 0 8px var(--color-accent-glow)' : undefined,
          }}
        />
      </div>
      {pct >= 80 && !isSoldOut && (
        <p className="mt-1 text-xs font-mono" style={{ color: 'var(--color-accent)' }}>
          Almost full
        </p>
      )}
    </div>
  );
}
