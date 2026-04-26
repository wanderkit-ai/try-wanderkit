'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AdminDropActions({ dropId, status }: { dropId: string; status: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function publish() {
    setLoading(true);
    const res = await fetch(`/api/drops/${dropId}/publish`, { method: 'POST' });
    if (res.ok) {
      router.refresh();
    } else {
      const json = await res.json();
      alert(json.error?.message ?? 'Failed to publish');
    }
    setLoading(false);
  }

  async function updateStatus(newStatus: string) {
    setLoading(true);
    await fetch(`/api/drops/${dropId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="flex gap-2 shrink-0">
      {status === 'REVIEW' && (
        <button
          onClick={publish}
          disabled={loading}
          className="font-mono text-xs px-3 py-1.5 disabled:opacity-50"
          style={{ background: 'var(--color-accent)', color: '#080808' }}
        >
          Approve + publish
        </button>
      )}
      {status === 'LIVE' && (
        <button
          onClick={() => updateStatus('CLOSED')}
          disabled={loading}
          className="font-mono text-xs px-3 py-1.5 border"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}
        >
          Close
        </button>
      )}
      {['DRAFT', 'REVIEW'].includes(status) && (
        <button
          onClick={() => updateStatus('CANCELLED')}
          disabled={loading}
          className="font-mono text-xs px-3 py-1.5 border"
          style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}
        >
          Cancel
        </button>
      )}
    </div>
  );
}
