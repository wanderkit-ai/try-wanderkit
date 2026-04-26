'use client';

import { useState } from 'react';
import type { ItineraryDay } from '@/types';

const typeColors: Record<ItineraryDay['type'], string> = {
  travel: 'rgba(255,255,255,0.2)',
  trek: 'var(--color-accent)',
  acclimatize: '#57d4ff',
  cultural: '#ff9d57',
  rest: '#57ff8c',
  departure: 'rgba(255,255,255,0.2)',
};

interface DropItineraryProps {
  itinerary: ItineraryDay[];
}

export function DropItinerary({ itinerary }: DropItineraryProps) {
  const [expanded, setExpanded] = useState<number | null>(0);

  return (
    <section
      className="py-24 px-8"
      style={{ background: 'var(--color-bg)', borderTop: '1px solid var(--color-border)' }}
    >
      <div className="max-w-4xl mx-auto">
        <p className="font-mono text-xs tracking-widest mb-3" style={{ color: 'var(--color-accent)' }}>
          ITINERARY
        </p>
        <h2 className="font-display text-5xl font-light mb-16" style={{ color: 'var(--color-white)' }}>
          Day by day.
        </h2>

        <div className="space-y-px" style={{ background: 'var(--color-border)' }}>
          {itinerary.map((day, i) => {
            const isOpen = expanded === i;
            return (
              <div
                key={day.dayNumber}
                className="cursor-pointer"
                style={{ background: 'var(--color-surface)' }}
                onClick={() => setExpanded(isOpen ? null : i)}
              >
                <div className="flex items-center gap-6 p-6">
                  <span
                    className="font-mono font-bold shrink-0 w-12"
                    style={{ fontSize: '2rem', color: 'var(--color-accent)', lineHeight: 1 }}
                  >
                    {String(day.dayNumber).padStart(2, '0')}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <h3 className="font-display text-xl" style={{ color: 'var(--color-white)' }}>
                        {day.title}
                      </h3>
                      {day.tag && (
                        <span
                          className="font-mono text-xs px-2 py-0.5 border"
                          style={{
                            borderColor: typeColors[day.type],
                            color: typeColors[day.type],
                            opacity: 0.8,
                          }}
                        >
                          {day.tag}
                        </span>
                      )}
                    </div>
                    <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                      {day.location}
                      {day.altitude && ` · ${day.altitude}`}
                      {day.date && ` · ${day.date}`}
                    </p>
                  </div>

                  <span
                    className="font-mono text-xs shrink-0 transition-transform"
                    style={{
                      color: 'var(--color-dim)',
                      transform: isOpen ? 'rotate(180deg)' : undefined,
                    }}
                  >
                    ↓
                  </span>
                </div>

                {isOpen && (
                  <div className="px-6 pb-6 border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <p
                      className="text-base leading-relaxed mt-4 mb-4"
                      style={{ color: 'var(--color-muted)' }}
                    >
                      {day.description}
                    </p>
                    {day.highlights.length > 0 && (
                      <ul className="space-y-1">
                        {day.highlights.map((h, j) => (
                          <li key={j} className="flex items-center gap-3 text-sm" style={{ color: 'var(--color-white)' }}>
                            <span style={{ color: 'var(--color-accent)' }}>→</span>
                            {h}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
