/**
 * Permission Denial Audit Service
 * 
 * PURPOSE: Service layer for permission denial audit logging
 * ARCHITECTURE: Service → DB Service → Prisma → PostgreSQL
 */

import { createPermissionDenialAudit, getPermissionDenialAudits } from '../db/permission-denial-audit-postgres.js';

/**
 * Log a permission denial
 */
export async function logPermissionDenial(data) {
  return await createPermissionDenialAudit(data);
}

/**
 * Get permission denial audits with filters
 */
export async function getPermissionDenialLogs(filters) {
  return await getPermissionDenialAudits(filters);
}

export default {
  logPermissionDenial,
  getPermissionDenialLogs
};
