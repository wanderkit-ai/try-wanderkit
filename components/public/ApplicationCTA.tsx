'use client';

import Link from 'next/link';
import { CountdownTimer } from './CountdownTimer';
import { formatCurrency, formatDate } from '@/lib/utils';

interface ApplicationCTAProps {
  dropId: string;
  applicationDeadline: Date;
  depositAmount: number;
  depositDeadline: Date | null;
  isSoldOut: boolean;
  isApplicationOpen: boolean;
}

export function ApplicationCTA({
  dropId,
  applicationDeadline,
  depositAmount,
  depositDeadline,
  isSoldOut,
  isApplicationOpen,
}: ApplicationCTAProps) {
  return (
    <section
      className="py-32 px-8 text-center"
      style={{
        background: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <div className="max-w-2xl mx-auto">
        <p className="font-mono text-xs tracking-widest mb-6" style={{ color: 'var(--color-accent)' }}>
          READY TO JOIN?
        </p>

        {isSoldOut ? (
          <>
            <h2 className="font-display text-5xl font-light mb-6" style={{ color: 'var(--color-white)' }}>
              This drop is full.
            </h2>
            <p className="text-base mb-10" style={{ color: 'var(--color-muted)' }}>
              All spots have been taken. Join the waitlist and we&apos;ll let you know if one opens up.
            </p>
            <Link
              href={`/waitlist/${dropId}`}
              className="inline-block px-10 py-5 text-sm font-sans tracking-wide border"
              style={{ borderColor: 'var(--color-white)', color: 'var(--color-white)' }}
            >
              Join waitlist
            </Link>
          </>
        ) : !isApplicationOpen ? (
          <>
            <h2 className="font-display text-5xl font-light mb-6" style={{ color: 'var(--color-white)' }}>
              Applications closed.
            </h2>
            <p className="text-base" style={{ color: 'var(--color-muted)' }}>
              The application deadline has passed.
            </p>
          </>
        ) : (
          <>
            <h2 className="font-display text-5xl font-light mb-4" style={{ color: 'var(--color-white)' }}>
              Applications close in
            </h2>
            <div className="mb-10">
              <CountdownTimer targetDate={applicationDeadline} />
            </div>

            <Link
              href={`/apply/${dropId}`}
              className="inline-block px-12 py-5 text-base font-sans tracking-wide font-medium mb-6"
              style={{ background: 'var(--color-accent)', color: '#080808' }}
            >
              Apply now →
            </Link>

            <div>
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                {formatCurrency(depositAmount)} deposit to secure your spot
                {depositDeadline && ` · refundable until ${formatDate(depositDeadline)}`}
              </p>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
