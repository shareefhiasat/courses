import React from 'react';
import { Card, CardContent } from '@/components/kibo/ui/card';
import { Badge } from '@/components/kibo/ui/badge';
import { Status, StatusIndicator, StatusLabel } from '@/components/kibo-ui/status';
import { cn } from '@/lib/utils';
import { User, Calendar } from 'lucide-react';

const STATUS_COLORS = {
  DRAFT: 'bg-gray-500/15 text-gray-700 dark:text-gray-300 border-gray-500/30',
  SUBMITTED: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
  UNDER_HR_REVIEW: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  UNDER_ADMIN_REVIEW: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  APPROVED: 'bg-green-500/15 text-green-700 dark:text-green-300 border-green-500/30',
  REJECTED: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30',
  NOT_TAKEN: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30',
  PRESENT: 'bg-green-500/15 text-green-700 dark:text-green-300 border-green-500/30',
  LATE: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  ABSENT: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30',
  EXCUSED: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30',
  HUMAN_CASE: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30',
};

const ATTENDANCE_STATUS_CLASS = {
  PRESENT: 'online',
  LATE: 'degraded',
  ABSENT: 'offline',
  EXCUSED: 'maintenance',
  HUMAN_CASE: 'degraded',
  NOT_TAKEN: 'pending',
};

export default function BoardCard({ item, onClick, t }) {
  const statusColor = STATUS_COLORS[item.column] || 'bg-muted text-muted-foreground border-border';

  return (
    <Card
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(item);
      }}
      className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate mb-2">
              {item.name}
            </h3>
            
            {item.type === 'workflow' && (
              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                {item.assignee && (
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3" />
                    <span className="truncate">{item.assignee}</span>
                  </div>
                )}
                {item.workflowType && (
                  <span className="truncate">{item.workflowType}</span>
                )}
              </div>
            )}
            
            {item.type === 'attendance' && (
              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                {item.className && (
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3" />
                    <span className="truncate">{item.className}</span>
                  </div>
                )}
                {item.date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(item.date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {item.type === 'attendance' ? (
            <Status status={ATTENDANCE_STATUS_CLASS[item.column] || 'offline'} className="w-fit shrink-0">
              <StatusIndicator />
              <StatusLabel>{item.column}</StatusLabel>
            </Status>
          ) : (
            <Badge 
              variant="outline" 
              className={cn('text-xs font-medium whitespace-nowrap', statusColor)}
            >
              {item.column}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
