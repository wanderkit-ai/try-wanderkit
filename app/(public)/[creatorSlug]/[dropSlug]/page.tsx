import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatCurrency, tripDuration } from '@/lib/utils';
import { DropHero } from '@/components/public/DropHero';
import { LiveTicker } from '@/components/public/LiveTicker';
import { ScarcityBar } from '@/components/public/ScarcityBar';
import { DropItinerary } from '@/components/public/DropItinerary';
import { DropIncluded } from '@/components/public/DropIncluded';
import { DropHost } from '@/components/public/DropHost';
import { ApplicationCTA } from '@/components/public/ApplicationCTA';
import { FAQAccordion } from '@/components/public/FAQAccordion';
import type { DropWithRelations, ItineraryDay, IncludedItem, FAQ } from '@/types';

export const revalidate = 60;

interface PageProps {
  params: { creatorSlug: string; dropSlug: string };
  searchParams: { preview?: string };
}

export async function generateMetadata({ params }: PageProps) {
  const drop = await getDrop(params.creatorSlug, params.dropSlug);
  if (!drop) return {};
  return {
    title: drop.metaTitle ?? `${drop.title} — Tripdrop`,
    description: drop.metaDescription ?? drop.description.slice(0, 160),
  };
}

async function getDrop(creatorSlug: string, dropSlug: string) {
  return prisma.drop.findFirst({
    where: {
      slug: dropSlug,
      status: 'LIVE',
      creator: { slug: creatorSlug },
    },
    include: {
      creator: true,
      operator: true,
      applications: {
        where: { status: { in: ['APPROVED', 'DEPOSIT_PAID', 'COMPLETED'] } },
        select: { id: true },
      },
    },
  });
}

