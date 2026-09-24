import React from 'react';
import { OFFICIAL_HEADER } from '../shared/officialHeader.js';
import { buildWatermarkLines, buildStatusWatermark } from '../engine/watermark.js';
import { formatDate, formatDateTime } from '@utils/date-formatter.js';
import styles from './officialReport.module.css';

export function AttendanceWarningTemplate({ data, showWatermark = true }) {
  const { pages, lang, serial } = data;
  const statusWm = data.watermarkStatus
    ? buildStatusWatermark(data.watermarkStatus, data.approvedByUser, data.lang, data.approvedAt, data.watermarkUser, data.serial)
    : null;
  const fallbackWm = buildWatermarkLines(data.watermarkUser);
  const wm = statusWm || fallbackWm;

  return (
    <>
      {pages.map((page, i) => {
        const isAr = page.isAr;
        const genDateTime = formatDateTime(new Date(), isAr ? 'ar' : 'en');

        return (
          <div
            key={`${page.studentId}-${page.lang}`}
            data-official-page
            className={`${styles.officialPage} ${isAr ? styles.officialPageRtl : ''} ${styles.arabicShapedText}`}
            lang={isAr ? 'ar' : 'en'}
          >
          {showWatermark && (wm.en || wm.ar || wm.uuid) && (
            <div className={`${styles.officialWatermark} ${wm?.status === 'approved' ? styles.officialWatermarkApproved : ''} ${wm?.status && wm?.status !== 'approved' ? styles.officialWatermarkDraft : ''}`} style={{ color: wm?.color }} aria-hidden>
              {wm.en && String(wm.en).split(' — ').map((line, i) => <div key={`e-${i}`}>{line}</div>)}
              {wm.ar && wm.ar !== wm.en && String(wm.ar).split(' — ').map((line, i) => <div key={`a-${i}`}>{line}</div>)}
              {wm.uuid && <div>{wm.uuid}</div>}
            </div>
          )}
          <div className={styles.officialContentFlex}>
            <div className={styles.serialLine}>
              {isAr ? 'الرقم التسلسلي' : 'Serial'}: <bdi>{serial}</bdi>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '8px 14px',
                marginBottom: 8,
                background: 'transparent',
                border: 'none',
              }}
            >
              <img src={OFFICIAL_HEADER.logoUrl} alt="" style={{ width: 48, height: 48, objectFit: 'contain' }} />
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  width: '100%',
                  gap: 12,
                  marginTop: 8,
                }}
              >
                <div style={{ textAlign: isAr ? 'right' : 'left', fontSize: 10, lineHeight: 1.4 }}>
                  <div>{OFFICIAL_HEADER.ministryEn}</div>
                  <div>{OFFICIAL_HEADER.corpsEn.split(' / ')[0]?.trim()}</div>
                  <div>{OFFICIAL_HEADER.corpsEn.split(' / ')[1]?.trim()}</div>
                </div>
                <div style={{ textAlign: isAr ? 'left' : 'right', fontSize: 10, lineHeight: 1.4 }}>
                  <div>{OFFICIAL_HEADER.ministryAr}</div>
                  <div>{OFFICIAL_HEADER.corpsAr.split(' / ')[0]?.trim()}</div>
                  <div>{OFFICIAL_HEADER.corpsAr.split(' / ')[1]?.trim()}</div>
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center', margin: '8px 0 16px' }}>
              <div style={{ fontWeight: 800, fontSize: 17, color: '#b91c1c' }}>{page.title}</div>
            </div>

            <div
              dir="ltr"
              style={{
                display: 'flex',
                gap: 16,
                fontSize: 12,
                lineHeight: 2,
                marginBottom: 24,
              }}
            >
              <div style={{ flex: 1, textAlign: isAr ? 'right' : 'left' }} dir={isAr ? 'rtl' : 'ltr'}>
                {[
                  [isAr ? 'الرقم' : 'Number', page.studentNumber],
                  [isAr ? 'الرتبة' : 'Rank', page.rank],
                  [isAr ? 'الإسم' : 'Name', page.studentName],
                ].map(([label, value]) => (
                  <div key={label}>
                    <span style={{ color: '#b91c1c', fontWeight: 700 }}>{label}: </span>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
              <div style={{ flex: 1, textAlign: isAr ? 'left' : 'right' }} dir={isAr ? 'rtl' : 'ltr'}>
                {[
                  [isAr ? 'الدورة' : 'Program', page.programName],
                  [isAr ? 'الشعبة' : 'Class', page.className],
                  [isAr ? 'المادة' : 'Subject', page.subjectName],
                ].map(([label, value]) => (
                  <div key={label}>
                    {isAr ? (
                      <>
                        <span style={{ color: '#b91c1c', fontWeight: 700 }}>{label}: </span>
                        <span>{value}</span>
                      </>
                    ) : (
                      <>
                        <span>{value}</span>
                        <span style={{ color: '#b91c1c', fontWeight: 700 }}> : {label}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.warningBody} style={{ textAlign: isAr ? 'right' : 'left' }}>
              {page.body}
            </div>

            {Array.isArray(page.absences) && page.absences.length > 0 && (
              <div style={{ marginBottom: 16 }} dir={isAr ? 'rtl' : 'ltr'}>
                <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 6, textAlign: isAr ? 'right' : 'left' }}>
                  {page.absenceDatesLabel}
                </div>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: 11,
                  }}
                >
                  <thead>
                    <tr>
                      <th style={{ border: '1px solid #999', padding: '4px 8px', textAlign: isAr ? 'right' : 'left', width: 40 }}>
                        {isAr ? '#' : '#'}
                      </th>
                      <th style={{ border: '1px solid #999', padding: '4px 8px', textAlign: isAr ? 'right' : 'left' }}>
                        {isAr ? 'التاريخ' : 'Date'}
                      </th>
                      <th style={{ border: '1px solid #999', padding: '4px 8px', textAlign: isAr ? 'right' : 'left' }}>
                        {isAr ? 'الحالة' : 'Status'}
                      </th>
                      <th style={{ border: '1px solid #999', padding: '4px 8px', textAlign: isAr ? 'right' : 'left' }}>
                        {isAr ? 'الاعتماد' : 'Approval'}
                      </th>
                      <th style={{ border: '1px solid #999', padding: '4px 8px', textAlign: isAr ? 'right' : 'left' }}>
                        {isAr ? 'ملاحظة' : 'Note'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {page.absences.map((absence, idx) => (
                      <tr key={`${absence.date?.toISOString?.() || idx}-${idx}`}>
                        <td style={{ border: '1px solid #999', padding: '4px 8px' }}>{idx + 1}</td>
                        <td style={{ border: '1px solid #999', padding: '4px 8px' }}>
                          <bdi>{formatDate(absence.date, 'en')}</bdi>
                        </td>
                        <td style={{ border: '1px solid #999', padding: '4px 8px' }}>
                          {page.absenceStatusLabels?.[absence.statusCode] || absence.statusCode || '—'}
                        </td>
                        <td style={{ border: '1px solid #999', padding: '4px 8px' }}>
                          {absence.excusedViaWorkflow
                            ? (isAr ? 'معتمد' : 'Approved')
                            : (isAr ? 'قيد الانتظار' : 'Pending')}
                        </td>
                        <td style={{ border: '1px solid #999', padding: '4px 8px' }}>
                          {absence.note || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className={styles.certificateBottomBlock}>
              <div className={styles.certificateFooterRow}>
                <div className={styles.certificateSignatures} style={{ justifyContent: 'flex-start' }}>
                  {page.signatures.map((sig) => (
                    <div
                      key={sig.titleEn}
                      className={styles.certificateSignatureBlock}
                      style={{
                        flex: 'none',
                        textAlign: isAr ? 'right' : 'left',
                        minWidth: 160,
                        maxWidth: 260,
                      }}
                    >
                      <div style={{ fontWeight: 700 }}>{isAr ? sig.titleAr : sig.titleEn}</div>
                      <div style={{ marginTop: 4 }}>({isAr ? sig.nameAr : sig.nameEn})</div>
                      <div style={{ marginTop: 48, borderTop: '1px solid #333', width: '100%' }} />
                    </div>
                  ))}
                </div>
              </div>

              <div
                className={styles.warningReceipt}
                style={{ flexDirection: isAr ? 'row-reverse' : 'row' }}
              >
                <div>
                  <span style={{ fontWeight: 700 }}>{page.studentSignatureLabel}</span>
                  <span style={{ margin: isAr ? '0 12px 0 0' : '0 0 0 12px' }}>..............................................</span>
                </div>
                <div style={{ textAlign: isAr ? 'right' : 'left' }}>
                  <span style={{ fontWeight: 700 }}>{page.handoverDateLabel}</span>
                  <span style={{ margin: isAr ? '0 12px 0 0' : '0 0 0 12px' }}>{page.handoverDateValue}</span>
                </div>
              </div>

              <div className={styles.officialPageFooter}>
                <span>{isAr ? 'الرقم التسلسلي' : 'Serial'}: <bdi>{serial}</bdi></span>
                <span>{isAr ? 'تاريخ الإصدار' : 'Generated'}: {genDateTime}</span>
                <span>{isAr ? 'صفحة' : 'Page'} {i + 1} / {pages.length}</span>
              </div>
            </div>
          </div>
        </div>
        );
      })}
    </>
  );
}
