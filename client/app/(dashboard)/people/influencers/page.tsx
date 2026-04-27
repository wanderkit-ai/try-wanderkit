import { PageHeader } from '@/components/page-header';
import { Avatar } from '@/components/avatar';
import { TableShell, Th, Td } from '@/components/table-shell';
import { influencers } from '@/lib/mock-data';

export default function InfluencersPage() {
  return (
    <>
      <PageHeader
        icon="✨"
        title="Influencers"
        crumbs={[{ label: 'People' }, { label: 'Influencers' }]}
        description="Travel creators who curate and sell trips on Wanderkit."
      />
      <TableShell views={['Table', 'Cards']}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <Th>Creator</Th>
                <Th>Handle</Th>
                <Th>Followers</Th>
                <Th>Niches</Th>
                <Th>Regions</Th>
                <Th>Active trips</Th>
              </tr>
            </thead>
            <tbody>
              {influencers.map((i) => (
                <tr key={i.id} className="hover:bg-hover/60">
                  <Td>
                    <div className="flex items-center gap-2">
                      <Avatar name={i.name} color={i.avatarColor} size={24} />
                      <div>
                        <div className="font-medium text-ink">{i.name}</div>
                        <div className="text-xs text-muted truncate max-w-xs">{i.bio}</div>
                      </div>
                    </div>
                  </Td>
                  <Td className="text-ink2">{i.handle}</Td>
                  <Td className="font-mono tabular-nums text-xs">
                    {i.followers.toLocaleString()}
                  </Td>
                  <Td>
                    <div className="flex gap-1 flex-wrap">
                      {i.niches.map((n) => <span key={n} className="chip">{n}</span>)}
                    </div>
                  </Td>
                  <Td>
                    <div className="flex gap-1 flex-wrap">
                      {i.regions.map((r) => <span key={r} className="chip">{r}</span>)}
                    </div>
                  </Td>
                  <Td className="font-medium">{i.activeTrips}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TableShell>
    </>
  );
}
