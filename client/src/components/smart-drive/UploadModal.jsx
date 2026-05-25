import { useRef } from 'react';
import { useLang } from '@contexts/LangContext';
import Modal from '@ui/Modal/Modal';
import Button from '@ui/Button/Button';
import { Badge } from '@ui';
import { FILE_UPLOAD_CONFIG } from '@constants/sharedConfig';
import { getThemedIcon } from '@constants/iconTypes';

export default function UploadModal({
  uploads,
  uploading,
  onAddFiles,
  onRemove,
  onStart,
  onClose
}) {
  const { t } = useLang();
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    // Check file size
    if (file.size > FILE_UPLOAD_CONFIG.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `${file.name} exceeds the 50MB limit`
      };
    }

    // Check file extension
    const extension = file.name.split('.').pop().toLowerCase();
    if (!FILE_UPLOAD_CONFIG.ALLOWED_EXTENSIONS.includes(extension)) {
      return {
        valid: false,
        error: `${file.name} has an unsupported file type`
      };
    }

    return { valid: true };
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const validFiles = Array.from(files).filter(file => {
        const validation = validateFile(file);
        if (!validation.valid) {
          console.warn(validation.error);
        }
        return validation.valid;
      });
      if (validFiles.length > 0) {
        onAddFiles(validFiles);
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      const validFiles = Array.from(files).filter(file => {
        const validation = validateFile(file);
        if (!validation.valid) {
          console.warn(validation.error);
        }
        return validation.valid;
      });
      if (validFiles.length > 0) {
        onAddFiles(validFiles);
      }
    }
  };

  const formatSize = (bytes) => {
    if (!bytes && bytes !== 0) return '\u2014';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return 'check_circle';
      case 'failed': return 'x_circle';
      case 'uploading': return 'loader';
      default: return 'file';
    }
  };

  const getFileTypeIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
    if (['pdf', 'doc', 'docx', 'txt'].includes(ext)) return 'file_text';
    if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) return 'music';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'archive';
    return 'file';
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'completed':
        return {
          iconColor: 'text-green-600 dark:text-green-400',
          badgeBg: 'bg-green-100 dark:bg-green-900/30',
          badgeText: 'text-green-700 dark:text-green-400',
          badgeBorder: 'border-green-300 dark:border-green-700',
          progressBg: 'bg-green-500',
          icon: 'check_circle'
        };
      case 'failed':
        return {
          iconColor: 'text-red-600 dark:text-red-400',
          badgeBg: 'bg-red-100 dark:bg-red-900/30',
          badgeText: 'text-red-700 dark:text-red-400',
          badgeBorder: 'border-red-300 dark:border-red-700',
          progressBg: 'bg-red-500',
          icon: 'x_circle'
        };
      case 'uploading':
        return {
          iconColor: 'text-blue-600 dark:text-blue-400',
          badgeBg: 'bg-blue-100 dark:bg-blue-900/30',
          badgeText: 'text-blue-700 dark:text-blue-400',
          badgeBorder: 'border-blue-300 dark:border-blue-700',
          progressBg: 'bg-blue-500',
          icon: 'refresh_cw'
        };
      default:
        return {
          iconColor: 'text-gray-500 dark:text-gray-400',
          badgeBg: 'bg-gray-100 dark:bg-gray-800',
          badgeText: 'text-gray-700 dark:text-gray-400',
          badgeBorder: 'border-gray-300 dark:border-gray-700',
          progressBg: 'bg-gray-400',
          icon: 'clock'
        };
    }
  };

  const queuedCount = uploads.filter(u => u.status === 'queued').length;
  const completedCount = uploads.filter(u => u.status === 'completed').length;
  const failedCount = uploads.filter(u => u.status === 'failed').length;
  const versionUploads = uploads.filter(u => u.isVersion && u.status === 'queued').length;

  const footer = uploads.length > 0 ? (
    <div className="flex items-center justify-between w-full">
      <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
        {t('drive.addMore')}
      </Button>
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button
          variant="primary"
          onClick={onStart}
          disabled={queuedCount === 0 || uploading}
          loading={uploading}
        >
          {uploading ? t('drive.uploading') : `${t('drive.upload')} (${queuedCount})`}
        </Button>
      </div>
    </div>
  ) : (
    <div className="flex items-center justify-end w-full">
      <Button variant="outline" onClick={onClose}>
        {t('common.cancel')}
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={t('drive.uploadFiles')}
      size="large"
      footer={footer}
      titleStyle={{ fontSize: '1.25rem', fontWeight: '600' }}
    >
      {versionUploads > 0 && (
        <div style={{ marginBottom: '0.75rem' }}>
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-md border border-amber-300 dark:border-amber-600 bg-amber-100 dark:bg-amber-50 text-amber-700 dark:text-amber-800">
            {getThemedIcon('ui', 'info', 18, 'light')}
            <span className="text-base font-semibold">
              {versionUploads} {versionUploads === 1 ? 'file will' : 'files will'} create a new version because {versionUploads === 1 ? 'it' : 'they'} {versionUploads === 1 ? 'has' : 'have'} the same name as an existing file.
            </span>
          </div>
        </div>
      )}

      {uploads.length > 0 && (
        <div className="flex flex-wrap gap-2.5" style={{ marginBottom: '1.0rem' }}>
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-md border border-blue-300 dark:border-blue-600 bg-blue-100 dark:bg-blue-50 text-blue-700 dark:text-blue-800">
            {getThemedIcon('ui', 'clock', 18, 'light')}
            <span className="text-base font-semibold">
              {uploads.length} {t('drive.filesInQueue')}
            </span>
          </div>
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-md border border-green-300 dark:border-green-600 bg-green-100 dark:bg-green-50 text-green-700 dark:text-green-800">
            {getThemedIcon('ui', 'check_circle', 18, 'light')}
            <span className="text-base font-semibold">
              {completedCount} {t('drive.completed')}
            </span>
          </div>
          {failedCount > 0 && (
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-md border border-red-300 dark:border-red-600 bg-red-100 dark:bg-red-50 text-red-700 dark:text-red-800">
              {getThemedIcon('ui', 'x_circle', 18, 'light')}
              <span className="text-base font-semibold">
                {failedCount} {t('drive.failed')}
              </span>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {uploads.length === 0 && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className="p-16 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-500 dark:hover:border-blue-400 transition-all cursor-pointer bg-gray-50 dark:bg-white"
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
        >
          {getThemedIcon('ui', 'upload', 80, 'primary')}
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-900 mb-3" style={{ textAlign: 'center' }}>
            {t('drive.dragDropFiles')}
          </p>
          <p className="text-base font-medium text-gray-600 dark:text-gray-700 mb-8" style={{ textAlign: 'center' }}>
            {t('drive.orClickToSelect')}
          </p>
          <div className="flex items-center justify-center gap-6 mb-6">
            {getThemedIcon('ui', 'image', 28, 'muted')}
            {getThemedIcon('ui', 'file_text', 28, 'muted')}
            {getThemedIcon('ui', 'video', 28, 'muted')}
            {getThemedIcon('ui', 'music', 28, 'muted')}
            {getThemedIcon('ui', 'archive', 28, 'muted')}
          </div>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-700">
            <span className="font-medium">Max: 50MB</span>
            <span className="text-gray-300 dark:text-gray-400">•</span>
            <span>Images, Docs, Video, Audio, Archives</span>
          </div>
        </div>
      )}

      {uploads.length > 0 && (
        <div className="space-y-6 max-h-96 overflow-y-auto">
          {uploads.map((upload) => {
            const statusIcon = getStatusIcon(upload.status);
            const statusConfig = getStatusConfig(upload.status);
            const fileTypeIcon = getFileTypeIcon(upload.file.name);

            return (
              <div
                key={upload.id}
                className="p-3 bg-white dark:bg-white rounded-lg border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
                style={{ marginBottom: '1rem' }}
              >
                <div className="flex items-center gap-6">
                  <div className="flex-shrink-0">
                    {getThemedIcon('ui', fileTypeIcon, 36, 'muted')}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-gray-900 dark:text-gray-900 truncate mb-2">
                      {upload.file.name}
                    </p>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600 dark:text-gray-700">
                        {formatSize(upload.file.size)}
                      </span>
                      {upload.status === 'uploading' && (
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-700">
                          {upload.progress}%
                        </span>
                      )}
                      {upload.status === 'failed' && upload.error && (
                        <span className="text-sm font-medium text-red-600 dark:text-red-700">
                          {upload.error}
                        </span>
                      )}
                    </div>

                    {upload.status === 'uploading' && (
                      <div className="mt-3 h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${statusConfig.progressBg} transition-all duration-300 rounded-full`}
                          style={{ width: `${upload.progress}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <div className={`flex-shrink-0 ${statusConfig.iconColor}`}>
                    {getThemedIcon('ui', statusIcon, 24, upload.status === 'uploading' ? 'primary' : 'light')}
                  </div>

                  {upload.status !== 'uploading' && (
                    <button
                      onClick={() => onRemove(upload.id)}
                      className="flex-shrink-0 p-2.5 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      aria-label={t('drive.removeFile')}
                    >
                      {getThemedIcon('ui', 'trash2', 20, 'currentColor')}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
