import React from 'react';
import { OFFICIAL_HEADER } from '../shared/officialHeader.js';
import { buildWatermarkLines } from '../engine/watermark.js';
import { formatDateTime } from '@utils/date-formatter.js';
import styles from './officialReport.module.css';

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

function VerticalText({ children, className, compact }) {
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
      <span className={`${styles.scheduleVerticalText} ${className || ''}`}>
        {content}
      </span>
    </div>
  );
}

const DAY_COL_PCT = 3;
const LABEL_COL_PCT = 7;
const DATA_COL_BUDGET = 100 - DAY_COL_PCT - LABEL_COL_PCT;

function isOfficeHourColumn(col) {
  return col.key === 'officeHour' || col.isOfficeHour;
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
    : 7;

  return { breakPct, officePct };
}

function resolveDataColumnWidth(col, columns, narrow) {
  const breakCount = columns.filter((c) => c.isBreak).length;
  const hasOffice = columns.some((c) => isOfficeHourColumn(c));
  const lectureCount = columns.length - breakCount - (hasOffice ? 1 : 0);
  const fixedUsed = (breakCount * narrow.breakPct) + (hasOffice ? narrow.officePct : 0);
  const lectureWidth = lectureCount > 0 ? (DATA_COL_BUDGET - fixedUsed) / lectureCount : 0;

  if (col.isBreak) return narrow.breakPct;
  if (isOfficeHourColumn(col)) return narrow.officePct;
  return lectureWidth;
}

function SlotCell({ slot, rowType, isBreak }) {
  if (isBreak) {
    if (rowType !== 'subject') return null;
    return (
      <td className={styles.scheduleBreakCell} rowSpan={4}>
        <CellContent ltr className={styles.scheduleNarrowCellInner}>
          <VerticalText compact className={styles.scheduleBreakVertical}>{slot?.time || '—'}</VerticalText>
        </CellContent>
      </td>
    );
  }

  if (!slot) {
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
  ].filter(Boolean).join(' ');

  return (
    <td className={cellClass}>
      <CellContent ltr={rowType === 'time'}>{value || (rowType === 'instructor' ? '' : '—')}</CellContent>
    </td>
  );
}

function DayBlock({ day, columns, rowLabels }) {
  const rowTypes = ['subject', 'time', 'instructor', 'room'];
  const rowLabelMap = {
    subject: rowLabels.subject,
    time: rowLabels.time,
    instructor: rowLabels.instructor,
    room: rowLabels.room,
  };

  return (
    <>
      {rowTypes.map((rowType, rowIndex) => (
        <tr key={`${day.dayLabel}-${rowType}`} className={styles.scheduleDayRow}>
          {rowIndex === 0 && (
            <td className={styles.scheduleDayCell} rowSpan={4}>
              <div className={styles.scheduleVerticalInset}>
                <VerticalText>{day.dayLabel}</VerticalText>
              </div>
            </td>
          )}
          <td className={`${styles.scheduleRowLabelCell} ${rowType === 'time' ? styles.scheduleRowLabelTime : ''}`}>
            <CellContent className={styles.scheduleRowLabelInner}>{rowLabelMap[rowType]}</CellContent>
          </td>
          {columns.map((col) => (
            <SlotCell
              key={`${day.dayLabel}-${col.key}-${rowType}`}
              slot={day.slots[col.key]}
              rowType={rowType}
              isBreak={col.isBreak}
            />
          ))}
        </tr>
      ))}
    </>
  );
}

