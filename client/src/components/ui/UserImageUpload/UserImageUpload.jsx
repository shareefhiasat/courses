/**
 * User Image Upload Component
 * 
 * PURPOSE: Reusable component for uploading user images with progress tracking
 * ARCHITECTURE: UI Component → User Image Service → Backend API → Nextcloud WebDAV
 */

import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, CheckCircle, AlertCircle, Trash2, User, CreditCard, Shield, ImagePlus } from 'lucide-react';
import { useLang } from '@contexts/LangContext';
import { Button, Progress } from '@ui';
import { uploadUserImage, deleteUserImage } from '@services/business/userImageService';

const UserImageUpload = ({ userId, imageType, currentImageUrl, editable = true, onUploadSuccess, onDeleteSuccess, onError }) => {
  const { t } = useLang();
  const fileInputRef = useRef(null);
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleFileSelect = useCallback((event) => {
    console.log('[UserImageUpload] File select triggered');
    const file = event.target.files?.[0];
    console.log('[UserImageUpload] Selected file:', file);
    
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.error('[UserImageUpload] File too large:', file.size);
      setUploadError(t('user_images.file_too_large', 'File size exceeds 5MB limit'));
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      console.error('[UserImageUpload] Invalid file type:', file.type);
      setUploadError(t('user_images.invalid_file_type', 'Invalid file type. Allowed: JPEG, PNG, PDF'));
      return;
    }

    console.log('[UserImageUpload] File validated, setting selected file');
    setSelectedFile(file);
    setUploadError(null);
    setUploadSuccess(false);
    setUploadProgress(0);
  }, [t]);

  const handleUpload = useCallback(async () => {
    console.log('[UserImageUpload] handleUpload called:', { userId, imageType, selectedFile: selectedFile?.name });
    
    if (!selectedFile) {
      console.error('[UserImageUpload] No file selected');
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      console.log('[UserImageUpload] Calling uploadUserImage...');
      const result = await uploadUserImage(userId, imageType, selectedFile, {
        onProgress: (progress) => {
          console.log('[UserImageUpload] Upload progress:', progress);
          setUploadProgress(Math.min(progress, 90));
        }
      });

      setUploadProgress(100);

      if (result.success) {
        setUploadSuccess(true);
        if (onUploadSuccess) {
          onUploadSuccess({
            type: imageType,
            url: result.data?.url,
            filePath: result.data?.filePath
          });
        }
        setTimeout(() => {
          setSelectedFile(null);
          setUploadSuccess(false);
          setUploadProgress(0);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }, 2000);
      } else {
        setUploadError(result.error || t('user_images.upload_error', 'Failed to upload image'));
        if (onError) {
          onError(result.error);
        }
      }
    } catch (error) {
      console.error('[UserImageUpload] Upload error:', error);
      setUploadError(error.message || t('user_images.upload_error', 'Failed to upload image'));
      if (onError) {
        onError(error.message);
      }
    } finally {
      setUploading(false);
    }
  }, [selectedFile, userId, imageType, onUploadSuccess, onError, t]);

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    setUploadError(null);
    setUploadSuccess(false);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleDelete = useCallback(async () => {
    if (!currentImageUrl) return;

    setDeleting(true);
    try {
      const result = await deleteUserImage(userId, imageType);
      if (result.success) {
        if (onDeleteSuccess) {
          onDeleteSuccess(imageType);
        }
      } else {
        setUploadError(result.error || t('user_images.delete_error', 'Failed to delete image'));
        if (onError) {
          onError(result.error);
        }
      }
    } catch (error) {
      console.error('[UserImageUpload] Delete error:', error);
      setUploadError(error.message || t('user_images.delete_error', 'Failed to delete image'));
      if (onError) {
        onError(error.message);
      }
    } finally {
      setDeleting(false);
    }
  }, [currentImageUrl, userId, imageType, onDeleteSuccess, onError, t]);

  const handleButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const getImageTypeMeta = () => {
    switch (imageType) {
      case 'profile':  return { label: t('user_images.profile_photo', 'Profile Photo'),   Icon: User,       color: 'text-blue-500 dark:text-blue-400',   bg: 'bg-blue-50 dark:bg-blue-900/20',   border: 'border-blue-200 dark:border-blue-700' };
      case 'qid':      return { label: t('user_images.qid_image', 'QID / ID Card'),        Icon: CreditCard, color: 'text-purple-500 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-700' };
      case 'military': return { label: t('user_images.military_id_image', 'Military ID'),  Icon: Shield,     color: 'text-green-600 dark:text-green-400',  bg: 'bg-green-50 dark:bg-green-900/20',  border: 'border-green-200 dark:border-green-700' };
      default:         return { label: imageType,                                           Icon: ImagePlus,  color: 'text-gray-500 dark:text-gray-400',   bg: 'bg-gray-50 dark:bg-gray-800',   border: 'border-gray-200 dark:border-gray-600' };
    }
  };

  const { label, Icon, color, bg, border } = getImageTypeMeta();

  return (
    <div className="flex flex-col gap-2">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,application/pdf"
        onChange={handleFileSelect}
        className="hidden"
        disabled={!editable || uploading}
      />

      {/* Card */}
      <div className={`rounded-lg border ${border} ${bg} overflow-hidden transition-all dark:bg-gray-800/50`}>
        {/* Header */}
        <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80">
          <div className={`flex items-center gap-1.5 font-medium text-xs ${color}`}>
            <Icon className="h-3 w-3" />
            {label}
          </div>
          {currentImageUrl && editable && !selectedFile && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting || uploading}
              className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors disabled:opacity-40"
              title={t('common.delete', 'Delete')}
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-2">
          {/* Current Image Preview */}
          {currentImageUrl && !selectedFile ? (
            <div className="space-y-1.5">
              <img
                src={currentImageUrl}
                alt={label}
                className="w-full h-24 object-cover rounded-md shadow-sm"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              {editable && (
                <button
                  type="button"
                  onClick={handleButtonClick}
                  className={`w-full text-xs ${color} hover:underline flex items-center justify-center gap-1 py-1`}
                >
                  <Upload className="h-3 w-3" /> {t('user_images.replace', 'Replace')}
                </button>
              )}
            </div>
          ) : !selectedFile ? (
            /* Empty state - click to upload */
            <button
              type="button"
              onClick={handleButtonClick}
              disabled={!editable || uploading}
              className={`w-full flex flex-col items-center gap-1 py-3 rounded-md border-2 border-dashed ${border} hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors disabled:opacity-40 cursor-pointer`}
            >
              <Upload className={`h-4 w-4 ${color}`} />
              <span className={`text-xs font-medium ${color}`}>{t('user_images.click_to_upload', 'Click to upload')}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{t('user_images.file_types', 'JPEG, PNG, PDF · max 5MB')}</span>
            </button>
          ) : (
            /* File selected */
            <div className="space-y-1.5">
              {/* File info row */}
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-md px-2 py-1.5 shadow-sm border border-gray-200 dark:border-gray-700">
                <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${color}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                {!uploading && !uploadSuccess && (
                  <button type="button" onClick={handleRemoveFile} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Progress */}
              {uploading && (
                <div className="space-y-1">
                  <Progress value={uploadProgress} className="h-1" />
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">{uploadProgress}%</p>
                </div>
              )}

              {/* Success */}
              {uploadSuccess && (
                <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 text-xs">
                  <CheckCircle className="h-3 w-3" />
                  {t('user_images.upload_success', 'Uploaded successfully')}
                </div>
              )}

              {/* Error */}
              {uploadError && (
                <div className="flex items-center gap-1.5 text-red-500 dark:text-red-400 text-xs">
                  <AlertCircle className="h-3 w-3 flex-shrink-0" />
                  {uploadError}
                </div>
              )}

              {/* Upload button */}
              {!uploading && !uploadSuccess && (
                <Button
                  type="button"
                  onClick={handleUpload}
                  className="w-full flex items-center justify-center gap-1.5 text-xs py-1.5"
                  disabled={uploading}
                >
                  <Upload className="h-3 w-3" />
                  {t('user_images.upload', 'Upload')}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserImageUpload;
