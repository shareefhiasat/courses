import React from 'react';
import { OFFICIAL_HEADER } from '../shared/officialHeader.js';
import { buildWatermarkLines } from '../engine/watermark.js';
import styles from './officialReport.module.css';

function CellContent({ children, className }) {
  return (
    <div className={`${styles.scheduleCellInner} ${className || ''}`}>
      {children}
    </div>
  );
}

function VerticalText({ children, className, compact }) {
  return (
    <div className={compact ? styles.scheduleBreakVerticalWrap : styles.scheduleVerticalTextWrap}>
      <span className={`${styles.scheduleVerticalText} ${className || ''}`}>
        {children}
      </span>
    </div>
  );
}

function SlotCell({ slot, rowType, isBreak }) {
  if (isBreak) {
    if (rowType !== 'subject') return null;
    return (
      <td className={styles.scheduleBreakCell} rowSpan={4}>
        <CellContent>
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
    rowType === 'room' ? styles.scheduleRoomCell : '',
  ].filter(Boolean).join(' ');

  return (
    <td className={cellClass}>
      <CellContent>{value || (rowType === 'instructor' ? '' : '—')}</CellContent>
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
              <VerticalText>{day.dayLabel}</VerticalText>
            </td>
          )}
          <td className={styles.scheduleRowLabelCell}>
            <CellContent>{rowLabelMap[rowType]}</CellContent>
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

  const genDateTime = new Date().toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const metaLine = [batch, year && term ? `${year} / ${term}` : year || term]
    .filter(Boolean)
    .join(' — ');

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
          {wm.uuid && <div style={{ fontSize: '7px', opacity: 0.5, marginTop: '12px' }}>{wm.uuid}</div>}
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
            <span className={styles.scheduleTitleSub}>{subtitle}</span>
            {metaLine && (
              <>
                <span className={styles.scheduleTitleSep}>|</span>
                <span className={styles.scheduleTitleMeta}>{metaLine}</span>
              </>
            )}
          </div>
        </div>

        <div className={styles.scheduleTableWrap}>
        <table className={`${styles.officialTable} ${styles.weeklyScheduleTable}`}>
          <colgroup>
            <col style={{ width: '2.8%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '19.5%' }} />
            <col style={{ width: '3.2%' }} />
            <col style={{ width: '19.5%' }} />
            <col style={{ width: '3.2%' }} />
            <col style={{ width: '19.5%' }} />
            <col style={{ width: '14%' }} />
          </colgroup>
          <thead>
            <tr className={styles.scheduleHeaderRow}>
              <th className={styles.scheduleCornerCell}>{isAr ? 'اليوم' : 'Day'}</th>
              <th className={styles.scheduleCornerCell} />
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={col.isBreak ? styles.scheduleBreakHeader : styles.scheduleLectureHeader}
                >
                  {col.label}
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
            <span>{isAr ? 'الرقم التسلسلي' : 'Serial'}: {serial}</span>
            <span>{isAr ? 'تاريخ الإصدار' : 'Generated'}: {genDateTime}</span>
            <span>{isAr ? 'صفحة' : 'Page'} 1 / 1</span>
          </div>
        </div>
      </div>
    </div>
  );
}
