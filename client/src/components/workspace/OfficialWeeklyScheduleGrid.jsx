import React, { useState, useEffect, useRef, useLayoutEffect, useMemo } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { Chip, IconButton, Box } from '@mui/material';
import { Maximize2, Minimize2 } from 'lucide-react';
import ColoredTooltip from '@components/ui/mui/ColoredTooltip';
import styles from '@services/export/official-reports/templates/officialReport.module.css';
import {
  SCHEDULE_FONT_SCALE_DEFAULT,
} from '@constants/scheduleFontScale';
import gridStyles from './officialWeeklyScheduleGrid.module.css';
import {
  SCHEDULE_WORKFLOW_COLORS,
  resolveScheduleWorkflowKey,
} from '@constants/workspaceStatusColors';

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

function resolveDataColumnWidth(col, columns) {
  const breakCount = columns.filter((c) => c.isBreak).length;
  const hasOffice = columns.some((c) => isOfficeHourColumn(c));
  const lectureCount = columns.length - breakCount - (hasOffice ? 1 : 0);
  const fixedUsed = (breakCount * BREAK_COL_PCT) + (hasOffice ? OFFICE_COL_PCT : 0);
  const lectureWidth = lectureCount > 0 ? (DATA_COL_BUDGET - fixedUsed) / lectureCount : 0;

  if (col.isBreak) return BREAK_COL_PCT;
  if (isOfficeHourColumn(col)) return OFFICE_COL_PCT;
  return lectureWidth;
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
          const rowLeftPx = firstCellRect.left - wrapRect.left;
          const rowWidthPx = lastCellRect.right - firstCellRect.left;
          setRowLeft(rowLeftPx);
          setRowWidth(rowWidthPx);

          if (isInSlot && dataCells[clampedColumnIndex]) {
            const cellRect = dataCells[clampedColumnIndex].getBoundingClientRect();
            const offsetWithinRow = (cellRect.left - firstCellRect.left) + cellRect.width * clampedWithinSlotPct;
            setDotOffset(offsetWithinRow);
          } else {
            // When not in a slot, use linear time-to-pixel mapping across the row
            // The row spans from dayStartMin to dayEndMin (actual schedule bounds)
            setDotOffset(rowWidthPx * timePct);
          }
        }
      }
      
      setLineTop(top);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(tableRef.current);
    window.addEventListener('resize', measure);
    return () => {
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

  const label = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

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
      <span className={gridStyles.timeLineDot} style={{ left: `${dotOffset}px` }} />
      <div className={gridStyles.timeLineTooltip} style={{ left: `${dotOffset}px` }}>
        {label}
        <span className={gridStyles.timeLineTooltipArrow} />
      </div>
    </div>
  );
}

