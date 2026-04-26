'use client';

import { useState } from 'react';
import { formatDate } from '@/lib/utils';

const COLUMNS = [
  { status: 'SUBMITTED', label: 'New', color: 'var(--color-muted)' },
  { status: 'APPROVED', label: 'Awaiting Deposit', color: '#5794ff' },
  { status: 'DEPOSIT_PAID', label: 'Confirmed', color: 'var(--color-accent)' },
  { status: 'WAITLISTED', label: 'Waitlist', color: '#ff9d57' },
  { status: 'REJECTED', label: 'Declined', color: 'var(--color-danger)' },
];

interface Application {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  roomPreference: string;
  motivation: string;
  createdAt: Date;
  reviewNote: string | null;
}

interface ApplicantKanbanProps {
  dropId: string;
  applications: Application[];
  depositAmount: number;
}

export function ApplicantKanban({ dropId, applications: initial, depositAmount }: ApplicantKanbanProps) {
  const [apps, setApps] = useState(initial);
  const [selected, setSelected] = useState<Application | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  async function updateStatus(appId: string, status: string) {
    setLoading(appId);
    if (status === 'APPROVED') {
      const res = await fetch(`/api/applications/${appId}/approve`, { method: 'POST' });
      const json = await res.json();
      if (res.ok) {
        setApps((prev) => prev.map((a) => a.id === appId ? { ...a, status: 'APPROVED' } : a));
        if (json.checkoutUrl) {
          alert(`Approval email sent with payment link:\n${json.checkoutUrl}`);
        }
      } else {
        alert(json.error?.message ?? 'Failed to approve');
      }
    } else {
      const res = await fetch(`/api/applications/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setApps((prev) => prev.map((a) => a.id === appId ? { ...a, status } : a));
      }
    }
    setLoading(null);
    setSelected(null);
  }

  return (
    <div>
      {/* Kanban */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const colApps = apps.filter((a) => a.status === col.status);
          return (
            <div key={col.status} className="min-w-[260px] flex-1">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs tracking-widest" style={{ color: col.color }}>
                  {col.label.toUpperCase()}
                </span>
                <span
                  className="font-mono text-xs w-5 h-5 flex items-center justify-center rounded-full"
                  style={{ background: 'var(--color-surface)', color: 'var(--color-dim)' }}
                >
                  {colApps.length}
                </span>
              </div>

              <div className="space-y-2">
                {colApps.map((app) => (
                  <button
                    key={app.id}
                    onClick={() => setSelected(app)}
                    className="w-full text-left p-4 border transition-colors"
                    style={{
                      background: 'var(--color-card)',
                      borderColor: 'var(--color-border)',
                    }}
                  >
                    <p className="font-sans text-sm font-medium mb-1" style={{ color: 'var(--color-white)' }}>
                      {app.firstName} {app.lastName}
                    </p>
                    <p className="font-mono text-xs mb-2" style={{ color: 'var(--color-dim)' }}>
                      {formatDate(app.createdAt)}
                    </p>
                    <p className="text-xs line-clamp-2" style={{ color: 'var(--color-muted)' }}>
                      {app.motivation.slice(0, 80)}...
                    </p>
                    {app.roomPreference === 'SINGLE_SUPPLEMENT' && (
                      <span
                        className="inline-block mt-2 font-mono text-xs px-1.5 py-0.5"
                        style={{ background: 'var(--color-accent-dim)', color: 'var(--color-accent)' }}
                      >
                        Single
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-end"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}
        >
          <div
            className="w-full max-w-lg h-full overflow-y-auto p-8"
            style={{ background: 'var(--color-surface)', borderLeft: '1px solid var(--color-border)' }}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="font-display text-2xl font-light" style={{ color: 'var(--color-white)' }}>
                  {selected.firstName} {selected.lastName}
                </h2>
                <p className="font-mono text-xs mt-1" style={{ color: 'var(--color-dim)' }}>
                  {selected.email}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="font-mono text-sm"
                style={{ color: 'var(--color-dim)' }}
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 mb-8">
              <div>
                <p className="font-mono text-xs tracking-widest mb-1" style={{ color: 'var(--color-dim)' }}>
                  WHY THEY WANT TO JOIN
                </p>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                  {selected.motivation}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-mono text-xs" style={{ color: 'var(--color-dim)' }}>Room</p>
                  <p className="text-sm" style={{ color: 'var(--color-white)' }}>
                    {selected.roomPreference === 'TWIN_SHARE' ? 'Twin share' : 'Single room'}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-xs" style={{ color: 'var(--color-dim)' }}>Applied</p>
                  <p className="text-sm" style={{ color: 'var(--color-white)' }}>
                    {formatDate(selected.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {selected.status === 'SUBMITTED' && (
              <div className="flex gap-3">
                <button
                  onClick={() => updateStatus(selected.id, 'APPROVED')}
                  disabled={loading === selected.id}
                  className="flex-1 py-3 text-sm font-mono disabled:opacity-50"
                  style={{ background: 'var(--color-accent)', color: '#080808' }}
                >
                  Approve + send deposit link
                </button>
                <button
                  onClick={() => updateStatus(selected.id, 'WAITLISTED')}
                  disabled={loading === selected.id}
                  className="py-3 px-4 text-sm font-mono border"
                  style={{ borderColor: '#ff9d57', color: '#ff9d57' }}
                >
                  Waitlist
                </button>
                <button
                  onClick={() => updateStatus(selected.id, 'REJECTED')}
                  disabled={loading === selected.id}
                  className="py-3 px-4 text-sm font-mono border"
                  style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}
                >
                  Decline
                </button>
              </div>
            )}

            {selected.status === 'APPROVED' && (
              <p className="text-sm text-center py-4" style={{ color: 'var(--color-muted)' }}>
                Approval email sent. Waiting for deposit payment.
              </p>
            )}

            {selected.status === 'DEPOSIT_PAID' && (
              <div
                className="flex items-center gap-3 p-4"
                style={{ background: 'var(--color-accent-dim)', border: '1px solid var(--color-accent)' }}
              >
                <span style={{ color: 'var(--color-accent)' }}>✓</span>
                <p className="text-sm" style={{ color: 'var(--color-accent)' }}>
                  Deposit paid. Confirmed.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
