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
import { screenOps } from '../middleware/requirePermission.js';

const router = Router();
const wfOps = screenOps('workflow');

// All workflow routes require auth.
router.use(keycloakAuth([]));

// --------------------------------------------------------------------------
// Workflow Definitions (admin only)
// --------------------------------------------------------------------------
router.post('/definitions', wfOps.create, createDefinition);
router.get('/definitions', wfOps.view, listDefinitions);
router.get('/definitions/:definitionId', wfOps.view, getDefinition);

// --------------------------------------------------------------------------
// Workflow Instances
// --------------------------------------------------------------------------
router.post('/instances', wfOps.create, startInstance);
router.get('/instances', wfOps.view, listInstances);
router.get('/instances/:instanceId', wfOps.view, getInstance);
router.post('/instances/:instanceId/approve', wfOps.update, approveInstance);
router.post('/instances/:instanceId/reject', wfOps.update, rejectInstance);
router.get('/instances/:instanceId/history', wfOps.view, getInstanceHistory);

// --------------------------------------------------------------------------
// Simplified Single-Stage Workflow Actions
// --------------------------------------------------------------------------
router.post('/instances/:instanceId/submit', wfOps.update, submitInstance);
router.post('/instances/:instanceId/send-for-review', wfOps.update, sendForReview);
router.post('/instances/:instanceId/send-for-approval', wfOps.update, sendForApproval);
router.post('/instances/:instanceId/approve-simplified', wfOps.update, approveInstanceSimplified);
router.post('/instances/:instanceId/reject-simplified', wfOps.update, rejectInstanceSimplified);
router.post('/instances/:instanceId/revise', wfOps.update, reviseInstance);
router.post('/instances/:instanceId/cancel', wfOps.delete, cancelInstance);

// --------------------------------------------------------------------------
// My Tasks (pending approvals for current user)
// --------------------------------------------------------------------------
router.get('/my-tasks', wfOps.view, getMyTasks);

export default router;
