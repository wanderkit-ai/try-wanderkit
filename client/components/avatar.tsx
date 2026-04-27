import { initials } from '@/lib/utils';

export function Avatar({
  name,
  color,
  size = 24,
}: {
  name: string;
  color: string;
  size?: number;
}) {
  return (
    <div
      className="rounded-full grid place-items-center text-white font-medium shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        fontSize: size <= 20 ? 9 : size <= 28 ? 10 : 12,
      }}
    >
      {initials(name)}
    </div>
  );
}
