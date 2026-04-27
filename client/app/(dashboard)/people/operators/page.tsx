import { PageHeader } from '@/components/page-header';
import { TableShell, Th, Td } from '@/components/table-shell';
import { operators } from '@/lib/mock-data';
import { Star, MessageCircle } from 'lucide-react';

export default function OperatorsPage() {
  return (
    <>
      <PageHeader
        icon="🏔️"
        title="Local operators"
        crumbs={[{ label: 'People' }, { label: 'Operators' }]}
        description="Tour companies and local guides the AI negotiates with on WhatsApp."
      />
      <TableShell views={['Table', 'Map']}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <Th>Company</Th>
                <Th>Contact</Th>
                <Th>Country / Region</Th>
                <Th>Specialties</Th>
                <Th>Rating</Th>
                <Th>Tier</Th>
                <Th>Reply time</Th>
                <Th>WhatsApp</Th>
              </tr>
            </thead>
            <tbody>
              {operators.map((o) => (
                <tr key={o.id} className="hover:bg-hover/60">
                  <Td>
                    <div className="font-medium text-ink">{o.company}</div>
                    {o.notes && (
                      <div className="text-xs text-muted truncate max-w-xs">{o.notes}</div>
                    )}
                  </Td>
                  <Td className="text-ink2">{o.contactName}</Td>
                  <Td className="text-ink2">
                    {o.country}
                    <span className="text-muted"> · {o.region}</span>
                  </Td>
                  <Td>
                    <div className="flex gap-1 flex-wrap">
                      {o.specialties.map((s) => <span key={s} className="chip">{s}</span>)}
                    </div>
                  </Td>
                  <Td>
                    <span className="inline-flex items-center gap-1 font-mono tabular-nums text-xs">
                      <Star className="w-3 h-3 fill-warn text-warn" strokeWidth={0} />
                      {o.rating.toFixed(1)}
                    </span>
                  </Td>
                  <Td className="font-mono">{o.priceTier}</Td>
                  <Td className="text-ink2 text-xs">~{o.responseHours}h</Td>
                  <Td>
                    <span className="inline-flex items-center gap-1 text-xs text-ink2">
                      <MessageCircle className="w-3 h-3" strokeWidth={1.75} />
                      {o.whatsapp}
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TableShell>
    </>
  );
}
