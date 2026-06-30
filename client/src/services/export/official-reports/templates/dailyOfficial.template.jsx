import React from 'react';
import { OFFICIAL_HEADER } from '../shared/officialHeader.js';
import { buildWatermarkLines } from '../engine/watermark.js';
import styles from './officialReport.module.css';

const STATUS_LABELS = {
  ar: {
    present: 'متواجد',
    absent: 'غائب',
    humanCase: 'حالة إنسانية',
    late: 'متأخر',
  },
  en: {
    present: 'Present',
    absent: 'Absent',
    humanCase: 'Human case',
    late: 'Late',
  },
};

const COLUMN_LABELS = {
  ar: { serial: 'ت', name: 'اسم الطالب', number: 'الرقم العسكري', notes: 'ملاحظات' },
  en: { serial: '#', name: 'Student Name', number: 'Military No.', notes: 'Notes' },
};

export function DailyOfficialTemplate({ data, showWatermark = true }) {
  const { header, rows, lang, statusKeys, serial } = data;
  const labels = COLUMN_LABELS[lang] || COLUMN_LABELS.ar;
  const statusLabels = STATUS_LABELS[lang] || STATUS_LABELS.ar;
  const wm = buildWatermarkLines(data.watermarkUser);

  return (
    <div
      data-official-page
      className={`${styles.officialPage} ${lang === 'ar' ? styles.officialPageRtl : ''}`}
    >
      {showWatermark && (wm.en || wm.ar) && (
        <div className={styles.officialWatermark} aria-hidden>
          {wm.en}
          {'\n'}
          {wm.ar}
        </div>
      )}
      <div className={styles.officialContent}>
        <div className={styles.serialLine}>
          {lang === 'ar' ? 'الرقم التسلسلي' : 'Serial'}: {serial}
        </div>

        <div className={styles.dailyHeaderBand}>
          <div />
          <img src={OFFICIAL_HEADER.logoUrl} alt="" className={styles.dailyLogo} />
          <div />
        </div>

        <div className={styles.dailyMetaGrid}>
          <div>
            {lang === 'ar' ? 'التاريخ' : 'Date'}: {header.date}
          </div>
          <div>
            {lang === 'ar' ? 'البرنامج' : 'Program'}: {header.program}
          </div>
          {header.subject && (
            <div>
              {lang === 'ar' ? 'المادة' : 'Subject'}: {header.subject}
            </div>
          )}
          {header.className && (
            <div>
              {lang === 'ar' ? 'الفصل' : 'Class'}: {header.className}
            </div>
          )}
          {header.instructor && (
            <div>
              {lang === 'ar' ? 'المدرب' : 'Instructor'}: {header.instructor}
            </div>
          )}
          {(header.year || header.term) && (
            <div>
              {lang === 'ar' ? 'السنة / الفصل الدراسي' : 'Year / Term'}: {[header.year, header.term]
                .filter(Boolean)
                .join(' / ')}
            </div>
          )}
        </div>

        <div className={styles.dailyTitle}>{data.title}</div>

        <table className={styles.officialTable}>
          <thead>
            <tr>
              <th>{labels.serial}</th>
              <th className={styles.nameCell}>{labels.name}</th>
              <th>{labels.number}</th>
              {statusKeys.map((key) => (
                <th key={key}>{statusLabels[key]}</th>
              ))}
              <th>{labels.notes}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.serial}>
                <td>{row.serial}</td>
                <td className={styles.nameCell}>{row.studentName}</td>
                <td>{row.studentNumber}</td>
                {statusKeys.map((key) => (
                  <td key={key} className={styles.markCell}>
                    {row[key] ? '✓' : ''}
                  </td>
                ))}
                <td className={styles.notesCell}>{row.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DailyOfficialTemplate;
