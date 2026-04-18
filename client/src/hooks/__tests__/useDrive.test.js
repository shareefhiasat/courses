/**
 * Unit tests for useDrive hook
 * Tests state management, file operations, and error handling
 */

import { renderHook, act } from '@testing-library/react';
import { useDrive } from '../useDrive';
import * as driveService from '../../services/business/driveService';

// Mock dependencies
jest.mock('../../services/business/driveService');
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'test-user-id' } }),
}));

describe('useDrive Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useDrive());
      
      expect(result.current.privateFiles).toEqual([]);
      expect(result.current.sharedFiles).toEqual([]);
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBe(null);
      expect(result.current.activeTab).toBe('private');
    });
  });

  describe('loadPrivateFiles', () => {
    it('should load private files successfully', async () => {
      driveService.getPrivateFiles.mockResolvedValue({
        success: true,
        data: [{ fileName: 'test.pdf', size: 1024 }],
      });
      
      const { result } = renderHook(() => useDrive());
      
      await act(async () => {
        await result.current.loadPrivateFiles();
      });
      
      expect(result.current.privateFiles).toEqual([{ fileName: 'test.pdf', size: 1024 }]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle load error', async () => {
      driveService.getPrivateFiles.mockRejectedValue(new Error('Network error'));
      
      const { result } = renderHook(() => useDrive());
      
      await act(async () => {
        await result.current.loadPrivateFiles();
      });
      
      expect(result.current.error).toBe('Network error');
      expect(result.current.loading).toBe(false);
    });
  });

  describe('uploadToPrivate', () => {
    it('should upload file successfully', async () => {
      driveService.uploadFilePrivate.mockResolvedValue({
        success: true,
        data: { fileName: 'upload.pdf', size: 2048 },
      });
      driveService.getPrivateFiles.mockResolvedValue({
        success: true,
        data: [{ fileName: 'upload.pdf', size: 2048 }],
      });
      
      const { result } = renderHook(() => useDrive());
      const mockFile = new File(['content'], 'upload.pdf', { type: 'application/pdf' });
      
      await act(async () => {
        const uploadResult = await result.current.uploadToPrivate(mockFile);
        expect(uploadResult).toBeTruthy();
      });
      
      expect(driveService.uploadFilePrivate).toHaveBeenCalledWith('test-user-id', mockFile);
    });

    it('should handle upload error', async () => {
      driveService.uploadFilePrivate.mockResolvedValue({
        success: false,
        error: 'Upload failed',
      });
      
      const { result } = renderHook(() => useDrive());
      const mockFile = new File(['content'], 'upload.pdf', { type: 'application/pdf' });
      
      await act(async () => {
        const uploadResult = await result.current.uploadToPrivate(mockFile);
        expect(uploadResult).toBeNull();
      });
      
      expect(result.current.error).toBe('Upload failed');
    });
  });

  describe('deleteFromPrivate', () => {
    it('should delete file successfully', async () => {
      driveService.deleteFilePrivate.mockResolvedValue({
        success: true,
      });
      driveService.getPrivateFiles.mockResolvedValue({
        success: true,
        data: [],
      });
      
      const { result } = renderHook(() => useDrive());
      
      await act(async () => {
        const deleteResult = await result.current.deleteFromPrivate('file-id-123');
        expect(deleteResult).toBe(true);
      });
      
      expect(driveService.deleteFilePrivate).toHaveBeenCalledWith('test-user-id', 'file-id-123');
    });

    it('should handle delete error', async () => {
      driveService.deleteFilePrivate.mockResolvedValue({
        success: false,
        error: 'Delete failed',
      });
      
      const { result } = renderHook(() => useDrive());
      
      await act(async () => {
        const deleteResult = await result.current.deleteFromPrivate('file-id-123');
        expect(deleteResult).toBe(false);
      });
      
      expect(result.current.error).toBe('Delete failed');
    });
  });

  describe('tab switching', () => {
    it('should switch tabs and load appropriate files', async () => {
      driveService.getPrivateFiles.mockResolvedValue({
        success: true,
        data: [{ fileName: 'private.pdf' }],
      });
      driveService.getSharedFiles.mockResolvedValue({
        success: true,
        data: [{ fileName: 'shared.pdf' }],
      });
      
      const { result } = renderHook(() => useDrive());
      
      await act(async () => {
        await result.current.setActiveTab('shared');
      });
      
      expect(result.current.activeTab).toBe('shared');
      expect(driveService.getSharedFiles).toHaveBeenCalled();
    });
  });
});
