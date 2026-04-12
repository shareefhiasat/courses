/**
 * Document Workflow Routes
 *
 * PURPOSE: Expose LMS-owned approval workflow transitions that trigger Nextcloud actions.
 */

import { Router } from 'express';
import {
  submitAttendanceForReviewController,
  rejectAttendanceWithFeedbackController,
  approveAttendanceToHrController,
  markAwaitingManualSignatureController,
  uploadSignedDocumentForHrController,
  finalizeHrFilingController
} from '../controllers/documentWorkflows.js';

const router = Router();

router.post('/attendance/submit', submitAttendanceForReviewController);
router.post('/attendance/reject', rejectAttendanceWithFeedbackController);
router.post('/attendance/approve', approveAttendanceToHrController);

router.post('/signature/awaiting', markAwaitingManualSignatureController);
router.post('/signature/uploaded', uploadSignedDocumentForHrController);
router.post('/hr/finalize', finalizeHrFilingController);

export default router;
