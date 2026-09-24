import React from 'react';
import { OFFICIAL_HEADER } from '../shared/officialHeader.js';
import { buildWatermarkLines } from '../engine/watermark.js';
import { formatDate, formatDateTime } from '@utils/date-formatter.js';
import styles from './officialReport.module.css';

const thStyle = (isAr, extra = {}) => ({
  border: '1px solid #999',
  padding: '4px 8px',
  textAlign: isAr ? 'right' : 'left',
  ...extra,
});

const tdStyle = { border: '1px solid #999', padding: '4px 8px' };

function InfoPair({ label, value, isAr, mirrored = false }) {
  if (mirrored) {
    return (
      <div>
        <span>{value || '—'}</span>
        <span style={{ color: '#b91c1c', fontWeight: 700 }}> : {label}</span>
      </div>
    );
  }
  return (
    <div>
      <span style={{ color: '#b91c1c', fontWeight: 700 }}>{label}: </span>
      <span>{value || '—'}</span>
    </div>
  );
}

export function StudentSummaryTemplate({ data, showWatermark = true }) {
  const { isAr, serial, labels } = data;
  const wm = buildWatermarkLines(data.watermarkUser);
  const genDateTime = formatDateTime(new Date(), isAr ? 'ar' : 'en');

  return (
    <div
      data-official-page
      className={`${styles.officialPage} ${isAr ? styles.officialPageRtl : ''} ${styles.arabicShapedText}`}
      lang={isAr ? 'ar' : 'en'}
    >
      {showWatermark && (wm.en || wm.ar || wm.uuid) && (
        <div className={styles.officialWatermark} style={{ color: wm?.color }} aria-hidden>
          {wm.en && String(wm.en).split(' — ').map((line, i) => <div key={`e-${i}`}>{line}</div>)}
          {wm.ar && wm.ar !== wm.en && String(wm.ar).split(' — ').map((line, i) => <div key={`a-${i}`}>{line}</div>)}
          {wm.uuid && <div>{wm.uuid}</div>}
        </div>
      )}
      <div className={styles.officialContentFlex}>
        <div className={styles.serialLine}>
          {isAr ? 'الرقم التسلسلي' : 'Serial'}: <bdi>{serial}</bdi>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 14px', marginBottom: 8 }}>
          <img src={OFFICIAL_HEADER.logoUrl} alt="" style={{ width: 48, height: 48, objectFit: 'contain' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', width: '100%', gap: 12, marginTop: 8 }}>
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
          <div style={{ fontWeight: 800, fontSize: 17, color: '#b91c1c' }}>{data.title}</div>
        </div>

        <div
          dir="ltr"
          style={{ display: 'flex', gap: 16, fontSize: 12, lineHeight: 2, marginBottom: 16 }}
        >
          <div style={{ flex: 1, textAlign: isAr ? 'right' : 'left' }} dir={isAr ? 'rtl' : 'ltr'}>
            <InfoPair label={labels.number} value={data.studentNumber} isAr={isAr} />
            <InfoPair label={labels.rank} value={data.rank} isAr={isAr} />
            <InfoPair label={labels.name} value={data.studentName} isAr={isAr} />
          </div>
          <div style={{ flex: 1, textAlign: isAr ? 'left' : 'right' }} dir={isAr ? 'rtl' : 'ltr'}>
            {data.scope === 'class' && data.sections[0] && (
              <>
                <InfoPair label={labels.program} value={data.sections[0].programName} isAr={isAr} mirrored={!isAr} />
                <InfoPair label={labels.class} value={data.sections[0].className} isAr={isAr} mirrored={!isAr} />
                <InfoPair label={labels.subject} value={data.sections[0].subjectName} isAr={isAr} mirrored={!isAr} />
              </>
            )}
            {data.scope === 'all' && (
              <InfoPair
                label={labels.class}
                value={`${data.sections.length} ${isAr ? 'شعبة' : 'classes'}`}
                isAr={isAr}
                mirrored={!isAr}
              />
            )}
          </div>
        </div>

        {data.sections.map((section) => (
          <div key={section.classId || section.className} style={{ marginBottom: 16 }} dir={isAr ? 'rtl' : 'ltr'}>
            {data.scope === 'all' && (
              <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 6, textAlign: isAr ? 'right' : 'left' }}>
                {section.className}{section.subjectName ? ` — ${section.subjectName}` : ''}
              </div>
            )}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr>
                  <th style={thStyle(isAr, { width: 36 })}>#</th>
                  <th style={thStyle(isAr)}>{labels.date}</th>
                  <th style={thStyle(isAr)}>{labels.status}</th>
                  <th style={thStyle(isAr)}>{labels.approval}</th>
                  <th style={thStyle(isAr, { width: 70 })}>{labels.deduction}</th>
                  <th style={thStyle(isAr)}>{labels.note}</th>
                </tr>
              </thead>
              <tbody>
                {section.rows.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: '#64748b' }}>
                      {labels.noRecords}
                    </td>
                  </tr>
                )}
                {section.rows.map((row, idx) => (
                  <tr key={`${row.date?.toISOString?.() || idx}-${idx}`}>
                    <td style={tdStyle}>{idx + 1}</td>
                    <td style={tdStyle}><bdi>{formatDate(row.date, 'en')}</bdi></td>
                    <td style={tdStyle}>{section.statusLabels[row.statusCode] || row.statusCode || '—'}</td>
                    <td style={tdStyle}>{row.excusedViaWorkflow ? labels.approved : labels.pending}</td>
                    <td style={tdStyle}>{row.deduction || '—'}</td>
                    <td style={tdStyle}>{row.note || '—'}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={4} style={{ ...tdStyle, fontWeight: 700 }}>{labels.total}</td>
                  <td style={{ ...tdStyle, fontWeight: 700 }}>{section.totalDeduction}</td>
                  <td style={{ ...tdStyle, fontWeight: 700 }}>{section.totalRows} {labels.records}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}

        <div className={styles.officialPageFooter} style={{ marginTop: 'auto' }}>
          <span>{isAr ? 'الرقم التسلسلي' : 'Serial'}: <bdi>{serial}</bdi></span>
          <span>{isAr ? 'تاريخ الإصدار' : 'Generated'}: {genDateTime}</span>
        </div>
      </div>
    </div>
  );
}
