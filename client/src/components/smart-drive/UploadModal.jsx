import { useRef } from 'react';
import { useLang } from '@contexts/LangContext';
import { Upload, File, CheckCircle, XCircle, Loader, X } from 'lucide-react';
import Modal from '@ui/Modal/Modal';
import Button from '@ui/Button/Button';

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

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onAddFiles(files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      onAddFiles(files);
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
      case 'completed': return CheckCircle;
      case 'failed': return XCircle;
      case 'uploading': return Loader;
      default: return File;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-500 dark:text-green-400';
      case 'failed': return 'text-red-500 dark:text-red-400';
      case 'uploading': return 'text-blue-500 dark:text-blue-400';
      default: return 'text-gray-500 dark:text-gray-400';
    }
  };

  const queuedCount = uploads.filter(u => u.status === 'queued').length;
  const completedCount = uploads.filter(u => u.status === 'completed').length;
  const failedCount = uploads.filter(u => u.status === 'failed').length;

  const summary = uploads.length > 0
    ? `${uploads.length} ${t('drive.filesInQueue')} · ${completedCount} ${t('drive.completed')} · ${failedCount} ${t('drive.failed')}`
    : t('drive.dragDropOrClick');

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
  ) : null;

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={t('drive.uploadFiles')}
      size="large"
      footer={footer}
      titleStyle={{ fontSize: '1.25rem', fontWeight: '600' }}
    >
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{summary}</p>

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
          className="p-14 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors cursor-pointer text-center"
        >
          <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" aria-hidden="true" />
          <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {t('drive.dragDropFiles')}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('drive.orClickToSelect')}
          </p>
        </div>
      )}

      {uploads.length > 0 && (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {uploads.map((upload) => {
            const StatusIcon = getStatusIcon(upload.status);
            const statusColor = getStatusColor(upload.status);

            return (
              <div
                key={upload.id}
                className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`flex-shrink-0 ${statusColor}`}>
                    <StatusIcon className={`w-5 h-5 ${upload.status === 'uploading' ? 'animate-spin' : ''}`} aria-hidden="true" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-base font-medium text-gray-900 dark:text-white truncate">
                      {upload.file.name}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatSize(upload.file.size)}
                      </span>
                      {upload.status === 'uploading' && (
                        <span className="text-sm text-blue-500 dark:text-blue-400">
                          {upload.progress}%
                        </span>
                      )}
                      {upload.status === 'failed' && upload.error && (
                        <span className="text-sm text-red-500 dark:text-red-400">
                          {upload.error}
                        </span>
                      )}
                    </div>

                    {upload.status === 'uploading' && (
                      <div className="mt-3 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                          style={{ width: `${upload.progress}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {upload.status !== 'uploading' && (
                    <button
                      onClick={() => onRemove(upload.id)}
                      className="flex-shrink-0 p-2 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      aria-label={t('drive.removeFile')}
                    >
                      <X className="w-4 h-4" aria-hidden="true" />
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