function StatusDot({ status, t }) {
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

  return (
    <ColoredTooltip title={labels[key]} color={PURPLE_TOOLTIP} placement="bottom">
      <span className={gridStyles.statusDotWrap}>
        <span
          className={`${gridStyles.statusDot} ${gridStyles[`statusDot_${key}`]}`}
          style={{ '--dot-color': dotColor }}
          aria-label={labels[key]}
        />
      </span>
    </ColoredTooltip>
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

function VerticalText({ children, compact }) {
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

  return (
    <div className={compact ? styles.scheduleBreakVerticalWrap : styles.scheduleVerticalTextWrap}>
      <span className={`${styles.scheduleVerticalText} ${compact ? styles.scheduleBreakVertical : ''}`}>
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
  onClick,
}) {
  if (isBreak) {
    if (rowType !== 'subject') return null;
    return (
      <td className={styles.scheduleBreakCell} rowSpan={4}>
        <CellContent ltr className={gridStyles.breakCellInner}>
          <VerticalText compact>{slot?.time || '—'}</VerticalText>
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

  const subjectInnerClass = [
    gridStyles.subjectCellInner,
    rowType === 'subject' && isMine ? gridStyles.subjectCellInnerWithTray : '',
  ].filter(Boolean).join(' ');

  const content = (
    <CellContent ltr={rowType === 'time'} className={rowType === 'subject' ? subjectInnerClass : ''}>
      {rowType === 'subject' && <StatusDot status={status} t={t} />}
      {rowType === 'subject' && isMine && (
        <span className={gridStyles.cellIconTray} aria-hidden="true">
          <ColoredTooltip title={t('workspace_my_class')} color={PURPLE_TOOLTIP} placement="bottom">
            <span className={gridStyles.instructorIcon} aria-label={t('workspace_my_class')}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"></path>
                <path d="M22 10v6"></path>
                <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"></path>
              </svg>
            </span>
          </ColoredTooltip>
        </span>
      )}
      <span className={rowType === 'subject' && isMine ? gridStyles.subjectCellText : undefined}>
        {value || (rowType === 'instructor' ? '' : '—')}
      </span>
      {rowType === 'subject' && isMine && <span className={gridStyles.cellEndSpacer} aria-hidden="true" />}
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
          aria-label={slot.subjectName || slot.class?.code || 'class'}
        >
          {content}
        </button>
      </td>
    );
  }

  return <td className={cellClass}>{content}</td>;
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
}) {
  const rowTypes = ['subject', 'time', 'instructor', 'room'];
  const rowLabelMap = {
    subject: rowLabels.subject,
    time: rowLabels.time,
    instructor: rowLabels.instructor,
    room: rowLabels.room,
  };

  return (
    <tbody className={isTodayRow ? gridStyles.dayBlockWrap : undefined} data-day={day.dayCode}>
      {rowTypes.map((rowType, rowIndex) => (
        <tr
          key={`${day.dayCode}-${rowType}`}
          className={`${styles.scheduleDayRow} ${isTodayRow ? gridStyles.todayRow : ''}`}
        >
          {rowIndex === 0 && (
            <td className={styles.scheduleDayCell} rowSpan={4}>
              <VerticalText>{day.dayLabel}</VerticalText>
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
            const isDimmed = Boolean(classId && instructorId && !isMine && !interactiveAll);
            const isSelected = Boolean(
              rowType === 'subject'
              && classId && selectedSlot
              && Number(classId) === Number(selectedSlot.classId)
              && day.dayCode === selectedSlot.dayCode
              && col.key === selectedSlot.colKey,
            );
            const hasSession = Boolean(resolveSlotSession(slot));
            const isClickable = Boolean(
              onCellClick && classId && hasSession && (interactiveAll || isMine),
            );
            const status = classId ? statusMap[classId] : null;
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
                rowType={rowType}
                isBreak={col.isBreak}
                isMine={isMine}
                isClickable={isClickable}
                isDimmed={isDimmed}
                isInProgress={isInProgress}
                isSelected={isSelected}
                dayCode={day.dayCode}
                colKey={col.key}
                status={status}
                t={t}
                onClick={onCellClick}
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
  compact = false,
  fillHeight = false,
  fillWidth = false,
  fontScale = SCHEDULE_FONT_SCALE_DEFAULT,
  expanded = false,
  onToggleExpand = null,
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

  const columnWidths = useMemo(
    () => (scheduleData?.columns || []).map((col) => resolveDataColumnWidth(col, scheduleData.columns)),
    [scheduleData?.columns],
  );

  if (!scheduleData?.days?.length) {
    return (
      <div className={`${gridStyles.wrap} ${isDark ? gridStyles.wrapDark : ''}`}>
        <div className={gridStyles.emptyState}>
          {lang === 'ar' ? 'لا توجد جلسات مجدولة' : 'No scheduled sessions found'}
        </div>
      </div>
    );
  }

  const { columns, rowLabels, days, subtitle, year, term, batch } = scheduleData;
  const isAr = lang === 'ar';
  const todayCode = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][selectedDate.getDay()];
  const isTodaySelected = selectedDate.toDateString() === new Date().toDateString();
  const metaLine = [batch, year && term ? `${year} / ${term}` : year || term].filter(Boolean).join(' — ');
  const { start: dayStartMin, end: dayEndMin } = resolveProgramHours(scheduleData);
  const dateInputValue = selectedDate.toISOString().split('T')[0];

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
          visible={isTodaySelected}
          columns={columns}
          days={days}
          t={t}
          onOutsideHoursChange={setOutsideHours}
        />
        <table
          ref={tableRef}
          className={`${styles.officialTable} ${styles.weeklyScheduleTable} ${gridStyles.scalableTable} ${fillWidth ? gridStyles.expandedTable : ''}`}
        >
          <colgroup>
            <col style={{ width: `${DAY_COL_PCT}%` }} />
            <col style={{ width: `${LABEL_COL_PCT}%` }} />
            {columns.map((col, idx) => (
              <col key={col.key} style={{ width: `${columnWidths[idx]}%` }} />
            ))}
          </colgroup>
          <thead>
            <tr className={styles.scheduleHeaderRow}>
              <th className={styles.scheduleCornerCell}>
                <VerticalText>{isAr ? 'اليوم' : 'Day'}</VerticalText>
              </th>
              <th className={styles.scheduleCornerCell} />
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={[
                    col.isBreak ? styles.scheduleBreakHeader : styles.scheduleLectureHeader,
                    col.isBreak || isOfficeHourColumn(col) ? gridStyles.narrowColHeader : gridStyles.lectureColHeader,
                  ].filter(Boolean).join(' ')}
                >
                  {col.isBreak ? (
                    <VerticalText compact className={styles.scheduleBreakHeaderLabel}>{col.label}</VerticalText>
                  ) : (
                    <span className={gridStyles.horizontalLectureHeader}>{col.label}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          {days.map((day) => (
            <DayBlock
              key={day.dayCode}
              day={day}
              columns={columns}
              rowLabels={rowLabels}
              statusMap={statusMap}
              instructorId={instructorId}
              interactiveAll={interactiveAll}
              isTodayRow={isTodaySelected && day.dayCode === todayCode}
              selectedSlot={selectedSlot}
              lang={lang}
              t={t}
              onCellClick={onCellClick}
            />
          ))}
        </table>
      </div>

      <div className={`${gridStyles.statusLegend} ${gridStyles.statusLegendBottom}`}>
        <div className={gridStyles.legendItem}>
          <span className={`${gridStyles.legendDot} ${gridStyles.legendDot_not_taken}`} />
          <span>{t('workspace_status_not_taken')}</span>
        </div>
        <div className={gridStyles.legendItem}>
          <span className={`${gridStyles.legendDot} ${gridStyles.legendDot_draft}`} />
          <span>{t('workspace_status_draft') || 'Draft'}</span>
        </div>
        <div className={gridStyles.legendItem}>
          <span className={`${gridStyles.legendDot} ${gridStyles.legendDot_taken}`} />
          <span>{t('workspace_status_taken')}</span>
        </div>
        <div className={gridStyles.legendItem}>
          <span className={`${gridStyles.legendDot} ${gridStyles.legendDot_submitted}`} />
          <span>{t('workspace_status_submitted')}</span>
        </div>
        <div className={gridStyles.legendItem}>
          <span className={gridStyles.legendLine} />
          <span>{t('workspace_current_time')}</span>
        </div>
        <div className={gridStyles.legendItem}>
          <span className={`${gridStyles.legendDot} ${gridStyles.legendDot_inProgress}`} />
          <span>{t('workspace_lecture_in_progress')}</span>
        </div>
        <div className={gridStyles.legendItem}>
          <span className={`${gridStyles.legendDot} ${gridStyles.legendDot_selected}`} />
          <span>{t('workspace_selected_class')}</span>
        </div>
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
              border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
              bgcolor: isDark ? 'rgba(30,41,59,0.6)' : 'rgba(255,255,255,0.8)',
              color: isDark ? '#94a3b8' : '#64748b',
              '&:hover': {
                bgcolor: isDark ? 'rgba(51,65,85,0.8)' : 'rgba(241,245,249,1)',
              },
            }}
          >
            {expanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </IconButton>
        )}
      </div>
    </div>
  );
};

export default OfficialWeeklyScheduleGrid;
