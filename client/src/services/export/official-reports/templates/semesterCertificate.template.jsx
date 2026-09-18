import React from 'react';
import { getLocalizedTermDisplay } from '@constants/gradingStandards';
import { OFFICIAL_HEADER } from '../shared/officialHeader.js';
import { buildWatermarkLines } from '../engine/watermark.js';
import { formatDateTime } from '@utils/date-formatter.js';
import styles from './officialReport.module.css';

const SIGNATURE_BLOCKS = [
  {
    titleAr: 'المقدم (الركن) / رئيس شعبة تقنية المعلومات',
    titleEn: 'Lt. Col. (Staff) / Head of IT Branch',
    nameAr: 'مشعل علي الرويلي',
    nameEn: 'Mashal Ali Al-Ruwaili',
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

function MarkCell({ value, failed, originalMark, previousAttempt, complementaryScore, gradeType, isAr }) {
  const display = value == null || value === '' ? '—' : value;
  const isComplementary = gradeType === 'complementary';
  const orig = originalMark ?? previousAttempt?.totalMarks;
  const origLabel = isAr ? 'أصلي' : 'Orig';
  return (
    <td className={failed ? styles.failCell : undefined} style={failed ? { color: '#dc2626', fontWeight: 700 } : undefined}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, fontSize: 'inherit' }}>
        <span>{display}</span>
        {orig != null && orig !== '' && !Number.isNaN(Number(orig)) && (
          <span style={{ fontSize: '0.75em', opacity: 0.7, whiteSpace: 'nowrap' }}>
            {origLabel}: {Number(orig).toFixed(2)}{previousAttempt?.letterGrade ? ` (${previousAttempt.letterGrade})` : ''}
          </span>
        )}
        {isComplementary && complementaryScore != null && (
          <span style={{ fontSize: '0.75em', opacity: 0.65, whiteSpace: 'nowrap' }}>
            {isAr ? 'تكميلي' : 'Comp'}: {complementaryScore}/100
          </span>
        )}
      </div>
    </td>
  );
}

const ROWS_PER_PAGE = 6;

export function SemesterCertificateTemplate({ data, showWatermark = true }) {
  const { subjects, rows, lang, serial, title, subtitle, gradingScale, meta } = data;
  const isAr = lang === 'ar';
  const wm = buildWatermarkLines(data.watermarkUser);

  const genDateTime = formatDateTime(new Date(), isAr ? 'ar' : 'en');

  const pageChunks = [];
  for (let i = 0; i < rows.length; i += ROWS_PER_PAGE) {
    pageChunks.push(rows.slice(i, i + ROWS_PER_PAGE));
  }
  if (pageChunks.length === 0) pageChunks.push([]);
  const totalPages = pageChunks.length;

  return (
    <>
      {pageChunks.map((pageRows, pageIndex) => {
        const isLastPage = pageIndex === totalPages - 1;
        return (
          <div
            key={`sc-page-${pageIndex}`}
            data-official-page
            data-page-orientation="landscape"
            className={`${styles.officialPage} ${styles.officialPageLandscapeCert} ${isAr ? styles.officialPageRtl : ''}`}
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
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto 1fr',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 14px',
                  marginBottom: 8,
                  background: 'transparent',
                  border: 'none',
                }}
              >
                <div style={{ textAlign: isAr ? 'right' : 'left', fontSize: 10, lineHeight: 1.4 }}>
                  <div>{OFFICIAL_HEADER.ministryEn}</div>
                  <div>{OFFICIAL_HEADER.corpsEn}</div>
                </div>
                <img src={OFFICIAL_HEADER.logoUrl} alt="" style={{ width: 56, height: 56, objectFit: 'contain', justifySelf: 'center' }} />
                <div style={{ textAlign: isAr ? 'left' : 'right', fontSize: 10, lineHeight: 1.4 }}>
                  <div>{OFFICIAL_HEADER.ministryAr}</div>
                  <div>{OFFICIAL_HEADER.corpsAr}</div>
                </div>
              </div>

              <div style={{ textAlign: 'center', margin: '8px 0' }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{subtitle}</div>
                <div style={{ fontWeight: 700, fontSize: 13, marginTop: 4 }}>{title}</div>
              </div>

              <table className={`${styles.officialTable} ${styles.semesterCertTable}`} style={{ width: '100%', tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: '32px' }} />
                  <col style={{ width: '55px' }} />
                  <col style={{ width: '75px' }} />
                  <col style={{ width: '170px' }} />
                  {subjects.map((s) => (
                    <col key={s.id} style={{ width: '108px' }} />
                  ))}
                  <col style={{ width: '50px' }} />
                </colgroup>
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
                  {pageRows.map((row) => (
                    <tr key={row.studentId}>
                      <td>{row.serial}</td>
                      <td>{row.studentNumber}</td>
                      <td>{row.rank}</td>
                      <td style={{ textAlign: isAr ? 'right' : 'left' }}>{row.studentName}</td>
                      {subjects.map((s) => {
                        const m = row.subjectMarks[s.id];
                        return (
                          <MarkCell
                            key={s.id}
                            value={m ? `${Number(m.totalMarks).toFixed(2)}${m.letterGrade ? ` (${m.letterGrade})` : ''}` : '—'}
                            failed={m?.failed}
                            originalMark={m?.originalMark}
                            previousAttempt={m?.previousAttempt}
                            complementaryScore={m?.complementaryScore}
                            gradeType={m?.gradeType}
                            isAr={isAr}
                          />
                        );
                      })}
                      <td style={{ fontWeight: 700 }}>{row.semesterGpa?.toFixed?.(2) ?? row.semesterGpa}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className={styles.certificateBottomBlock}>
                {isLastPage && (
                  <div className={styles.certificateFooterRow}>
                    <table className={`${styles.officialTable} ${styles.gradeLookupTable}`}>
                      <thead>
                        <tr>
                          <th colSpan={2}>{isAr ? 'التقدير' : 'Grade'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gradingScale.map((g) => (
                          <tr key={g.letter}>
                            <td>{isAr ? g.descriptionAr : g.description}</td>
                            <td style={{ whiteSpace: 'nowrap' }}>{g.min} — {g.max >= 100 ? 100 : g.max}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className={styles.certificateSignatures}>
                      {SIGNATURE_BLOCKS.map((sig) => (
                        <div key={sig.titleEn} className={styles.certificateSignatureBlock}>
                          <div style={{ fontWeight: 700 }}>{isAr ? sig.titleAr : sig.titleEn}</div>
                          <div style={{ marginTop: 4 }}>({isAr ? sig.nameAr : sig.nameEn})</div>
                          <div style={{ marginTop: 48, borderTop: '1px solid #333', minWidth: 100 }} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className={styles.officialPageFooter}>
                  <span>{isAr ? 'الرقم التسلسلي' : 'Serial'}: {serial}</span>
                  <span>{isAr ? 'تاريخ الإصدار' : 'Generated'}: {genDateTime}</span>
                  <span>{isAr ? 'صفحة' : 'Page'} {pageIndex + 1} / {totalPages}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
