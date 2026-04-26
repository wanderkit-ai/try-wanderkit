'use client';

import Image from 'next/image';
import { formatDateRange, formatCurrency, tripDuration } from '@/lib/utils';
import type { DropWithRelations } from '@/types';

interface DropHeroProps {
  drop: DropWithRelations;
}

export function DropHero({ drop }: DropHeroProps) {
  const duration = tripDuration(drop.departureDate, drop.returnDate);
  const isLive = drop.status === 'LIVE';

  return (
    <section className="relative h-screen min-h-[600px] flex flex-col justify-between overflow-hidden">
      {/* Background image */}
      {drop.heroImageUrl ? (
        <Image
          src={drop.heroImageUrl}
          alt={drop.title}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
      ) : (
        <div className="absolute inset-0" style={{ background: 'var(--color-surface)' }} />
      )}

      {/* Gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(8,8,8,0.3) 0%, rgba(8,8,8,0) 40%, rgba(8,8,8,0.85) 100%)',
        }}
      />

      {/* Top badges */}
      <div className="relative z-10 flex items-start justify-between p-8">
        <div
          className="font-mono text-xs tracking-widest px-3 py-1.5"
          style={{
            background: 'rgba(8,8,8,0.7)',
            backdropFilter: 'blur(8px)',
            border: '1px solid var(--color-border-bright)',
            color: 'var(--color-muted)',
          }}
        >
          Drop {String(drop.dropNumber).padStart(3, '0')} · {drop.country} ·{' '}
          {formatDateRange(drop.departureDate, drop.returnDate)}
        </div>

        {isLive && (
          <div
            className="flex items-center gap-2 font-mono text-xs tracking-widest px-3 py-1.5"
            style={{
              background: 'rgba(8,8,8,0.7)',
              backdropFilter: 'blur(8px)',
              border: '1px solid var(--color-border-bright)',
              color: 'var(--color-accent)',
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse-accent"
              style={{ background: 'var(--color-accent)' }}
            />
            Drop is live
          </div>
        )}
      </div>

      {/* Bottom content */}
      <div className="relative z-10 p-8 md:p-12">
        <h1
          className="font-display font-light leading-none mb-6"
          style={{ fontSize: 'clamp(2.5rem, 5vw, 5rem)', color: 'var(--color-white)' }}
        >
          {drop.subtitle || drop.title}
        </h1>

        <div className="flex flex-wrap gap-8">
          <div>
            <p className="font-mono text-xs tracking-widest mb-1" style={{ color: 'var(--color-dim)' }}>
              DURATION
            </p>
            <p className="font-sans text-lg" style={{ color: 'var(--color-white)' }}>
              {duration} days
            </p>
          </div>
          <div>
            <p className="font-mono text-xs tracking-widest mb-1" style={{ color: 'var(--color-dim)' }}>
              GROUP SIZE
            </p>
            <p className="font-sans text-lg" style={{ color: 'var(--color-white)' }}>
              {drop.totalSpots} people max
            </p>
          </div>
          <div>
            <p className="font-mono text-xs tracking-widest mb-1" style={{ color: 'var(--color-dim)' }}>
              FROM
            </p>
            <p className="font-sans text-lg" style={{ color: 'var(--color-white)' }}>
              {formatCurrency(drop.pricePerPerson)} / person
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
