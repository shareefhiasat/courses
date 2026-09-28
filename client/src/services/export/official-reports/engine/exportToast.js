/**
 * Shared export success toast — shows report title, filename, and an
 * "Open file" action (PDF → new tab, Excel → re-download).
 */

import { toast } from 'sonner';
import { startExportLoading } from '../index.jsx';
import { openDriveFileInCollabora } from '@utils/collaboraUtils.js';

/** Show the global 'generating report' overlay while fn() runs. */
export async function withExportLoading(message, fn) {
  const stop = startExportLoading(message);
  try {
    return await fn();
  } finally {
    stop();
  }
}

/** Localized display titles per report kind. */
export const REPORT_TITLES = {
  student: { en: 'Student Summary Report', ar: 'تقرير ملخص حضور الطالب' },
  class: { en: 'Class Summary Report', ar: 'تقرير ملخص الشعبة' },
  program: { en: 'Program Attendance Summary', ar: 'ملخص حضور البرنامج' },
  deduction: { en: 'Class Deduction Report', ar: 'تقرير خصومات الشعبة' },
  'weekly-schedule': { en: 'Weekly Schedule', ar: 'الجدول الأسبوعي' },
  'daily-official': { en: 'Daily Official Report', ar: 'التقرير اليومي الرسمي' },
  'daily-template': { en: 'Daily Template', ar: 'النموذج اليومي' },
  'attendance-official': { en: 'Attendance Report', ar: 'تقرير الحضور' },
  'semester-certificate': { en: 'Semester Certificate', ar: 'شهادة الفصل الدراسي' },
  'marks-sheet': { en: 'Marks Sheet', ar: 'كشف الدرجات' },
  'attendance-warning': { en: 'Attendance Warning', ar: 'إنذار حضور' },
};

/**
 * @param {string} kind - key into REPORT_TITLES (or a literal title)
 * @param {string} format - 'pdf' | 'excel'
 * @param {string} lang - 'en' | 'ar'
 * @param {Blob} [blob] - exported file blob; enables the "Open file" action
 * @param {string} [filename] - shown as the toast description
 * @param {string} [fileId] - persisted drive file id; Excel opens in the Collabora viewer when present
 */
export function notifyExportSuccess(kind, format, lang, blob, filename, fileId) {
  const label = REPORT_TITLES[kind]?.[lang === 'ar' ? 'ar' : 'en'] || kind;
  const fmt = format === 'excel' ? 'Excel' : 'PDF';
  const done = lang === 'ar' ? 'تم التصدير بنجاح' : 'Export successful';
  const openLabel = lang === 'ar' ? 'فتح الملف' : 'Open file';

  let blobUrl = null;
  if (blob) {
    blobUrl = URL.createObjectURL(blob);
    // Keep the blob alive long enough for the user to click "Open file".
    setTimeout(() => URL.revokeObjectURL(blobUrl), 5 * 60 * 1000);
  }

  toast.success(`${label} — ${fmt} — ${done}`, {
    description: filename,
    duration: 10000,
    action: blobUrl
      ? {
          label: openLabel,
          onClick: async () => {
            if (format === 'excel') {
              // Prefer the Collabora viewer when the export was persisted to Drive;
              // fall back to a direct blob download otherwise.
              if (fileId && (await openDriveFileInCollabora(fileId))) return;
              const a = document.createElement('a');
              a.href = blobUrl;
              a.download = filename || 'export.xlsx';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            } else {
              window.open(blobUrl, '_blank');
            }
          },
        }
      : undefined,
  });
}
