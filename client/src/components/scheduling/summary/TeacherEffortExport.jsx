import React, { useCallback } from 'react';
import { jsPDF } from 'jspdf';
import ExcelJS from 'exceljs';
import { useLang } from '@contexts/LangContext';
import { Button } from '@ui';
import { FileDown, FileSpreadsheet } from 'lucide-react';
import { getAuthToken } from '@utils/authHelpers';

export default function TeacherEffortExport({ teacherId, params, effort, canExport }) {
  const { t, isRTL } = useLang();

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = useCallback(async () => {
    if (!effort) return;
    const doc = new jsPDF();
    const name = isRTL ? effort.teacher?.instructorNameAr : effort.teacher?.instructorName;

    doc.setFontSize(14);
    doc.text('QAF — RESTRICTED', 14, 16);
    doc.setFontSize(11);
    doc.text(t('teacher_effort_report') || 'Teacher Effort Report', 14, 26);
    doc.text(`${t('teacher') || 'Teacher'}: ${name}`, 14, 34);
    doc.text(`${t('total_sessions') || 'Sessions'}: ${effort.summary.totalSessions}`, 14, 42);
    doc.text(`${t('teaching_hours') || 'Hours'}: ${effort.summary.teachingHours}`, 14, 50);
    doc.text(`${t('total_breaks') || 'Breaks'}: ${effort.summary.totalBreaks}`, 14, 58);
    doc.text(`${t('holiday_sessions_missed') || 'Holiday Impact'}: ${effort.summary.sessionsMissedDueToHolidays}`, 14, 66);

    let y = 78;
    doc.setFontSize(10);
    doc.text(t('subject_distribution') || 'Subjects:', 14, y);
    y += 6;
    (effort.subjectDistribution || []).forEach((s) => {
      doc.text(`  ${s.subjectNameEn}: ${s.sessionCount}`, 14, y);
      y += 5;
    });

    doc.save(`teacher-effort-${teacherId}.pdf`);
  }, [effort, teacherId, t, isRTL]);

  const exportExcel = useCallback(async () => {
    const token = getAuthToken();
    const base = import.meta.env.VITE_API_URL || 'https://localhost:8001/api/v1';
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${base}/scheduling/teacher-effort/${teacherId}/export/excel?${q}`, {
      headers: { Authorization: token ? `Bearer ${token}` : '' },
    });
    if (!res.ok) return;
    const text = await res.text();
    downloadBlob(new Blob([text], { type: 'text/csv' }), `teacher-effort-${teacherId}.csv`);

    if (effort) {
      const wb = new ExcelJS.Workbook();
      const summary = wb.addWorksheet('Summary');
      summary.addRow(['Teacher', effort.teacher?.instructorName]);
      summary.addRow(['Sessions', effort.summary.totalSessions]);
      summary.addRow(['Teaching Hours', effort.summary.teachingHours]);
      summary.addRow(['Breaks', effort.summary.totalBreaks]);

      const sessions = wb.addWorksheet('Sessions');
      sessions.addRow(['Date', 'Subject', 'Time', 'Classroom']);
      (effort.sessions || []).forEach((s) => {
        sessions.addRow([
          new Date(s.date).toLocaleDateString(),
          s.subject?.nameEn || '',
          `${s.timeSlot?.startTime}-${s.timeSlot?.endTime}`,
          s.classroom?.nameEn || '',
        ]);
      });

      const buffer = await wb.xlsx.writeBuffer();
      downloadBlob(
        new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
        `teacher-effort-${teacherId}.xlsx`,
      );
    }
  }, [teacherId, params, effort]);

  if (!canExport) return null;

  return (
    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
      <Button variant="outline" size="sm" onClick={exportPDF} disabled={!effort} data-testid="export-pdf-btn">
        <FileDown size={14} style={{ marginInlineEnd: '0.25rem' }} />
        {t('export_pdf') || 'Export PDF'}
      </Button>
      <Button variant="outline" size="sm" onClick={exportExcel} disabled={!teacherId} data-testid="export-excel-btn">
        <FileSpreadsheet size={14} style={{ marginInlineEnd: '0.25rem' }} />
        {t('export_excel') || 'Export Excel'}
      </Button>
    </div>
  );
}
