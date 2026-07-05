import React from 'react';
import { OFFICIAL_HEADER } from '../shared/officialHeader.js';
import { buildWatermarkLines } from '../engine/watermark.js';
import styles from './officialReport.module.css';

export function AttendanceWarningTemplate({ data, showWatermark = true }) {
  const { pages, lang, serial, isAr } = data;
  const wm = buildWatermarkLines(data.watermarkUser);

  return (
    <>
      {pages.map((page) => (
        <div
          key={page.studentId}
          data-official-page
          className={`${styles.officialPage} ${isAr ? styles.officialPageRtl : ''} ${styles.arabicShapedText}`}
          lang={isAr ? 'ar' : 'en'}
          style={{ border: '3px double #333', padding: 28 }}
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

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <img src={OFFICIAL_HEADER.logoUrl} alt="" style={{ width: 72, height: 72, objectFit: 'contain' }} />
              <div style={{ textAlign: isAr ? 'left' : 'right', fontSize: 11, lineHeight: 1.6 }}>
                <div>{OFFICIAL_HEADER.corpsAr.split('/')[0]?.trim()}</div>
                <div>{isAr ? 'مدرسة الإشارة' : 'Signal School'}</div>
              </div>
            </div>

            <div style={{
              textAlign: 'center',
              border: '2px solid #333',
              padding: '8px 16px',
              margin: '12px auto 20px',
              maxWidth: 280,
              color: '#b91c1c',
              fontWeight: 800,
              fontSize: 18,
            }}
            >
              {page.title}
            </div>

            <div style={{ fontSize: 12, lineHeight: 2, marginBottom: 20 }}>
              {[
                [isAr ? 'الرقم' : 'Number', page.studentNumber],
                [isAr ? 'الرتبة' : 'Rank', page.rank],
                [isAr ? 'الإسم' : 'Name', page.studentName],
                [isAr ? 'الدورة' : 'Program', page.programName],
                [isAr ? 'المادة' : 'Subject', page.subjectName],
              ].map(([label, value]) => (
                <div key={label}>
                  <span style={{ color: '#b91c1c', fontWeight: 700 }}>{label}</span>
                  <span> : </span>
                  <span>{value}</span>
                </div>
              ))}
            </div>

            <p style={{
              fontSize: 13,
              lineHeight: 1.9,
              textAlign: 'justify',
              margin: '24px 0 48px',
              padding: '0 8px',
            }}
            >
              {page.body}
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 40 }}>
              <div style={{ textAlign: 'center', fontSize: 11, minWidth: 200 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{page.signerTitle}</div>
                <div>({page.signerName})</div>
                <div style={{ marginTop: 36, borderTop: '1px solid #333', minWidth: 160 }} />
              </div>
              <div style={{ fontSize: 11, color: '#333' }}>
                {isAr ? 'التاريخ : / / ٢٠٢٥ م' : 'Date: ___ / ___ / 2025'}
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
