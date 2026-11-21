export function LiveCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl bg-surface ring-1 ring-border" aria-hidden="true">
      <div className="skeleton aspect-video" />
      <div className="space-y-3 p-4">
        <div className="skeleton h-4 w-11/12 rounded" />
        <div className="skeleton h-4 w-2/3 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="skeleton mt-4 h-11 w-full rounded-lg" />
      </div>
    </div>
  );
}
