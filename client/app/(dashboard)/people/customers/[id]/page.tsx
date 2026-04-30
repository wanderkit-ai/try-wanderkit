'use client';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Avatar } from '@/components/avatar';
import { StatusPill } from '@/components/status-pill';
import { customers, influencers, findById } from '@/lib/mock-data';
import { formatMoney } from '@/lib/utils';
import type { Document } from '@/lib/types';
import {
  Bot,
  Globe,
  BookOpen,
  MapPin,
  Users,
  DollarSign,
  Calendar,
  Tag,
  Upload,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

function Prop({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted">
      <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
      {label}
    </div>
  );
}

function DocumentRow({
  customerId,
  tripId,
  initialDoc,
}: {
  customerId: string;
  tripId?: string;
  initialDoc: Document;
}) {
  const [doc, setDoc] = useState<Document>(initialDoc);
  const [loading, setLoading] = useState(false);

  async function handleUpload() {
    setLoading(true);
    try {
      const res = await fetch(`/api/customers/${customerId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doc_type: doc.docType,
          filename: `${doc.docType.toLowerCase().replace(/\s+/g, '_')}.pdf`,
          trip_id: tripId ?? null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setDoc({
          docType: doc.docType,
          filename: data.doc?.filename ?? 'document.pdf',
          url: data.doc?.url ?? '',
          uploadedAt: data.doc?.uploadedAt ?? new Date().toISOString(),
          status: 'uploaded',
        });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <tr className="hover:bg-hover/60">
      <td className="py-2 px-4 text-sm text-ink">{doc.docType}</td>
      <td className="py-2 px-4">
        <StatusPill status={doc.status} />
      </td>
      <td className="py-2 px-4 text-xs text-ink2 font-mono">
        {doc.status === 'uploaded' ? (
          <a href={doc.url} target="_blank" rel="noreferrer" className="text-accent underline underline-offset-2">
            {doc.filename}
          </a>
        ) : (
          <span className="text-muted">—</span>
        )}
      </td>
      <td className="py-2 px-4 text-xs text-muted">
        {doc.status === 'uploaded' ? doc.uploadedAt.slice(0, 10) : '—'}
      </td>
      <td className="py-2 px-4">
        {doc.status === 'missing' && (
          <button
            onClick={handleUpload}
            disabled={loading}
            className="btn btn-outline h-7 text-xs px-2 gap-1"
          >
            <Upload className="w-3 h-3" strokeWidth={1.75} />
            {loading ? 'Uploading…' : 'Upload'}
          </button>
        )}
        {doc.status === 'uploaded' && (
          <CheckCircle2 className="w-4 h-4 text-success" strokeWidth={2} />
        )}
      </td>
    </tr>
  );
}

// Default checklist shown when no agent-generated checklist exists.
const DEFAULT_DOCS: Document[] = [
  { docType: 'Passport (photo page)', filename: '', url: '', uploadedAt: '', status: 'missing' },
  { docType: 'Travel insurance certificate', filename: '', url: '', uploadedAt: '', status: 'missing' },
];

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const customer = customers.find((c) => c.id === params.id);
  if (!customer) notFound();

  const inf = findById(influencers, customer.influencerId);
  const docs: Document[] = customer.documents && customer.documents.length > 0
    ? customer.documents
    : DEFAULT_DOCS;

  return (
    <>
      <PageHeader
        icon="👤"
        title={customer.name}
        crumbs={[
          { label: 'Customers', href: '/people/customers' },
          { label: customer.name },
        ]}
      />

      <div className="px-12 pb-12">
        {/* Status + influencer */}
        <div className="flex items-center gap-2 mb-6">
          <StatusPill status={customer.status} />
          {inf && (
            <span className="inline-flex items-center gap-1.5 text-xs text-ink2">
              <Avatar name={inf.name} color={inf.avatarColor} size={18} />
              {inf.handle}
            </span>
          )}
        </div>

        {/* Property grid */}
        <div className="grid grid-cols-[160px_1fr] gap-y-1 text-sm mb-8 max-w-2xl">
          <Prop icon={Globe} label="Nationality" />
          <div className="text-ink">{customer.nationality ?? '—'}</div>

          <Prop icon={BookOpen} label="Passport expiry" />
          <div className={`text-ink font-mono tabular-nums text-xs ${
            customer.passportExpiry && customer.passportExpiry < '2027-01-01' ? 'text-warning' : ''
          }`}>
            {customer.passportExpiry ?? '—'}
          </div>

          <Prop icon={MapPin} label="Location" />
          <div className="text-ink">{customer.city}, {customer.country}</div>

          <Prop icon={Calendar} label="Age" />
          <div className="text-ink">{customer.age}</div>

          <Prop icon={DollarSign} label="Budget" />
          <div className="text-ink font-mono tabular-nums text-xs">
            {formatMoney(customer.budgetMin)}–{formatMoney(customer.budgetMax)}
          </div>

          <Prop icon={Tag} label="Interests" />
          <div className="flex gap-1 flex-wrap">
            {customer.interests.map((i) => <span key={i} className="chip">{i}</span>)}
          </div>

          <Prop icon={Users} label="Group size" />
          <div className="text-ink">{customer.groupSize}</div>

          <Prop icon={Calendar} label="Availability" />
          <div className="flex gap-1 flex-wrap">
            {customer.availability.map((a) => <span key={a} className="chip">{a}</span>)}
          </div>

          {customer.notes && (
            <>
              <div className="text-xs text-muted pt-1">Notes</div>
              <div className="text-ink2 text-xs pt-1">{customer.notes}</div>
            </>
          )}
        </div>

        {/* Documents section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-ink2 uppercase tracking-wide">Documents</h2>
            {docs.some((d) => d.status === 'missing') && (
              <span className="flex items-center gap-1 text-xs text-warning">
                <AlertCircle className="w-3.5 h-3.5" strokeWidth={1.75} />
                {docs.filter((d) => d.status === 'missing').length} missing
              </span>
            )}
          </div>
          <div className="surface overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 px-4 text-left text-xs font-medium text-muted">Doc Type</th>
                  <th className="py-2 px-4 text-left text-xs font-medium text-muted">Status</th>
                  <th className="py-2 px-4 text-left text-xs font-medium text-muted">Filename</th>
                  <th className="py-2 px-4 text-left text-xs font-medium text-muted">Uploaded</th>
                  <th className="py-2 px-4 text-left text-xs font-medium text-muted">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {docs.map((doc, i) => (
                  <DocumentRow
                    key={`${doc.docType}-${i}`}
                    customerId={customer.id}
                    initialDoc={doc}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Open in Compliance */}
        <Link
          href={`/agents/itinerary?customer=${customer.id}`}
          className="btn btn-outline h-9 w-fit"
        >
          <Bot className="w-3.5 h-3.5" strokeWidth={1.75} />
          Research a trip for this customer
        </Link>
      </div>
    </>
  );
}
