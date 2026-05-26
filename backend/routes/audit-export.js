import { Router } from 'express';
import {
  exportWorkflowStatusHistoryController,
  exportPermissionDenialsController
} from '../controllers/audit-export.js';

const router = Router();

// Temporarily disabled Swagger docs due to YAML parsing error
// TODO: Fix YAML syntax in Swagger documentation

router.get('/workflow-status-history', exportWorkflowStatusHistoryController);
router.get('/permission-denials', exportPermissionDenialsController);

export default router;
