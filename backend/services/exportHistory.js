/**
 * Export History Service - Business Logic Layer
 *
 * PURPOSE: Business logic for export history operations
 * ARCHITECTURE: Controllers → Business Services → DB Services → PostgreSQL
 */

import {
  createExportHistory as createExportHistoryDb,
  getExportHistories as getExportHistoriesDb,
  getExportHistoryById as getExportHistoryByIdDb,
} from '../db/export-history-postgres.js';

/**
 * Log an export event
 */
export async function logExport(data) {
  return await createExportHistoryDb(data);
}

/**
 * Get export history with filters
 */
export async function getExportHistory(filters) {
  return await getExportHistoriesDb(filters);
}

export async function getExportHistoryById(id) {
  return await getExportHistoryByIdDb(id);
}

export default { logExport, getExportHistory, getExportHistoryById };
