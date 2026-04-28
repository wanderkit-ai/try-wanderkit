export default function Loading() {
  return (
    <div className="flex-1 flex flex-col animate-pulse p-6 gap-4">
      {/* Page header skeleton */}
      <div className="h-8 w-48 rounded bg-hover" />
      <div className="h-4 w-72 rounded bg-hover" />

      {/* Content block skeletons */}
      <div className="mt-4 grid gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 rounded-lg bg-hover" />
        ))}
      </div>
    </div>
  );
}
