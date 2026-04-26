import type { IncludedItem } from '@/types';

interface DropIncludedProps {
  items: IncludedItem[];
}

export function DropIncluded({ items }: DropIncludedProps) {
  return (
    <section
      className="py-24 px-8"
      style={{ background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)' }}
    >
      <div className="max-w-4xl mx-auto">
        <p className="font-mono text-xs tracking-widest mb-3" style={{ color: 'var(--color-accent)' }}>
          WHAT&apos;S INCLUDED
        </p>
        <h2 className="font-display text-5xl font-light mb-16" style={{ color: 'var(--color-white)' }}>
          Everything covered.
        </h2>

        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-px"
          style={{ background: 'var(--color-border)' }}
        >
          {items.map((item) => (
            <div
              key={item.index}
              className="p-8"
              style={{
                background: 'var(--color-bg)',
                opacity: item.included ? 1 : 0.5,
              }}
            >
              <div className="flex items-start gap-4">
                <span
                  className="font-mono text-xs shrink-0 mt-1"
                  style={{ color: item.included ? 'var(--color-accent)' : 'var(--color-dim)' }}
                >
                  {item.included ? item.index : '✕'}
                </span>
                <div>
                  <h4 className="font-sans font-medium mb-1" style={{ color: 'var(--color-white)' }}>
                    {item.title}
                  </h4>
                  <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                    {item.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
