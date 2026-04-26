'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AdminCreatorActions({ creatorId, status }: { creatorId: string; status: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function updateStatus(newStatus: string) {
    setLoading(true);
    await fetch(`/api/creators/${creatorId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="flex gap-2 shrink-0">
      {status === 'PENDING' && (
        <button
          onClick={() => updateStatus('APPROVED')}
          disabled={loading}
          className="font-mono text-xs px-3 py-1.5"
          style={{ background: 'var(--color-accent)', color: '#080808' }}
        >
          Approve
        </button>
      )}
      {status !== 'SUSPENDED' && (
        <button
          onClick={() => updateStatus('SUSPENDED')}
          disabled={loading}
          className="font-mono text-xs px-3 py-1.5 border"
          style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}
        >
          Suspend
        </button>
      )}
    </div>
  );
}
