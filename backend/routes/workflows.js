/**
 * Workflow Routes
 * Mounted at `/api/v1/workflows`.
 */

import { Router } from 'express';
import { keycloakAuth } from '../middleware/keycloakAuth.js';
import {
  createDefinition,
  getDefinition,
  listDefinitions,
  startInstance,
  getInstance,
  listInstances,
  approveInstance,
  rejectInstance,
  getInstanceHistory,
  getMyTasks,
  submitInstance,
  sendForReview,
  sendForApproval,
  approveInstanceSimplified,
  rejectInstanceSimplified,
  reviseInstance,
  cancelInstance,
} from '../controllers/workflowController.js';

const router = Router();

// All workflow routes require auth.
router.use(keycloakAuth([]));

// --------------------------------------------------------------------------
// Workflow Definitions (admin only)
// --------------------------------------------------------------------------
router.post('/definitions', createDefinition);
router.get('/definitions', listDefinitions);
router.get('/definitions/:definitionId', getDefinition);

// --------------------------------------------------------------------------
// Workflow Instances
// --------------------------------------------------------------------------
router.post('/instances', startInstance);
router.get('/instances', listInstances);
router.get('/instances/:instanceId', getInstance);
router.post('/instances/:instanceId/approve', approveInstance);
router.post('/instances/:instanceId/reject', rejectInstance);
router.get('/instances/:instanceId/history', getInstanceHistory);

// --------------------------------------------------------------------------
// Simplified Single-Stage Workflow Actions
// --------------------------------------------------------------------------
router.post('/instances/:instanceId/submit', submitInstance);
router.post('/instances/:instanceId/send-for-review', sendForReview);
router.post('/instances/:instanceId/send-for-approval', sendForApproval);
router.post('/instances/:instanceId/approve-simplified', approveInstanceSimplified);
router.post('/instances/:instanceId/reject-simplified', rejectInstanceSimplified);
router.post('/instances/:instanceId/revise', reviseInstance);
router.post('/instances/:instanceId/cancel', cancelInstance);

// --------------------------------------------------------------------------
// My Tasks (pending approvals for current user)
// --------------------------------------------------------------------------
router.get('/my-tasks', getMyTasks);

export default router;
