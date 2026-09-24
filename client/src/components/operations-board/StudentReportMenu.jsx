import React, { useMemo, useState } from 'react';
import { FileText, FileSpreadsheet, FileBarChart, Layers } from 'lucide-react';
import AppMenu from '@components/ui/mui/AppMenu.jsx';
import { useLang } from '@contexts/LangContext';
import { useAuth } from '@contexts/AuthContext';
import { exportStudentSummaryReport } from '@services/business/studentSummaryReportService.js';

/**
 * Menu with student attendance summary export actions:
 * - This class → PDF / Excel
 * - All classes → PDF / Excel
 */
export default function StudentReportMenu({ open, anchorEl, onClose, student, classId, metadata = {} }) {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const [exporting, setExporting] = useState(null);

  const run = async (scope, format) => {
    const key = `${scope}-${format}`;
    setExporting(key);
    try {
      await exportStudentSummaryReport({ student, classId, scope, format, lang, user, metadata });
      onClose?.();
    } catch (err) {
      console.error('[StudentReportMenu] export failed:', err);
    } finally {
      setExporting(null);
    }
  };

  const actions = useMemo(() => [
    {
      id: 'student-summary-class',
      label: t('report_student_summary_class') || 'This class',
      icon: <FileBarChart size={18} color="#0ea5e9" />,
      trailingActions: [
        {
          title: t('export_pdf') || 'PDF',
          icon: <FileText size={16} style={{ color: '#e53935' }} />,
          tooltipColor: '#e53935',
          onClick: () => run('class', 'pdf'),
        },
        {
          title: t('export_excel') || 'Excel',
          icon: <FileSpreadsheet size={16} style={{ color: '#43a047' }} />,
          tooltipColor: '#43a047',
          onClick: () => run('class', 'excel'),
        },
      ],
    },
    {
      id: 'student-summary-all',
      label: t('report_student_summary_all') || 'All classes',
      icon: <Layers size={18} color="#8b5cf6" />,
      trailingActions: [
        {
          title: t('export_pdf') || 'PDF',
          icon: <FileText size={16} style={{ color: '#e53935' }} />,
          tooltipColor: '#e53935',
          onClick: () => run('all', 'pdf'),
        },
        {
          title: t('export_excel') || 'Excel',
          icon: <FileSpreadsheet size={16} style={{ color: '#43a047' }} />,
          tooltipColor: '#43a047',
          onClick: () => run('all', 'excel'),
        },
      ],
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [t, classId, student, exporting]);

  return (
    <AppMenu
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      actions={actions}
      t={t}
      isRTL={lang === 'ar'}
      flipToFit
    />
  );
}
