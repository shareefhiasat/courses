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

const META_LABELS = {
  ar: {
    date: 'التاريخ',
    serial: 'الرقم التسلسلي',
    program: 'البرنامج',
    subject: 'المادة',
    class: 'الفصل',
    instructor: 'المدرب',
    yearTerm: 'السنة / الفصل الدراسي',
  },
  en: {
    date: 'Date',
    serial: 'Serial',
    program: 'Program',
    subject: 'Subject',
    class: 'Class',
    instructor: 'Instructor',
    yearTerm: 'Year / Term',
  },
};

function MetaItem({ label, value, align = 'start', mirrored = false }) {
  const alignClass =
    align === 'end' ? styles.metaItemEnd : align === 'center' ? styles.metaItemCenter : styles.metaItemStart;

  if (mirrored) {
    return (
      <div className={`${styles.metaItem} ${alignClass} ${styles.metaItemMirrored}`}>
        <span className={styles.metaValue}>{value}</span>
        <span className={styles.metaSep}>:</span>
        <span className={styles.metaLabel}>{label}</span>
      </div>
    );
  }

  return (
    <div className={`${styles.metaItem} ${alignClass}`}>
      <span className={styles.metaLabel}>{label}</span>
      <span className={styles.metaSep}>:</span>
      <span className={styles.metaValue}>{value}</span>
    </div>
  );
}

export function DailyOfficialTemplate({ data, showWatermark = true }) {
  const { header, rows, lang, statusKeys, serial } = data;
  const labels = COLUMN_LABELS[lang] || COLUMN_LABELS.ar;
  const statusLabels = STATUS_LABELS[lang] || STATUS_LABELS.ar;
  const meta = META_LABELS[lang] || META_LABELS.ar;
  const wm = buildWatermarkLines(data.watermarkUser);
  const isAr = lang === 'ar';

  const metaRows = [
    [
      { label: meta.date, value: header.date },
      { label: meta.serial, value: serial },
    ],
    [
      { label: meta.program, value: header.program },
      { label: meta.subject, value: header.subject },
    ],
    [
      { label: meta.class, value: header.className },
      { label: meta.instructor, value: header.instructor || '—' },
    ],
  ];

  if (header.year || header.term) {
    metaRows.push([
      {
        label: meta.yearTerm,
        value: [header.year, header.term].filter(Boolean).join(' / '),
      },
      null,
    ]);
  }

  return (
    <div
      data-official-page
      className={`${styles.officialPage} ${isAr ? styles.officialPageRtl : ''} ${styles.arabicShapedText}`}
      lang={isAr ? 'ar' : 'en'}
    >
      {showWatermark && (wm.en || wm.ar || wm.uuid) && (
        <div className={styles.officialWatermark} aria-hidden>
          {wm.en && <div>{wm.en}</div>}
          {wm.ar && wm.ar !== wm.en && <div>{wm.ar}</div>}
          {wm.uuid && <div style={{ fontSize: '7px', opacity: 0.5, marginTop: '12px' }}>{wm.uuid}</div>}
        </div>
      )}
      <div className={styles.officialContent}>
        <div className={styles.serialLine}>
          {isAr ? 'الرقم التسلسلي' : 'Serial'}: {serial}
        </div>

        {/* Bilingual header — always EN left, AR right (LTR band) */}
        <div className={`${styles.violationsTopRow} ${styles.bilingualHeaderBand}`}>
          <div className={`${styles.violationsTopEn} ${styles.arabicShapedText}`}>
            {OFFICIAL_HEADER.ministryEn}
            <br />
            {OFFICIAL_HEADER.corpsEn}
          </div>
          <img src={OFFICIAL_HEADER.logoUrl} alt="" className={styles.dailyLogo} />
          <div className={`${styles.violationsTopAr} ${styles.arabicShapedText}`}>
            {OFFICIAL_HEADER.ministryAr}
            <br />
            {OFFICIAL_HEADER.corpsAr}
          </div>
        </div>

        <div className={styles.dailyTitleBar}>{data.title}</div>

        <div className={styles.dailyMetaGrid}>
          {metaRows.map((pair, rowIdx) => (
            <React.Fragment key={rowIdx}>
              {pair[0] && (
                <MetaItem
                  label={pair[0].label}
                  value={pair[0].value}
                  align="start"
                  mirrored={false}
                />
              )}
              {pair[1] && (
                <MetaItem
                  label={pair[1].label}
                  value={pair[1].value}
                  align="end"
                  mirrored
                />
              )}
            </React.Fragment>
          ))}
        </div>

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
                <td className={styles.notesCell}>{row.notes || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DailyOfficialTemplate;
