/**
 * Unit tests for useWorkflowDocuments hook
 * Tests state management, document operations, and collaboration features
 */

import { renderHook, act } from '@testing-library/react';
import { useWorkflowDocuments } from '../useWorkflowDocuments';
import * as workflowDocumentService from '../../services/business/workflowDocumentService';

// Mock dependencies
jest.mock('../../services/business/workflowDocumentService');
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'test-user-id' } }),
}));

describe('useWorkflowDocuments Hook', () => {
  const workflowId = 'workflow-1';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useWorkflowDocuments(workflowId));
      
      expect(result.current.documents).toEqual([]);
      expect(result.current.history).toEqual([]);
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBe(null);
    });
  });

  describe('loadDocuments', () => {
    it('should load documents successfully', async () => {
      workflowDocumentService.getWorkflowDocuments.mockResolvedValue({
        success: true,
        data: [{ fileName: 'test.pdf', status: 'pending' }],
      });
      
      const { result } = renderHook(() => useWorkflowDocuments(workflowId));
      
      await act(async () => {
        await result.current.loadDocuments();
      });
      
      expect(result.current.documents).toEqual([{ fileName: 'test.pdf', status: 'pending' }]);
      expect(result.current.loading).toBe(false);
    });

    it('should handle load error', async () => {
      workflowDocumentService.getWorkflowDocuments.mockRejectedValue(new Error('Network error'));
      
      const { result } = renderHook(() => useWorkflowDocuments(workflowId));
      
      await act(async () => {
        await result.current.loadDocuments();
      });
      
      expect(result.current.error).toBe('Network error');
    });
  });

  describe('uploadDocument', () => {
    it('should upload document successfully', async () => {
      workflowDocumentService.uploadWorkflowDocument.mockResolvedValue({
        success: true,
        data: { fileName: 'upload.pdf', status: 'pending' },
      });
      workflowDocumentService.getWorkflowDocuments.mockResolvedValue({
        success: true,
        data: [{ fileName: 'upload.pdf', status: 'pending' }],
      });
      
      const { result } = renderHook(() => useWorkflowDocuments(workflowId));
      const mockFile = new File(['content'], 'upload.pdf', { type: 'application/pdf' });
      
      await act(async () => {
        const uploadResult = await result.current.uploadDocument(mockFile);
        expect(uploadResult).toBeTruthy();
      });
      
      expect(workflowDocumentService.uploadWorkflowDocument).toHaveBeenCalledWith(workflowId, mockFile);
    });

    it('should handle upload error', async () => {
      workflowDocumentService.uploadWorkflowDocument.mockResolvedValue({
        success: false,
        error: 'Upload failed',
      });
      
      const { result } = renderHook(() => useWorkflowDocuments(workflowId));
      const mockFile = new File(['content'], 'upload.pdf', { type: 'application/pdf' });
      
      await act(async () => {
        const uploadResult = await result.current.uploadDocument(mockFile);
        expect(uploadResult).toBeNull();
      });
      
      expect(result.current.error).toBe('Upload failed');
    });
  });

  describe('approveDocument', () => {
    it('should approve document successfully', async () => {
      workflowDocumentService.approveWorkflowDocument.mockResolvedValue({
        success: true,
        data: { status: 'approved' },
      });
      workflowDocumentService.getWorkflowDocuments.mockResolvedValue({
        success: true,
        data: [{ status: 'approved' }],
      });
      
      const { result } = renderHook(() => useWorkflowDocuments(workflowId));
      
      await act(async () => {
        const approveResult = await result.current.approveDocument('doc-1');
        expect(approveResult).toBe(true);
      });
      
      expect(workflowDocumentService.approveWorkflowDocument).toHaveBeenCalledWith('doc-1');
    });

    it('should handle approval error', async () => {
      workflowDocumentService.approveWorkflowDocument.mockResolvedValue({
        success: false,
        error: 'Approval failed',
      });
      
      const { result } = renderHook(() => useWorkflowDocuments(workflowId));
      
      await act(async () => {
        const approveResult = await result.current.approveDocument('doc-1');
        expect(approveResult).toBe(false);
      });
      
      expect(result.current.error).toBe('Approval failed');
    });
  });

  describe('shareDocument', () => {
    it('should share document successfully', async () => {
      workflowDocumentService.shareWorkflowDocument.mockResolvedValue({
        success: true,
        data: { shareUrl: 'https://share.url' },
      });
      
      const { result } = renderHook(() => useWorkflowDocuments(workflowId));
      
      await act(async () => {
        const shareResult = await result.current.shareDocument('doc-1', 'user@test.com', 1);
        expect(shareResult).toBeTruthy();
      });
      
      expect(workflowDocumentService.shareWorkflowDocument).toHaveBeenCalledWith('doc-1', 'user@test.com', 1);
    });

    it('should handle share error', async () => {
      workflowDocumentService.shareWorkflowDocument.mockResolvedValue({
        success: false,
        error: 'Share failed',
      });
      
      const { result } = renderHook(() => useWorkflowDocuments(workflowId));
      
      await act(async () => {
        const shareResult = await result.current.shareDocument('doc-1', 'user@test.com', 1);
        expect(shareResult).toBeNull();
      });
      
      expect(result.current.error).toBe('Share failed');
    });
  });

  describe('deleteDocument', () => {
    it('should delete document successfully', async () => {
      workflowDocumentService.deleteWorkflowDocument.mockResolvedValue({
        success: true,
      });
      workflowDocumentService.getWorkflowDocuments.mockResolvedValue({
        success: true,
        data: [],
      });
      
      const { result } = renderHook(() => useWorkflowDocuments(workflowId));
      
      // Mock window.confirm
      window.confirm = jest.fn(() => true);
      
      await act(async () => {
        const deleteResult = await result.current.deleteDocument('doc-1');
        expect(deleteResult).toBe(true);
      });
      
      expect(workflowDocumentService.deleteWorkflowDocument).toHaveBeenCalledWith('doc-1');
    });

    it('should cancel delete when user confirms false', async () => {
      const { result } = renderHook(() => useWorkflowDocuments(workflowId));
      
      window.confirm = jest.fn(() => false);
      
      await act(async () => {
        const deleteResult = await result.current.deleteDocument('doc-1');
        expect(deleteResult).toBe(false);
      });
      
      expect(workflowDocumentService.deleteWorkflowDocument).not.toHaveBeenCalled();
    });
  });

  describe('loadHistory', () => {
    it('should load document history successfully', async () => {
      workflowDocumentService.getDocumentHistory.mockResolvedValue({
        success: true,
        data: [{ fileName: 'v1.pdf', uploadedAt: '2024-01-01' }],
      });
      
      const { result } = renderHook(() => useWorkflowDocuments(workflowId));
      
      await act(async () => {
        await result.current.loadHistory();
      });
      
      expect(result.current.history).toEqual([{ fileName: 'v1.pdf', uploadedAt: '2024-01-01' }]);
    });
  });
});
