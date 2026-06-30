import React from 'react';
import { OFFICIAL_HEADER } from '../shared/officialHeader.js';
import { buildWatermarkLines } from '../engine/watermark.js';
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
            <td colSpan={6}>
              {labels.datePrefix}: {dg.dateLabel}
            </td>
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
  const wm = buildWatermarkLines(data.watermarkUser);

  return (
    <div
      data-official-page
      className={`${styles.officialPage} ${data.lang === 'ar' ? styles.officialPageRtl : ''}`}
    >
      {showWatermark && (wm.en || wm.ar) && (
        <div className={styles.officialWatermark} aria-hidden>
          {wm.en}
          {'\n'}
          {wm.ar}
        </div>
      )}
      <div className={styles.officialContent}>
        {showHeader && (
          <>
            <div className={styles.serialLine}>
              {data.lang === 'ar' ? 'الرقم التسلسلي' : 'Serial'}: {data.serial}
            </div>
            <div className={styles.violationsTopRow}>
              <div className={styles.violationsTopEn}>
                {OFFICIAL_HEADER.corpsEn}
              </div>
              <img src={OFFICIAL_HEADER.logoUrl} alt="" className={styles.dailyLogo} />
              <div className={styles.violationsTopAr}>
                {OFFICIAL_HEADER.ministryAr}
                <br />
                {OFFICIAL_HEADER.corpsAr}
              </div>
            </div>
            <div className={styles.violationsTitleBar}>{data.title}</div>
            <div className={styles.violationsMeta}>
              <span>
                {labels.issueDate}: {data.header.issueDate}
              </span>
              <span>
                {labels.program}: {data.header.program}
              </span>
              {(data.header.dateFrom || data.header.dateTo) && (
                <span>
                  {labels.period}: {data.header.dateFrom} — {data.header.dateTo}
                </span>
              )}
            </div>
          </>
        )}

        <table className={styles.officialTable}>
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
          <div className={styles.signatureFooter}>{labels.officerSign} _______________</div>
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
