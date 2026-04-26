'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Lazy import to avoid module-load initialization with empty env vars
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-8"
      style={{ background: 'var(--color-bg)', color: 'var(--color-white)' }}
    >
      <div className="w-full max-w-sm">
        <Link href="/" className="block font-mono text-sm tracking-widest mb-12" style={{ color: 'var(--color-accent)' }}>
          TRIPDROP
        </Link>

        {sent ? (
          <div>
            <div
              className="w-12 h-12 flex items-center justify-center mb-6"
              style={{ background: 'var(--color-accent-dim)', border: '1px solid var(--color-accent)' }}
            >
              <span style={{ color: 'var(--color-accent)' }}>✓</span>
            </div>
            <h1 className="font-display text-3xl font-light mb-3" style={{ color: 'var(--color-white)' }}>
              Check your email.
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
              We sent a magic link to <strong>{email}</strong>. Click it to sign in.
            </p>
          </div>
        ) : (
          <>
            <h1 className="font-display text-4xl font-light mb-2" style={{ color: 'var(--color-white)' }}>
              Creator login.
            </h1>
            <p className="text-sm mb-8" style={{ color: 'var(--color-muted)' }}>
              Enter your email and we&apos;ll send a magic link.
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block font-mono text-xs tracking-widest mb-2" style={{ color: 'var(--color-dim)' }}>
                  EMAIL
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 text-sm outline-none"
                  style={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-white)',
                  }}
                />
              </div>

              {error && (
                <p className="text-xs" style={{ color: 'var(--color-danger)' }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 text-sm font-mono font-bold disabled:opacity-50"
                style={{ background: 'var(--color-accent)', color: '#080808' }}
              >
                {loading ? 'Sending...' : 'Send magic link →'}
              </button>
            </form>

            <p className="mt-8 text-xs" style={{ color: 'var(--color-dim)' }}>
              Not a creator yet?{' '}
              <Link href="/creator/signup" style={{ color: 'var(--color-accent)' }}>
                Apply here
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
