import React from 'react';
import { OFFICIAL_HEADER } from '../shared/officialHeader.js';
import { buildWatermarkLines } from '../engine/watermark.js';
import styles from './officialReport.module.css';

const SIGNATURE_BLOCKS = [
  {
    titleAr: 'المقدم (الركن) / رئيس شعبة تقنية المعلومات',
    titleEn: 'Lt. Col. (Staff) / Head of IT Branch',
    nameAr: 'مشعل علي الرويسي',
    nameEn: 'Mashal Ali Al-Ruwaissi',
  },
  {
    titleAr: 'العميد (الركن) / كبير المعلمين',
    titleEn: 'Brig. Gen. (Staff) / Chief Instructor',
    nameAr: 'عبدالله محمد مطر الكواري',
    nameEn: 'Abdullah Mohammed Matar Al-Kuwari',
  },
  {
    titleAr: 'العميد (الركن) / قائد مدرسة الإشارة وتقنية المعلومات',
    titleEn: 'Brig. Gen. (Staff) / Commander, Signal & IT School',
    nameAr: 'صلاح عتيق سلمان جمعة',
    nameEn: 'Salah Atiq Salman Juma',
  },
];

function MarkCell({ value, failed }) {
  const display = value == null || value === '' ? '—' : value;
  return (
    <td className={failed ? styles.failCell : undefined} style={failed ? { color: '#dc2626', fontWeight: 700 } : undefined}>
      {display}
    </td>
  );
}

export function SemesterCertificateTemplate({ data, showWatermark = true }) {
  const { subjects, rows, lang, serial, title, subtitle, gradingScale, meta } = data;
  const isAr = lang === 'ar';
  const wm = buildWatermarkLines(data.watermarkUser);

  return (
    <div
      data-official-page
      className={`${styles.officialPage} ${isAr ? styles.officialPageRtl : ''}`}
      style={{ width: '1123px', minHeight: '794px' }}
    >
      {showWatermark && (wm.en || wm.ar || wm.uuid) && (
        <div className={styles.officialWatermark} aria-hidden>
          {wm.en && <div>{wm.en}</div>}
          {wm.ar && wm.ar !== wm.en && <div>{wm.ar}</div>}
          {wm.uuid && <div style={{ fontSize: '7px', opacity: 0.5, marginTop: '12px' }}>{wm.uuid}</div>}
        </div>
      )}
      <div className={styles.officialContent}>
        <div className={styles.dailyHeaderBand}>
          <div style={{ textAlign: isAr ? 'right' : 'left', fontSize: 10, lineHeight: 1.4 }}>
            <div>{OFFICIAL_HEADER.ministryEn}</div>
            <div>{OFFICIAL_HEADER.corpsEn}</div>
          </div>
          <img src={OFFICIAL_HEADER.logoUrl} alt="" className={styles.dailyLogo} />
          <div style={{ textAlign: isAr ? 'left' : 'right', fontSize: 10, lineHeight: 1.4 }}>
            <div>{OFFICIAL_HEADER.ministryAr}</div>
            <div>{OFFICIAL_HEADER.corpsAr}</div>
          </div>
        </div>

        <div style={{ textAlign: 'center', margin: '8px 0' }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{subtitle}</div>
          <div style={{ fontWeight: 700, fontSize: 13, marginTop: 4 }}>{title}</div>
          <div style={{ fontSize: 10, color: '#555', marginTop: 4 }}>
            {isAr ? 'الرقم التسلسلي' : 'Serial'}: {serial}
            {' · '}
            {[meta?.year, meta?.term].filter(Boolean).join(' / ')}
          </div>
        </div>

        <table className={styles.officialTable} style={{ fontSize: 9, width: '100%' }}>
          <thead>
            <tr>
              <th>{isAr ? 'م' : '#'}</th>
              <th>{isAr ? 'الرقم' : 'ID'}</th>
              <th>{isAr ? 'الرتبة' : 'Rank'}</th>
              <th>{isAr ? 'الاسم' : 'Name'}</th>
              {subjects.map((s) => (
                <th key={s.id}>{s.name}</th>
              ))}
              <th>{isAr ? 'المعدل الفصلي' : 'Semester GPA'}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.studentId}>
                <td>{row.serial}</td>
                <td>{row.studentNumber}</td>
                <td>{row.rank}</td>
                <td style={{ textAlign: isAr ? 'right' : 'left', minWidth: 120 }}>{row.studentName}</td>
                {subjects.map((s) => {
                  const m = row.subjectMarks[s.id];
                  return (
                    <MarkCell
                      key={s.id}
                      value={m ? `${m.totalMarks}${m.letterGrade ? ` (${m.letterGrade})` : ''}` : '—'}
                      failed={m?.failed}
                    />
                  );
                })}
                <td style={{ fontWeight: 700 }}>{row.semesterGpa?.toFixed?.(2) ?? row.semesterGpa}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: 16, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <table className={styles.officialTable} style={{ fontSize: 9, flex: '0 0 280px' }}>
            <thead>
              <tr>
                <th colSpan={2}>{isAr ? 'التقدير' : 'Grade'}</th>
              </tr>
            </thead>
            <tbody>
              {gradingScale.map((g) => (
                <tr key={g.letter}>
                  <td>{isAr ? g.descriptionAr : g.description}</td>
                  <td>{g.min} — {g.max >= 100 ? 100 : g.max}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 24 }}>
            {SIGNATURE_BLOCKS.map((sig) => (
              <div key={sig.titleEn} style={{ textAlign: 'center', fontSize: 9, flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{isAr ? sig.titleAr : sig.titleEn}</div>
                <div style={{ marginTop: 4 }}>({isAr ? sig.nameAr : sig.nameEn})</div>
                <div style={{ marginTop: 28, borderTop: '1px solid #333', minWidth: 120 }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
