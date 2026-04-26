import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tripdrop — Creator-led group trips',
  description: 'Exclusive small-group travel experiences curated by the creators you follow.',
  openGraph: {
    title: 'Tripdrop',
    description: 'Exclusive small-group travel experiences curated by the creators you follow.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
