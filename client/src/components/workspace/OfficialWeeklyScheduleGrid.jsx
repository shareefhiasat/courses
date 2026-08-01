import React, { useState, useEffect, useRef, useLayoutEffect, useMemo } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { Chip, IconButton, Box } from '@mui/material';
import {
  Maximize2,
  Minimize2,
  Workflow as WorkflowIcon,
  ClipboardCheck,
  FileText,
  FileSpreadsheet,
} from 'lucide-react';
import ColoredTooltip from '@components/ui/mui/ColoredTooltip';
import ScheduleStatusHistoryTooltip from './ScheduleStatusHistoryTooltip.jsx';
import ClassSessionMetaBadges, { getClassSessionMetaFromStatus } from './ClassSessionMetaBadges.jsx';
import { getUserRoleColor, getUserRoleIcon } from '@constants/iconTypes';
import styles from '@services/export/official-reports/templates/officialReport.module.css';
import {
  SCHEDULE_FONT_SCALE_DEFAULT,
} from '@constants/scheduleFontScale';
import gridStyles from './officialWeeklyScheduleGrid.module.css';
import {
  SCHEDULE_WORKFLOW_COLORS,
  SCHEDULE_WORKFLOW_STATUS,
  WORKFLOW_STATUS_COLORS,
  resolveScheduleWorkflowKey,
} from '@constants/workspaceStatusColors';
import BoardLegend from '@components/operations-board/BoardLegend.jsx';
import {
  getAttendanceCountsFromStatus,
  ATTENDANCE_COUNT_ITEMS,
} from '@components/operations-board/boardClassCalendarUtils.js';

const DAY_CODES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function isSameCalendarWeek(a, b) {
  const startA = new Date(a);
  startA.setDate(startA.getDate() - startA.getDay());
  startA.setHours(0, 0, 0, 0);
  const startB = new Date(b);
  startB.setDate(startB.getDate() - startB.getDay());
  startB.setHours(0, 0, 0, 0);
  return startA.getTime() === startB.getTime();
}