export function WeeklyScheduleTemplate({ data, showWatermark = true }) {
  const { lang, serial, title, subtitle, batch, year, term, columns, rowLabels, days } = data;
  const isAr = lang === 'ar';
  const wm = buildWatermarkLines(data.watermarkUser);

  const genDateTime = formatDateTime(new Date(), lang);

  const yearTermLabel = year && term ? `${year} / ${term}` : year || term || '';
  const titleParts = [subtitle, yearTermLabel, batch && batch !== subtitle ? batch : null].filter(Boolean);
  const titleLine = titleParts.join(' | ');
  const narrowWidths = measureNarrowColumnWidths(columns || [], days || []);
  const dataColWidths = (columns || []).map((col) => resolveDataColumnWidth(col, columns, narrowWidths));

  return (
    <div
      data-official-page
      data-page-orientation="landscape"
      className={`${styles.officialPage} ${styles.officialPageLandscapeCert} ${styles.officialPageLandscapeSchedule} ${isAr ? styles.officialPageRtl : ''}`}
      style={{ width: '1123px' }}
    >
      {showWatermark && (wm.en || wm.ar || wm.uuid) && (
        <div className={styles.officialWatermark} aria-hidden>
          {wm.en && <div>{wm.en}</div>}
          {wm.ar && wm.ar !== wm.en && <div>{wm.ar}</div>}
          {wm.uuid && <div>{wm.uuid}</div>}
        </div>
      )}
      <div className={styles.officialContentFlex}>
        <div className={`${styles.violationsTopRow} ${styles.bilingualHeaderBand} ${styles.scheduleHeaderBand}`}>
          <div className={`${styles.violationsTopEn} ${styles.scheduleHeaderEn} ${styles.arabicShapedText}`}>
            {OFFICIAL_HEADER.ministryEn}
            <br />
            {OFFICIAL_HEADER.corpsEn}
          </div>
          <img src={OFFICIAL_HEADER.logoUrl} alt="" className={styles.dailyLogo} />
          <div className={`${styles.violationsTopAr} ${styles.scheduleHeaderAr} ${styles.arabicShapedText}`}>
            {OFFICIAL_HEADER.ministryAr}
            <br />
            {OFFICIAL_HEADER.corpsAr}
          </div>
        </div>

        <div className={styles.scheduleTitleBar}>
          <div className={styles.scheduleTitleMain}>{title}</div>
          <div className={styles.scheduleTitleSubRow}>
            <span className={styles.scheduleTitleSub}>{titleLine}</span>
          </div>
        </div>

        <div className={styles.scheduleTableWrap}>
        <table className={`${styles.officialTable} ${styles.weeklyScheduleTable}`}>
          <colgroup>
            <col style={{ width: `${DAY_COL_PCT}%` }} />
            <col style={{ width: `${LABEL_COL_PCT}%` }} />
            {dataColWidths.map((width, idx) => (
              <col key={columns[idx]?.key || idx} style={{ width: `${width}%` }} />
            ))}
          </colgroup>
          <thead>
            <tr className={styles.scheduleHeaderRow}>
              <th className={styles.scheduleCornerCell}>
                <div className={styles.scheduleVerticalInset}>
                  <VerticalText>{isAr ? 'اليوم' : 'Day'}</VerticalText>
                </div>
              </th>
              <th className={styles.scheduleCornerCell} />
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={[
                    col.isBreak ? styles.scheduleBreakHeader : styles.scheduleLectureHeader,
                    col.isBreak || isOfficeHourColumn(col) ? styles.scheduleNarrowHeader : '',
                  ].filter(Boolean).join(' ')}
                >
                  {col.isBreak ? (
                    <div className={styles.scheduleVerticalInset}>
                      <VerticalText compact className={styles.scheduleBreakHeaderLabel}>{col.label}</VerticalText>
                    </div>
                  ) : (
                    <span className={isOfficeHourColumn(col) ? styles.scheduleOfficeHeaderLabel : undefined}>
                      {col.label}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <DayBlock
                key={day.dayLabel}
                day={day}
                columns={columns}
                rowLabels={rowLabels}
              />
            ))}
          </tbody>
        </table>
        </div>

        <div className={styles.certificateBottomBlock}>
          <div className={styles.officialPageFooter}>
            <span>{isAr ? 'الرقم التسلسلي' : 'Serial'}: <bdi>{serial}</bdi></span>
            <span>{isAr ? 'تاريخ الإصدار' : 'Generated'}: {genDateTime}</span>
            <span>{isAr ? 'صفحة' : 'Page'} 1 / 1</span>
          </div>
        </div>
      </div>
    </div>
  );
}
