import React from 'react';
import { Star, Workflow as WorkflowIcon, FilePenLine, GitBranch, MessageSquare } from 'lucide-react';
import { useLang } from '@contexts/LangContext';
import gridStyles from '@components/workspace/officialWeeklyScheduleGrid.module.css';
import { WORKFLOW_COLUMNS, ATTENDANCE_BOARD_LANES } from '@services/business/operationsBoardService.js';
import { getHRLegendAttendanceColumns, isHROnlyViewer, isInstructorOnlyViewer, canViewParticipation } from './hrAttendancePrivacy.js';
import { BOARD_PARTICIPATION_COLOR, BOARD_COMMENT_COLOR, SCHEDULE_WORKFLOW_COLORS } from '@constants/workspaceStatusColors.js';

const { NOT_TAKEN, ABSENT, EXCUSED, HUMAN_CASE } = ATTENDANCE_BOARD_LANES;

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
  workflowLegendColumns = null,
  roleContext = {},
  showParticipation: showParticipationProp = null,
  className = '',
  style,
  fontScale = 100,
  'data-testid': dataTestId,
  'data-tour': dataTour,
}) {
  const { t } = useLang();
  const scale = (base) => Math.round(base * (fontScale / 100));
  const allAttendanceColumns = getHRLegendAttendanceColumns(roleContext);
  const hidePrivacyLegend = isHROnlyViewer(roleContext);
  const isInstructor = isInstructorOnlyViewer(roleContext);
  const showParticipation = showParticipationProp ?? canViewParticipation(roleContext);
  const instructorHiddenColumns = new Set([ABSENT, EXCUSED, HUMAN_CASE]);
  const attendanceLegendColumns = isInstructor
    ? allAttendanceColumns.filter((col) => !instructorHiddenColumns.has(col.id))
    : allAttendanceColumns;
  const hideRejected = isHROnlyViewer(roleContext);
  const baseWorkflowLegendColumns = workflowLegendColumns || WORKFLOW_COLUMNS;
  const workflowLegendColumnsResolved = hideRejected
    ? baseWorkflowLegendColumns.filter((col) => col.id !== 'REJECTED')
    : baseWorkflowLegendColumns;

  const renderYourClassOnly = showYourClassOnly && (
    <div className={gridStyles.legendItem} data-testid="operations-board-legend-your-class">
      <span className={`${gridStyles.legendDot} ${gridStyles.legendDot_inProgress} ${gridStyles.legendDotPulse}`} />
      <span className={gridStyles.legendLabel} style={{ color: 'rgb(3, 105, 161)' }}>{t('workspace_lecture_in_progress')}</span>
    </div>
  );

  const renderScheduleExtras = showScheduleExtras && (
    <>
      <div className={gridStyles.legendItem}>
        <span className={gridStyles.legendLine} />
        <span className={gridStyles.legendLabel} style={{ color: '#8b5cf6' }}>{t('workspace_current_time')}</span>
      </div>
      <div className={gridStyles.legendItem}>
        <span className={`${gridStyles.legendDot} ${gridStyles.legendDot_selected}`} />
        <span className={gridStyles.legendLabel} style={{ color: '#8b5cf6' }}>{t('workspace_selected_class')}</span>
      </div>
    </>
  );

  const LegendGroup = ({ children, label }) => {
    const hasChildren = React.Children.toArray(children).some((c) => c != null && c !== false);
    if (!hasChildren) return null;
    return (
      <div
        className={gridStyles.legendGroup}
        aria-label={label}
        title={label}
        role="group"
      >
        {children}
      </div>
    );
  };

  return (
    <div
      className={bare ? className : `${gridStyles.statusLegend} ${className}`.trim()}
      style={style}
      data-testid={dataTestId}
      data-tour={dataTour}
    >
      {scheduleExtrasFirst && (
        <LegendGroup label={t('schedule_extras') || 'Schedule extras'}>
          {renderScheduleExtras}
        </LegendGroup>
      )}
      {showYourClassOnly && renderYourClassOnly}
      {showAttendance && (
        <LegendGroup label={t('attendance') || 'Attendance'}>
          {attendanceLegendColumns.map((col) => (
            <div key={col.id} className={gridStyles.legendItem} data-testid={`operations-board-legend-att-${col.id}`}>
              <span
                className={`${gridStyles.legendDot} ${col.id === NOT_TAKEN ? gridStyles.legendDotPulse : ''}`}
                style={{ background: col.color, '--dot-color': col.color }}
              />
              <span className={gridStyles.legendLabel} style={{ color: col.color }}>
                {t(col.i18nKey) || col.name}
              </span>
            </div>
          ))}
        </LegendGroup>
      )}
      {showAttendance && !hidePrivacyLegend && (
        <LegendGroup label={t('notes_and_participation') || 'Notes & Participation'}>
          <div className={gridStyles.legendItem} style={{ gap: 4 }} data-testid="operations-board-legend-note-star">
            <Star size={scale(11)} fill="#ef4444" color="#ef4444" />
            <span className={gridStyles.legendLabel} style={{ color: '#ef4444' }}>
              {t('operations_board_legend_note')}
            </span>
          </div>
          {!isInstructor && (
            <div className={gridStyles.legendItem} style={{ gap: 4 }} data-testid="operations-board-legend-comment">
              <MessageSquare size={scale(11)} fill={BOARD_COMMENT_COLOR} color={BOARD_COMMENT_COLOR} />
              <span className={gridStyles.legendLabel} style={{ color: BOARD_COMMENT_COLOR }}>
                {t('comment') || 'Comment'}
              </span>
            </div>
          )}
          {showParticipation && (
            <div className={gridStyles.legendItem} style={{ gap: 4 }} data-testid="operations-board-legend-participation-star">
              <Star size={scale(11)} fill={BOARD_PARTICIPATION_COLOR} color={BOARD_PARTICIPATION_COLOR} />
              <span className={gridStyles.legendLabel} style={{ color: BOARD_PARTICIPATION_COLOR }}>
                {t('operations_board_legend_participation')}
              </span>
            </div>
          )}
        </LegendGroup>
      )}
      {showWorkflow && !isInstructor && (
        <>
          <LegendGroup label={t('workflow_documents') || 'Workflow documents'}>
            <div className={gridStyles.legendItem} data-testid="operations-board-legend-wf-daily">
              <FilePenLine size={scale(14)} style={{ color: '#3b82f6' }} />
              <span className={gridStyles.legendLabel} style={{ color: '#3b82f6' }}>
                {t('operations_board_daily_attendance') || 'Daily Attendance'}
              </span>
            </div>
            <div className={gridStyles.legendItem} data-testid="operations-board-legend-wf-weekly">
              <GitBranch size={scale(14)} style={{ color: '#8b5cf6' }} />
              <span className={gridStyles.legendLabel} style={{ color: '#8b5cf6' }}>
                {t('operations_board_weekly_summary') || 'Weekly Summary'}
              </span>
            </div>
          </LegendGroup>
          <LegendGroup label={t('workflow_statuses') || 'Workflow statuses'}>
            {includeNotTaken && (
              <div className={gridStyles.legendItem} data-testid="operations-board-legend-wf-not-taken">
                <span
                  className={`${gridStyles.legendDot} ${gridStyles.legendDotPulse}`}
                  style={{ background: SCHEDULE_WORKFLOW_COLORS.not_taken, '--dot-color': SCHEDULE_WORKFLOW_COLORS.not_taken }}
                />
                <span className={gridStyles.legendLabel} style={{ color: SCHEDULE_WORKFLOW_COLORS.not_taken }}>
                  {t('workspace_status_not_taken')}
                </span>
              </div>
            )}
            {workflowLegendColumnsResolved.map((col) => (
              <div key={col.id} className={gridStyles.legendItem} data-testid={`operations-board-legend-wf-${col.id}`}>
                <WorkflowIcon size={scale(14)} style={{ color: col.color }} />
                <span className={gridStyles.legendLabel} style={{ color: col.color }}>
                  {t(col.i18nKey) || col.name}
                </span>
              </div>
            ))}
          </LegendGroup>
        </>
      )}
      {!scheduleExtrasFirst && (
        <LegendGroup label={t('schedule_extras') || 'Schedule extras'}>
          {renderScheduleExtras}
        </LegendGroup>
      )}
    </div>
  );
}
