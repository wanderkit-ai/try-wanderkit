'use client';

import { useEffect, useState } from 'react';
import { differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds } from 'date-fns';

interface CountdownTimerProps {
  targetDate: Date;
  label?: string;
}

export function CountdownTimer({ targetDate, label }: CountdownTimerProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const target = new Date(targetDate);
  const totalMinutes = differenceInMinutes(target, now);
  const totalHours = differenceInHours(target, now);
  const totalDays = differenceInDays(target, now);

  const isPast = totalMinutes <= 0;
  const isUrgent = totalHours < 24;

  let display: string;
  if (isPast) {
    display = 'Closed';
  } else if (totalMinutes < 60) {
    const secs = differenceInSeconds(target, now) % 60;
    display = `${totalMinutes}m ${secs}s`;
  } else if (totalHours < 48) {
    const mins = totalMinutes % 60;
    display = `${totalHours}h ${mins}m`;
  } else {
    display = `${totalDays} days`;
  }

  return (
    <div>
      {label && (
        <p className="font-mono text-xs tracking-widest mb-1" style={{ color: 'var(--color-dim)' }}>
          {label}
        </p>
      )}
      <p
        className="font-mono text-2xl font-bold"
        style={{ color: isPast ? 'var(--color-dim)' : isUrgent ? 'var(--color-danger)' : 'var(--color-white)' }}
      >
        {display}
      </p>
    </div>
  );
}
