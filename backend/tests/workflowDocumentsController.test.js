/**
 * Unit tests for workflow documents controller
 * Tests RBAC, document operations, and collaboration features
 */

const workflowDocumentsController = require('../controllers/workflowDocumentsController');
const nextcloudService = require('../services/nextcloudService');
const prisma = require('../db/prisma');
const { setupTestEnvironment, expectSuccess, expectUnauthorized, expectBadRequest } = require('./helpers/testSetup');

// Mock dependencies
jest.mock('../services/nextcloudService');
jest.mock('../db/prisma');

describe('Workflow Documents Controller', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    ({ mockReq, mockRes } = setupTestEnvironment({ user: { id: 'test-user-id', roles: ['editor'] } }));
  });

  describe('uploadDocument', () => {
    it('should upload document for authorized editor', async () => {
      nextcloudService.ensureFolder.mockResolvedValue({ success: true });
      nextcloudService.uploadFile.mockResolvedValue({ success: true });
      nextcloudService.assignTag.mockResolvedValue({ success: true });
      prisma.workflowDocument.create.mockResolvedValue({
        id: 'doc-1',
        fileName: 'test.pdf',
        workflowId: 'workflow-1',
      });
      
      mockReq.params.workflowId = 'workflow-1';
      mockReq.file = { originalname: 'test.pdf', buffer: Buffer.from('test'), mimetype: 'application/pdf' };
      
      await workflowDocumentsController.uploadDocument(mockReq, mockRes);
      
      expectSuccess(mockRes);
    });

    it('should deny access for unauthorized user', async () => {
      mockReq.params.workflowId = 'workflow-1';
      mockReq.user = { id: 'student-id', roles: ['student'] };
      mockReq.file = { originalname: 'test.pdf', buffer: Buffer.from('test') };
      
      await workflowDocumentsController.uploadDocument(mockReq, mockRes);
      
      expectUnauthorized(mockRes);
    });

    it('should reject without file', async () => {
      mockReq.params.workflowId = 'workflow-1';
      mockReq.file = null;
      
      await workflowDocumentsController.uploadDocument(mockReq, mockRes);
      
      expectBadRequest(mockRes);
    });
  });

  describe('getDocuments', () => {
    it('should return all documents for workflow', async () => {
      prisma.workflowDocument.findMany.mockResolvedValue([
        { id: 'doc-1', fileName: 'test.pdf' },
        { id: 'doc-2', fileName: 'test2.pdf' },
      ]);
      
      mockReq.params.workflowId = 'workflow-1';
      
      await workflowDocumentsController.getDocuments(mockReq, mockRes);
      
      expectSuccess(mockRes);
    });
  });

  describe('getDocumentHistory', () => {
    it('should return document history with user details', async () => {
      prisma.workflowDocument.findMany.mockResolvedValue([
        {
          id: 'doc-1',
          fileName: 'test.pdf',
          uploadedByUser: { email: 'user@test.com', firstName: 'Test', lastName: 'User' },
        },
      ]);
      
      mockReq.params.workflowId = 'workflow-1';
      
      await workflowDocumentsController.getDocumentHistory(mockReq, mockRes);
      
      expectSuccess(mockRes);
    });
  });

  describe('approveDocument', () => {
    it('should approve document for authorized reviewer', async () => {
      prisma.workflowDocument.findUnique.mockResolvedValue({
        id: 'doc-1',
        workflowId: 'workflow-1',
        status: 'pending',
      });
      prisma.workflowDocument.update.mockResolvedValue({
        id: 'doc-1',
        status: 'approved',
      });
      
      mockReq.params.documentId = 'doc-1';
      mockReq.user = { id: 'reviewer-id', roles: ['reviewer'] };
      
      await workflowDocumentsController.approveDocument(mockReq, mockRes);
      
      expectSuccess(mockRes);
    });

    it('should deny approval for unauthorized user', async () => {
      prisma.workflowDocument.findUnique.mockResolvedValue({
        id: 'doc-1',
        workflowId: 'workflow-1',
      });
      
      mockReq.params.documentId = 'doc-1';
      mockReq.user = { id: 'student-id', roles: ['student'] };
      
      await workflowDocumentsController.approveDocument(mockReq, mockRes);
      
      expectUnauthorized(mockRes);
    });
  });

  describe('shareDocument', () => {
    it('should share document successfully', async () => {
      prisma.workflowDocument.findUnique.mockResolvedValue({
        id: 'doc-1',
        filePath: 'Workflows/wf-1/test.pdf',
      });
      nextcloudService.createShare.mockResolvedValue({
        success: true,
        payload: { url: 'https://share.url' },
      });
      prisma.workflowDocumentShare.create.mockResolvedValue({
        id: 'share-1',
        shareUrl: 'https://share.url',
      });
      
      mockReq.params.documentId = 'doc-1';
      mockReq.body = { shareWith: 'user@test.com', permissions: 1 };
      
      await workflowDocumentsController.shareDocument(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should handle share failure from Nextcloud', async () => {
      prisma.workflowDocument.findUnique.mockResolvedValue({
        id: 'doc-1',
        filePath: 'Workflows/wf-1/test.pdf',
      });
      nextcloudService.createShare.mockResolvedValue({
        success: false,
        error: 'Share failed',
      });
      
      mockReq.params.documentId = 'doc-1';
      mockReq.body = { shareWith: 'user@test.com', permissions: 1 };
      
      await workflowDocumentsController.shareDocument(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('deleteDocument', () => {
    it('should delete document for authorized user', async () => {
      prisma.workflowDocument.findUnique.mockResolvedValue({
        id: 'doc-1',
        workflowId: 'workflow-1',
        filePath: 'Workflows/wf-1/test.pdf',
      });
      nextcloudService.deleteNode.mockResolvedValue({ success: true });
      prisma.workflowDocument.delete.mockResolvedValue({});
      
      mockReq.params.documentId = 'doc-1';
      mockReq.user = { id: 'editor-id', roles: ['editor'] };
      
      await workflowDocumentsController.deleteDocument(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should deny delete for unauthorized user', async () => {
      prisma.workflowDocument.findUnique.mockResolvedValue({
        id: 'doc-1',
        workflowId: 'workflow-1',
      });
      
      mockReq.params.documentId = 'doc-1';
      mockReq.user = { id: 'student-id', roles: ['student'] };
      
      await workflowDocumentsController.deleteDocument(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
  });
});
