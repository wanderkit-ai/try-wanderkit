import Link from 'next/link';

export default function ApplicationSuccess() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-8 text-center"
      style={{ background: 'var(--color-bg)', color: 'var(--color-white)' }}
    >
      <div className="max-w-lg">
        <div
          className="w-16 h-16 flex items-center justify-center mb-8 mx-auto"
          style={{
            background: 'var(--color-accent-dim)',
            border: '1px solid var(--color-accent)',
          }}
        >
          <span className="font-mono text-2xl" style={{ color: 'var(--color-accent)' }}>✓</span>
        </div>

        <p className="font-mono text-xs tracking-widest mb-6" style={{ color: 'var(--color-accent)' }}>
          APPLICATION RECEIVED
        </p>
        <h1 className="font-display text-5xl font-light mb-6" style={{ color: 'var(--color-white)' }}>
          We&apos;ve got it.
        </h1>
        <p className="text-base mb-12" style={{ color: 'var(--color-muted)' }}>
          Check your inbox for a confirmation email. Here&apos;s what happens next:
        </p>

        <div className="text-left space-y-px mb-12" style={{ background: 'var(--color-border)' }}>
          {[
            { n: '01', step: 'Application review', desc: 'The creator reviews your application. This usually takes 24–48 hours.' },
            { n: '02', step: 'Approval email', desc: "If you're approved, you'll get an email with a link to pay your deposit." },
            { n: '03', step: 'Deposit payment', desc: 'Pay your deposit to confirm your spot. Until then, your spot is not guaranteed.' },
            { n: '04', step: "You're confirmed", desc: "Spot secured. Pre-trip info will follow closer to departure." },
          ].map(({ n, step, desc }) => (
            <div key={n} className="p-6 flex items-start gap-4" style={{ background: 'var(--color-surface)' }}>
              <span className="font-mono text-xs shrink-0 mt-0.5" style={{ color: 'var(--color-accent)' }}>
                {n}
              </span>
              <div>
                <p className="font-sans font-medium text-sm mb-1" style={{ color: 'var(--color-white)' }}>
                  {step}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <Link
          href="/"
          className="inline-block px-8 py-4 border text-sm font-mono"
          style={{ borderColor: 'var(--color-border-bright)', color: 'var(--color-white)' }}
        >
          Back to Tripdrop
        </Link>
      </div>
    </div>
  );
}
