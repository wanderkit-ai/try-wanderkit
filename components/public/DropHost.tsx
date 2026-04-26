import Image from 'next/image';
import { formatNumber } from '@/lib/utils';

interface DropHostProps {
  creator: {
    name: string;
    handle: string;
    bio: string | null;
    photoUrl: string | null;
    followerCount: number | null;
    primaryPlatform: string | null;
  };
}

export function DropHost({ creator }: DropHostProps) {
  return (
    <section
      className="py-24 px-8"
      style={{ background: 'var(--color-bg)', borderTop: '1px solid var(--color-border)' }}
    >
      <div className="max-w-4xl mx-auto">
        <p className="font-mono text-xs tracking-widest mb-16" style={{ color: 'var(--color-accent)' }}>
          YOUR HOST
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="relative aspect-[3/4] overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
            {creator.photoUrl ? (
              <Image
                src={creator.photoUrl}
                alt={creator.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ background: 'var(--color-surface)' }}
              >
                <span className="font-display text-8xl font-light" style={{ color: 'var(--color-dim)' }}>
                  {creator.name[0]}
                </span>
              </div>
            )}
          </div>

          <div>
            <h2
              className="font-display font-light mb-2"
              style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', color: 'var(--color-white)' }}
            >
              {creator.name}
            </h2>
            <p className="font-mono text-sm mb-8" style={{ color: 'var(--color-accent)' }}>
              @{creator.handle}
            </p>

            {creator.bio && (
              <p className="text-base leading-relaxed mb-10" style={{ color: 'var(--color-muted)' }}>
                {creator.bio}
              </p>
            )}

            <div
              className="grid grid-cols-3 gap-px"
              style={{ background: 'var(--color-border)' }}
            >
              {[
                {
                  label: creator.primaryPlatform ?? 'Followers',
                  value: creator.followerCount ? formatNumber(creator.followerCount) : '—',
                },
                { label: 'Trips run', value: '—' },
                { label: 'Avg rating', value: '—' },
              ].map(({ label, value }) => (
                <div key={label} className="p-4" style={{ background: 'var(--color-surface)' }}>
                  <p
                    className="font-mono text-xs mb-1 truncate"
                    style={{ color: 'var(--color-dim)' }}
                  >
                    {label.toUpperCase()}
                  </p>
                  <p className="font-mono text-lg" style={{ color: 'var(--color-white)' }}>
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
