'use client';

interface LiveTickerProps {
  items: string[];
}

export function LiveTicker({ items }: LiveTickerProps) {
  const repeated = [...items, ...items];

  return (
    <div
      className="w-full overflow-hidden py-4 border-y"
      style={{
        background: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div className="flex ticker-track whitespace-nowrap">
        {repeated.map((item, i) => (
          <span key={i} className="flex items-center">
            <span className="font-mono text-xs tracking-widest px-8" style={{ color: 'var(--color-muted)' }}>
              {item}
            </span>
            <span
              className="w-1 h-1 rounded-full shrink-0"
              style={{ background: 'var(--color-accent)' }}
            />
          </span>
        ))}
      </div>
    </div>
  );
}
