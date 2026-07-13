import React from 'react';
import { Star, Workflow as WorkflowIcon, Calendar, User, Shield } from 'lucide-react';
import { useLang } from '@contexts/LangContext';
import gridStyles from '@components/workspace/officialWeeklyScheduleGrid.module.css';
import { WORKFLOW_COLUMNS } from '@services/business/operationsBoardService.js';
import { getHRLegendAttendanceColumns, isHROnlyViewer, isInstructorOnlyViewer } from './hrAttendancePrivacy.js';
import { BOARD_PARTICIPATION_COLOR, SCHEDULE_WORKFLOW_COLORS } from '@constants/workspaceStatusColors.js';

/**
 * Shared attendance + workflow legend used by operations board footer and schedule grid.
 */
export default function BoardLegend({
  bare = false,
  showAttendance = true,
  showWorkflow = true,
  showScheduleExtras = false,
  scheduleExtrasFirst = false,
  showYourClassOnly = false,
  hideDivider = false,
  includeNotTaken = false,
  roleContext = {},
  className = '',
  style,
  'data-testid': dataTestId,
  'data-tour': dataTour,
}) {
  const { t } = useLang();
  const allAttendanceColumns = getHRLegendAttendanceColumns(roleContext);
  const hidePrivacyLegend = isHROnlyViewer(roleContext);
  const isInstructor = isInstructorOnlyViewer(roleContext);
  const instructorHiddenColumns = new Set(['ABSENT', 'EXCUSED', 'HUMAN_CASE']);
  const attendanceLegendColumns = isInstructor
    ? allAttendanceColumns.filter((col) => !instructorHiddenColumns.has(col.id))
    : allAttendanceColumns;
  const hideRejected = isHROnlyViewer(roleContext);
  const workflowLegendColumns = hideRejected
    ? WORKFLOW_COLUMNS.filter((col) => col.id !== 'REJECTED')
    : WORKFLOW_COLUMNS;

  const renderYourClassOnly = showYourClassOnly && (
    <div className={gridStyles.legendItem} data-testid="operations-board-legend-your-class">
      <span className={`${gridStyles.legendDot} ${gridStyles.legendDot_inProgress} ${gridStyles.legendDotPulse}`} />
      <span className={gridStyles.legendLabel} style={{ color: 'rgb(3, 105, 161)', fontSize: '0.7rem' }}>{t('workspace_lecture_in_progress')}</span>
    </div>
  );

  const renderScheduleExtras = showScheduleExtras && (
    <>
      {(showAttendance || showWorkflow) && !hideDivider && <div className={gridStyles.legendDivider} aria-hidden="true" />}
      <div className={gridStyles.legendItem}>
        <span className={gridStyles.legendLine} />
        <span className={gridStyles.legendLabel} style={{ color: '#0ea5e9', fontSize: '0.7rem' }}>{t('workspace_current_time')}</span>
      </div>
      <div className={gridStyles.legendItem}>
        <span className={`${gridStyles.legendDot} ${gridStyles.legendDot_inProgress}`} />
        <span className={gridStyles.legendLabel} style={{ color: 'rgb(3, 105, 161)', fontSize: '0.7rem' }}>{t('workspace_lecture_in_progress')}</span>
      </div>
      <div className={gridStyles.legendItem}>
        <span className={`${gridStyles.legendDot} ${gridStyles.legendDot_selected}`} />
        <span className={gridStyles.legendLabel} style={{ color: '#8b5cf6', fontSize: '0.7rem' }}>{t('workspace_selected_class')}</span>
      </div>
    </>
  );

  return (
    <div
      className={bare ? className : `${gridStyles.statusLegend} ${className}`.trim()}
      style={style}
      data-testid={dataTestId}
      data-tour={dataTour}
    >
      {scheduleExtrasFirst && renderScheduleExtras}
      {showYourClassOnly && renderYourClassOnly}
      {showAttendance && attendanceLegendColumns.map((col) => (
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
      {showAttendance && !hidePrivacyLegend && (
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
          {includeNotTaken && (
            <div className={gridStyles.legendItem} data-testid="operations-board-legend-wf-not-taken">
              <span
                className={`${gridStyles.legendDot} ${gridStyles.legendDotPulse}`}
                style={{ background: SCHEDULE_WORKFLOW_COLORS.not_taken, '--dot-color': SCHEDULE_WORKFLOW_COLORS.not_taken }}
              />
              <span className={gridStyles.legendLabel} style={{ color: SCHEDULE_WORKFLOW_COLORS.not_taken, fontSize: '0.7rem' }}>
                {t('workspace_status_not_taken')}
              </span>
            </div>
          )}
          {workflowLegendColumns.map((col) => (
            <div key={col.id} className={gridStyles.legendItem} data-testid={`operations-board-legend-wf-${col.id}`}>
              <WorkflowIcon size={12} style={{ color: col.color }} />
              <span className={gridStyles.legendLabel} style={{ color: col.color, fontSize: '0.7rem' }}>
                {t(col.i18nKey) || col.name}
              </span>
            </div>
          ))}
          <div className={gridStyles.legendDivider} aria-hidden="true" />
          <div className={gridStyles.legendItem} data-testid="operations-board-legend-wf-daily">
            <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Calendar size={12} style={{ color: '#3b82f6' }} />
              <User size={12} style={{ color: '#3b82f6' }} />
            </div>
            <span className={gridStyles.legendLabel} style={{ color: '#3b82f6', fontSize: '0.7rem' }}>
              {t('operations_board_daily_attendance') || 'Daily Attendance'}
            </span>
          </div>
          <div className={gridStyles.legendItem} data-testid="operations-board-legend-wf-weekly">
            <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Calendar size={12} style={{ color: '#8b5cf6' }} />
              <Shield size={12} style={{ color: '#8b5cf6' }} />
            </div>
            <span className={gridStyles.legendLabel} style={{ color: '#8b5cf6', fontSize: '0.7rem' }}>
              {t('operations_board_weekly_summary') || 'Weekly Summary'}
            </span>
          </div>
        </>
      )}
      {!scheduleExtrasFirst && renderScheduleExtras}
    </div>
  );
}
