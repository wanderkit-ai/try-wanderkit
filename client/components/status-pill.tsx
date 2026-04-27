import { cn } from '@/lib/utils';

const PALETTES: Record<string, string> = {
  brief: 'bg-[#eef] text-[#446]',
  sourcing: 'bg-[#fdf3e0] text-[#7a5410]',
  quoting: 'bg-[#fff3d4] text-[#7a5410]',
  approved: 'bg-[#d6efe6] text-[#1f5742]',
  booked: 'bg-[#d3eada] text-[#1f5742]',
  completed: 'bg-[#e6e3df] text-[#3a352d]',
  cancelled: 'bg-[#f6dcdc] text-[#7a1f1f]',

  lead: 'bg-[#f0eef9] text-[#454075]',
  briefed: 'bg-[#fdf3e0] text-[#7a5410]',
  matched: 'bg-[#dceef0] text-[#1d4f56]',
  paid: 'bg-[#d3eada] text-[#1f5742]',
  travelling: 'bg-[#dcecff] text-[#1d3a6f]',
  returned: 'bg-[#e6e3df] text-[#3a352d]',

  requested: 'bg-[#fff3d4] text-[#7a5410]',
  received: 'bg-[#dceef0] text-[#1d4f56]',
  accepted: 'bg-[#d3eada] text-[#1f5742]',
  rejected: 'bg-[#f6dcdc] text-[#7a1f1f]',
  expired: 'bg-[#e6e3df] text-[#3a352d]',
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded text-2xs font-medium capitalize',
        PALETTES[status] ?? 'bg-hover text-ink2'
      )}
    >
      {status}
    </span>
  );
}
