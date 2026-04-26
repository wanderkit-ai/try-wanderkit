import Link from 'next/link';

export default function DropNotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-8 text-center"
      style={{ background: 'var(--color-bg)', color: 'var(--color-white)' }}
    >
      <p className="font-mono text-xs tracking-widest mb-8" style={{ color: 'var(--color-accent)' }}>
        404
      </p>
      <h1 className="font-display font-light mb-4" style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}>
        This drop doesn&apos;t exist.
      </h1>
      <p className="text-base mb-10" style={{ color: 'var(--color-muted)' }}>
        It may have sold out, been cancelled, or the URL might be wrong.
      </p>
      <Link
        href="/"
        className="px-8 py-4 text-sm font-mono tracking-wide border"
        style={{ borderColor: 'var(--color-border-bright)', color: 'var(--color-white)' }}
      >
        Back to Tripdrop
      </Link>
    </div>
  );
}
