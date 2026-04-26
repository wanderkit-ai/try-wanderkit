'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { slugify } from '@/lib/utils';

export default function NewDropPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    destination: '',
    country: '',
    departureDate: '',
    returnDate: '',
    applicationDeadline: '',
    totalSpots: '12',
    pricePerPerson: '',
    depositAmount: '',
  });

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const slug = slugify(`${form.destination}-${form.departureDate.slice(0, 7)}`);

    const res = await fetch('/api/drops', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        slug,
        totalSpots: parseInt(form.totalSpots),
        pricePerPerson: Math.round(parseFloat(form.pricePerPerson) * 100),
        depositAmount: Math.round(parseFloat(form.depositAmount) * 100),
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      setError(json.error?.message ?? 'Failed to create drop');
      setLoading(false);
      return;
    }

    router.push(`/drops/${json.id}`);
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-10">
        <Link href="/drops" className="font-mono text-xs" style={{ color: 'var(--color-dim)' }}>
          ← All drops
        </Link>
        <h1 className="font-display text-4xl font-light mt-4" style={{ color: 'var(--color-white)' }}>
          New drop.
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <FormField label="Trip title" required>
          <input
            className="form-field"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            required
            placeholder="Annapurna Circuit"
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Destination" required>
            <input
              className="form-field"
              value={form.destination}
              onChange={(e) => update('destination', e.target.value)}
              required
              placeholder="Annapurna Circuit"
            />
          </FormField>
          <FormField label="Country" required>
            <input
              className="form-field"
              value={form.country}
              onChange={(e) => update('country', e.target.value)}
              required
              placeholder="Nepal"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Departure date" required>
            <input
              type="date"
              className="form-field"
              value={form.departureDate}
              onChange={(e) => update('departureDate', e.target.value)}
              required
            />
          </FormField>
          <FormField label="Return date" required>
            <input
              type="date"
              className="form-field"
              value={form.returnDate}
              onChange={(e) => update('returnDate', e.target.value)}
              required
            />
          </FormField>
        </div>

        <FormField label="Application deadline" required>
          <input
            type="date"
            className="form-field"
            value={form.applicationDeadline}
            onChange={(e) => update('applicationDeadline', e.target.value)}
            required
          />
        </FormField>

        <div className="grid grid-cols-3 gap-4">
          <FormField label="Max spots">
            <input
              type="number"
              className="form-field"
              value={form.totalSpots}
              onChange={(e) => update('totalSpots', e.target.value)}
              min="2"
              max="50"
            />
          </FormField>
          <FormField label="Price / person (USD)" required>
            <input
              type="number"
              className="form-field"
              value={form.pricePerPerson}
              onChange={(e) => update('pricePerPerson', e.target.value)}
              required
              placeholder="3500"
              step="100"
            />
          </FormField>
          <FormField label="Deposit (USD)" required>
            <input
              type="number"
              className="form-field"
              value={form.depositAmount}
              onChange={(e) => update('depositAmount', e.target.value)}
              required
              placeholder="500"
              step="50"
            />
          </FormField>
        </div>

        {error && (
          <p className="text-sm" style={{ color: 'var(--color-danger)' }}>
            {error}
          </p>
        )}

        <style jsx global>{`
          .form-field {
            width: 100%;
            background: var(--color-surface);
            border: 1px solid var(--color-border);
            color: var(--color-white);
            padding: 0.75rem 1rem;
            font-family: var(--font-sans);
            font-size: 0.875rem;
            outline: none;
          }
          .form-field:focus {
            border-color: var(--color-accent);
          }
          .form-field::placeholder {
            color: var(--color-dim);
          }
        `}</style>

        <button
          type="submit"
          disabled={loading}
          className="px-8 py-4 text-sm font-mono font-bold disabled:opacity-50"
          style={{ background: 'var(--color-accent)', color: '#080808' }}
        >
          {loading ? 'Creating...' : 'Create drop →'}
        </button>
      </form>
    </div>
  );
}

function FormField({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="block font-mono text-xs tracking-widest mb-2" style={{ color: 'var(--color-dim)' }}>
        {label.toUpperCase()}{required && ' *'}
      </label>
      {children}
    </div>
  );
}
