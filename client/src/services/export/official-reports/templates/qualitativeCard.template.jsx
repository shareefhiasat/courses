import React from 'react';
import { OFFICIAL_HEADER } from '../shared/officialHeader.js';
import { buildWatermarkLines } from '../engine/watermark.js';
import { formatDateTime } from '@utils/date-formatter.js';
import styles from './officialReport.module.css';

function footerLabels(isAr) {
  return isAr
    ? {
        courseCount: 'مجموع مقررات الفصل الدراسي',
        semGpaHours: 'ساعات المعدل الفصلي',
        semEarnedHours: 'ساعات المعدل الفصلي المكتسبة',
        cumGpaHours: 'ساعات المعدل التراكمي',
        cumEarnedHours: 'ساعات المعدل التراكمي المكتسبة',
        semPoints: 'النقاط المكتسبة للمعدل الفصلي',
        cumPoints: 'النقاط المكتسبة للمعدل التراكمي',
        semGpa: 'المعدل الفصلي',
        cumGpa: 'المعدل العام',
      }
    : {
        courseCount: 'Semester Courses',
        semGpaHours: 'Semester GPA Hours',
        semEarnedHours: 'Semester Earned Hours',
        cumGpaHours: 'Cumulative GPA Hours',
        cumEarnedHours: 'Cumulative Earned Hours',
        semPoints: 'Semester Points Earned',
        cumPoints: 'Cumulative Points Earned',
        semGpa: 'Semester GPA',
        cumGpa: 'Cumulative GPA',
      };
}