function computeCellIsoDate(selectedDate, dayCode) {
  const dayOffset = DAY_CODES.indexOf(dayCode);
  if (dayOffset < 0 || !selectedDate) return null;
  const anchor = selectedDate instanceof Date ? new Date(selectedDate) : new Date(selectedDate);
  const weekStart = new Date(anchor);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const cellDate = new Date(weekStart);
  cellDate.setDate(cellDate.getDate() + dayOffset);
  const y = cellDate.getFullYear();
  const m = String(cellDate.getMonth() + 1).padStart(2, '0');
  const d = String(cellDate.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function resolveCellStatus(statusMap, selectedDate, dayCode, classId) {
  if (!classId) return null;
  const iso = computeCellIsoDate(selectedDate, dayCode);
  if (iso && statusMap[`${iso}:${classId}`]) return statusMap[`${iso}:${classId}`];
  return statusMap[classId] ?? null;
}

const DEFAULT_DAY_START = 7 * 60; // 07:00
const DEFAULT_DAY_END = 17 * 60 + 30; // 17:30
const DAY_COL_PCT = 3;
const LABEL_COL_PCT = 7;
const DATA_COL_BUDGET = 100 - DAY_COL_PCT - LABEL_COL_PCT;
const BREAK_COL_PCT = 4.5;
const OFFICE_COL_PCT = 7;
const PURPLE_TOOLTIP = '#8b5cf6';

function isOfficeHourColumn(col) {
  return col.key === 'officeHour' || col.isOfficeHour;
}

function resolveDataColumnWidth(col, columns, options = {}) {
  const { breakPct = BREAK_COL_PCT, officePct = OFFICE_COL_PCT } = options;
  const breakCount = columns.filter((c) => c.isBreak).length;
  const hasOffice = columns.some((c) => isOfficeHourColumn(c));
  const lectureCount = columns.length - breakCount - (hasOffice ? 1 : 0);
  const fixedUsed = (breakCount * breakPct) + (hasOffice ? officePct : 0);
  const lectureWidth = lectureCount > 0 ? (DATA_COL_BUDGET - fixedUsed) / lectureCount : 0;

  if (col.isBreak) return breakPct;
  if (isOfficeHourColumn(col)) return officePct;
  return lectureWidth;
}

function measureNarrowColumnWidths(columns, days) {
  const breakKeys = columns.filter((c) => c.isBreak).map((c) => c.key);
  let maxBreakLen = 0;
  (days || []).forEach((day) => {
    breakKeys.forEach((key) => {
      const time = day.slots?.[key]?.time || '';
      maxBreakLen = Math.max(maxBreakLen, String(time).replace(/\s/g, '').length);
    });
  });
  const breakPct = Math.min(6.5, Math.max(4, 3.2 + maxBreakLen * 0.2));

  const officeCol = columns.find((c) => isOfficeHourColumn(c));
  const officeLabelLen = officeCol?.label ? String(officeCol.label).length : 0;
  const officePct = officeCol
    ? Math.min(9, Math.max(6.5, 5.5 + officeLabelLen * 0.12))
    : OFFICE_COL_PCT;

  return { breakPct, officePct };
}

function parseTimeToMinutes(value) {
  if (!value) return null;
  const match = String(value).match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
}

function resolveProgramHours(scheduleData) {
  const times = [];

  (scheduleData?.days || []).forEach((day) => {
    Object.values(day.slots || {}).forEach((slot) => {
      if (!slot?.time) return;
      const parts = String(slot.time).split(/[–\-]/).map((p) => p.trim());
      parts.forEach((p) => {
        const m = parseTimeToMinutes(p);
        if (m != null) times.push(m);
      });
    });
  });

  if (times.length) {
    return { start: Math.min(...times), end: Math.max(...times) };
  }
  return { start: DEFAULT_DAY_START, end: DEFAULT_DAY_END };
}

function ScheduleTimeLineOverlay({
  tableRef,
  todayCode,
  dayStartMin,
  dayEndMin,
  visible,
  columns,
  days,
  t,
  lang = 'en',
  onOutsideHoursChange,
}) {
  const [lineTop, setLineTop] = useState(null);
  const [rowLeft, setRowLeft] = useState(null);
  const [rowWidth, setRowWidth] = useState(null);
  const [dotOffset, setDotOffset] = useState(0);
  const [now, setNow] = useState(() => new Date());
  const [isOutsideHours, setIsOutsideHours] = useState(false);

  useEffect(() => {
    if (!visible) return undefined;
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, [visible]);

  useLayoutEffect(() => {
    if (!visible || !tableRef.current || !todayCode) {
      setLineTop(null);
      setRowLeft(null);
      setRowWidth(null);
      return undefined;
    }

    const measure = () => {
      const wrap = tableRef.current?.closest(`.${gridStyles.tableWithTimeline}`);
      const tbody = tableRef.current?.querySelector(`tbody[data-day="${todayCode}"]`);
      if (!wrap || !tbody) {
        setLineTop(null);
        setRowLeft(null);
        setRowWidth(null);
        return;
      }

      const nowMin = now.getHours() * 60 + now.getMinutes();
      // Show the line from 60 min before schedule start to 60 min after end
      if (nowMin < dayStartMin - 60 || nowMin > dayEndMin + 60) {
        setLineTop(null);
        setRowLeft(null);
        setRowWidth(null);
        setIsOutsideHours(true);
        return;
      }
      setIsOutsideHours(false);

      // Find the current day's data
      const currentDay = days?.find(d => d.dayCode === todayCode);
      if (!currentDay) {
        setLineTop(null);
        setRowLeft(null);
        setRowWidth(null);
        return;
      }

      const rawPct = (nowMin - dayStartMin) / (dayEndMin - dayStartMin);
      const timePct = Math.max(0, Math.min(1, rawPct));

      // Find which column the current time falls into based on slot time ranges,
      // and how far through that slot we are (for horizontal positioning within the cell)
      let targetColumnIndex = -1;
      let withinSlotPct = 0;
      let isInSlot = false;
      for (let i = 0; i < columns.length; i++) {
        const col = columns[i];
        const slot = currentDay.slots?.[col.key];
        if (slot && slot.time) {
          // Parse time range (e.g., "07:30–09:00")
          const timeMatch = slot.time.match(/(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/);
          if (timeMatch) {
            const startMin = parseInt(timeMatch[1], 10) * 60 + parseInt(timeMatch[2], 10);
            const endMin = parseInt(timeMatch[3], 10) * 60 + parseInt(timeMatch[4], 10);
            if (nowMin >= startMin && nowMin < endMin) {
              targetColumnIndex = i;
              withinSlotPct = (nowMin - startMin) / (endMin - startMin);
              isInSlot = true;
              break;
            }
          }
        }
      }

      const clampedColumnIndex = Math.max(0, Math.min(targetColumnIndex, columns.length - 1));
      const clampedWithinSlotPct = Math.max(0, Math.min(withinSlotPct, 1));
      
      const wrapRect = wrap.getBoundingClientRect();
      const tbodyRect = tbody.getBoundingClientRect();
      
      // Get the first row of the tbody to measure the full row's data-cell span and the target column
      const firstRow = tbody.querySelector('tr');
      // Position vertically at center of first row (Subject row)
      const top = firstRow
        ? (firstRow.getBoundingClientRect().top - wrapRect.top + firstRow.getBoundingClientRect().height / 2)
        : (tbodyRect.top - wrapRect.top + tbodyRect.height / 2);
      if (firstRow) {
        const cells = firstRow.querySelectorAll('td');
        // Skip day label cell (first) and row label cell (second)
        const dataCells = Array.from(cells).slice(2);
        if (dataCells.length) {
          const firstCellRect = dataCells[0].getBoundingClientRect();
          const lastCellRect = dataCells[dataCells.length - 1].getBoundingClientRect();
          const isRtl = firstCellRect.left > lastCellRect.left;
          const rowLeftPx = Math.min(firstCellRect.left, lastCellRect.left) - wrapRect.left;
          const rowWidthPx = Math.max(firstCellRect.right, lastCellRect.right) - Math.min(firstCellRect.left, lastCellRect.left);
          setRowLeft(rowLeftPx);
          setRowWidth(rowWidthPx);

          if (isInSlot && dataCells[clampedColumnIndex]) {
            const cellRect = dataCells[clampedColumnIndex].getBoundingClientRect();
            const cellLeft = cellRect.left - wrapRect.left;
            const cellRight = cellRect.right - wrapRect.left;
            const offsetWithinRow = isRtl
              ? (cellRight - rowLeftPx) - cellRect.width * clampedWithinSlotPct
              : (cellLeft - rowLeftPx) + cellRect.width * clampedWithinSlotPct;
            setDotOffset(offsetWithinRow);
          } else {
            // When not in a slot, use linear time-to-pixel mapping across the row.
            // In RTL the visual flow is right-to-left, so invert the percentage.
            const rawOffset = isRtl ? rowWidthPx * (1 - timePct) : rowWidthPx * timePct;
            setDotOffset(rawOffset);
          }
        }
      }
      
      setLineTop(top);
    };

    measure();
    // Re-measure after the browser has painted, so the table DOM is
    // fully laid out when returning to the current week after navigation.
    const raf = requestAnimationFrame(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(tableRef.current);
    window.addEventListener('resize', measure);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [visible, todayCode, dayStartMin, dayEndMin, now, tableRef, columns, days]);

  useEffect(() => {
    onOutsideHoursChange?.(visible && isOutsideHours);
  }, [visible, isOutsideHours, onOutsideHoursChange]);

  if (!visible) return null;

  if (isOutsideHours) return null;

  if (lineTop == null || rowLeft == null || rowWidth == null) return null;

  const label = (() => {
    const h24 = now.getHours();
    const m = now.getMinutes();
    const h12 = (h24 + 11) % 12 + 1;
    const ampm = lang === 'ar' ? (h24 >= 12 ? 'م' : 'ص') : (h24 >= 12 ? 'PM' : 'AM');
    return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
  })();

  return (
    <div 
      className={gridStyles.timeLineOverlay} 
      style={{ 
        top: `${lineTop}px`,
        left: `${rowLeft}px`,
        width: `${rowWidth}px`,
        right: 'auto'
      }} 
      aria-hidden
    >
      <div className={gridStyles.timeLineDash} />
      <ColoredTooltip title={label} color={PURPLE_TOOLTIP} placement="top">
        <span className={gridStyles.timeLineDot} style={{ left: `${dotOffset}px` }} />
      </ColoredTooltip>
    </div>
  );
}

const WORKFLOW_STATUS_LABELS = {
  DRAFT: 'workflow.status.draft',
  TAKEN: 'workspace_status_taken',
  SUBMITTED: 'workspace_status_submitted',
  UNDER_ADMIN_REVIEW: 'workflow.status.under_admin_review',
  UNDER_HR_REVIEW: 'workflow.status.under_hr_review',
  APPROVED: 'workflow.status.approved',
  REJECTED: 'workflow.status.rejected',
  AMENDED: 'workflow.status.amended',
};

function getWorkflowStatusLabel(status, t) {
  const ws = status?.workflowStatus;
  if (!ws) return null;
  const key = WORKFLOW_STATUS_LABELS[ws];
  if (!key) return null;
  return t(key) || ws;
}

function WorkflowStatusGroup({ status, t, lang, selectedDate, hideTooltips = false, onWorkflowClick }) {
  const ws = status?.workflowStatus;
  if (!ws || ws === 'NOT_TAKEN') return null;
  const color = WORKFLOW_STATUS_COLORS[ws];
  if (!color) return null;
  const label = getWorkflowStatusLabel(status, t);
  if (!label) return null;

  const handleClick = onWorkflowClick
    ? (e) => { e.stopPropagation(); onWorkflowClick(status); }
    : undefined;

  return (
    <span className={gridStyles.workflowGroup}>
      {!hideTooltips && (
        <ScheduleStatusHistoryTooltip status={status} lang={lang} fallbackDate={selectedDate} t={t} currentColor={color}>
          <span className={gridStyles.workflowIconWrap} style={{ '--workflow-color': color, ...(onWorkflowClick ? { cursor: 'pointer' } : {}) }} onClick={handleClick} role={onWorkflowClick ? 'button' : undefined}>
            <WorkflowIcon className={gridStyles.workflowIconSvg} color={color} strokeWidth={2.5} />
          </span>
        </ScheduleStatusHistoryTooltip>
      )}
      {hideTooltips && (
        <span className={gridStyles.workflowIconWrap} style={{ '--workflow-color': color, ...(onWorkflowClick ? { cursor: 'pointer' } : {}) }} onClick={handleClick} role={onWorkflowClick ? 'button' : undefined}>
          <WorkflowIcon className={gridStyles.workflowIconSvg} color={color} strokeWidth={2.5} />
        </span>
      )}
    </span>
  );
}

function AttendanceIndicatorGroup({ status, t, slot, onGenerateDailyAttendance, hideTooltips = false }) {
  const counts = getAttendanceCountsFromStatus(status);
  if (!counts) return null;
  const items = ATTENDANCE_COUNT_ITEMS
    .map((item) => ({ ...item, count: counts[item.key] || 0 }))
    .filter((item) => item.count > 0);
  if (items.length === 0) return null;

  const tooltip = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, padding: '2px 0' }}>
      {items.map((item) => (
        <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
          <span>{item.count} {t(item.labelKey) || item.fallback}</span>
        </div>
      ))}
    </div>
  );

  const hasExportHandler = Boolean(onGenerateDailyAttendance && slot?.classId);

  const exportTooltip = hasExportHandler ? (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, padding: '4px 0' }}>
      <div style={{ fontWeight: 600, marginBottom: 2 }}>{t('daily_official') || 'Daily Official'}</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span
          style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', color: '#e53935' }}
          onClick={(e) => { e.stopPropagation(); onGenerateDailyAttendance(slot, 'pdf'); }}
        >
          <FileText size={14} /> {t('export_pdf') || 'PDF'}
        </span>
        <span
          style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', color: '#43a047' }}
          onClick={(e) => { e.stopPropagation(); onGenerateDailyAttendance(slot, 'excel'); }}
        >
          <FileSpreadsheet size={14} /> {t('export_excel') || 'Excel'}
        </span>
      </div>
    </div>
  ) : (t('attendance_summary') || 'Attendance summary');

  if (hideTooltips) {
    return (
      <span className={gridStyles.attendanceGroup}>
        <span
          className={gridStyles.attendanceIconWrap}
          aria-hidden={!hasExportHandler}
          role={hasExportHandler ? 'button' : undefined}
          onClick={hasExportHandler ? (e) => { e.stopPropagation(); onGenerateDailyAttendance(slot, 'pdf'); } : undefined}
          style={hasExportHandler ? { cursor: 'pointer' } : undefined}
        >
          <ClipboardCheck size={12} color={hasExportHandler ? '#3b82f6' : '#64748b'} strokeWidth={2.25} />
        </span>
        <span className={gridStyles.indicatorDivider} aria-hidden="true">|</span>
        <span className={gridStyles.attendanceMiniDots} aria-label={t('attendance_summary') || 'Attendance summary'}>
          {items.map((item, idx) => (
            <span
              key={item.key}
              className={gridStyles.attendanceMiniDot}
              style={{
                backgroundColor: item.color,
                zIndex: items.length - idx,
              }}
            />
          ))}
        </span>
      </span>
    );
  }

  return (
    <span className={gridStyles.attendanceGroup}>
      <ColoredTooltip title={exportTooltip} color="#64748b" placement="bottom" cursor={hasExportHandler ? 'pointer' : 'default'}>
        <span
          className={gridStyles.attendanceIconWrap}
          aria-hidden={!hasExportHandler}
          role={hasExportHandler ? 'button' : undefined}
          onClick={hasExportHandler ? (e) => { e.stopPropagation(); onGenerateDailyAttendance(slot, 'pdf'); } : undefined}
          style={hasExportHandler ? { cursor: 'pointer' } : undefined}
        >
          <ClipboardCheck size={12} color={hasExportHandler ? '#3b82f6' : '#64748b'} strokeWidth={2.25} />
        </span>
      </ColoredTooltip>
      <span className={gridStyles.indicatorDivider} aria-hidden="true">|</span>
      <ColoredTooltip title={tooltip} color="#64748b" placement="bottom" cursor="default">
        <span className={gridStyles.attendanceMiniDots} aria-label={t('attendance_summary') || 'Attendance summary'}>
          {items.map((item, idx) => (
            <span
              key={item.key}
              className={gridStyles.attendanceMiniDot}
              style={{
                backgroundColor: item.color,
                zIndex: items.length - idx,
              }}
            />
          ))}
        </span>
      </ColoredTooltip>
    </span>
  );
}

function StatusDot({ status, t, lang, selectedDate, hideTooltips = false }) {
  if (!status) return null;
  const key = resolveScheduleWorkflowKey(status);
  const colors = SCHEDULE_WORKFLOW_COLORS;
  const labels = {
    not_taken: t('workspace_status_not_taken'),
    draft: t('workspace_status_draft') || 'Draft',
    taken: t('workspace_status_taken'),
    submitted: t('workspace_status_submitted'),
  };
  const dotColor = colors[key];

  if (hideTooltips) {
    return (
      <span className={gridStyles.statusDotWrap}>
        <span
          className={`${gridStyles.statusDot} ${gridStyles[`statusDot_${key}`]}`}
          style={{ '--dot-color': dotColor }}
          aria-label={labels[key]}
        />
      </span>
    );
  }

  return (
    <ScheduleStatusHistoryTooltip status={status} lang={lang} fallbackDate={selectedDate} t={t} currentColor={dotColor}>
      <span className={gridStyles.statusDotWrap}>
        <span
          className={`${gridStyles.statusDot} ${gridStyles[`statusDot_${key}`]}`}
          style={{ '--dot-color': dotColor }}
          aria-label={labels[key]}
        />
      </span>
    </ScheduleStatusHistoryTooltip>
  );
}

function CellContent({ children, className, ltr }) {
  return (
    <div
      className={`${styles.scheduleCellInner} ${ltr ? styles.scheduleLtrDigits : ''} ${className || ''}`}
      {...(ltr ? { dir: 'ltr' } : {})}
    >
      {children}
    </div>
  );
}

function VerticalText({ children, compact, fontSize, minHeight, className }) {
  let content = children;
  const text = typeof children === 'string' ? children.trim() : '';
  const shouldSplitWords = compact && text.includes(' ') && !/\d{1,2}:\d{2}/.test(text);

  if (shouldSplitWords) {
    const words = text.split(/\s+/);
    content = words.map((word, i) => (
      <React.Fragment key={i}>
        {i > 0 && <br />}
        {word}
      </React.Fragment>
    ));
  }

  const wrapStyle = minHeight !== undefined ? { minHeight } : undefined;
  const textStyle = fontSize !== undefined ? { fontSize } : undefined;
  const textClass = `${styles.scheduleVerticalText}${compact ? ` ${styles.scheduleBreakVertical}` : ''}${className ? ` ${className}` : ''}`;

  return (
    <div className={compact ? styles.scheduleBreakVerticalWrap : styles.scheduleVerticalTextWrap} style={wrapStyle}>
      <span className={textClass} style={textStyle}>
        {content}
      </span>
    </div>
  );
}

function resolveSlotSession(slot) {
  if (slot?.session) return slot.session;
  if (!slot?.classId && !slot?.class) return null;
  return {
    id: slot.sessionId,
    classId: slot.classId,
    class: slot.class,
    sessionType: slot.sessionType || 'lecture',
  };
}

function InteractiveSlotCell({
  slot,
  day,
  dayCode,
  colKey,
  rowType,
  isBreak,
  isMine,
  isClickable,
  isDimmed,
  isInProgress,
  isSelected,
  status,
  t,
  lang,
  onClick,
  selectedDate,
  hideNotesParticipation = false,
  hideNotesComments = false,
  hideTooltips = false,
  onGenerateDailyAttendance,
  onWorkflowClick,
  rowSpan = 4,
}) {
  if (isBreak) {
    if (rowType !== 'subject') return null;
    const dayHasClasses = day && Object.values(day.slots || {}).some(s => s && s.classId && !s.isBreak);
    const breakFontSize = rowSpan <= 2 ? '7px' : rowSpan === 3 ? '9px' : undefined;
    return (
      <td className={styles.scheduleBreakCell} rowSpan={rowSpan}>
        <CellContent ltr className={gridStyles.breakCellInner}>
          <VerticalText compact fontSize={breakFontSize} minHeight={0}>
            {dayHasClasses ? (slot?.time || '—') : '—'}
          </VerticalText>
        </CellContent>
      </td>
    );
  }

  if (!slot || slot.isBreak) {
    return (
      <td className={styles.scheduleDataCell}>
        <CellContent>{rowType === 'instructor' ? '' : '—'}</CellContent>
      </td>
    );
  }

  let value = '';
  if (rowType === 'subject') value = slot.subjectName || '—';
  else if (rowType === 'time') value = slot.time || '—';
  else if (rowType === 'instructor') value = slot.instructor || '';
  else if (rowType === 'room') value = slot.room || '—';

  const cellClass = [
    styles.scheduleDataCell,
    rowType === 'subject' ? styles.scheduleSubjectCell : '',
    rowType === 'time' ? styles.scheduleTimeCell : '',
    rowType === 'instructor' ? styles.scheduleInstructorCell : '',
    rowType === 'room' ? styles.scheduleRoomCell : '',
    isMine ? gridStyles.mineCell : '',
    rowType === 'subject' && !isMine ? gridStyles.subjectCellBorderNeutral : '',
    isDimmed ? gridStyles.dimmedCell : '',
    isClickable && rowType === 'subject' ? gridStyles.clickableCell : '',
    isInProgress ? gridStyles.inProgressCell : '',
    isSelected ? gridStyles.selectedCell : '',
  ].filter(Boolean).join(' ');

  const metaCounts = status ? getClassSessionMetaFromStatus(status, { hideNotesParticipation, hideNotesComments }) : null;
  const hasMetaBadges = Boolean(
    metaCounts
    && (metaCounts.notesCount > 0 || metaCounts.participationCount > 0 || metaCounts.commentsCount > 0),
  );
  const showLeftTray = rowType === 'subject' && (isMine || (hasMetaBadges && !hideTooltips));

  const subjectInnerClass = [
    gridStyles.subjectCellInner,
    rowType === 'subject' ? gridStyles.subjectCellWithIndicators : '',
    showLeftTray ? gridStyles.subjectCellWithLeftTray : '',
    rowType === 'subject' && isMine ? gridStyles.subjectCellInnerWithTray : '',
  ].filter(Boolean).join(' ');

  const content = (
    <CellContent ltr={rowType === 'time'} className={rowType === 'subject' ? subjectInnerClass : ''}>
      {showLeftTray && (
        <div className={gridStyles.subjectCellLeftTray}>
          {isMine && (
            <span className={gridStyles.cellIconTray} aria-hidden="true">
              <ColoredTooltip title={t('workspace_my_class')} color={PURPLE_TOOLTIP} placement="bottom">
                <span
                  className={gridStyles.instructorIcon}
                  style={{ background: getUserRoleColor('instructor') }}
                  aria-label={t('workspace_my_class')}
                >
                  {React.cloneElement(getUserRoleIcon('instructor'), { size: 12, color: '#fff', strokeWidth: 2 })}
                </span>
              </ColoredTooltip>
            </span>
          )}
          {hasMetaBadges && <ClassSessionMetaBadges status={status} t={t} compact hideNotesParticipation={hideNotesParticipation} hideNotesComments={hideNotesComments} />}
        </div>
      )}
      {rowType === 'subject' && !hideTooltips && (() => {
        const hasAttendance = (() => {
          const counts = getAttendanceCountsFromStatus(status);
          if (!counts) return false;
          return ATTENDANCE_COUNT_ITEMS.some((item) => (counts[item.key] || 0) > 0);
        })();
        const hasWorkflow = Boolean(status?.workflowStatus && status.workflowStatus !== 'NOT_TAKEN');
        if (!hasAttendance && !hasWorkflow) return null;
        return (
          <div className={gridStyles.subjectCellTopIndicators}>
            {hasAttendance && <AttendanceIndicatorGroup status={status} t={t} slot={{ ...slot, dayCode, colKey }} onGenerateDailyAttendance={onGenerateDailyAttendance} hideTooltips={hideTooltips} />}
            {hasAttendance && hasWorkflow && (
              <span className={gridStyles.indicatorDivider} aria-hidden="true">|</span>
            )}
            {hasWorkflow && (
              <WorkflowStatusGroup status={status} t={t} lang={lang} selectedDate={selectedDate} hideTooltips={hideTooltips} onWorkflowClick={onWorkflowClick ? (wfStatus) => onWorkflowClick({ ...wfStatus, classId: slot.classId, dayCode }) : undefined} />
            )}
          </div>
        );
      })()}
      <span className={rowType === 'subject' && showLeftTray ? gridStyles.subjectCellTextWithTray : (rowType === 'subject' && isMine ? gridStyles.subjectCellText : undefined)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        {value || (rowType === 'instructor' ? '' : '—')}
      </span>
      {rowType === 'subject' && showLeftTray && <span className={gridStyles.cellEndSpacer} aria-hidden="true" />}
    </CellContent>
  );

  if (isClickable && rowType === 'subject' && onClick) {
    const slotPayload = {
      session: slot.session,
      class: slot.class,
      sessionId: slot.sessionId,
      classId: slot.classId,
      sessionType: slot.sessionType,
      dayCode,
      colKey,
    };
    return (
      <td className={cellClass}>
        <button
          type="button"
          className={gridStyles.cellButton}
          onClick={(e) => onClick({ ...slot, dayCode, colKey }, null, false)}
          onDoubleClick={(e) => onClick({ ...slot, dayCode, colKey }, { x: e.clientX, y: e.clientY }, true)}
          data-testid={`schedule-cell-${slot.classId}`}
          data-day-code={dayCode}
          data-col-key={colKey}
          data-slot={JSON.stringify(slotPayload)}
          aria-label={slot.subjectName || slot.class?.code || t('class') || 'class'}
        >
          {content}
        </button>
      </td>
    );
  }

  return <td className={cellClass}>{content}</td>;
}

function formatCountdown(ms, { includeMonths = false, compact = false, t = null } = {}) {
  if (ms <= 0) return '0';
  const totalSeconds = Math.floor(ms / 1000);
  const months = Math.floor(totalSeconds / (30 * 24 * 60 * 60));
  const days = Math.floor((totalSeconds % (30 * 24 * 60 * 60)) / (24 * 60 * 60));
  const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = totalSeconds % 60;
  const tx = (key, fallback) => { const v = typeof t === 'function' ? t(key) : null; return v || fallback; };

  if (compact) {
    if (includeMonths && months > 0) return `${months}${tx('time_month_short', 'mo')} ${days}${tx('time_day_short', 'd')} ${hours}${tx('time_hour_short', 'h')} ${minutes}${tx('time_minute_short', 'm')}`;
    if (days > 0) return `${days}${tx('time_day_short', 'd')} ${hours}${tx('time_hour_short', 'h')} ${minutes}${tx('time_minute_short', 'm')}`;
    if (hours > 0) return `${hours}${tx('time_hour_short', 'h')} ${minutes}${tx('time_minute_short', 'm')}`;
    return `${minutes}${tx('time_minute_short', 'm')}`;
  }

  if (includeMonths && months > 0) {
    return `${months}${tx('time_month_short', 'mo')} ${days}${tx('time_day_short', 'd')} ${hours}${tx('time_hour_short', 'h')} ${minutes}${tx('time_minute_short', 'm')} ${seconds}${tx('time_second_short', 's')}`;
  }
  if (days > 0) {
    return `${days}${tx('time_day_short', 'd')} ${hours}${tx('time_hour_short', 'h')} ${minutes}${tx('time_minute_short', 'm')} ${seconds}${tx('time_second_short', 's')}`;
  }
  return `${hours}${tx('time_hour_short', 'h')} ${minutes}${tx('time_minute_short', 'm')} ${seconds}${tx('time_second_short', 's')}`;
}

function ScheduleDayInfoWidget({ selectedDate, isViewingCurrentWeek, t }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const target = useMemo(() => {
    const anchor = selectedDate instanceof Date ? new Date(selectedDate) : new Date(selectedDate);
    const weekStart = new Date(anchor);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(7, 0, 0, 0);

    if (isViewingCurrentWeek) {
      const todayTarget = new Date(now);
      todayTarget.setHours(7, 0, 0, 0);
      return todayTarget;
    }

    return weekStart;
  }, [selectedDate, isViewingCurrentWeek, now]);

  const diff = target.getTime() - now.getTime();
  const isPast = diff <= 0;
  const isFarFuture = !isViewingCurrentWeek && diff > 24 * 60 * 60 * 1000;

  if (isPast) {
    return null;
  }

  const countdownText = formatCountdown(diff, { includeMonths: isFarFuture, compact: true, t });
  const tooltip = isViewingCurrentWeek
    ? `${t('schedule_day_starts_in') || 'Working day starts in'} ${countdownText}`
    : `${t('schedule_week_starts_in') || 'Working week starts in'} ${countdownText}`;

  return (
    <ColoredTooltip title={tooltip} color="#3b82f6" placement="bottom">
      <span className={gridStyles.dayInfoCompactText}>{countdownText}</span>
    </ColoredTooltip>
  );
}

function DayBlock({
  day,
  columns,
  rowLabels,
  statusMap,
  instructorId,
  interactiveAll,
  isTodayRow,
  selectedSlot,
  lang,
  t,
  onCellClick,
  selectedDate,
  hideNotesParticipation = false,
  hideNotesComments = false,
  hideTooltips = false,
  onGenerateDailyAttendance,
  onWorkflowClick,
  rowTypes,
  rowSpan,
  showDayDate = true,
}) {
  const rowLabelMap = {
    subject: rowLabels.subject,
    time: rowLabels.time,
    instructor: rowLabels.instructor,
    room: rowLabels.room,
  };
  const dayFontSize = rowSpan <= 2 ? '8px' : rowSpan === 3 ? '10px' : undefined;

  return (
    <tbody className={isTodayRow ? gridStyles.dayBlockWrap : undefined} data-day={day.dayCode}>
      {rowTypes.map((rowType, rowIndex) => (
        <tr
          key={`${day.dayCode}-${rowType}`}
          className={`${styles.scheduleDayRow} ${isTodayRow ? gridStyles.todayRow : ''}`}
        >
          {rowIndex === 0 && (
            <td className={styles.scheduleDayCell} rowSpan={rowSpan}>
              <div className={gridStyles.verticalCellInner}>
                <VerticalText fontSize={dayFontSize} minHeight={0}>
                  {day.dayLabel}
                  {showDayDate && (() => {
                    if (!selectedDate) return null;
                    const anchor = selectedDate instanceof Date ? selectedDate : new Date(selectedDate);
                    const weekStart = new Date(anchor);
                    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                    const dayIndex = DAY_CODES.indexOf(day.dayCode);
                    if (dayIndex < 0) return null;
                    const dayDate = new Date(weekStart);
                    dayDate.setDate(dayDate.getDate() + dayIndex);
                    const dateStr = `${String(dayDate.getDate()).padStart(2, '0')}/${String(dayDate.getMonth() + 1).padStart(2, '0')}`;
                    return (
                      <span className={styles.scheduleDayDate} key="date">
                        {` ${dateStr}`}
                      </span>
                    );
                  })()}
                </VerticalText>
              </div>
            </td>
          )}
          <td className={`${styles.scheduleRowLabelCell} ${rowType === 'time' ? styles.scheduleRowLabelTime : ''}`}>
            <CellContent className={styles.scheduleRowLabelInner}>{rowLabelMap[rowType]}</CellContent>
          </td>
          {columns.map((col) => {
            const slot = day.slots?.[col.key];
            const classId = slot?.classId;
            const resolvedInstructorId = slot?.instructorId ?? slot?.class?.instructorId;
            const isMine = classId && instructorId
              ? Number(resolvedInstructorId) === Number(instructorId)
              : false;
            const isDimmed = Boolean(classId && instructorId && !isMine && !interactiveAll && resolvedInstructorId != null);
            const isSelected = Boolean(
              rowType === 'subject'
              && classId && selectedSlot
              && Number(classId) === Number(selectedSlot.classId)
              && day.dayCode === selectedSlot.dayCode
              && col.key === selectedSlot.colKey,
            );
            const hasSession = Boolean(resolveSlotSession(slot));
            const isClickable = Boolean(
              onCellClick && classId && hasSession && (interactiveAll || isMine || (instructorId && resolvedInstructorId == null)),
            );
            const status = resolveCellStatus(statusMap, selectedDate, day.dayCode, classId);
            let isInProgress = false;
            if (isTodayRow && classId && slot?.time) {
              const timeMatch = slot.time.match(/(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/);
              if (timeMatch) {
                const nowMs = Date.now();
                const now = new Date(nowMs);
                const nowMin = now.getHours() * 60 + now.getMinutes();
                const startMin = parseInt(timeMatch[1], 10) * 60 + parseInt(timeMatch[2], 10);
                const endMin = parseInt(timeMatch[3], 10) * 60 + parseInt(timeMatch[4], 10);
                isInProgress = nowMin >= startMin && nowMin < endMin;
              }
            }

            return (
              <InteractiveSlotCell
                key={`${day.dayCode}-${col.key}-${rowType}`}
                slot={slot}
                day={day}
                rowType={rowType}
                isBreak={col.isBreak || isOfficeHourColumn(col)}
                isMine={isMine}
                isClickable={isClickable}
                isDimmed={isDimmed}
                isInProgress={isInProgress}
                isSelected={isSelected}
                dayCode={day.dayCode}
                colKey={col.key}
                status={status}
                t={t}
                lang={lang}
                onClick={onCellClick}
                selectedDate={selectedDate}
                hideNotesParticipation={hideNotesParticipation}
                hideNotesComments={hideNotesComments}
                hideTooltips={hideTooltips}
                onGenerateDailyAttendance={onGenerateDailyAttendance}
                onWorkflowClick={onWorkflowClick}
                rowSpan={rowSpan}
              />
            );
          })}
        </tr>
      ))}
    </tbody>
  );
}

const OfficialWeeklyScheduleGrid = ({
  scheduleData,
  statusMap,
  instructorId,
  interactiveAll = false,
  selectedDate,
  selectedSlot,
  onCellClick,
  onDateChange,
  onGenerateDailyAttendance,
  onWorkflowClick,
  compact = false,
  fillHeight = false,
  fillWidth = false,
  fontScale = SCHEDULE_FONT_SCALE_DEFAULT,
  expanded = false,
  onToggleExpand = null,
  hideNotesParticipation = false,
  hideNotesComments = false,
  hideTooltips = false,
  hideLegend = false,
  showInstructor = true,
  showRoom = true,
  showDayDate = true,
  showBreakColumns = true,
  dayFocus = false,
}) => {
  const { lang, t } = useLang();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const tableRef = useRef(null);
  const wrapRef = useRef(null);
  const [outsideHours, setOutsideHours] = useState(false);

  useEffect(() => {
    if (!onCellClick) return;

    const handleContextMenu = (e) => {
      // Temporarily disable pointer events on open MUI menus so elementFromPoint
      // can see the schedule cell underneath the menu backdrop.
      const menuRootEls = document.querySelectorAll('.MuiPopover-root, .MuiModal-root');
      menuRootEls.forEach((el) => { el.style.pointerEvents = 'none'; });
      const target = document.elementFromPoint(e.clientX, e.clientY);
      menuRootEls.forEach((el) => { el.style.pointerEvents = ''; });

      const button = target?.closest('[data-testid^="schedule-cell-"]');
      if (!button) return;
      if (!wrapRef.current?.contains(button)) return;

      const dayCode = button.getAttribute('data-day-code');
      const colKey = button.getAttribute('data-col-key');
      const day = scheduleData?.days?.find((d) => d.dayCode === dayCode);
      const slot = day?.slots?.[colKey];
      if (!slot) return;

      e.preventDefault();
      e.stopPropagation();
      onCellClick({ ...slot, dayCode, colKey }, { x: e.clientX, y: e.clientY }, true);
    };

    document.addEventListener('contextmenu', handleContextMenu, true);
    return () => document.removeEventListener('contextmenu', handleContextMenu, true);
  }, [onCellClick, scheduleData]);

  const visibleColumns = useMemo(() => {
    const cols = scheduleData?.columns || [];
    if (showBreakColumns) return cols;
    return cols.filter((col) => !col.isBreak);
  }, [scheduleData?.columns, showBreakColumns]);

  const displayDays = useMemo(() => {
    const allDays = scheduleData?.days || [];
    if (!dayFocus || allDays.length === 0) return allDays;
    const focusDayCode = DAY_CODES[selectedDate.getDay()];
    const filtered = allDays.filter((day) => day.dayCode === focusDayCode);
    return filtered.length > 0 ? filtered : allDays;
  }, [scheduleData?.days, dayFocus, selectedDate]);

  const columnWidths = useMemo(() => {
    const narrow = measureNarrowColumnWidths(visibleColumns, displayDays);
    return visibleColumns.map((col) => resolveDataColumnWidth(col, visibleColumns, narrow));
  }, [visibleColumns, displayDays]);

  const visibleRowTypes = useMemo(() => {
    const all = ['subject', 'time', 'instructor', 'room'];
    return all.filter((rt) => {
      if (rt === 'instructor') return showInstructor;
      if (rt === 'room') return showRoom;
      return true;
    });
  }, [showInstructor, showRoom]);
  const rowSpan = visibleRowTypes.length;

  if (!scheduleData?.days?.length) {
    return (
      <div className={`${gridStyles.wrap} ${isDark ? gridStyles.wrapDark : ''}`}>
        <div className={gridStyles.emptyState}>
          {t('schedule_no_sessions') || (lang === 'ar' ? 'لا توجد جلسات مجدولة' : 'No scheduled sessions found')}
        </div>
      </div>
    );
  }

  const { columns, rowLabels, days, subtitle, year, term, batch } = scheduleData;
  const isAr = lang === 'ar';
  const actualToday = new Date();
  const todayCode = DAY_CODES[actualToday.getDay()];
  const isViewingCurrentWeek = isSameCalendarWeek(selectedDate, actualToday);
  const showTodayTimeline = isViewingCurrentWeek;
  const metaLine = [batch, year && term ? `${year} / ${term}` : year || term].filter(Boolean).join(' — ');
  const { start: dayStartMin, end: dayEndMin } = resolveProgramHours({ ...scheduleData, days: displayDays });
  const dateInputValue = selectedDate.toISOString().split('T')[0];
  const totalDataRows = (displayDays?.length || 0) * rowSpan;

  return (
    <div
      ref={wrapRef}
      className={`${gridStyles.wrap} ${isDark ? gridStyles.wrapDark : ''} ${compact ? gridStyles.wrapCompact : ''} ${fillHeight ? gridStyles.wrapFill : ''} ${fillWidth ? gridStyles.wrapFillWidth : ''}`}
      style={{ '--schedule-font-scale': String(fontScale / 100) }}
      dir={isAr ? 'rtl' : 'ltr'}
      data-testid="official-weekly-schedule-grid"
    >
      <div className={`${styles.scheduleTitleBar} ${gridStyles.interactiveTitleBar} ${compact ? gridStyles.titleBarCompact : ''}`}>
        <div className={gridStyles.titleRow}>
          <div className={gridStyles.titleTextGroup}>
            {!compact && <div className={`${styles.scheduleTitleMain} ${gridStyles.titleMainCompact}`}>{subtitle}</div>}
            {!compact && metaLine && (
              <div className={styles.scheduleTitleSubRow}>
                <span className={styles.scheduleTitleMeta}>{metaLine}</span>
              </div>
            )}
          </div>
          {!compact && onDateChange && (
            <input
              type="date"
              value={dateInputValue}
              onChange={(e) => onDateChange(new Date(`${e.target.value}T12:00:00`))}
              className={gridStyles.inlineDateInput}
              data-testid="workspace-date-picker"
              aria-label={t('workspace_date')}
            />
          )}
        </div>
      </div>

      <div className={`${styles.scheduleTableWrap} ${gridStyles.tableScroll} ${gridStyles.tableWithTimeline} ${fillHeight ? gridStyles.tableFill : ''}`}>
        <ScheduleTimeLineOverlay
          tableRef={tableRef}
          todayCode={todayCode}
          dayStartMin={dayStartMin}
          dayEndMin={dayEndMin}
          visible={showTodayTimeline}
          columns={visibleColumns}
          days={displayDays}
          t={t}
          lang={lang}
          onOutsideHoursChange={setOutsideHours}
        />
        <table
          ref={tableRef}
          className={`${styles.officialTable} ${styles.weeklyScheduleTable} ${gridStyles.scalableTable} ${fillWidth ? gridStyles.expandedTable : ''}`}
          data-theme={isDark ? 'dark' : undefined}
          style={{ '--schedule-data-rows': String(totalDataRows || 1) }}
        >
          <colgroup>
            <col style={{ width: `${DAY_COL_PCT}%` }} />
            <col style={{ width: `${LABEL_COL_PCT}%` }} />
            {visibleColumns.map((col, idx) => (
              <col key={col.key} style={{ width: `${columnWidths[idx]}%` }} />
            ))}
          </colgroup>
          <thead>
            <tr className={styles.scheduleHeaderRow}>
              <th className={styles.scheduleCornerCell}>
                <div className={gridStyles.verticalCellInner}>
                  <VerticalText>{t('calendar_day') || (isAr ? 'اليوم' : 'Day')}</VerticalText>
                </div>
              </th>
              <th className={styles.scheduleCornerCell}>
                <ScheduleDayInfoWidget
                  selectedDate={selectedDate}
                  isViewingCurrentWeek={isViewingCurrentWeek}
                  t={t}
                />
              </th>
              {visibleColumns.map((col) => {
                const isNarrowCol = col.isBreak || isOfficeHourColumn(col);
                const headerFontSize = isNarrowCol
                  ? `${Math.min(11, Math.max(6, Math.floor(40 / (String(col.label || '').length * 0.65))))}px`
                  : undefined;
                return (
                  <th
                    key={col.key}
                    className={[
                      isNarrowCol ? styles.scheduleBreakHeader : styles.scheduleLectureHeader,
                      isNarrowCol ? gridStyles.narrowColHeader : gridStyles.lectureColHeader,
                    ].filter(Boolean).join(' ')}
                  >
                    {isNarrowCol ? (
                      <div className={gridStyles.verticalCellInner}>
                        <VerticalText compact className={styles.scheduleBreakHeaderLabel} fontSize={headerFontSize}>
                          {col.label}
                        </VerticalText>
                      </div>
                    ) : (
                      <span className={gridStyles.horizontalLectureHeader}>{col.label}</span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          {displayDays.map((day) => (
            <DayBlock
              key={day.dayCode}
              day={day}
              columns={visibleColumns}
              rowLabels={rowLabels}
              statusMap={statusMap}
              instructorId={instructorId}
              interactiveAll={interactiveAll}
              isTodayRow={showTodayTimeline && day.dayCode === todayCode}
              selectedSlot={selectedSlot}
              lang={lang}
              t={t}
              onCellClick={onCellClick}
              selectedDate={selectedDate}
              hideNotesParticipation={hideNotesParticipation}
              hideNotesComments={hideNotesComments}
              hideTooltips={hideTooltips}
              onGenerateDailyAttendance={onGenerateDailyAttendance}
              onWorkflowClick={onWorkflowClick}
              rowTypes={visibleRowTypes}
              rowSpan={rowSpan}
              showDayDate={showDayDate}
            />
          ))}
        </table>
      </div>

      <div className={`${gridStyles.statusLegend} ${gridStyles.statusLegendBottom}`} style={hideLegend ? { display: 'none' } : undefined}>
        <BoardLegend
          bare
          showWorkflow={!hideTooltips}
          showScheduleExtras={!hideTooltips}
          roleContext={hideNotesParticipation ? { isHR: true, isAdmin: false, isSuperAdmin: false } : {}}
          style={{ flex: 1, minWidth: 0, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.35rem' }}
        />
        {outsideHours && (
          <Chip
            size="small"
            label={t('schedule_outside_hours') || 'Outside working hours'}
            className={gridStyles.outsideHoursChip}
            sx={{
              height: '1.55em',
              fontSize: '0.85em',
              fontWeight: 600,
              bgcolor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.08)',
              color: isDark ? '#fca5a5' : '#dc2626',
              border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.35)' : 'rgba(239, 68, 68, 0.25)'}`,
              '& .MuiChip-label': {
                fontSize: 'inherit',
                px: '0.45em',
              },
            }}
          />
        )}
        {onToggleExpand && (
          <ColoredTooltip
            title={expanded ? (t('schedule_collapse') || 'Collapse schedule') : (t('schedule_expand') || 'Expand schedule')}
            color={PURPLE_TOOLTIP}
            placement="top"
          >
            <IconButton
              size="small"
              onClick={onToggleExpand}
              className={gridStyles.legendExpandBtn}
              data-testid="schedule-expand-btn"
              aria-label={expanded ? (t('schedule_collapse') || 'Collapse schedule') : (t('schedule_expand') || 'Expand schedule')}
              sx={{
                width: 24,
                height: 24,
                ml: 0.5,
                borderRadius: 0,
                bgcolor: isDark ? 'rgba(30,41,59,0.6)' : 'rgba(255,255,255,0.8)',
                color: isDark ? '#94a3b8' : '#64748b',
                '&:hover': {
                  bgcolor: isDark ? 'rgba(51,65,85,0.8)' : 'rgba(241,245,249,1)',
                },
              }}
            >
              {expanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
            </IconButton>
          </ColoredTooltip>
        )}
      </div>
    </div>
  );
};

export default OfficialWeeklyScheduleGrid;
