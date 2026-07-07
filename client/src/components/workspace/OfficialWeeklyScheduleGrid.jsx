import React, { useState, useEffect } from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import styles from '@services/export/official-reports/templates/officialReport.module.css';
import gridStyles from './officialWeeklyScheduleGrid.module.css';

const DEFAULT_DAY_START = 7 * 60 + 30; // 07:30
const DEFAULT_DAY_END = 17 * 60 + 30; // 17:30

function parseTimeToMinutes(value) {
  if (!value) return null;
  const match = String(value).match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
}

function resolveProgramHours(scheduleData) {
  let start = DEFAULT_DAY_START;
  let end = DEFAULT_DAY_END;
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
    start = Math.min(start, ...times);
    end = Math.max(end, ...times);
  }
  return { start, end };
}

function CurrentTimeLine({ dayStartMin, dayEndMin, visible }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!visible) return undefined;
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, [visible]);

  if (!visible) return null;

  const nowMin = now.getHours() * 60 + now.getMinutes();
  if (nowMin < dayStartMin || nowMin > dayEndMin) return null;

  const pct = ((nowMin - dayStartMin) / (dayEndMin - dayStartMin)) * 100;
  const label = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  return (
    <div className={gridStyles.timeLine} style={{ top: `${pct}%` }} aria-hidden>
      <span className={gridStyles.timeLineLabel}>{label}</span>
    </div>
  );
}

function StatusDot({ status, lang }) {
  if (!status) return null;
  const isSubmitted = ['SUBMITTED', 'UNDER_ADMIN_REVIEW', 'UNDER_HR_REVIEW', 'APPROVED', 'ADMIN_APPROVED'].includes(status.workflowStatus);
  const key = isSubmitted ? 'submitted' : status.hasAttendance ? 'taken' : 'not_taken';
  const colors = { taken: '#22c55e', submitted: '#3b82f6', not_taken: '#94a3b8' };
  return <span className={gridStyles.statusDot} style={{ background: colors[key] }} title={key} />;
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
  return (
    <div className={compact ? styles.scheduleBreakVerticalWrap : styles.scheduleVerticalTextWrap}>
      <span className={`${styles.scheduleVerticalText} ${compact ? styles.scheduleBreakVertical : ''}`}>
        {children}
      </span>
    </div>
  );
}

function InteractiveSlotCell({
  slot,
  rowType,
  isBreak,
  isMine,
  isDimmed,
  status,
  lang,
  onClick,
}) {
  if (isBreak) {
    if (rowType !== 'subject') return null;
    return (
      <td className={styles.scheduleBreakCell} rowSpan={4}>
        <CellContent ltr>
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
    isDimmed ? gridStyles.dimmedCell : '',
    isMine && rowType === 'subject' && onClick ? gridStyles.clickableCell : '',
  ].filter(Boolean).join(' ');

  const content = (
    <CellContent ltr={rowType === 'time'}>
      {rowType === 'subject' && <StatusDot status={status} lang={lang} />}
      {value || (rowType === 'instructor' ? '' : '—')}
    </CellContent>
  );

  if (isMine && rowType === 'subject' && onClick) {
    return (
      <td className={cellClass}>
        <button
          type="button"
          className={gridStyles.cellButton}
          onClick={() => onClick(slot)}
          data-testid={`schedule-cell-${slot.classId}`}
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
  isTodayRow,
  dayStartMin,
  dayEndMin,
  showTimeLine,
  lang,
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
    <tbody className={isTodayRow ? gridStyles.dayBlockWrap : undefined}>
      {isTodayRow && (
        <CurrentTimeLine dayStartMin={dayStartMin} dayEndMin={dayEndMin} visible={showTimeLine} />
      )}
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
            const isMine = classId ? Number(resolvedInstructorId) === Number(instructorId) : false;
            const isDimmed = Boolean(classId && instructorId && !isMine);
            const status = classId ? statusMap[classId] : null;

            return (
              <InteractiveSlotCell
                key={`${day.dayCode}-${col.key}-${rowType}`}
                slot={slot}
                rowType={rowType}
                isBreak={col.isBreak}
                isMine={isMine}
                isDimmed={isDimmed}
                status={status}
                lang={lang}
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
  selectedDate,
  onCellClick,
}) => {
  const { lang } = useLang();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

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

  return (
    <div
      className={`${gridStyles.wrap} ${isDark ? gridStyles.wrapDark : ''}`}
      dir={isAr ? 'rtl' : 'ltr'}
      data-testid="official-weekly-schedule-grid"
    >
      <div className={`${styles.scheduleTitleBar} ${gridStyles.interactiveTitleBar}`}>
        <div className={styles.scheduleTitleMain}>{subtitle}</div>
        {metaLine && (
          <div className={styles.scheduleTitleSubRow}>
            <span className={styles.scheduleTitleMeta}>{metaLine}</span>
          </div>
        )}
      </div>

      <div className={`${styles.scheduleTableWrap} ${gridStyles.tableScroll} ${gridStyles.tableWithTimeline}`}>
        <table className={`${styles.officialTable} ${styles.weeklyScheduleTable}`}>
          <colgroup>
            <col style={{ width: '3%' }} />
            <col style={{ width: '7%' }} />
            {columns.map((col) => (
              <col key={col.key} style={{ width: col.isBreak ? '3.5%' : '25.2%' }} />
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
                  className={col.isBreak ? styles.scheduleBreakHeader : styles.scheduleLectureHeader}
                >
                  <VerticalText compact={col.isBreak}>{col.label}</VerticalText>
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
              isTodayRow={isTodaySelected && day.dayCode === todayCode}
              dayStartMin={dayStartMin}
              dayEndMin={dayEndMin}
              showTimeLine={isTodaySelected && day.dayCode === todayCode}
              lang={lang}
              onCellClick={onCellClick}
            />
          ))}
        </table>
      </div>
    </div>
  );
};

export default OfficialWeeklyScheduleGrid;
