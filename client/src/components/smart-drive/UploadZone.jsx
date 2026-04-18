import { useCallback, useState } from 'react';
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import { usePermissions } from '@hooks/usePermissions';
import { useLang } from '@contexts/LangContext';
import { ROLE_STRINGS } from '@utils/userUtils';

/**
 * UploadZone Component
 * Drag & drop file upload with permission check
 */
export default function UploadZone({ bucket, onUpload, onClose }) {
  const { t } = useLang();
  const { hasPermission, roleCode } = usePermissions();
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadStatus, setUploadStatus] = useState({});

  // Super admin bypass for upload permission
  const isSuperAdmin = roleCode === ROLE_STRINGS.SUPER_ADMIN;
  const canUpload = isSuperAdmin ? true : hasPermission('drive.upload');

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles(prev => [...prev, ...files]);
  }, []);

  const handleFileSelect = useCallback((e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
  }, []);

  const removeFile = useCallback((index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpload = useCallback(async () => {
    if (!canUpload || selectedFiles.length === 0) return;

    setUploading(true);
    const newProgress = {};
    const newStatus = {};

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const fileId = `${file.name}-${i}`;
      
      try {
        newProgress[fileId] = 0;
        newStatus[fileId] = 'uploading';
        setUploadProgress({ ...newProgress });
        setUploadStatus({ ...newStatus });

        await onUpload(file, (progress) => {
          newProgress[fileId] = progress;
          setUploadProgress({ ...newProgress });
        });

        newStatus[fileId] = 'success';
        setUploadStatus({ ...newStatus });
      } catch (error) {
        newStatus[fileId] = 'error';
        setUploadStatus({ ...newStatus });
      }
    }

    setUploading(false);
    
    // Auto-close after 2 seconds if all successful
    const allSuccess = Object.values(newStatus).every(s => s === 'success');
    if (allSuccess) {
      setTimeout(() => {
        onClose?.();
      }, 2000);
    }
  }, [selectedFiles, canUpload, onUpload, onClose]);

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (!canUpload) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-600 dark:text-red-400">
          {t('drive.noUploadPermission')}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('drive.uploadFiles')}
        </h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[1.02]'
            : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
        }`}
      >
        <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('drive.dragDropFiles')}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {t('drive.supportedFormats')}
        </p>
        <label className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 cursor-pointer transition-all shadow-md hover:shadow-lg">
          <input
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          {t('drive.browseFiles')}
        </label>
      </div>

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="font-medium text-gray-900 dark:text-white">
            {t('drive.selectedFiles')} ({selectedFiles.length})
          </h4>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {selectedFiles.map((file, index) => {
              const fileId = `${file.name}-${index}`;
              const progress = uploadProgress[fileId] || 0;
              const status = uploadStatus[fileId];

              return (
                <div
                  key={fileId}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatSize(file.size)}
                    </p>
                    {status === 'uploading' && (
                      <div className="mt-1 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                  {status === 'success' && (
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  )}
                  {status === 'error' && (
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  )}
                  {!status && !uploading && (
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upload Button */}
      {selectedFiles.length > 0 && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? t('drive.uploading') : t('drive.uploadAll')}
          </button>
          {!uploading && (
            <button
              onClick={() => setSelectedFiles([])}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              {t('common.clear')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
