import React from 'react';
import { OFFICIAL_HEADER } from '../shared/officialHeader.js';
import { buildWatermarkLines, buildStatusWatermark } from '../engine/watermark.js';
import styles from './officialReport.module.css';

const TABLE_LABELS = {
  ar: {
    serial: 'ت',
    name: 'اسم الطالب',
    violation: 'نوع المخالفة',
    subject: 'المادة',
    deduction: 'درجة الحسم',
    signature: 'التوقيع',
    datePrefix: 'التاريخ',
    officerSign: 'توقيع الضابط:',
    issueDate: 'تاريخ الإصدار',
    program: 'البرنامج',
    period: 'الفترة',
  },
  en: {
    serial: 'No.',
    name: 'Student Name',
    violation: 'Violation Type',
    subject: 'Subject',
    deduction: 'Deduction',
    signature: 'Signature',
    datePrefix: 'Date',
    officerSign: "Officer's Signature:",
    issueDate: 'Issue Date',
    program: 'Program',
    period: 'Period',
  },
};

const ROWS_PER_PAGE = 18;

function chunkDateGroups(dateGroups, rowsPerPage) {
  const pages = [];
  let currentPage = [];
  let rowCount = 0;

  dateGroups.forEach((dg) => {
    const groupRowCost = 1;
    dg.students.forEach((student) => {
      const studentRows = student.subjectRows.length || 1;
      const blockCost = groupRowCost + studentRows;
      if (rowCount > 0 && rowCount + blockCost > rowsPerPage) {
        pages.push(currentPage);
        currentPage = [];
        rowCount = 0;
      }
      if (!currentPage.find((p) => p.dateKey === dg.dateKey)) {
        currentPage.push({ ...dg, students: [] });
        rowCount += groupRowCost;
      }
      const pageGroup = currentPage.find((p) => p.dateKey === dg.dateKey);
      pageGroup.students.push(student);
      rowCount += studentRows;
    });
  });

  if (currentPage.length) pages.push(currentPage);
  if (!pages.length) pages.push([]);
  return pages;
}

function ViolationsTableBody({ dateGroups, labels }) {
  return (
    <>
      {dateGroups.map((dg) => (
        <React.Fragment key={dg.dateKey}>
          <tr className={styles.dateGroupRow}>
            <td colSpan={6}>{dg.dateLabel}</td>
          </tr>
          {dg.students.map((student) =>
            student.subjectRows.map((subRow, idx) => (
              <tr key={`${dg.dateKey}-${student.serial}-${idx}`}>
                {idx === 0 && (
                  <>
                    <td rowSpan={student.subjectRows.length}>{student.serial}</td>
                    <td rowSpan={student.subjectRows.length} className={styles.nameCell}>
                      {student.studentName}
                    </td>
                    <td rowSpan={student.subjectRows.length}>{student.violationType}</td>
                  </>
                )}
                <td>{subRow.subjectName}</td>
                <td>{subRow.deduction}</td>
                <td />
              </tr>
            ))
          )}
        </React.Fragment>
      ))}
    </>
  );
}

function ViolationsPage({ data, dateGroups, labels, showHeader, showFooter, showWatermark }) {
  const statusWm = data.watermarkStatus
    ? buildStatusWatermark(data.watermarkStatus, data.approvedByUser, data.lang, data.approvedAt, data.watermarkUser, data.serial)
    : null;
  const fallbackWm = buildWatermarkLines(data.watermarkUser);
  const wm = statusWm || fallbackWm;

  return (
    <div
      data-official-page
      className={`${styles.officialPage} ${data.lang === 'ar' ? styles.officialPageRtl : ''} ${styles.arabicShapedText}`}
      lang={data.lang === 'ar' ? 'ar' : 'en'}
    >
      {showWatermark && (wm?.en || wm?.ar || wm?.uuid) && (
        <div className={`${styles.officialWatermark} ${wm?.status === 'approved' ? styles.officialWatermarkApproved : ''} ${wm?.status && wm?.status !== 'approved' ? styles.officialWatermarkDraft : ''}`} style={{ color: wm?.color }} aria-hidden>
          {wm.en && String(wm.en).split(' — ').map((line, i) => <div key={`e-${i}`}>{line}</div>)}
          {wm.ar && wm.ar !== wm.en && String(wm.ar).split(' — ').map((line, i) => <div key={`a-${i}`}>{line}</div>)}
          {wm.uuid && <div>{wm.uuid}</div>}
        </div>
      )}
      <div className={`${styles.officialContent} ${showFooter ? styles.officialContentFlex : ''}`}>
        {showHeader && (
          <>
            <div className={styles.serialLine}>
              {data.lang === 'ar' ? 'الرقم التسلسلي' : 'Serial'}: <bdi>{data.serial}</bdi>
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
            <div className={styles.violationsTitleBar}>
              <div>{data.title}</div>
              {(data.header.dateFrom || data.header.dateTo) && (
                <div className={styles.violationsTitlePeriod}>
                  {data.header.dateFrom} — {data.header.dateTo}
                </div>
              )}
            </div>
            {data.preview && (
              <div className={styles.violationsPreviewBanner}>
                {data.lang === 'ar'
                  ? 'هذه معاينة قبل الاعتماد — لا يجوز استخدامها كوثيقة رسمية.'
                  : 'This is a preview before approval — not for official use.'}
              </div>
            )}
            <div className={styles.violationsMeta}>
              <span className={styles.violationsMetaBold}>
                {labels.issueDate}: {data.header.issueDate}
              </span>
              <span className={styles.violationsMetaBold}>{data.header.program}</span>
            </div>
          </>
        )}

        <table className={`${styles.officialTable} ${styles.violationsTable}`}>
          <colgroup>
            <col style={{ width: '5%' }} />
            <col style={{ width: '24%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '27%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '22%' }} />
          </colgroup>
          <thead>
            <tr>
              <th>{labels.serial}</th>
              <th>{labels.name}</th>
              <th>{labels.violation}</th>
              <th>{labels.subject}</th>
              <th>{labels.deduction}</th>
              <th>{labels.signature}</th>
            </tr>
          </thead>
          <tbody>
            <ViolationsTableBody dateGroups={dateGroups} labels={labels} />
          </tbody>
        </table>

        {showFooter && (
          <>
            <div
              className={`${styles.officerSignatureBlock} ${
                data.lang === 'ar' ? styles.officerSignatureAr : styles.officerSignatureEn
              }`}
            >
              <span className={styles.officerSignatureLabel}>{labels.officerSign}</span>
              <span className={styles.officerSignatureLine} aria-hidden />
            </div>
            {data.generatedAt && (
              <div className={styles.officialFooter}>
                <span style={{ fontSize: '10px', color: '#6b7280' }}>
                  {data.lang === 'ar' ? 'تم التوليد' : 'Generated'}: {data.generatedAt}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function AttendanceOfficialTemplate({ data, showWatermark = true }) {
  const labels = TABLE_LABELS[data.lang] || TABLE_LABELS.ar;
  const pages = chunkDateGroups(data.dateGroups, ROWS_PER_PAGE);

  return (
    <>
      {pages.map((pageGroups, pageIdx) => (
        <ViolationsPage
          key={pageIdx}
          data={data}
          dateGroups={pageGroups}
          labels={labels}
          showHeader={pageIdx === 0}
          showFooter={pageIdx === pages.length - 1}
          showWatermark={showWatermark}
        />
      ))}
    </>
  );
}

export default AttendanceOfficialTemplate;