function SemesterTable({ semester, isAr }) {
  if (!semester) return null;
  const labels = isAr
    ? {
        code: 'رمز المقرر',
        credits: 'الساعات المعتمدة',
        name: 'اسم المقرر',
        grade: 'التقدير',
        points: 'النقاط المكتسبة',
        hours: 'الساعات المكتسبة',
      }
    : {
        code: 'Code',
        credits: 'Credits',
        name: 'Course',
        grade: 'Grade',
        points: 'Points',
        hours: 'Hours Earned',
      };

  const L = footerLabels(isAr);
  const fmt = (n) => (n != null && !Number.isNaN(Number(n)) ? Number(n).toFixed(2) : '—');

  const semesterStats = [
    { label: L.courseCount, value: semester.courseCount },
    { label: L.semGpaHours, value: semester.gpaHours },
    { label: L.semEarnedHours, value: semester.earnedHours },
    { label: L.semPoints, value: fmt(semester.semesterPointsEarned) },
    { label: L.semGpa, value: fmt(semester.semesterGpa) },
  ];

  const cumulativeStats = [
    { label: L.cumGpaHours, value: semester.cumulativeGpaHours },
    { label: L.cumEarnedHours, value: semester.cumulativeEarnedHours },
    { label: L.cumPoints, value: fmt(semester.cumulativePointsEarned) },
    { label: L.cumGpa, value: fmt(semester.cumulativeGpa) },
  ];

  return (
    <div className={styles.qualitativeSemesterBlock}>
      <div className={styles.qualitativeSemesterTitle}>{semester.label}</div>
      <table className={`${styles.officialTable} ${styles.qualitativeCourseTable}`}>
        <colgroup>
          <col style={{ width: '9%' }} />
          <col style={{ width: '7%' }} />
          <col style={{ width: '44%' }} />
          <col style={{ width: '8%' }} />
          <col style={{ width: '16%' }} />
          <col style={{ width: '16%' }} />
        </colgroup>
        <thead>
          <tr className={styles.qualitativeTableHead}>
            <th>{labels.code}</th>
            <th>{labels.credits}</th>
            <th className={styles.nameCell}>{labels.name}</th>
            <th>{labels.grade}</th>
            <th>{labels.points}</th>
            <th>{labels.hours}</th>
          </tr>
        </thead>
        <tbody>
          {semester.courses.map((c, idx) => (
            <tr key={`${c.code}-${c.name}-${idx}`}>
              <td>{c.code}</td>
              <td>{c.credits}</td>
              <td className={styles.nameCell}>{c.name}</td>
              <td style={{ fontWeight: 700 }}>{c.letterGrade}</td>
              <td>{c.pointsEarned?.toFixed?.(2) ?? c.pointsEarned}</td>
              <td>{c.hoursEarned}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: '8px', fontSize: '11px', lineHeight: 1.6 }}>
        <div style={{ fontWeight: 700, marginBottom: '4px', fontSize: '12px' }}>
          {isAr ? 'ملخص الفصل' : 'Semester Summary'}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px 16px' }}>
          {semesterStats.map((stat) => (
            <div key={stat.label} className={isAr ? styles.arabicShapedText : ''}>
              <strong>{stat.label}:</strong> {stat.value ?? '—'}
            </div>
          ))}
        </div>
        <div style={{ fontWeight: 700, marginTop: '12px', marginBottom: '4px', fontSize: '12px', paddingTop: '8px', borderTop: '1px solid #ccc' }}>
          {isAr ? 'الملخص التراكمي' : 'Cumulative Summary'}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px 16px' }}>
          {cumulativeStats.map((stat) => (
            <div key={stat.label} className={isAr ? styles.arabicShapedText : ''}>
              <strong>{stat.label}:</strong> {stat.value ?? '—'}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StudentInfo({ student, isAr }) {
  const rows = isAr
    ? [
        ['الاسم', student.studentName],
        ['الرقم', student.studentNumber],
        ['التخصص', student.programName],
        ['رقم القيد', student.registrationPlaceholder],
        ['الدفعة', student.batchPlaceholder],
        ['المجموعة', student.groupPlaceholder],
      ]
    : [
        ['Name', student.studentName],
        ['ID', student.studentNumber],
        ['Major', student.programName],
        ['Registration No.', student.registrationPlaceholder],
        ['Batch', student.batchPlaceholder],
        ['Group', student.groupPlaceholder],
      ];

  return (
    <div className={styles.qualitativeStudentInfo}>
      {rows.map(([label, value]) => (
        <div key={label}>
          <strong>{label}:</strong> {value}
        </div>
      ))}
    </div>
  );
}

export function QualitativeCardTemplate({ data, showWatermark = true }) {
  const { students, serial, title, isAr, academyNameAr, academyNameEn } = data;
  const wm = buildWatermarkLines(data.watermarkUser);
  const corpsEn = `${OFFICIAL_HEADER.corpsEn.split('/')[0]?.trim()} / ${academyNameEn}`;
  const corpsAr = `${OFFICIAL_HEADER.corpsAr.split('/')[0]?.trim()} / ${academyNameAr}`;

  const pages = [];
  students.forEach((student) => {
    student.pages.forEach((page) => {
      pages.push({ student, page });
    });
  });

  const genDateTime = formatDateTime(new Date(), isAr ? 'ar' : 'en');

  return (
    <>
      {pages.map(({ student, page }, pageIndex) => (
        <div
          key={`${student.studentId}-${page.pageIndex}`}
          data-official-page
          data-page-orientation="landscape"
          className={`${styles.officialPage} ${styles.officialPageLandscapeCert} ${isAr ? styles.officialPageRtl : ''} ${styles.arabicShapedText}`}
          lang={isAr ? 'ar' : 'en'}
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
            {page.showHeader && (
              <>
                <div className={`${styles.violationsTopRow} ${styles.bilingualHeaderBand}`}>
                  <div className={`${styles.violationsTopEn} ${styles.arabicShapedText}`}>
                    {OFFICIAL_HEADER.ministryEn}
                    <br />
                    {corpsEn}
                  </div>
                  <img src={OFFICIAL_HEADER.logoUrl} alt="" className={styles.dailyLogo} />
                  <div className={`${styles.violationsTopAr} ${styles.arabicShapedText}`}>
                    {OFFICIAL_HEADER.ministryAr}
                    <br />
                    {corpsAr}
                  </div>
                </div>
                <div className={styles.dailyTitleBar}>{title}</div>
                <StudentInfo student={student} isAr={isAr} />
              </>
            )}

            {page.semesters.map((sem) => (
              <SemesterTable key={sem.label} semester={sem} isAr={isAr} />
            ))}

            {!page.showHeader && page.semesters.length === 0 && (
              <div style={{ textAlign: 'center', color: '#888', padding: 24 }}>
                {isAr ? 'لا توجد بيانات فصلية' : 'No semester data'}
              </div>
            )}

            <div className={styles.certificateBottomBlock}>
              <div className={styles.officialPageFooter}>
                <span>{isAr ? 'الرقم التسلسلي' : 'Serial'}: <bdi>{serial}</bdi></span>
                <span>{isAr ? 'تاريخ الإصدار' : 'Generated'}: {genDateTime}</span>
                <span>{isAr ? 'صفحة' : 'Page'} {pageIndex + 1} / {pages.length}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
