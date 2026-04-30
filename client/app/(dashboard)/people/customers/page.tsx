import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Avatar } from '@/components/avatar';
import { StatusPill } from '@/components/status-pill';
import { TableShell, Th, Td } from '@/components/table-shell';
import { customers } from '@/lib/mock-data';
import { formatMoney } from '@/lib/utils';

const JAMIE_ID = 'inf_jamie';

export default function CustomersPage() {
  const myCustomers = customers.filter((c) => c.influencerId === JAMIE_ID);

  return (
    <>
      <PageHeader
        icon="👥"
        title="Customers"
        crumbs={[{ label: 'Customers' }]}
        description="Travelers who came in through your portal or word of mouth."
      />
      <TableShell>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Status</Th>
                <Th>Interests</Th>
                <Th>Budget</Th>
                <Th>Group</Th>
                <Th>Location</Th>
                <Th>Joined</Th>
              </tr>
            </thead>
            <tbody>
              {myCustomers.map((c) => (
                <tr key={c.id} className="hover:bg-hover/60">
                  <Td>
                    <Link href={`/people/customers/${c.id}`} className="flex items-center gap-2">
                      <Avatar name={c.name} color={c.avatarColor} size={22} />
                      <div>
                        <div className="font-medium text-ink hover:underline">{c.name}</div>
                        <div className="text-xs text-muted">{c.email}</div>
                      </div>
                    </Link>
                  </Td>
                  <Td><StatusPill status={c.status} /></Td>
                  <Td>
                    <div className="flex gap-1 flex-wrap">
                      {c.interests.map((i) => (
                        <span key={i} className="chip">{i}</span>
                      ))}
                    </div>
                  </Td>
                  <Td className="font-mono tabular-nums text-xs">
                    {formatMoney(c.budgetMin)}–{formatMoney(c.budgetMax)}
                  </Td>
                  <Td className="text-ink2">{c.groupSize}</Td>
                  <Td className="text-ink2">{c.city}, {c.country}</Td>
                  <Td className="text-muted text-xs">{c.joinedAt}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TableShell>
    </>
  );
}
