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

export default function BoardTableView({ data, columns, onCardClick, t }) {
  const columnMap = Object.fromEntries(columns.map((c) => [c.id, c]));

  return (
    <div className="rounded-lg border border-border" data-testid="operations-board-table">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('operations_board_table_name') || 'Name'}</TableHead>
            <TableHead>{t('operations_board_status')}</TableHead>
            <TableHead>{t('operations_board_class')}</TableHead>
            <TableHead>{t('operations_board_card_assignee')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => {
            const col = columnMap[item.column];
            return (
              <TableRow
                key={item.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onCardClick(item)}
                data-testid={`operations-board-table-row-${item.id}`}
              >
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary" style={col ? { borderColor: col.color } : undefined}>
                    {col ? t(col.i18nKey) || col.name : item.column}
                  </Badge>
                </TableCell>
                <TableCell>{item.className || '—'}</TableCell>
                <TableCell>{item.assignee || '—'}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
