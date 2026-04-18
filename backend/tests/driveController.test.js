/**
 * Unit tests for drive controller
 * Tests RBAC, file operations, and error handling
 */

const driveController = require('../controllers/driveController');
const nextcloudService = require('../services/nextcloudService');
const keycloakService = require('../services/keycloakService');

// Mock dependencies
jest.mock('../services/nextcloudService');
jest.mock('../services/keycloakService');

describe('Drive Controller', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      params: {},
      user: { id: 'test-user-id', roles: ['student'] },
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe('getPrivateFiles', () => {
    it('should return files for authorized user', async () => {
      keycloakService.getDatabaseUserId.mockResolvedValue('db-user-id');
      nextcloudService.listFiles.mockResolvedValue([{ name: 'test.pdf', size: 1024 }]);
      
      mockReq.params.userId = 'keycloak-id';
      
      await driveController.getPrivateFiles(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it('should deny access for unauthorized user', async () => {
      keycloakService.getDatabaseUserId.mockResolvedValue('other-db-id');
      
      mockReq.params.userId = 'keycloak-id';
      mockReq.user = { id: 'test-user-id', roles: ['student'] };
      
      await driveController.getPrivateFiles(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    it('should handle user not found', async () => {
      keycloakService.getDatabaseUserId.mockResolvedValue(null);
      
      mockReq.params.userId = 'invalid-id';
      
      await driveController.getPrivateFiles(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('uploadFilePrivate', () => {
    it('should upload file for authorized user', async () => {
      keycloakService.getDatabaseUserId.mockResolvedValue('db-user-id');
      nextcloudService.ensureFolder.mockResolvedValue({ success: true });
      nextcloudService.uploadFile.mockResolvedValue({ success: true });
      nextcloudService.assignTag.mockResolvedValue({ success: true });
      
      mockReq.params.userId = 'keycloak-id';
      mockReq.file = { originalname: 'test.pdf', buffer: Buffer.from('test'), mimetype: 'application/pdf' };
      
      await driveController.uploadFilePrivate(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it('should reject without file', async () => {
      mockReq.params.userId = 'keycloak-id';
      mockReq.file = null;
      
      await driveController.uploadFilePrivate(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getSharedFiles', () => {
    it('should return shared files for authorized user', async () => {
      nextcloudService.listFiles.mockResolvedValue([{ name: 'shared.pdf', size: 2048 }]);
      
      mockReq.user = { id: 'admin-id', roles: ['admin'] };
      
      await driveController.getSharedFiles(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should deny access for student', async () => {
      mockReq.user = { id: 'student-id', roles: ['student'] };
      
      await driveController.getSharedFiles(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
  });

  describe('proxyFile', () => {
    it('should proxy file for authorized user', async () => {
      keycloakService.getDatabaseUserId.mockResolvedValue('db-user-id');
      nextcloudService.downloadFile.mockResolvedValue({ pipe: jest.fn() });
      
      mockReq.params.userId = 'keycloak-id';
      mockReq.params.spaceType = 'private';
      mockReq.params.fileId = 'test-file.pdf';
      mockRes.setHeader = jest.fn();
      mockRes.headersSent = false;
      
      await driveController.proxyFile(mockReq, mockRes);
      
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'application/octet-stream');
    });

    it('should deny unauthorized proxy access', async () => {
      keycloakService.getDatabaseUserId.mockResolvedValue('other-db-id');
      
      mockReq.params.userId = 'keycloak-id';
      mockReq.params.spaceType = 'private';
      mockReq.params.fileId = 'test-file.pdf';
      mockReq.user = { id: 'test-user-id', roles: ['student'] };
      
      await driveController.proxyFile(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
  });
});
