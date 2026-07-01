/**
 * Export History Routes - API Endpoints
 *
 * PURPOSE: Route definitions for export history operations
 * ARCHITECTURE: HTTP Requests → Routes → Controllers → Business Services → DB Services → PostgreSQL
 */

import { Router } from 'express';
import { logExportController, getExportHistoryController } from '../controllers/exportHistory.js';
import { keycloakAuth } from '../middleware/keycloakAuth.js';
import { qrScannerOps } from '../middleware/requirePermission.js';

const router = Router();

/**
 * POST /api/v1/export-history
 * Log a new export event (requires qr-scanner export permission)
 */
router.post('/', keycloakAuth([]), qrScannerOps.export, logExportController);

/**
 * GET /api/v1/export-history
 * Get export history with optional filters (requires qr-scanner view permission)
 */
router.get('/', keycloakAuth([]), qrScannerOps.view, getExportHistoryController);

export default router;
