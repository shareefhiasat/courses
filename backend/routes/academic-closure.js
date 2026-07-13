/**
 * Academic Closure Routes
 */

import { Router } from 'express';
import {
  getClosureStatusController,
  closePeriodController,
  reopenPeriodController,
} from '../controllers/academicClosureController.js';

const router = Router();

router.get('/status', getClosureStatusController);
router.post('/close', closePeriodController);
router.post('/reopen', reopenPeriodController);

export default router;
