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

export default function EffortReportExport({ report, canExport }) {
  const { t, isRTL } = useLang();
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
    cursor: report ? 'pointer' : 'not-allowed',
    opacity: report ? 1 : 0.55,
  };

  const exportPDF = useCallback(() => {
    if (!report) return;
    const doc = new jsPDF();
    let y = 16;
    doc.setFontSize(14);
    doc.text('QAF — RESTRICTED', 14, y);
    y += 10;
    doc.setFontSize(11);
    doc.text(t('teacher_effort_report') || 'Teacher Effort Report', 14, y);
    y += 8;
    doc.text(`${t('total_sessions')}: ${report.totals?.sessionCount}`, 14, y);
    y += 6;
    doc.text(`${t('teaching_hours')}: ${report.totals?.teachingHours}`, 14, y);
    y += 6;
    doc.text(`${t('total_teachers')}: ${report.totals?.teacherCount}`, 14, y);
    y += 10;

    doc.setFontSize(10);
    doc.text(t('teacher_effort_report') || 'Teachers:', 14, y);
    y += 6;
    (report.teachers || []).forEach((row) => {
      if (y > 270) { doc.addPage(); y = 16; }
      const name = isRTL ? row.instructorNameAr : row.instructorName;
      doc.text(`  ${name}: ${row.sessionCount} ${t('sessions')}, ${row.teachingHours}h`, 14, y);
      y += 5;
    });

    if (report.reportFormat === 'breakdown') {
      y += 6;
      doc.text(t('session_breakdown') || 'Sessions:', 14, y);
      y += 6;
      (report.sessions || []).slice(0, 40).forEach((s) => {
        if (y > 270) { doc.addPage(); y = 16; }
        doc.text(`  ${new Date(s.date).toLocaleDateString()} ${s.subject?.nameEn || ''}`, 14, y);
        y += 5;
      });
    }

    doc.save(`effort-report-${Date.now()}.pdf`);
  }, [report, t, isRTL]);

  const exportExcel = useCallback(async () => {
    if (!report) return;
    const wb = new ExcelJS.Workbook();

    const summary = wb.addWorksheet('Summary');
    summary.addRow([t('total_sessions'), report.totals?.sessionCount]);
    summary.addRow([t('teaching_hours'), report.totals?.teachingHours]);
    summary.addRow([t('total_teachers'), report.totals?.teacherCount]);

    const teachers = wb.addWorksheet('Teachers');
    teachers.addRow([t('instructor'), t('sessions'), t('teaching_hours'), t('subjects'), t('classes')]);
    (report.teachers || []).forEach((r) => {
      teachers.addRow([r.instructorName, r.sessionCount, r.teachingHours, r.subjectCount, r.classCount]);
    });

    const courses = wb.addWorksheet('Courses');
    courses.addRow([t('program'), t('subject'), t('class'), t('location'), t('capacity'), t('sessions'), t('teaching_hours')]);
    (report.courses || []).forEach((r) => {
      courses.addRow([
        r.program?.nameEn, r.subject?.nameEn, r.class?.nameEn,
        r.location, r.capacity, r.sessionCount, r.teachingHours,
      ]);
    });

    if (report.reportFormat === 'breakdown' && report.sessions?.length) {
      const sessions = wb.addWorksheet('Sessions');
      sessions.addRow([t('date'), t('instructor'), t('subject'), t('time'), t('location'), t('capacity')]);
      report.sessions.forEach((s) => {
        sessions.addRow([
          new Date(s.date).toLocaleDateString(),
          s.instructor?.displayName,
          s.subject?.nameEn,
          `${s.timeSlot?.startTime}-${s.timeSlot?.endTime}`,
          s.location,
          s.capacity,
        ]);
      });
    }

    const buffer = await wb.xlsx.writeBuffer();
    downloadBlob(
      new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      `effort-report-${Date.now()}.xlsx`,
    );
  }, [report, t]);

  if (!canExport) return null;

  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
      <button
        type="button"
        onClick={exportPDF}
        disabled={!report}
        data-testid="export-effort-pdf"
        title={t('export_pdf') || 'Export PDF'}
        aria-label={t('export_pdf') || 'Export PDF'}
        style={buttonStyle}
      >
        <FileDown size={16} />
      </button>
      <button
        type="button"
        onClick={exportExcel}
        disabled={!report}
        data-testid="export-effort-excel"
        title={t('export_excel') || 'Export Excel'}
        aria-label={t('export_excel') || 'Export Excel'}
        style={buttonStyle}
      >
        <FileSpreadsheet size={16} />
      </button>
    </div>
  );
}
