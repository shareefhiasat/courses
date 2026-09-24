import React from 'react';
import { OFFICIAL_HEADER } from '../shared/officialHeader.js';
import { buildWatermarkLines } from '../engine/watermark.js';
import { formatDateTime } from '@utils/date-formatter.js';
import styles from './officialReport.module.css';

const thStyle = (isAr, extra = {}) => ({
  border: '1px solid #999',
  padding: '4px 6px',
  textAlign: isAr ? 'right' : 'left',
  ...extra,
});

const tdStyle = { border: '1px solid #999', padding: '4px 6px' };
const tdCenter = { ...tdStyle, textAlign: 'center' };

const WARNING_COLORS = {
  first: '#d97706',
  final: '#ea580c',
  dismissed: '#b91c1c',
  none: '#16a34a',
};

function InfoPair({ label, value, mirrored = false }) {
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

export function ClassSummaryTemplate({ data, showWatermark = true }) {
  const { isAr, serial, labels } = data;
  const wm = buildWatermarkLines(data.watermarkUser);
  const genDateTime = formatDateTime(new Date(), isAr ? 'ar' : 'en');

  return (
    <div
      data-official-page
      data-page-orientation="landscape"
      className={`${styles.officialPage} ${styles.officialPageLandscape} ${isAr ? styles.officialPageRtl : ''} ${styles.arabicShapedText}`}
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

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4px 14px', marginBottom: 4 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', width: '100%', gap: 12, alignItems: 'center' }}>
            <div style={{ textAlign: isAr ? 'right' : 'left', fontSize: 10, lineHeight: 1.4 }}>
              <div>{OFFICIAL_HEADER.ministryEn}</div>
              <div>{OFFICIAL_HEADER.corpsEn.split(' / ')[0]?.trim()}</div>
              <div>{OFFICIAL_HEADER.corpsEn.split(' / ')[1]?.trim()}</div>
            </div>
            <img src={OFFICIAL_HEADER.logoUrl} alt="" style={{ width: 44, height: 44, objectFit: 'contain' }} />
            <div style={{ textAlign: isAr ? 'left' : 'right', fontSize: 10, lineHeight: 1.4 }}>
              <div>{OFFICIAL_HEADER.ministryAr}</div>
              <div>{OFFICIAL_HEADER.corpsAr.split(' / ')[0]?.trim()}</div>
              <div>{OFFICIAL_HEADER.corpsAr.split(' / ')[1]?.trim()}</div>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', margin: '4px 0 10px' }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: '#b91c1c' }}>{data.title}</div>
        </div>

        <div
          dir="ltr"
          style={{ display: 'flex', gap: 16, fontSize: 12, lineHeight: 1.9, marginBottom: 12 }}
        >
          <div style={{ flex: 1, textAlign: isAr ? 'right' : 'left' }} dir={isAr ? 'rtl' : 'ltr'}>
            <InfoPair label={labels.program} value={data.programName} />
            <InfoPair label={labels.class} value={data.className} />
          </div>
          <div style={{ flex: 1, textAlign: isAr ? 'left' : 'right' }} dir={isAr ? 'rtl' : 'ltr'}>
            <InfoPair label={labels.subject} value={data.subjectName} mirrored={!isAr} />
            <InfoPair label={labels.term} value={data.term} mirrored={!isAr} />
          </div>
        </div>

        <div dir={isAr ? 'rtl' : 'ltr'} style={{ marginBottom: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10, tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th rowSpan={2} style={thStyle(isAr, { width: 30, textAlign: 'center' })}>#</th>
                <th rowSpan={2} style={thStyle(isAr, { width: 70 })}>{labels.number}</th>
                <th rowSpan={2} style={thStyle(isAr)}>{labels.name}</th>
                <th rowSpan={2} style={thStyle(isAr, { width: 52, textAlign: 'center' })}>{labels.present}</th>
                <th colSpan={3} style={thStyle(isAr, { textAlign: 'center' })}>{labels.absent}</th>
                <th colSpan={3} style={thStyle(isAr, { textAlign: 'center' })}>{labels.excused}</th>
                <th colSpan={3} style={thStyle(isAr, { textAlign: 'center' })}>{labels.humanCase}</th>
                <th rowSpan={2} style={thStyle(isAr, { width: 44, textAlign: 'center' })}>{labels.late}</th>
                <th rowSpan={2} style={thStyle(isAr, { width: 46, textAlign: 'center' })}>{labels.total}</th>
                <th colSpan={3} style={thStyle(isAr, { textAlign: 'center' })}>{labels.deduction}</th>
                <th rowSpan={2} style={thStyle(isAr, { width: 84, textAlign: 'center' })}>{labels.warning}</th>
              </tr>
              <tr>
                <th style={thStyle(isAr, { width: 34, textAlign: 'center', fontSize: 9 })}>{labels.approved}</th>
                <th style={thStyle(isAr, { width: 34, textAlign: 'center', fontSize: 9 })}>{labels.pending}</th>
                <th style={thStyle(isAr, { width: 34, textAlign: 'center', fontSize: 9 })}>{labels.total}</th>
                <th style={thStyle(isAr, { width: 34, textAlign: 'center', fontSize: 9 })}>{labels.approved}</th>
                <th style={thStyle(isAr, { width: 34, textAlign: 'center', fontSize: 9 })}>{labels.pending}</th>
                <th style={thStyle(isAr, { width: 34, textAlign: 'center', fontSize: 9 })}>{labels.total}</th>
                <th style={thStyle(isAr, { width: 34, textAlign: 'center', fontSize: 9 })}>{labels.approved}</th>
                <th style={thStyle(isAr, { width: 34, textAlign: 'center', fontSize: 9 })}>{labels.pending}</th>
                <th style={thStyle(isAr, { width: 34, textAlign: 'center', fontSize: 9 })}>{labels.total}</th>
                <th style={thStyle(isAr, { width: 44, textAlign: 'center', fontSize: 9 })}>{labels.approved}</th>
                <th style={thStyle(isAr, { width: 44, textAlign: 'center', fontSize: 9 })}>{labels.pending}</th>
                <th style={thStyle(isAr, { width: 44, textAlign: 'center', fontSize: 9 })}>{labels.total}</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr key={row.studentId || row.index}>
                  <td style={tdCenter}>{row.index}</td>
                  <td style={tdStyle}><bdi>{row.studentNumber}</bdi></td>
                  <td style={tdStyle}>{row.studentName}</td>
                  <td style={tdCenter}>{row.present}</td>
                  <td style={tdCenter}>{row.absentApproved}</td>
                  <td style={tdCenter}>{row.absentPending}</td>
                  <td style={{ ...tdCenter, fontWeight: row.unexcused > 0 ? 700 : 400 }}>{row.unexcused}</td>
                  <td style={tdCenter}>{row.excusedApproved}</td>
                  <td style={tdCenter}>{row.excusedPending}</td>
                  <td style={tdCenter}>{row.excused}</td>
                  <td style={tdCenter}>{row.humanApproved}</td>
                  <td style={tdCenter}>{row.humanPending}</td>
                  <td style={tdCenter}>{row.humanCase}</td>
                  <td style={tdCenter}>{row.late}</td>
                  <td style={tdCenter}>{row.total}</td>
                  <td style={tdCenter}>{row.deductionApproved}</td>
                  <td style={tdCenter}>{row.deductionPending}</td>
                  <td style={tdCenter}>{row.deduction}</td>
                  <td style={{ ...tdCenter, color: WARNING_COLORS[row.warningType] || '#334155', fontWeight: 600 }}>
                    {row.warning}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.officialPageFooter} style={{ marginTop: 'auto' }}>
          <span>{isAr ? 'الرقم التسلسلي' : 'Serial'}: <bdi>{serial}</bdi></span>
          <span>{isAr ? 'تاريخ الإصدار' : 'Generated'}: {genDateTime}</span>
          <span>{data.rows.length} {labels.students}</span>
        </div>
      </div>
    </div>
  );
}
