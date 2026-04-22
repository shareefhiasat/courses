/**
 * Public Links — unauthenticated routes.
 * Mounted at `/api/v1/public`.
 */

import { Router } from 'express';
import {
  inspectPublicLink,
  downloadViaPublicLink,
} from '../controllers/publicLinkController.js';

const router = Router();

// Inspect link metadata (no auth required).
router.get('/links/:token', inspectPublicLink);

// Download file via token (password in body if required).
router.post('/links/:token/download', downloadViaPublicLink);

export default router;
