import React from 'react';
import { OFFICIAL_HEADER } from '../shared/officialHeader.js';
import { buildWatermarkLines } from '../engine/watermark.js';
import { formatMark } from '../shared/roundMarks.js';
import styles from './officialReport.module.css';

const HIGHLIGHT_BG = '#fff9f2';

function MarkCell({ value, failed, highlight, align = 'center' }) {
  const style = {
    textAlign: align,
    verticalAlign: 'middle',
    ...(failed ? { color: '#dc2626', fontWeight: 700 } : {}),
    ...(highlight ? { background: HIGHLIGHT_BG } : {}),
  };
  const display = value == null || value === '' ? '—' : value;
  return <td style={style}>{display}</td>;
}

export function ClassSubjectMarksTemplate({ data, showWatermark = true }) {
  const { rows, lang, serial, title, distribution, meta } = data;
  const isAr = lang === 'ar';
  const d = distribution || {};
  const wm = buildWatermarkLines(data.watermarkUser);

  const columns = [
    { key: 'homework', labelAr: 'الواجبات', labelEn: 'Assignments', weight: d.homework },
    { key: 'participation', labelAr: 'المشاركة', labelEn: 'Participation', weight: d.participation },
    { key: 'quizzes', labelAr: 'امتحانات قصيرة', labelEn: 'Quizzes', weight: d.quizzes },
    { key: 'labsProjectResearch', labelAr: 'بحث', labelEn: 'Research', weight: d.labsProjectResearch },
    { key: 'attendance', labelAr: 'الحضور', labelEn: 'Attendance', weight: d.attendance },
    { key: 'midTermExam', labelAr: 'الامتحان الفصلي', labelEn: 'Midterm', weight: d.midTermExam },
  ];

  const continuousWeight =
    (d.homework || 0) + (d.participation || 0) + (d.quizzes || 0) +
    (d.labsProjectResearch || 0) + (d.attendance || 0) + (d.midTermExam || 0);

  return (
    <div
      data-official-page
      data-page-orientation="landscape"
      className={`${styles.officialPage} ${styles.officialPageLandscape} ${isAr ? styles.officialPageRtl : ''} ${styles.arabicShapedText}`}
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

        <div style={{ textAlign: 'center', margin: '8px 0 10px' }}>
          <div style={{ color: '#b91c1c', fontWeight: 700, fontSize: 13 }}>
            {isAr ? 'البرنامج' : 'Program'}: {meta?.program}
          </div>
          <div style={{ fontWeight: 700, fontSize: 14, marginTop: 4 }}>
            {isAr ? 'المادة' : 'Subject'}: {meta?.subject}
          </div>
          {meta?.className && (
            <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>{meta.className}</div>
          )}
        </div>

        <table className={`${styles.officialTable} ${styles.marksTableVAlign} ${styles.marksTableNoHeaderGray}`} style={{ fontSize: 8, width: '100%' }}>
          <thead>
            <tr>
              <th>{isAr ? 'م' : '#'}</th>
              <th className={styles.nameCell}>{isAr ? 'اسم الطالب' : 'Student'}</th>
              <th>{isAr ? 'السنة' : 'Year'}</th>
              <th>{isAr ? 'الفصل' : 'Term'}</th>
              {columns.map((c) => (
                <th key={c.key}>
                  {isAr ? `${c.labelAr} (${c.weight}%)` : `${c.labelEn} (${c.weight}%)`}
                </th>
              ))}
              <th style={{ background: HIGHLIGHT_BG }}>
                {isAr ? `المجموع (${continuousWeight}%)` : `Subtotal (${continuousWeight}%)`}
              </th>
              <th>{isAr ? `النهائي (${d.finalExam}%)` : `Final (${d.finalExam}%)`}</th>
              <th style={{ background: HIGHLIGHT_BG }}>
                {isAr ? 'المجموع الكلي (100%)' : 'Total (100%)'}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.rowKey || `${row.studentId}-${row.year}-${row.term}`}>
                <td style={{ verticalAlign: 'middle', textAlign: 'center' }}>{row.serial}</td>
                <td className={styles.nameCell} style={{ verticalAlign: 'middle' }}>{row.studentName}</td>
                <MarkCell value={row.year} align="center" />
                <MarkCell value={row.term} align="center" />
                {columns.map((c) => (
                  <MarkCell key={c.key} value={formatMark(row[c.key])} align="center" />
                ))}
                <MarkCell value={formatMark(row.continuousTotal)} highlight align="center" />
                <MarkCell value={formatMark(row.finalExam)} align="center" />
                <MarkCell
                  value={formatMark(row.grandTotal)}
                  failed={row.failed}
                  highlight
                  align="center"
                />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
