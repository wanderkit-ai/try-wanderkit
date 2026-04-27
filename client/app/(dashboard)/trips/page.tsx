import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Avatar } from '@/components/avatar';
import { StatusPill } from '@/components/status-pill';
import { TableShell, Th, Td } from '@/components/table-shell';
import { trips, influencers, customers, findById } from '@/lib/mock-data';
import { formatMoney } from '@/lib/utils';

export default function TripsPage() {
  return (
    <>
      <PageHeader
        icon="✈️"
        title="Trips"
        description="Every brief in flight — from first interest to booked."
      />
      <TableShell views={['Table', 'Pipeline']}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <Th>Title</Th>
                <Th>Status</Th>
                <Th>Influencer</Th>
                <Th>Travelers</Th>
                <Th>Destination</Th>
                <Th>Dates</Th>
                <Th>Group</Th>
                <Th>Budget / pp</Th>
                <Th>Style</Th>
              </tr>
            </thead>
            <tbody>
              {trips.map((t) => {
                const inf = findById(influencers, t.influencerId);
                const cs = t.customerIds.map((id) => findById(customers, id)).filter(Boolean) as any[];
                return (
                  <tr key={t.id} className="hover:bg-hover/60">
                    <Td>
                      <Link href={`/trips/${t.id}`} className="font-medium text-ink hover:underline">
                        {t.title}
                      </Link>
                    </Td>
                    <Td><StatusPill status={t.status} /></Td>
                    <Td>
                      {inf && (
                        <div className="flex items-center gap-1.5">
                          <Avatar name={inf.name} color={inf.avatarColor} size={18} />
                          <span className="text-ink2 text-xs">{inf.handle}</span>
                        </div>
                      )}
                    </Td>
                    <Td>
                      <div className="flex -space-x-1.5">
                        {cs.map((c) => (
                          <div key={c.id} className="ring-2 ring-panel rounded-full">
                            <Avatar name={c.name} color={c.avatarColor} size={20} />
                          </div>
                        ))}
                      </div>
                    </Td>
                    <Td className="text-ink2">{t.destination}</Td>
                    <Td className="text-ink2 text-xs font-mono tabular-nums">
                      {t.startDate} → {t.endDate}
                    </Td>
                    <Td className="text-ink2">{t.groupSize}</Td>
                    <Td className="font-mono tabular-nums text-xs">
                      {formatMoney(t.budgetPerPerson)}
                    </Td>
                    <Td>
                      <div className="flex gap-1 flex-wrap">
                        {t.style.map((s) => <span key={s} className="chip">{s}</span>)}
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
