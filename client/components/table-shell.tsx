import { cn } from '@/lib/utils';

export function TableShell({
  children,
  rightActions,
}: {
  views?: string[];
  children: React.ReactNode;
  rightActions?: React.ReactNode;
}) {
  return (
    <div className="px-12">
      {rightActions && (
        <div className="flex items-center justify-end border-b border-border h-9">
          {rightActions}
        </div>
      )}
      {children}
    </div>
  );
}

export function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        'text-left text-2xs uppercase tracking-wide font-medium text-muted px-3 py-2 border-b border-border',
        className
      )}
    >
      {children}
    </th>
  );
}

export function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={cn('px-3 py-2 text-sm text-ink border-b border-border align-middle', className)}>
      {children}
    </td>
  );
}
