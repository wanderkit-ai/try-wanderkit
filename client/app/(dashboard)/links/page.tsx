import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Avatar } from '@/components/avatar';
import { TableShell, Th, Td } from '@/components/table-shell';
import { tripLinks, influencers, findById } from '@/lib/mock-data';

const STATUS_STYLES: Record<string, string> = {
  live: 'bg-green-50 text-green-700 border border-green-200',
  draft: 'bg-stone-100 text-stone-500 border border-stone-200',
  closed: 'bg-red-50 text-red-600 border border-red-200',
};

export default function TripLinksPage() {
  return (
    <>
      <PageHeader
        icon="🔗"
        title="Trip Links"
        description="Shareable sign-up pages your audience fills out to join a defined trip."
        actions={
          <Link
            href="/links/new"
            className="flex items-center gap-1.5 h-8 px-3 rounded bg-accent text-white text-sm font-medium hover:bg-accent/90"
          >
            + New link
          </Link>
        }
      />
      <TableShell views={['Table']}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <Th>Campaign</Th>
                <Th>Creator</Th>
                <Th>Destination</Th>
                <Th>Dates</Th>
                <Th>Spots</Th>
                <Th>Status</Th>
                <Th>Responses</Th>
                <Th>Link</Th>
              </tr>
            </thead>
            <tbody>
              {tripLinks.map((lnk) => {
                const inf = findById(influencers, lnk.influencerId);
                const spotsLeft = lnk.capacity - lnk.responseCount;
                return (
                  <tr key={lnk.id} className="hover:bg-hover/60">
                    <Td>
                      <Link href={`/links/${lnk.id}`} className="font-medium text-ink hover:underline">
                        {lnk.title}
                      </Link>
                      <div className="flex gap-1 flex-wrap mt-0.5">
                        {lnk.style.map((s) => <span key={s} className="chip">{s}</span>)}
                      </div>
                    </Td>
                    <Td>
                      {inf && (
                        <div className="flex items-center gap-1.5">
                          <Avatar name={inf.name} color={inf.avatarColor} size={18} />
                          <span className="text-ink2 text-xs">{inf.handle}</span>
                        </div>
                      )}
                    </Td>
                    <Td className="text-ink2 text-xs">{lnk.destination}</Td>
                    <Td className="text-ink2 text-xs font-mono tabular-nums whitespace-nowrap">
                      {lnk.startDate} → {lnk.endDate}
                    </Td>
                    <Td className="text-xs">
                      <span className={spotsLeft <= 2 ? 'text-red-500 font-medium' : 'text-ink2'}>
                        {spotsLeft} / {lnk.capacity}
                      </span>
                    </Td>
                    <Td>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[lnk.status]}`}>
                        {lnk.status}
                      </span>
                    </Td>
                    <Td className="font-mono tabular-nums text-xs">{lnk.responseCount}</Td>
                    <Td>
                      <div className="flex items-center gap-1.5">
                        <code className="text-xs text-muted font-mono truncate max-w-[140px]">/t/{lnk.slug}</code>
                        <Link
                          href={`/t/${lnk.slug}`}
                          target="_blank"
                          className="text-xs text-accent hover:underline shrink-0"
                        >
                          Open ↗
                        </Link>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </TableShell>
    </>
  );
}
