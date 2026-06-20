/**
 * User Image Upload Component
 *
 * Reusable upload card for profile photo, QID, and military ID images.
 */

import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, CheckCircle, AlertCircle, Trash2, User, CreditCard, Shield, ImagePlus } from 'lucide-react';
import { useLang } from '@contexts/LangContext';
import { Button, Progress } from '@ui';
import { uploadUserImage, deleteUserImage } from '@services/business/userImageService';
import styles from './UserImageUpload.module.css';

const IMAGE_TYPE_META = {
  profile: { labelKey: 'user_images.profile_photo', fallback: 'Profile Photo', Icon: User },
  qid: { labelKey: 'user_images.qid_image', fallback: 'QID / ID Card', Icon: CreditCard },
  military: { labelKey: 'user_images.military_id_image', fallback: 'Military ID', Icon: Shield },
};

const UserImageUpload = ({
  userId,
  imageType,
  currentImageUrl,
  editable = true,
  onUploadSuccess,
  onDeleteSuccess,
  onError,
}) => {
  const { t } = useLang();
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const meta = IMAGE_TYPE_META[imageType] || {
    labelKey: imageType,
    fallback: imageType,
    Icon: ImagePlus,
  };
  const { labelKey, fallback, Icon } = meta;
  const label = t(labelKey, fallback);

  const handleFileSelect = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setUploadError(t('user_images.file_too_large'));
      return;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setUploadError(t('user_images.invalid_file_type'));
      return;
    }

    setSelectedFile(file);
    setUploadError(null);
    setUploadSuccess(false);
    setUploadProgress(0);
  }, [t]);

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      const result = await uploadUserImage(userId, imageType, selectedFile, {
        onProgress: (progress) => setUploadProgress(Math.min(progress, 90)),
      });

      setUploadProgress(100);

      if (result.success) {
        setUploadSuccess(true);
        onUploadSuccess?.({
          type: imageType,
          url: result.data?.url,
          filePath: result.data?.filePath,
        });
        setTimeout(() => {
          setSelectedFile(null);
          setUploadSuccess(false);
          setUploadProgress(0);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }, 2000);
      } else {
        const message = result.error || t('user_images.upload_error');
        setUploadError(message);
        onError?.(result.error);
      }
    } catch (err) {
      const message = err.message || t('user_images.upload_error');
      setUploadError(message);
      onError?.(err.message);
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
        onDeleteSuccess?.(imageType);
      } else {
        const message = result.error || t('user_images.delete_error');
        setUploadError(message);
        onError?.(result.error);
      }
    } catch (err) {
      const message = err.message || t('user_images.delete_error');
      setUploadError(message);
      onError?.(err.message);
    } finally {
      setDeleting(false);
    }
  }, [currentImageUrl, userId, imageType, onDeleteSuccess, onError, t]);

  const handleButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className={styles.wrapper}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,application/pdf"
        onChange={handleFileSelect}
        className="hidden"
        disabled={!editable || uploading}
      />

      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.headerLabel}>
            <span className={styles.headerIcon}>
              <Icon size={14} />
            </span>
            {label}
          </div>
          {currentImageUrl && editable && !selectedFile && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting || uploading}
              className={styles.deleteBtn}
              title={t('common.delete', 'Delete')}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>

        <div className={styles.body}>
          {currentImageUrl && !selectedFile ? (
            <div className={styles.previewWrap}>
              <img
                src={currentImageUrl}
                alt={label}
                className={styles.preview}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              {editable && (
                <button
                  type="button"
                  onClick={handleButtonClick}
                  className={styles.replaceBtn}
                >
                  <Upload size={14} />
                  {t('user_images.replace')}
                </button>
              )}
            </div>
          ) : !selectedFile ? (
            <button
              type="button"
              onClick={handleButtonClick}
              disabled={!editable || uploading}
              className={styles.dropzone}
            >
              <Upload size={20} className={styles.dropzoneIcon} />
              <p className={styles.dropzoneTitle}>{t('user_images.click_to_upload')}</p>
              <p className={styles.dropzoneHint}>{t('user_images.file_types')}</p>
            </button>
          ) : (
            <div className={styles.selectedContent}>
              <div className={styles.fileRow}>
                <Icon size={16} className={styles.dropzoneIcon} />
                <div className={styles.fileInfo}>
                  <p className={styles.fileName}>{selectedFile.name}</p>
                  <p className={styles.fileSize}>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                {!uploading && !uploadSuccess && (
                  <button type="button" onClick={handleRemoveFile} className={styles.removeBtn}>
                    <X size={14} />
                  </button>
                )}
              </div>

              {uploading && (
                <div className={styles.progressWrap}>
                  <Progress value={uploadProgress} className="h-1" />
                  <p className={styles.progressLabel}>{uploadProgress}%</p>
                </div>
              )}

              {uploadSuccess && (
                <div className={styles.statusSuccess}>
                  <CheckCircle size={14} />
                  {t('user_images.upload_success')}
                </div>
              )}

              {uploadError && (
                <div className={styles.statusError}>
                  <AlertCircle size={14} />
                  {uploadError}
                </div>
              )}

              {!uploading && !uploadSuccess && (
                <Button
                  type="button"
                  onClick={handleUpload}
                  className={styles.uploadBtn}
                  disabled={uploading}
                >
                  <Upload size={14} />
                  {t('user_images.upload')}
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
