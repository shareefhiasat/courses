import { Badge } from "@/components/kibo/ui/badge";
import { cn } from "@/lib/utils";

export const Status = ({
  className,
  status,
  ...props
}) => (
  <Badge
    className={cn("flex items-center gap-2", "group", status, className)}
    variant="secondary"
    {...props} />
);

export const StatusIndicator = ({
  className,
  ...props
}) => (
  <span className="relative flex h-2 w-2" {...props}>
    <span
      className={cn(
        "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
        "group-[.offline]:bg-red-500",
        "group-[.pending]:bg-orange-500",
        "group-[.human-case]:bg-violet-500",
        "group-[.excused]:bg-pink-500",
      )} />
    <span
      className={cn(
        "relative inline-flex h-2 w-2 rounded-full",
        "group-[.online]:bg-emerald-500",
        "group-[.offline]:bg-red-500",
        "group-[.maintenance]:bg-blue-500",
        "group-[.degraded]:bg-amber-500",
        "group-[.pending]:bg-orange-500",
        "group-[.human-case]:bg-violet-500",
        "group-[.excused]:bg-pink-500"
      )} />
  </span>
);

export const StatusLabel = ({
  className,
  children,
  ...props
}) => (
  <span
    className={cn(
      "text-muted-foreground",
      "group-[.pending]:text-orange-600 dark:group-[.pending]:text-orange-400",
      "group-[.human-case]:text-violet-600 dark:group-[.human-case]:text-violet-400",
      "group-[.excused]:text-pink-600 dark:group-[.excused]:text-pink-400",
      className
    )}
    {...props}
  >
    {children ?? (
      <>
        <span className="hidden group-[.online]:block">Online</span>
        <span className="hidden group-[.offline]:block">Offline</span>
        <span className="hidden group-[.maintenance]:block">Maintenance</span>
        <span className="hidden group-[.degraded]:block">Degraded</span>
        <span className="hidden group-[.pending]:block">Pending</span>
      </>
    )}
  </span>
);
