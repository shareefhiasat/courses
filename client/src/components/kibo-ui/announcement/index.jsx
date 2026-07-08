import { Badge } from "@/components/kibo/ui/badge";
import { cn } from "@/lib/utils";

export const Announcement = ({
  variant = "outline",
  themed = false,
  className,
  ...props
}) => (
  <Badge
    className={cn(
      "group max-w-full gap-2 rounded-full bg-background px-3 py-0.5 font-medium shadow-sm transition-all",
      "hover:shadow-md",
      themed && "announcement-themed border-foreground/5",
      className
    )}
    variant={variant}
    {...props} />
);

export const AnnouncementTag = ({
  className,
  ...props
}) => (
  <div
    className={cn(
      "-ml-2.5 shrink-0 truncate rounded-full bg-foreground/5 px-2.5 py-1 text-xs",
      "group-[.announcement-themed]:bg-background/60",
      className
    )}
    {...props} />
);

export const AnnouncementTitle = ({
  className,
  ...props
}) => (
  <div
    className={cn("flex items-center gap-1 truncate py-1", className)}
    {...props} />
);
