'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function CreatorSignupPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    name: '',
    handle: '',
    email: '',
    primaryPlatform: 'instagram',
    followerCount: '',
    bio: '',
    websiteUrl: '',
  });

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function generateSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch('/api/creators', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        slug: generateSlug(form.handle || form.name),
        followerCount: form.followerCount ? parseInt(form.followerCount) : undefined,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      setError(json.error?.message ?? 'Something went wrong');
      setLoading(false);
      return;
    }

    setSubmitted(true);
    setLoading(false);
  }

  if (submitted) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-8 text-center"
        style={{ background: 'var(--color-bg)', color: 'var(--color-white)' }}
      >
        <div className="max-w-md">
          <div
            className="w-16 h-16 flex items-center justify-center mb-8 mx-auto"
            style={{ background: 'var(--color-accent-dim)', border: '1px solid var(--color-accent)' }}
          >
            <span style={{ color: 'var(--color-accent)' }}>✓</span>
          </div>
          <h1 className="font-display text-4xl font-light mb-4">Application received.</h1>
          <p style={{ color: 'var(--color-muted)' }}>
            We review applications within 2 business days. You&apos;ll get an email at{' '}
            <strong>{form.email}</strong> when you&apos;re approved.
          </p>
        </div>
      </div>
    );
  }

  const fields = [
    { key: 'name', label: 'Full name', type: 'text', placeholder: 'Jamie Chen' },
    { key: 'handle', label: 'Instagram / TikTok handle', type: 'text', placeholder: '@yourhandle' },
    { key: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
    { key: 'followerCount', label: 'Approximate followers (total)', type: 'number', placeholder: '50000' },
    { key: 'websiteUrl', label: 'Website (optional)', type: 'url', placeholder: 'https://yoursite.com' },
  ];

  return (
    <div
      className="min-h-screen py-16 px-8"
      style={{ background: 'var(--color-bg)', color: 'var(--color-white)' }}
    >
      <div className="max-w-lg mx-auto">
        <Link href="/" className="block font-mono text-sm tracking-widest mb-12" style={{ color: 'var(--color-accent)' }}>
          TRIPDROP
        </Link>

        <p className="font-mono text-xs tracking-widest mb-4" style={{ color: 'var(--color-dim)' }}>
          CREATOR APPLICATION
        </p>
        <h1 className="font-display text-5xl font-light mb-3" style={{ color: 'var(--color-white)' }}>
          Build trips for<br />your audience.
        </h1>
        <p className="text-base mb-12" style={{ color: 'var(--color-muted)' }}>
          Tripdrop handles the infrastructure. You bring the audience and the vibe.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {fields.map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label className="block font-mono text-xs tracking-widest mb-2" style={{ color: 'var(--color-dim)' }}>
                {label.toUpperCase()}
              </label>
              <input
                type={type}
                value={(form as any)[key]}
                onChange={(e) => update(key, e.target.value)}
                required={key !== 'websiteUrl'}
                placeholder={placeholder}
                className="w-full px-4 py-3 text-sm outline-none"
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-white)',
                }}
              />
            </div>
          ))}

          <div>
            <label className="block font-mono text-xs tracking-widest mb-2" style={{ color: 'var(--color-dim)' }}>
              PRIMARY PLATFORM
            </label>
            <select
              value={form.primaryPlatform}
              onChange={(e) => update('primaryPlatform', e.target.value)}
              className="w-full px-4 py-3 text-sm outline-none"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-white)' }}
            >
              {['instagram', 'tiktok', 'youtube', 'substack'].map((p) => (
                <option key={p} value={p} style={{ background: 'var(--color-surface)' }}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-mono text-xs tracking-widest mb-2" style={{ color: 'var(--color-dim)' }}>
              SHORT BIO
            </label>
            <textarea
              value={form.bio}
              onChange={(e) => update('bio', e.target.value)}
              rows={4}
              placeholder="Tell us about you and your travel content..."
              className="w-full px-4 py-3 text-sm outline-none resize-none"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-white)' }}
            />
          </div>

          {error && (
            <p className="text-sm" style={{ color: 'var(--color-danger)' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 text-sm font-mono font-bold disabled:opacity-50"
            style={{ background: 'var(--color-accent)', color: '#080808' }}
          >
            {loading ? 'Submitting...' : 'Apply to Tripdrop →'}
          </button>
        </form>
      </div>
    </div>
  );
}
