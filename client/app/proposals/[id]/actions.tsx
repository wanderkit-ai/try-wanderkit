'use client';

import { useState } from 'react';
import { CheckCircle2, MessageSquare } from 'lucide-react';

export function ProposalActions({
  influencerEmail,
  tripTitle,
}: {
  influencerEmail: string;
  tripTitle: string;
}) {
  const [accepted, setAccepted] = useState(false);

  const mailtoHref = `mailto:${influencerEmail}?subject=${encodeURIComponent(
    `Changes requested: ${tripTitle}`
  )}&body=${encodeURIComponent('Hi,\n\nI reviewed the proposal and have a few changes to request:\n\n1. \n2. \n\nThanks!')}`;

  return (
    <div className="flex flex-col sm:flex-row gap-3 mt-8">
      <button
        onClick={() => setAccepted(true)}
        disabled={accepted}
        className="flex-1 inline-flex items-center justify-center gap-2 h-12 px-6 rounded-lg font-medium text-sm transition-all"
        style={{
          background: accepted ? 'hsl(var(--accent-soft))' : 'hsl(var(--ink))',
          color: accepted ? 'hsl(var(--accent))' : 'hsl(var(--bg))',
          cursor: accepted ? 'default' : 'pointer',
        }}
      >
        <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
        {accepted ? 'Proposal accepted — we\'ll be in touch!' : 'Accept this proposal'}
      </button>

      <a
        href={mailtoHref}
        className="flex-1 inline-flex items-center justify-center gap-2 h-12 px-6 rounded-lg font-medium text-sm border transition-colors"
        style={{
          borderColor: 'hsl(var(--border))',
          background: 'hsl(var(--panel))',
          color: 'hsl(var(--ink))',
        }}
      >
        <MessageSquare className="w-4 h-4" strokeWidth={1.75} />
        Request changes
      </a>
    </div>
  );
}
