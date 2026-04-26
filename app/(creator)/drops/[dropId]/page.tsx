import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getUser } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';
import { DropEditor } from './DropEditor';
import type { ItineraryDay, IncludedItem, FAQ } from '@/types';

interface PageProps {
  params: { dropId: string };
}

export default async function DropEditorPage({ params }: PageProps) {
  const user = await getUser();
  if (!user) redirect('/auth/login');

  const drop = await prisma.drop.findUnique({
    where: { id: params.dropId },
    include: { creator: true },
  });

  if (!drop) redirect('/drops');

  const isAdmin = user.user_metadata?.role === 'admin';
  const isCreator = drop.creator.userId === user.id;
  if (!isAdmin && !isCreator) redirect('/drops');

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/drops" className="font-mono text-xs" style={{ color: 'var(--color-dim)' }}>
            ← All drops
          </Link>
          <h1 className="font-display text-3xl font-light mt-2" style={{ color: 'var(--color-white)' }}>
            {drop.title}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {drop.status === 'LIVE' && (
            <Link
              href={`/${drop.creator.slug}/${drop.slug}`}
              target="_blank"
              className="font-mono text-xs px-4 py-2 border"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}
            >
              View live →
            </Link>
          )}
        </div>
      </div>

      <DropEditor
        drop={{
          id: drop.id,
          title: drop.title,
          subtitle: drop.subtitle,
          description: drop.description,
          creatorNote: drop.creatorNote,
          destination: drop.destination,
          country: drop.country,
          heroImageUrl: drop.heroImageUrl,
          departureDate: drop.departureDate.toISOString().split('T')[0],
          returnDate: drop.returnDate.toISOString().split('T')[0],
          applicationDeadline: drop.applicationDeadline.toISOString().split('T')[0],
          depositDeadline: drop.depositDeadline?.toISOString().split('T')[0] ?? null,
          totalSpots: drop.totalSpots,
          pricePerPerson: drop.pricePerPerson,
          depositAmount: drop.depositAmount,
          singleSupplement: drop.singleSupplement,
          itinerary: (drop.itinerary as ItineraryDay[]) ?? [],
          included: (drop.included as IncludedItem[]) ?? [],
          excluded: drop.excluded,
          faqs: (drop.faqs as FAQ[]) ?? [],
          status: drop.status,
          stripeProductId: drop.stripeProductId,
        }}
      />
    </div>
  );
}
