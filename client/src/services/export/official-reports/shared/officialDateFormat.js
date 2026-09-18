import { formatDate, formatDateTime } from '@utils/date-formatter.js';

/** Official reports use DD/MM/YYYY (slashes), consistent with the rest of the LMS. */
export function formatOfficialReportDate(dateStr) {
  if (!dateStr) return '';
  return formatDate(dateStr, 'en');
}

/** Official reports generation timestamp: DD/MM/YYYY, hh:mm AM/PM (Arabic ص/م). */
export function formatOfficialReportDateTime(date, lang = 'en') {
  if (!date) return '';
  return formatDateTime(date, lang);
}
