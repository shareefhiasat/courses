import { formatQatarDate } from '@utils/timezone';

/** Official reports use DD/MM/YYYY (slashes), consistent with the rest of the LMS. */
export function formatOfficialReportDate(dateStr) {
  if (!dateStr) return '';
  return formatQatarDate(dateStr, 'dd/MM/yyyy');
}
