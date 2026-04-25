/**
 * FileRosterSkeleton - Loading skeleton for file roster
 * Shows animated placeholder rows while files are loading
 */
export default function FileRosterSkeleton({ rows = 5 }) {
  return (
    <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
      {/* Header Skeleton */}
      <div className="p-4 border-b border-[#e5e7eb] bg-[#f9fafb]">
        <div className="h-4 w-32 bg-[#e5e7eb] rounded animate-pulse" />
      </div>

      {/* Row Skeletons */}
      {Array.from({ length: rows }).map((_, idx) => (
        <div
          key={idx}
          className="flex items-center gap-4 p-4 border-b border-[#e5e7eb] last:border-b-0"
        >
          {/* Checkbox */}
          <div className="w-4 h-4 bg-[#e5e7eb] rounded animate-pulse" />

          {/* Icon */}
          <div className="w-10 h-10 bg-[#e5e7eb] rounded-lg animate-pulse" />

          {/* Name & Details */}
          <div className="flex-1 space-y-2">
            <div className="h-4 w-48 bg-[#e5e7eb] rounded animate-pulse" />
            <div className="h-3 w-32 bg-[#e5e7eb] rounded animate-pulse" />
          </div>

          {/* Size */}
          <div className="h-3 w-16 bg-[#e5e7eb] rounded animate-pulse" />

          {/* Date */}
          <div className="h-3 w-24 bg-[#e5e7eb] rounded animate-pulse" />

          {/* Actions */}
          <div className="w-8 h-8 bg-[#e5e7eb] rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}
