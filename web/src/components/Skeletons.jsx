/**
 * Skeletons mirror the real layout — same tab, same row height — so the page
 * doesn't reflow when data lands. That settling is what reads as "slow".
 */
export function FolderGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="relative pt-[18px]">
          <span className="skeleton absolute start-0 top-0 h-[22px] w-[46%] max-w-[150px] rounded-t-[12px]" />
          <div className="min-h-[148px] rounded-2xl rounded-ss-none border border-hairline bg-surface p-5">
            <div className="skeleton h-5 w-2/3 rounded-md" />
            <div className="skeleton mt-3 h-3.5 w-full rounded" />
            <div className="skeleton mt-2 h-3.5 w-4/5 rounded" />
            <div className="skeleton mt-7 h-3 w-1/2 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function FileListSkeleton({ count = 5 }) {
  return (
    <ul className="overflow-hidden rounded-2xl border border-hairline bg-surface" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="flex items-center gap-3.5 border-b border-hairline/70 px-4 py-4 last:border-b-0">
          <div className="skeleton h-9 w-9 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1">
            <div className="skeleton h-4 rounded" style={{ width: `${45 + ((i * 13) % 40)}%` }} />
            <div className="skeleton mt-2 h-3 w-28 rounded" />
          </div>
          <div className="skeleton h-8 w-8 shrink-0 rounded-lg" />
        </li>
      ))}
    </ul>
  );
}

export function HeaderSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="skeleton h-10 w-64 rounded-lg" />
      <div className="skeleton mt-4 h-4 w-full max-w-md rounded" />
      <div className="skeleton mt-2.5 h-3.5 w-48 rounded" />
    </div>
  );
}
