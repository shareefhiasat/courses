import { formatDate } from '@utils/date-formatter.js';

/** Official reports use DD/MM/YYYY (slashes), consistent with the rest of the LMS. */
export function formatOfficialReportDate(dateStr) {
  if (!dateStr) return '';
  return formatDate(dateStr, 'en');
}
