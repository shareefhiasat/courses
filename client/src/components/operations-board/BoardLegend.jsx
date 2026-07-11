import React from 'react';
import { Star, Workflow as WorkflowIcon } from 'lucide-react';
import { useLang } from '@contexts/LangContext';
import gridStyles from '@components/workspace/officialWeeklyScheduleGrid.module.css';
import { ATTENDANCE_COLUMNS, WORKFLOW_COLUMNS } from '@services/business/operationsBoardService.js';
import { BOARD_PARTICIPATION_COLOR } from '@constants/workspaceStatusColors.js';

/**
 * Shared attendance + workflow legend used by operations board footer and schedule grid.
 */
export default function BoardLegend({
  bare = false,
  showAttendance = true,
  showWorkflow = true,
  showScheduleExtras = false,
  className = '',
  style,
  'data-testid': dataTestId,
  'data-tour': dataTour,
}) {
  const { t } = useLang();

  return (
    <div
      className={bare ? className : `${gridStyles.statusLegend} ${className}`.trim()}
      style={style}
      data-testid={dataTestId}
      data-tour={dataTour}
    >
      {showAttendance && ATTENDANCE_COLUMNS.map((col) => (
        <div key={col.id} className={gridStyles.legendItem} data-testid={`operations-board-legend-att-${col.id}`}>
          <span
            className={`${gridStyles.legendDot} ${col.id === 'NOT_TAKEN' ? gridStyles.legendDotPulse : ''}`}
            style={{ background: col.color, '--dot-color': col.color }}
          />
          <span className={gridStyles.legendLabel} style={{ color: col.color, fontSize: '0.7rem' }}>
            {t(col.i18nKey) || col.name}
          </span>
        </div>
      ))}
      {showAttendance && (
        <>
      <div className={gridStyles.legendItem} style={{ gap: 4 }} data-testid="operations-board-legend-note-star">
        <Star size={9} fill="#ef4444" color="#ef4444" />
        <span className={gridStyles.legendLabel} style={{ color: '#ef4444', fontSize: '0.7rem' }}>
          {t('operations_board_legend_note')}
        </span>
      </div>
      <div className={gridStyles.legendItem} style={{ gap: 4 }} data-testid="operations-board-legend-participation-star">
        <Star size={9} fill={BOARD_PARTICIPATION_COLOR} color={BOARD_PARTICIPATION_COLOR} />
        <span className={gridStyles.legendLabel} style={{ color: BOARD_PARTICIPATION_COLOR, fontSize: '0.7rem' }}>
          {t('operations_board_legend_participation')}
        </span>
      </div>
        </>
      )}
      {showWorkflow && (
        <>
          {showAttendance && <div className={gridStyles.legendDivider} aria-hidden="true" />}
          {WORKFLOW_COLUMNS.map((col) => (
            <div key={col.id} className={gridStyles.legendItem} data-testid={`operations-board-legend-wf-${col.id}`}>
              <WorkflowIcon size={12} style={{ color: col.color }} />
              <span className={gridStyles.legendLabel} style={{ color: col.color, fontSize: '0.7rem' }}>
                {t(col.i18nKey) || col.name}
              </span>
            </div>
          ))}
        </>
      )}
      {showScheduleExtras && (
        <>
          {(showAttendance || showWorkflow) && <div className={gridStyles.legendDivider} aria-hidden="true" />}
          <div className={gridStyles.legendItem}>
            <span className={gridStyles.legendLine} />
            <span className={gridStyles.legendLabel} style={{ color: '#0ea5e9' }}>{t('workspace_current_time')}</span>
          </div>
          <div className={gridStyles.legendItem}>
            <span className={`${gridStyles.legendDot} ${gridStyles.legendDot_inProgress}`} />
            <span className={gridStyles.legendLabel} style={{ color: '#1d4ed8' }}>{t('workspace_lecture_in_progress')}</span>
          </div>
          <div className={gridStyles.legendItem}>
            <span className={`${gridStyles.legendDot} ${gridStyles.legendDot_selected}`} />
            <span className={gridStyles.legendLabel} style={{ color: '#8b5cf6' }}>{t('workspace_selected_class')}</span>
          </div>
        </>
      )}
    </div>
  );
}
