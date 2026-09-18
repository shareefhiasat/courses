import React from 'react';
import { OFFICIAL_HEADER } from '../shared/officialHeader.js';
import { buildWatermarkLines, buildStatusWatermark } from '../engine/watermark.js';
import { getLocalizedUserName } from '@utils/localizedUserName.js';
import styles from './officialReport.module.css';

const STATUS_LABELS = {
  ar: {
    present: 'متواجد',
    absent: 'غائب',
    humanCase: 'حالة إنسانية',
    excusedLeave: 'إجازة بعذر',
  },
  en: {
    present: 'Present',
    absent: 'Absent',
    humanCase: 'Human case',
    excusedLeave: 'Excused Leave',
  },
};

const COLUMN_LABELS = {
  ar: { serial: 'ت', name: 'اسم الطالب', number: 'الرقم العسكري', notes: 'ملاحظات', participation: 'المشاركة' },
  en: { serial: '#', name: 'Student Name', number: 'Military No.', notes: 'Notes', participation: 'Participation' },
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

const COUNT_LABELS = {
  ar: {
    present: 'حاضر',
    absent: 'غائب',
    humanCase: 'حالة إنسانية',
    excusedLeave: 'إجازة بعذر',
    notTaken: 'لم يُسجل',
    late: 'متأخر',
  },
  en: {
    present: 'Present',
    absent: 'Absent',
    humanCase: 'Human Case',
    excusedLeave: 'Excused Leave',
    notTaken: 'Not Taken',
    late: 'Late',
  },
};

function displayMetaValue(value, lang) {
  if (value == null || value === '') return null;
  if (typeof value === 'object') return getLocalizedUserName(value, lang, '—');
  return String(value);
}

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
  const { header, rows, lang, statusKeys, serial, generatedAt, counts = {} } = data;
  const labels = COLUMN_LABELS[lang] || COLUMN_LABELS.ar;
  const statusLabels = STATUS_LABELS[lang] || STATUS_LABELS.ar;
  const meta = META_LABELS[lang] || META_LABELS.ar;
  const countLabels = COUNT_LABELS[lang] || COUNT_LABELS.ar;
  const wm = buildWatermarkLines(data.watermarkUser);
  const statusWm = buildStatusWatermark(data.watermarkStatus, data.approvedByUser, lang, data.approvedAt, data.watermarkUser, data.serial);
  const isAr = lang === 'ar';

  const baseEntries = Object.entries(counts.base || {}).map(([key, value]) => ({
    key,
    label: countLabels[key],
    value,
  }));
  const extraEntries = Object.entries(counts.extra || {})
    .filter(([, value]) => value > 0)
    .map(([key, value]) => ({ key, label: countLabels[key], value }));

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
      { label: meta.class, value: displayMetaValue(header.className, lang) || '—' },
      { label: meta.instructor, value: displayMetaValue(header.instructor, lang) || '—' },
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
      {showWatermark && statusWm && (
        <div className={`${styles.officialWatermark} ${statusWm.status !== 'approved' ? styles.officialWatermarkDraft : ''} ${statusWm.status === 'approved' ? styles.officialWatermarkApproved : ''}`} style={{ color: statusWm.color }} aria-hidden>
          <>
            {statusWm.en && String(statusWm.en).split(' — ').map((line, i) => <div key={`e-${i}`}>{line}</div>)}
            {statusWm.ar && statusWm.ar !== statusWm.en && String(statusWm.ar).split(' — ').map((line, i) => <div key={`a-${i}`}>{line}</div>)}
          </>
        </div>
      )}
      {showWatermark && !statusWm && (wm.en || wm.ar || wm.uuid) && (
        <div className={styles.officialWatermark} aria-hidden>
          {wm.en && <div>{wm.en}</div>}
          {wm.ar && wm.ar !== wm.en && <div>{wm.ar}</div>}
          {wm.uuid && <div>{wm.uuid}</div>}
        </div>
      )}
      <div className={styles.officialContentFlex}>
        <div className={styles.serialLine} dir={isAr ? 'rtl' : 'ltr'}>
          {isAr ? 'الرقم التسلسلي' : 'Serial'}: <bdi dir="ltr">{serial}</bdi>
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

        <div className={styles.dailyOfficialTableWrap}>
        <table className={styles.officialTable}>
          <thead>
            <tr>
              <th>{labels.serial}</th>
              <th className={styles.nameCell}>{labels.name}</th>
              <th>{labels.number}</th>
              {statusKeys.map((key) => (
                <th key={key}>{statusLabels[key]}</th>
              ))}
              {data.showNotesColumn !== false && <th>{labels.notes}</th>}
              {data.showParticipationColumn !== false && <th>{labels.participation}</th>}
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
                {data.showNotesColumn !== false && <td className={styles.notesCell}>{row.notes || ''}</td>}
                {data.showParticipationColumn !== false && <td className={styles.notesCell}>{row.participation || ''}</td>}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {(baseEntries.length > 0 || extraEntries.length > 0) && (
          <div className={styles.dailyCountSummary} dir={isAr ? 'rtl' : 'ltr'}>
            {[...baseEntries, ...extraEntries].map(({ key, label, value }) => (
              <span key={key} className={styles.dailyCountItem}>
                {isAr ? `${value} ${label}` : `${label}: ${value}`}
              </span>
            ))}
          </div>
        )}
        <div className={styles.officialFooter}>
          {generatedAt && (
            <span style={{ fontSize: '10px', color: '#6b7280' }}>
              {isAr ? 'تم التوليد' : 'Generated'}: {generatedAt}
            </span>
          )}
          {statusWm && (
            <span style={{
              fontSize: '10px',
              fontWeight: 700,
              color: statusWm.color,
            }}>
              {isAr ? statusWm.ar : statusWm.en}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default DailyOfficialTemplate;
