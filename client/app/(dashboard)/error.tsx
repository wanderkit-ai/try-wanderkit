'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="w-10 h-10 rounded-full bg-danger/10 grid place-items-center">
        <AlertTriangle className="w-5 h-5 text-danger" strokeWidth={1.75} />
      </div>
      <div>
        <h2 className="text-sm font-semibold text-ink">Something went wrong</h2>
        <p className="text-sm text-ink2 mt-1 max-w-xs">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
      </div>
      <button
        onClick={reset}
        className="h-8 px-4 rounded text-sm font-medium bg-ink text-white hover:bg-ink/90 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
