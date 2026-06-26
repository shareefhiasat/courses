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
              {versionUploads === 1
                ? t('drive.versionUploadWarningSingular')
                : t('drive.versionUploadWarningPlural', { count: versionUploads })}
            </span>
          </div>
        </div>
      )}

      {uploads.length > 0 && (
        <div className="flex flex-wrap items-center gap-2" style={{ marginBottom: '1rem' }}>
          {queuedCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text)]">
              {getThemedIcon('ui', 'clock', 14, 'primary')}
              {queuedCount} {t('drive.filesInQueue')}
            </span>
          )}
          {completedCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text)]">
              {getThemedIcon('ui', 'check_circle', 14, 'success')}
              {completedCount} {t('drive.completed')}
            </span>
          )}
          {failedCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text)]">
              {getThemedIcon('ui', 'x_circle', 14, 'error')}
              {failedCount} {t('drive.failed')}
            </span>
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
          className="rounded-xl border-2 border-dashed border-[var(--border)] transition-all cursor-pointer hover:border-[var(--color-primary)] hover:bg-[var(--bg-primary)]"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2.5rem 1.5rem',
            background: 'var(--panel)',
            gap: '0.75rem',
          }}
        >
          <div
            style={{
              width: '3.5rem',
              height: '3.5rem',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--bg-primary)',
              color: 'var(--color-primary)',
              marginBottom: '0.25rem',
            }}
          >
            {getThemedIcon('ui', 'upload', 32, 'primary')}
          </div>
          <p style={{ margin: 0, textAlign: 'center', fontSize: '1rem', fontWeight: 600, color: 'var(--text)' }}>
            {t('drive.dragDropFiles')}
          </p>
          <p style={{ margin: 0, textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            {t('drive.orClickToSelect')}
          </p>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              marginTop: '0.25rem',
            }}
          >
            {['image', 'file_text', 'video', 'music', 'archive'].map((icon) => (
              <div
                key={icon}
                style={{
                  width: '2rem',
                  height: '2rem',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-muted)',
                }}
              >
                {getThemedIcon('ui', icon, 18, 'muted')}
              </div>
            ))}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              marginTop: '0.25rem',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
            }}
          >
            <span style={{ fontWeight: 500, padding: '0.25rem 0.625rem', background: 'var(--bg-primary)', borderRadius: '9999px' }}>
              {t('drive.uploadMaxSize')}
            </span>
            <span>•</span>
            <span>{t('drive.uploadAcceptedTypes')}</span>
          </div>
        </div>
      )}

      {uploads.length > 0 && (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {uploads.map((upload) => {
            const statusIcon = getStatusIcon(upload.status);
            const fileTypeIcon = getFileTypeIcon(upload.file.name);
            const statusTheme = upload.status === 'completed' ? 'success' : upload.status === 'failed' ? 'error' : upload.status === 'uploading' ? 'primary' : 'muted';

            return (
              <div
                key={upload.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--panel)] transition-all hover:border-[var(--color-primary)] hover:bg-[var(--bg-primary)]"
                style={{ padding: '0.875rem 1rem' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    style={{
                      width: '2.5rem',
                      height: '2.5rem',
                      borderRadius: '0.625rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'var(--bg-primary)',
                      color: 'var(--color-primary)',
                      flexShrink: 0,
                    }}
                  >
                    {getThemedIcon('ui', fileTypeIcon, 22, 'primary')}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                      {upload.file.name}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {formatSize(upload.file.size)}
                      </span>
                      {upload.status === 'uploading' && (
                        <span className="text-xs font-medium" style={{ color: 'var(--color-primary)' }}>
                          {upload.progress}%
                        </span>
                      )}
                      {upload.status === 'failed' && upload.error && (
                        <span className="text-xs font-medium truncate" style={{ color: 'var(--color-primary)', maxWidth: '12rem' }}>
                          {upload.error}
                        </span>
                      )}
                    </div>

                    {upload.status === 'uploading' && (
                      <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
                        <div
                          className="h-full transition-all duration-300 rounded-full"
                          style={{ width: `${upload.progress}%`, background: 'var(--color-primary)' }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <div className={upload.status === 'uploading' ? 'animate-spin' : ''} style={{ color: 'var(--text-muted)' }}>
                      {getThemedIcon('ui', statusIcon, 20, statusTheme)}
                    </div>
                    {upload.status !== 'uploading' && (
                      <button
                        onClick={() => onRemove(upload.id)}
                        className="p-2 rounded-lg transition-colors text-[var(--text-muted)] hover:text-red-500 hover:bg-[var(--bg-primary)]"
                        aria-label={t('drive.removeFile')}
                      >
                        {getThemedIcon('ui', 'trash2', 18, 'currentColor')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
