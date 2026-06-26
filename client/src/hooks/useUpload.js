/**
 * useUpload Hook
 * Manages upload queue and progress via protected proxy API
 * Flow: initiate → MinIO presigned PUT → complete
 */

import { useState, useCallback } from 'react';
import axios from 'axios';

const API_BASE = '/api/v1/drive';

export function useUpload(existingFiles = []) {
  const [uploads, setUploads] = useState([]);
  const [uploading, setUploading] = useState(false);

  const addToQueue = useCallback((files, folderId = null) => {
    const newUploads = Array.from(files).map(file => {
      // Check if file with same name already exists
      const existingFile = existingFiles.find(f =>
        f.name === file.name &&
        f.folderId === folderId
      );

      return {
        id: `${Date.now()}-${Math.random()}`,
        file,
        folderId,
        status: 'queued', // queued, uploading, completed, failed
        progress: 0,
        error: null,
        fileId: null,
        isVersion: !!existingFile,
      };
    });

    setUploads(prev => [...prev, ...newUploads]);
    return newUploads;
  }, [existingFiles]);

  const uploadFile = useCallback(async (uploadItem) => {
    const { id, file, folderId } = uploadItem;

    try {
      // Update status to uploading
      setUploads(prev => prev.map(u => 
        u.id === id ? { ...u, status: 'uploading', progress: 0 } : u
      ));

      // Step 1: Initiate upload
      const initiateResponse = await axios.post(`${API_BASE}/upload/initiate`, {
        name: file.name,
        size: file.size,
        mimeType: file.type,
        bucket: 'PRIVATE',
        folderId: folderId || null,
      });

      if (!initiateResponse.data.success) {
        throw new Error(initiateResponse.data.error?.message || 'Failed to initiate upload');
      }

      const { fileId, versionId, uploadUrl, presignedUrl } = initiateResponse.data.payload;
      const targetUploadUrl = uploadUrl || presignedUrl;

      if (!targetUploadUrl || !versionId) {
        throw new Error('Upload initiation response is missing upload URL or version ID');
      }

      // Update with fileId
      setUploads(prev => prev.map(u => 
        u.id === id ? { ...u, fileId, progress: 10 } : u
      ));

      // Step 2: Upload to MinIO presigned URL
      await axios.put(targetUploadUrl, file, {
        headers: {
          'Content-Type': file.type,
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 80) / progressEvent.total + 10
          );
          setUploads(prev => prev.map(u => 
            u.id === id ? { ...u, progress: percentCompleted } : u
          ));
        },
      });

      // Step 3: Complete upload
      const completeResponse = await axios.post(`${API_BASE}/upload/${fileId}/complete`, {
        versionId,
      });

      if (!completeResponse.data.success) {
        throw new Error(completeResponse.data.error?.message || 'Failed to complete upload');
      }

      // Mark as completed
      setUploads(prev => prev.map(u => 
        u.id === id ? { ...u, status: 'completed', progress: 100 } : u
      ));

      return { success: true, fileId };
    } catch (error) {
      console.error('[useUpload] upload failed:', error);
      
      setUploads(prev => prev.map(u => 
        u.id === id ? { 
          ...u, 
          status: 'failed', 
          error: error.response?.data?.error?.message || error.message 
        } : u
      ));

      return { success: false, error: error.message };
    }
  }, []);

  const startUpload = useCallback(async () => {
    setUploading(true);

    const queuedUploads = uploads.filter(u => u.status === 'queued');
    const results = { completed: 0, failed: 0, errors: [] };

    for (const upload of queuedUploads) {
      const result = await uploadFile(upload);
      if (result.success) {
        results.completed++;
      } else {
        results.failed++;
        results.errors.push({ name: upload.file.name, error: result.error });
      }
    }

    setUploading(false);
    return results;
  }, [uploads, uploadFile]);

  const removeUpload = useCallback((id) => {
    setUploads(prev => prev.filter(u => u.id !== id));
  }, []);

  const clearCompleted = useCallback(() => {
    setUploads(prev => prev.filter(u => u.status !== 'completed'));
  }, []);

  const clearAll = useCallback(() => {
    setUploads([]);
  }, []);

  return {
    uploads,
    uploading,
    addToQueue,
    startUpload,
    removeUpload,
    clearCompleted,
    clearAll,
  };
}

export default useUpload;
