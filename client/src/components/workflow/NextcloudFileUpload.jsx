/**
 * Nextcloud File Upload Component
 * 
 * PURPOSE: Upload files to Nextcloud personal drive with progress tracking
 * ARCHITECTURE: UI Component → Personal Drive Service → Nextcloud WebDAV API
 */

import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, File, CheckCircle, AlertCircle } from 'lucide-react';
import { useLang } from '@contexts/LangContext';
import { Button, Progress } from '@ui';
import { uploadFileToPersonalDrive } from '@services/business/personalDriveService';

const NextcloudFileUpload = ({ onFileUploaded, onError, accept = '*', maxSize = 50 * 1024 * 1024 }) => {
  const { t } = useLang();
  const fileInputRef = useRef(null);
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFileSelect = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      setUploadError(`File size exceeds ${maxSizeMB}MB limit`);
      return;
    }

    setSelectedFile(file);
    setUploadError(null);
    setUploadSuccess(false);
    setUploadProgress(0);
  }, [maxSize]);

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const result = await uploadFileToPersonalDrive(selectedFile, {
        folder: 'Uploads',
        onProgress: (progress) => {
          setUploadProgress(Math.min(progress, 90));
        }
      });

      clearInterval(progressInterval);

      if (result.success) {
        setUploadProgress(100);
        setUploadSuccess(true);
        
        if (onFileUploaded) {
          onFileUploaded({
            file: selectedFile,
            nextcloudFileId: result.data.fileId,
            nextcloudFilePath: result.data.filePath,
            url: result.data.url
          });
        }

        // Reset after 2 seconds
        setTimeout(() => {
          setSelectedFile(null);
          setUploadSuccess(false);
          setUploadProgress(0);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }, 2000);
      } else {
        setUploadError(result.error || t('workflow.drive.uploadError', 'Failed to upload file'));
        if (onError) {
          onError(result.error);
        }
      }
    } catch (error) {
      console.error('[NextcloudFileUpload] Upload error:', error);
      setUploadError(error.message || t('workflow.drive.uploadError', 'Failed to upload file'));
      if (onError) {
        onError(error.message);
      }
    } finally {
      setUploading(false);
    }
  }, [selectedFile, onFileUploaded, onError, t]);

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    setUploadError(null);
    setUploadSuccess(false);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="space-y-4">
      {/* File Input (Hidden) */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload Button or Selected File Display */}
      {!selectedFile ? (
        <Button
          type="button"
          variant="outline"
          onClick={handleButtonClick}
          className="w-full flex items-center justify-center gap-2"
        >
          <Upload className="h-4 w-4" />
          {t('workflow.create.selectFile', 'Select File')}
        </Button>
      ) : (
        <div className="border border-gray-300 rounded-lg p-4 space-y-3">
          {/* File Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <File className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            
            {!uploading && !uploadSuccess && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveFile}
                className="flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-gray-500 text-center">
                {uploadProgress}% {t('common.uploading', 'Uploading...')}
              </p>
            </div>
          )}

          {/* Success Message */}
          {uploadSuccess && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">
                {t('workflow.drive.uploadSuccess', 'File uploaded successfully')}
              </span>
            </div>
          )}

          {/* Error Message */}
          {uploadError && (
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{uploadError}</span>
            </div>
          )}

          {/* Upload Button */}
          {!uploading && !uploadSuccess && (
            <Button
              type="button"
              onClick={handleUpload}
              className="w-full flex items-center justify-center gap-2"
              disabled={uploading}
            >
              <Upload className="h-4 w-4" />
              {t('workflow.create.uploadFile', 'Upload File')}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default NextcloudFileUpload;
