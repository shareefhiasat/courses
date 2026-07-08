import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/kibo/ui/table';
import { Badge } from '@/components/kibo/ui/badge';
import BoardStudentAvatar from './BoardStudentAvatar.jsx';
import {
  formatBoardDate,
  resolveBoardClassName,
  resolveBoardStudentName,
} from './operationsBoardDisplayUtils.js';

export default function BoardTableView({ data, columns, onCardClick, t, lang = 'en' }) {
  const columnMap = Object.fromEntries(columns.map((c) => [c.id, c]));

  return (
    <div className="overflow-hidden rounded-lg border border-border" data-testid="operations-board-table">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12" />
            <TableHead>{t('operations_board_table_name')}</TableHead>
            <TableHead>{t('operations_board_status')}</TableHead>
            <TableHead>{t('operations_board_class')}</TableHead>
            <TableHead>{t('operations_board_card_date')}</TableHead>
            <TableHead>{t('operations_board_card_assignee')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                {t('operations_board_empty_table')}
              </TableCell>
            </TableRow>
          ) : (
            data.map((item) => {
              const col = columnMap[item.column];
              const studentName = resolveBoardStudentName(item, lang);
              const className = resolveBoardClassName(item, lang);
              return (
                <TableRow
                  key={item.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onCardClick(item)}
                  data-testid={`operations-board-table-row-${item.id}`}
                >
                  <TableCell>
                    <BoardStudentAvatar
                      name={studentName}
                      profileImageUrl={item.profileImageUrl}
                      size="sm"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{studentName}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      style={col ? { borderColor: col.color, color: col.color } : undefined}
                    >
                      {col ? t(col.i18nKey) || col.name : item.column}
                    </Badge>
                  </TableCell>
                  <TableCell>{className || '—'}</TableCell>
                  <TableCell>{item.date ? formatBoardDate(item.date, lang) : '—'}</TableCell>
                  <TableCell>{item.assignee || t('operations_board_card_no_assignee')}</TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
