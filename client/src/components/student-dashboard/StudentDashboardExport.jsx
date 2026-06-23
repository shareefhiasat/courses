import React, { useCallback } from 'react';
import { jsPDF } from 'jspdf';
import ExcelJS from 'exceljs';
import { useLang } from '@contexts/LangContext';
import { FileDown, FileSpreadsheet } from 'lucide-react';

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function safeVal(v) {
  if (v == null) return '';
  if (typeof v === 'object') return v.nameEn || v.nameAr || v.label || v.code || '';
  return String(v);
}

export default function StudentDashboardExport({ dashData, lookupData, isRTL }) {
  const { t } = useLang();

  const buttonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.35rem',
    width: 33,
    height: 33,
    borderRadius: '6px',
    border: '1px solid var(--border)',
    background: 'var(--panel)',
    color: 'var(--text)',
    cursor: 'pointer',
  };

  const hasData = dashData && (
    dashData.attendance?.length > 0 ||
    dashData.penalties?.length > 0 ||
    dashData.participations?.length > 0 ||
    dashData.behaviors?.length > 0 ||
    dashData.marks?.length > 0 ||
    dashData.enrollments?.length > 0 ||
    dashData.submissions?.length > 0
  );

  const exportPDF = useCallback(() => {
    if (!hasData) return;
    const doc = new jsPDF();
    let y = 16;
    doc.setFontSize(14);
    doc.text('QAF — Student Dashboard Export', 14, y);
    y += 10;
    doc.setFontSize(10);

    const stats = dashData.statsData || {};
    doc.text(`Attendance Rate: ${stats.attendanceRate ?? 0}%`, 14, y); y += 6;
    doc.text(`Total Attendance: ${stats.totalAttendance ?? 0}`, 14, y); y += 6;
    doc.text(`GPA: ${stats.gpa ?? 0}`, 14, y); y += 6;
    doc.text(`Participations: ${stats.participations ?? 0} (pts: ${stats.participationPoints ?? 0})`, 14, y); y += 6;
    doc.text(`Penalties: ${stats.penalties ?? 0} (pts: ${stats.penaltyPoints ?? 0})`, 14, y); y += 6;
    doc.text(`Behaviors: ${stats.behaviors ?? 0}`, 14, y); y += 6;
    doc.text(`Enrollments: ${stats.enrollments ?? 0}`, 14, y); y += 10;

    const sections = [
      { title: 'Attendance', rows: dashData.attendance, cols: ['date', 'status', 'className'] },
      { title: 'Penalties', rows: dashData.penalties, cols: ['date', 'penaltyType', 'points', 'className'] },
      { title: 'Participations', rows: dashData.participations, cols: ['date', 'type', 'points', 'className'] },
      { title: 'Behaviors', rows: dashData.behaviors, cols: ['date', 'type', 'points', 'className'] },
      { title: 'Marks', rows: dashData.marks, cols: ['subjectName', 'totalMarks', 'letterGrade', 'term', 'year'] },
    ];

    for (const sec of sections) {
      if (!sec.rows?.length) continue;
      if (y > 260) { doc.addPage(); y = 16; }
      doc.setFontSize(11);
      doc.text(`${sec.title} (${sec.rows.length})`, 14, y); y += 6;
      doc.setFontSize(9);
      for (const row of sec.rows.slice(0, 50)) {
        if (y > 270) { doc.addPage(); y = 16; }
        const vals = sec.cols.map(c => safeVal(row[c])).join(' | ');
        doc.text(`  ${vals}`, 14, y); y += 5;
      }
      if (sec.rows.length > 50) {
        doc.text(`  ... and ${sec.rows.length - 50} more`, 14, y); y += 5;
      }
      y += 4;
    }

    doc.save(`student-dashboard-${Date.now()}.pdf`);
  }, [dashData, hasData]);

  const exportExcel = useCallback(async () => {
    if (!hasData) return;
    const wb = new ExcelJS.Workbook();

    const summary = wb.addWorksheet('Summary');
    const stats = dashData.statsData || {};
    summary.addRow(['Metric', 'Value']);
    summary.addRow(['Attendance Rate', `${stats.attendanceRate ?? 0}%`]);
    summary.addRow(['Total Attendance', stats.totalAttendance ?? 0]);
    summary.addRow(['Present', stats.presentCount ?? 0]);
    summary.addRow(['Absent', stats.absentCount ?? 0]);
    summary.addRow(['Late', stats.lateCount ?? 0]);
    summary.addRow(['GPA', stats.gpa ?? 0]);
    summary.addRow(['Participations', stats.participations ?? 0]);
    summary.addRow(['Participation Points', stats.participationPoints ?? 0]);
    summary.addRow(['Penalties', stats.penalties ?? 0]);
    summary.addRow(['Penalty Points', stats.penaltyPoints ?? 0]);
    summary.addRow(['Behaviors', stats.behaviors ?? 0]);
    summary.addRow(['Net Score', stats.netScore ?? 0]);
    summary.addRow(['Enrollments', stats.enrollments ?? 0]);

    const addSheet = (name, rows, cols) => {
      if (!rows?.length) return;
      const ws = wb.addWorksheet(name);
      ws.addRow(cols);
      for (const row of rows) {
        ws.addRow(cols.map(c => safeVal(row[c])));
      }
    };

    addSheet('Attendance', dashData.attendance, ['date', 'status', 'className', 'studentName', 'notes']);
    addSheet('Penalties', dashData.penalties, ['date', 'penaltyType', 'points', 'className', 'descriptionEn']);
    addSheet('Participations', dashData.participations, ['date', 'type', 'points', 'className', 'descriptionEn']);
    addSheet('Behaviors', dashData.behaviors, ['date', 'type', 'points', 'className', 'descriptionEn']);
    addSheet('Marks', dashData.marks, ['subjectName', 'className', 'totalMarks', 'letterGrade', 'term', 'year']);
    addSheet('Enrollments', dashData.enrollments, ['programName', 'className', 'semester', 'status', 'academicYear']);
    addSheet('Submissions', dashData.submissions, ['title', 'type', 'status', 'submittedAt', 'grade']);

    const buffer = await wb.xlsx.writeBuffer();
    downloadBlob(
      new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      `student-dashboard-${Date.now()}.xlsx`,
    );
  }, [dashData, hasData]);

  if (!hasData) return null;

  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
      <button
        type="button"
        onClick={exportPDF}
        data-testid="export-student-pdf"
        title={t('export_pdf') || 'Export PDF'}
        aria-label={t('export_pdf') || 'Export PDF'}
        style={buttonStyle}
      >
        <FileDown size={16} />
      </button>
      <button
        type="button"
        onClick={exportExcel}
        data-testid="export-student-excel"
        title={t('export_excel') || 'Export Excel'}
        aria-label={t('export_excel') || 'Export Excel'}
        style={buttonStyle}
      >
        <FileSpreadsheet size={16} />
      </button>
    </div>
  );
}
