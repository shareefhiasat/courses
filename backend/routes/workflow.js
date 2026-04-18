/**
 * Workflow Routes
 *
 * PURPOSE: Expose workflow document management endpoints
 */

import { Router } from 'express';
import { keycloakAuth } from '../middleware/keycloakAuth.js';
import {
  createWorkflowDocumentController,
  getWorkflowDocumentsController,
  getWorkflowDocumentByIdController,
  sendWorkflowDocumentController,
  approveWorkflowDocumentController,
  returnWorkflowDocumentController,
  closeWorkflowDocumentController,
  getWorkflowInboxController,
  markWorkflowInboxItemAsReadController,
  getPrivateWorkspaceController
} from '../controllers/workflow.js';

const router = Router();

// All routes require Keycloak authentication
router.use(keycloakAuth([]));

// ==================== DOCUMENT ROUTES ====================

router.post('/documents', createWorkflowDocumentController);
router.get('/documents', getWorkflowDocumentsController);
router.get('/documents/:documentId', getWorkflowDocumentByIdController);

// ==================== WORKFLOW TRANSITION ROUTES ====================

router.post('/documents/:documentId/send', sendWorkflowDocumentController);
router.post('/documents/:documentId/approve', approveWorkflowDocumentController);
router.post('/documents/:documentId/return', returnWorkflowDocumentController);
router.post('/documents/:documentId/close', closeWorkflowDocumentController);

// ==================== INBOX ROUTES ====================

router.get('/inbox', getWorkflowInboxController);
router.post('/inbox/:inboxItemId/read', markWorkflowInboxItemAsReadController);

// ==================== PRIVATE WORKSPACE ROUTES ====================

router.get('/workspace', getPrivateWorkspaceController);
router.post('/workspace', getPrivateWorkspaceController);

export default router;
