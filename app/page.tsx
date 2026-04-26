import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen" style={{ background: 'var(--color-bg)', color: 'var(--color-white)' }}>
      {/* Nav */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5 border-b"
        style={{
          borderColor: 'var(--color-border)',
          background: 'rgba(8,8,8,0.9)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <span className="font-mono text-sm tracking-widest" style={{ color: 'var(--color-accent)' }}>
          TRIPDROP
        </span>
        <div className="flex items-center gap-6">
          <Link href="/auth/login" className="text-sm" style={{ color: 'var(--color-muted)' }}>
            Creator login
          </Link>
          <Link
            href="/creator/signup"
            className="text-sm px-4 py-2 border"
            style={{ borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }}
          >
            Apply as creator
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center min-h-screen text-center px-6 pt-20">
        <p className="font-mono text-xs tracking-widest mb-8" style={{ color: 'var(--color-accent)' }}>
          CREATOR-LED TRAVEL
        </p>
        <h1
          className="font-display font-light mb-6 leading-none"
          style={{ fontSize: 'clamp(3rem, 8vw, 7rem)' }}
        >
          Travel with the people
          <br />
          <em>you already follow.</em>
        </h1>
        <p className="max-w-xl text-lg mb-10" style={{ color: 'var(--color-muted)' }}>
          Tripdrop is where travel creators sell exclusive small-group trips to their audiences. Real
          places, real people, curated itineraries.
        </p>
        <div className="flex items-center gap-4 flex-wrap justify-center">
          <Link
            href="/jamie/annapurna-oct-2026"
            className="px-8 py-4 text-sm tracking-wide font-medium"
            style={{ background: 'var(--color-accent)', color: '#080808' }}
          >
            View a live drop →
          </Link>
          <Link
            href="/creator/signup"
            className="px-8 py-4 text-sm tracking-wide border"
            style={{ borderColor: 'var(--color-border-bright)', color: 'var(--color-white)' }}
          >
            I&apos;m a creator
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="py-32 px-8 max-w-5xl mx-auto">
        <p
          className="font-mono text-xs tracking-widest mb-16 text-center"
          style={{ color: 'var(--color-dim)' }}
        >
          HOW IT WORKS
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px" style={{ background: 'var(--color-border)' }}>
          {[
            {
              n: '01',
              title: 'Creator builds a drop',
              body: 'Define the destination, dates, and itinerary. We handle the booking infrastructure.',
            },
            {
              n: '02',
              title: 'Followers apply',
              body: 'Your audience submits a short application. You handpick who joins.',
            },
            {
              n: '03',
              title: 'Everyone shows up',
              body: 'Stripe handles deposits. We handle the ops. You lead the trip.',
            },
          ].map(({ n, title, body }) => (
            <div key={n} className="p-10" style={{ background: 'var(--color-surface)' }}>
              <p className="font-mono text-xs mb-6" style={{ color: 'var(--color-accent)' }}>
                {n}
              </p>
              <h3 className="font-display text-2xl font-light mb-3">{title}</h3>
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer
        className="border-t py-10 px-8 flex items-center justify-between text-xs"
        style={{ borderColor: 'var(--color-border)', color: 'var(--color-dim)' }}
      >
        <span className="font-mono" style={{ color: 'var(--color-accent)' }}>
          TRIPDROP
        </span>
        <span>© 2026 Tripdrop. All rights reserved.</span>
      </footer>
    </main>
  );
}
