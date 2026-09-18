import React from 'react';
import { Card, CardContent } from '@/components/kibo/ui/card';
import { Badge } from '@/components/kibo/ui/badge';
import { cn } from '@/lib/utils';
import { User, Calendar } from 'lucide-react';
import { ATTENDANCE_COLUMNS } from '@services/business/operationsBoardService.js';
import { CARD_TYPE } from './operationsBoardConstants.js';

const STATUS_COLORS = {
  DRAFT: 'bg-gray-500/15 text-gray-700 dark:text-gray-300 border-gray-500/30',
  SUBMITTED: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
  UNDER_HR_REVIEW: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
  UNDER_ADMIN_REVIEW: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  APPROVED: 'bg-green-700/15 text-green-800 dark:text-green-300 border-green-700/30',
  REJECTED: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30',
  NOT_TAKEN: 'bg-gray-500/15 text-gray-700 dark:text-gray-300 border-gray-500/30',
  PRESENT: 'bg-green-500/15 text-green-700 dark:text-green-300 border-green-500/30',
  LATE: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  ABSENT: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30',
  EXCUSED: 'bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-500/30',
  HUMAN_CASE: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30',
};

export default function BoardCard({ item, onClick, t }) {
  const statusColor = STATUS_COLORS[item.column] || 'bg-muted text-muted-foreground border-border';
  const attendanceColumn = item.type === CARD_TYPE.ATTENDANCE ? ATTENDANCE_COLUMNS.find((c) => c.id === item.column) : null;
  const statusLabel = attendanceColumn ? (t(attendanceColumn.i18nKey) || attendanceColumn.name) : item.column;

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
            
            {item.type === CARD_TYPE.WORKFLOW && (
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
            
            {item.type === CARD_TYPE.ATTENDANCE && (
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
          
          <Badge
            variant="outline"
            className={cn('text-xs font-medium whitespace-nowrap', statusColor)}
          >
            {item.type === CARD_TYPE.ATTENDANCE && attendanceColumn && (
              <span
                className="inline-block h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: attendanceColumn.color }}
                aria-hidden
              />
            )}
            {statusLabel}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
