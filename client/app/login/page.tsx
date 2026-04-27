'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Compass, Loader2, Mail, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'magic' | 'password'>('magic');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function onMagic(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setStatus('error');
      setErrorMsg(error.message);
      return;
    }
    setStatus('sent');
  }

  async function onPassword(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setStatus('error');
      setErrorMsg(error.message);
      return;
    }
    router.push('/');
    router.refresh();
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-10 bg-sidebar border-r">
        <div className="flex items-center gap-2 text-ink">
          <Compass className="w-5 h-5 text-accent" strokeWidth={1.75} />
          <span className="font-semibold">Wanderkit</span>
        </div>
        <div className="space-y-6 max-w-md">
          <h1 className="text-3xl font-medium leading-snug text-ink">
            The CRM for travel that actually plans the trip.
          </h1>
          <p className="text-ink2 leading-relaxed">
            Wanderkit is a workspace for travel creators, customers, and local operators —
            with five AI agents that source operators, negotiate quotes, and book itineraries
            in the background while you do the human work.
          </p>
          <div className="space-y-2 pt-2">
            {[
              ['Concierge', 'turns customer answers into a structured trip brief'],
              ['Matchmaker', 'finds and ranks local operators across countries'],
              ['Negotiator', 'WhatsApps operators, normalizes quotes'],
              ['Booker', 'direct bookings when no operator is needed'],
              ['Social', 'groups travelers, surfaces advisories and weather'],
            ].map(([name, desc]) => (
              <div key={name} className="flex gap-3 text-sm">
                <span className="font-medium text-ink min-w-[88px]">{name}</span>
                <span className="text-ink2">{desc}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted">© Wanderkit · 2026</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8 text-ink">
            <Compass className="w-5 h-5 text-accent" strokeWidth={1.75} />
            <span className="font-semibold">Wanderkit</span>
          </div>

          <h2 className="text-2xl font-medium text-ink">Sign in</h2>
          <p className="text-sm text-ink2 mt-1">
            {mode === 'magic'
              ? 'We will email you a one-time link.'
              : 'Use your email and password.'}
          </p>

          <form
            onSubmit={mode === 'magic' ? onMagic : onPassword}
            className="mt-8 space-y-3"
          >
            <label className="block">
              <span className="text-xs font-medium text-ink2">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full h-10 px-3 rounded border bg-panel text-sm focus:outline-none focus:border-ink"
                placeholder="you@studio.co"
              />
            </label>

            {mode === 'password' && (
              <label className="block">
                <span className="text-xs font-medium text-ink2">Password</span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full h-10 px-3 rounded border bg-panel text-sm focus:outline-none focus:border-ink"
                  placeholder="••••••••"
                />
              </label>
            )}

            <button
              type="submit"
              disabled={status === 'loading' || status === 'sent'}
              className="btn btn-primary w-full h-10 disabled:opacity-60"
            >
              {status === 'loading' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : status === 'sent' ? (
                <>
                  <Mail className="w-4 h-4" />
                  Check your email
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {errorMsg && (
              <p className="text-sm text-danger">{errorMsg}</p>
            )}
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <button
            type="button"
            onClick={() => {
              setMode(mode === 'magic' ? 'password' : 'magic');
              setStatus('idle');
              setErrorMsg('');
            }}
            className="btn btn-outline w-full h-10"
          >
            {mode === 'magic' ? 'Use password instead' : 'Use magic link instead'}
          </button>

          <p className="text-xs text-muted mt-6">
            By continuing you agree to Wanderkit&apos;s terms.
          </p>
        </div>
      </div>
    </div>
  );
}
