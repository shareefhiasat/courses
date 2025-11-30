import React, { useState, useRef } from 'react';
import { Upload, X, File, CheckCircle, AlertCircle } from 'lucide-react';
import styles from './FileUpload.module.css';

/**
 * FileUpload Component
 * 
 * Drag-and-drop file upload with progress.
 */
const FileUpload = ({
  onUpload,
  accept,
  multiple = false,
  maxSize = 10 * 1024 * 1024, // 10MB default
  maxFiles = 5,
  disabled = false,
  className = '',
}) => {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleFileInput = (e) => {
    const selectedFiles = Array.from(e.target.files);
    handleFiles(selectedFiles);
  };

  const handleFiles = (newFiles) => {
    const validFiles = newFiles
      .filter(file => {
        if (maxSize && file.size > maxSize) {
          return false;
        }
        return true;
      })
      .slice(0, maxFiles - files.length)
      .map(file => ({
        file,
        id: Math.random().toString(36).substr(2, 9),
        progress: 0,
        status: 'pending', // pending, uploading, success, error
        error: null,
      }));

    const updatedFiles = [...files, ...validFiles];
    setFiles(updatedFiles);

    // Simulate upload for each file
    validFiles.forEach(fileObj => {
      uploadFile(fileObj);
    });
  };

  const uploadFile = async (fileObj) => {
    setFiles(prev => prev.map(f => 
      f.id === fileObj.id ? { ...f, status: 'uploading' } : f
    ));

    try {
      // Simulate upload progress
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setFiles(prev => prev.map(f => 
          f.id === fileObj.id ? { ...f, progress } : f
        ));
      }

      setFiles(prev => prev.map(f => 
        f.id === fileObj.id ? { ...f, status: 'success', progress: 100 } : f
      ));

      if (onUpload) {
        onUpload(fileObj.file);
      }
    } catch (error) {
      setFiles(prev => prev.map(f => 
        f.id === fileObj.id ? { ...f, status: 'error', error: error.message } : f
      ));
    }
  };

  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const dropzoneClasses = [
    styles.dropzone,
    isDragging && styles.dragging,
    disabled && styles.disabled,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={styles.wrapper}>
      <div
        className={dropzoneClasses}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <Upload size={48} className={styles.uploadIcon} />
        <p className={styles.dropzoneText}>
          <strong>Click to upload</strong> or drag and drop
        </p>
        <p className={styles.dropzoneHint}>
          {accept ? `Accepted: ${accept}` : 'Any file type'} 
          {maxSize && ` (Max ${formatFileSize(maxSize)})`}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          disabled={disabled}
          className={styles.fileInput}
        />
      </div>

      {files.length > 0 && (
        <div className={styles.fileList}>
          {files.map(fileObj => (
            <div key={fileObj.id} className={styles.fileItem}>
              <div className={styles.fileInfo}>
                <File size={20} className={styles.fileIcon} />
                <div className={styles.fileDetails}>
                  <span className={styles.fileName}>{fileObj.file.name}</span>
                  <span className={styles.fileSize}>{formatFileSize(fileObj.file.size)}</span>
                </div>
              </div>

              <div className={styles.fileActions}>
                {fileObj.status === 'uploading' && (
                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progressFill} 
                      style={{ width: `${fileObj.progress}%` }}
                    />
                  </div>
                )}
                {fileObj.status === 'success' && (
                  <CheckCircle size={20} className={styles.successIcon} />
                )}
                {fileObj.status === 'error' && (
                  <AlertCircle size={20} className={styles.errorIcon} />
                )}
                <button
                  className={styles.removeButton}
                  onClick={() => removeFile(fileObj.id)}
                  aria-label="Remove file"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