export default async function DropPage({ params }: PageProps) {
  const rawDrop = await getDrop(params.creatorSlug, params.dropSlug);

  if (!rawDrop) notFound();

  const confirmedBookings = rawDrop.applications.length;
  const spotsRemaining = rawDrop.totalSpots - confirmedBookings;
  const percentFilled = Math.round((confirmedBookings / rawDrop.totalSpots) * 100);
  const isSoldOut = spotsRemaining <= 0;
  const isApplicationOpen =
    rawDrop.status === 'LIVE' && new Date(rawDrop.applicationDeadline) > new Date();

  const drop: DropWithRelations = {
    ...rawDrop,
    itinerary: rawDrop.itinerary as ItineraryDay[],
    included: rawDrop.included as IncludedItem[],
    faqs: rawDrop.faqs as FAQ[],
    confirmedBookings,
    spotsRemaining,
    percentFilled,
    isSoldOut,
    isApplicationOpen,
  };

  const duration = tripDuration(drop.departureDate, drop.returnDate);

  const tickerItems = [
    `${spotsRemaining} spots remaining`,
    `Apply by ${new Date(drop.applicationDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
    `${formatCurrency(drop.pricePerPerson)} per person`,
    drop.operator ? `Operated by ${drop.operator.name}` : drop.destination,
    `${duration} days · ${drop.country}`,
  ];

  return (
    <div style={{ background: 'var(--color-bg)', color: 'var(--color-white)' }}>
      {/* Sticky nav */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b"
        style={{
          borderColor: 'var(--color-border)',
          background: 'rgba(8,8,8,0.9)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <Link href="/" className="font-mono text-sm tracking-widest" style={{ color: 'var(--color-accent)' }}>
          TRIPDROP
        </Link>

        <div className="hidden md:block text-center">
          <p className="font-sans text-sm font-medium" style={{ color: 'var(--color-white)' }}>
            {drop.title}
          </p>
          <p className="font-mono text-xs" style={{ color: 'var(--color-muted)' }}>
            with {drop.creator.name}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2">
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse-accent"
              style={{ background: 'var(--color-accent)' }}
            />
            <span className="font-mono text-xs" style={{ color: 'var(--color-accent)' }}>
              {spotsRemaining} spots left
            </span>
          </div>
          {isApplicationOpen && !isSoldOut && (
            <Link
              href={`/apply/${drop.id}`}
              className="px-5 py-2 text-sm font-sans font-medium"
              style={{ background: 'var(--color-accent)', color: '#080808' }}
            >
              Apply now
            </Link>
          )}
        </div>
      </nav>

      {/* Hero */}
      <DropHero drop={drop} />

      {/* Ticker */}
      <LiveTicker items={tickerItems} />

      {/* Scarcity dashboard */}
      <section
        className="py-12 px-8 border-b"
        style={{
          background: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px" style={{ background: 'var(--color-border)' }}>
            <div className="p-6" style={{ background: 'var(--color-bg)' }}>
              <p className="font-mono text-xs tracking-widest mb-3" style={{ color: 'var(--color-dim)' }}>
                SPOTS
              </p>
              <ScarcityBar confirmedBookings={confirmedBookings} totalSpots={drop.totalSpots} />
            </div>
            <div className="p-6" style={{ background: 'var(--color-bg)' }}>
              <p className="font-mono text-xs tracking-widest mb-3" style={{ color: 'var(--color-dim)' }}>
                DEPARTS
              </p>
              <p className="font-mono text-2xl font-bold" style={{ color: 'var(--color-white)' }}>
                {Math.max(0, Math.ceil((new Date(drop.departureDate).getTime() - Date.now()) / 86400000))}
              </p>
              <p className="font-mono text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                days away
              </p>
            </div>
            <div className="p-6" style={{ background: 'var(--color-bg)' }}>
              <p className="font-mono text-xs tracking-widest mb-3" style={{ color: 'var(--color-dim)' }}>
                DURATION
              </p>
              <p className="font-mono text-2xl font-bold" style={{ color: 'var(--color-white)' }}>
                {duration}
              </p>
              <p className="font-mono text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                days total
              </p>
            </div>
            <div className="p-6" style={{ background: 'var(--color-bg)' }}>
              <p className="font-mono text-xs tracking-widest mb-3" style={{ color: 'var(--color-dim)' }}>
                DEPOSIT
              </p>
              <p className="font-mono text-2xl font-bold" style={{ color: 'var(--color-white)' }}>
                {formatCurrency(drop.depositAmount)}
              </p>
              {drop.depositDeadline && (
                <p className="font-mono text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                  refundable until {new Date(drop.depositDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Creator note */}
      {drop.creatorNote && (
        <section
          className="py-24 px-8 border-b"
          style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
        >
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16">
            <div>
              <p className="font-mono text-xs tracking-widest mb-6" style={{ color: 'var(--color-accent)' }}>
                A NOTE FROM {drop.creator.name.toUpperCase()}
              </p>
              <h2
                className="font-display font-light leading-tight"
                style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)', color: 'var(--color-white)' }}
              >
                This trip is personal.
              </h2>
            </div>
            <div>
              <p
                className="text-base leading-relaxed drop-cap"
                style={{ color: 'var(--color-muted)' }}
              >
                {drop.creatorNote}
              </p>
              <p
                className="mt-8 font-display text-xl italic"
                style={{ color: 'var(--color-dim)' }}
              >
                — {drop.creator.name}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Itinerary */}
      <DropItinerary itinerary={drop.itinerary} />

      {/* What's included */}
      <DropIncluded items={drop.included} />

      {/* Your host */}
      <DropHost creator={drop.creator} />

      {/* Application CTA */}
      <ApplicationCTA
        dropId={drop.id}
        applicationDeadline={drop.applicationDeadline}
        depositAmount={drop.depositAmount}
        depositDeadline={drop.depositDeadline}
        isSoldOut={isSoldOut}
        isApplicationOpen={isApplicationOpen}
      />

      {/* FAQ */}
      {drop.faqs.length > 0 && <FAQAccordion faqs={drop.faqs} />}

      {/* Footer */}
      <footer
        className="border-t py-10 px-8 flex items-center justify-between text-xs"
        style={{ borderColor: 'var(--color-border)', color: 'var(--color-dim)' }}
      >
        <Link href="/" className="font-mono" style={{ color: 'var(--color-accent)' }}>
          TRIPDROP
        </Link>
        <span>Operated in partnership with {drop.operator?.name ?? 'local operators'}</span>
      </footer>
    </div>
  );
}
