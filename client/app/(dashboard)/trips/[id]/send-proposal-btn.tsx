'use client';

import { useState } from 'react';
import { Share2, Check } from 'lucide-react';

export function SendProposalBtn({ tripId }: { tripId: string }) {
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    const url = `${window.location.origin}/proposals/${tripId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button onClick={handleClick} className="btn btn-primary gap-1.5 h-9 px-3 text-sm">
      {copied ? <Check className="w-3.5 h-3.5" strokeWidth={2} /> : <Share2 className="w-3.5 h-3.5" strokeWidth={1.75} />}
      {copied ? 'Link copied!' : 'Send Proposal'}
    </button>
  );
}
