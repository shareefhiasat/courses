import React from 'react';
import { OFFICIAL_HEADER } from '../shared/officialHeader.js';
import { buildWatermarkLines } from '../engine/watermark.js';
import styles from './officialReport.module.css';

function SemesterTable({ semester, isAr }) {
  if (!semester) return null;
  const labels = isAr
    ? {
        title: semester.label,
        code: 'رمز المقرر',
        name: 'اسم المقرر',
        credits: 'الساعات المعتمدة',
        grade: 'التقدير',
        points: 'النقاط المكتسبة',
        hours: 'الساعات المكتسبة',
        courses: 'عدد المقررات',
        gpaHours: 'ساعات المعدل الفصلي',
        earnedHours: 'الساعات المكتسبة للفصل',
        semesterGpa: 'المعدل الفصلي',
        cumGpaHours: 'ساعات المعدل العام',
        cumEarned: 'الساعات المكتسبة للمعدل العام',
        cumGpa: 'المعدل العام',
      }
    : {
        title: semester.label,
        code: 'Code',
        name: 'Course',
        credits: 'Credits',
        grade: 'Grade',
        points: 'Points',
        hours: 'Hours Earned',
        courses: 'Courses',
        gpaHours: 'GPA Hours',
        earnedHours: 'Earned Hours',
        semesterGpa: 'Semester GPA',
        cumGpaHours: 'Cumulative GPA Hours',
        cumEarned: 'Cumulative Earned',
        cumGpa: 'Cumulative GPA',
      };

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        background: '#1e3a5f',
        color: '#fff',
        padding: '6px 10px',
        fontWeight: 700,
        fontSize: 11,
        textAlign: 'center',
        marginBottom: 0,
      }}
      >
        {labels.title}
      </div>
      <table className={styles.officialTable} style={{ fontSize: 9, width: '100%' }}>
        <thead>
          <tr style={{ background: '#e8eef5' }}>
            <th>{labels.code}</th>
            <th className={styles.nameCell}>{labels.name}</th>
            <th>{labels.credits}</th>
            <th>{labels.grade}</th>
            <th>{labels.points}</th>
            <th>{labels.hours}</th>
          </tr>
        </thead>
        <tbody>
          {semester.courses.map((c) => (
            <tr key={`${c.code}-${c.name}`}>
              <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>{c.code}</td>
              <td className={styles.nameCell} style={{ verticalAlign: 'middle' }}>{c.name}</td>
              <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>{c.credits}</td>
              <td style={{ textAlign: 'center', verticalAlign: 'middle', fontWeight: 700 }}>{c.letterGrade}</td>
              <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>{c.pointsEarned}</td>
              <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>{c.hoursEarned}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 6,
        marginTop: 6,
        fontSize: 9,
      }}
      >
        <div><strong>{labels.courses}:</strong> {semester.courseCount}</div>
        <div><strong>{labels.gpaHours}:</strong> {semester.gpaHours}</div>
        <div><strong>{labels.earnedHours}:</strong> {semester.earnedHours}</div>
        <div style={{ background: '#f3f4f6', padding: '2px 6px', fontWeight: 700 }}>
          <strong>{labels.semesterGpa}:</strong> {semester.semesterGpa?.toFixed?.(2)}
        </div>
        <div><strong>{labels.cumGpaHours}:</strong> {semester.cumulativeGpaHours}</div>
        <div><strong>{labels.cumEarned}:</strong> {semester.cumulativeEarnedHours}</div>
        <div style={{ gridColumn: 'span 2', background: '#f3f4f6', padding: '2px 6px', fontWeight: 700 }}>
          <strong>{labels.cumGpa}:</strong> {semester.cumulativeGpa?.toFixed?.(2)}
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
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '4px 16px',
      fontSize: 10,
      marginBottom: 12,
      padding: '8px 10px',
      border: '1px solid #ccc',
      background: '#fafafa',
    }}
    >
      {rows.map(([label, value]) => (
        <div key={label}>
          <strong>{label}:</strong> {value}
        </div>
      ))}
    </div>
  );
}

export function QualitativeCardTemplate({ data, showWatermark = true }) {
  const { students, lang, serial, title, isAr, academyNameAr, academyNameEn } = data;
  const wm = buildWatermarkLines(data.watermarkUser);
  const corpsEn = `${OFFICIAL_HEADER.corpsEn.split('/')[0]?.trim()} / ${academyNameEn}`;
  const corpsAr = `${OFFICIAL_HEADER.corpsAr.split('/')[0]?.trim()} / ${academyNameAr}`;

  const pages = [];
  students.forEach((student) => {
    student.pages.forEach((page) => {
      pages.push({ student, page });
    });
  });

  return (
    <>
      {pages.map(({ student, page }, pageIdx) => (
        <div
          key={`${student.studentId}-${page.pageIndex}`}
          data-official-page
          className={`${styles.officialPage} ${isAr ? styles.officialPageRtl : ''} ${styles.arabicShapedText}`}
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
          </div>
        </div>
      ))}
    </>
  );
}
