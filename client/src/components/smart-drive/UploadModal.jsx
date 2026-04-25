import { useRef } from 'react';
import { useLang } from '@contexts/LangContext';
import { X, Upload, File, CheckCircle, XCircle, Loader } from 'lucide-react';

/**
 * UploadModal - Drag-drop upload with per-file progress
 * Uses protected proxy API (initiate → MinIO → complete)
 */
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
    if (!bytes && bytes !== 0) return '—';
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
      case 'completed': return 'text-[#a5d6a7]';
      case 'failed': return 'text-[#ffb4ab]';
      case 'uploading': return 'text-[#b4c5ff]';
      default: return 'text-[#8d90a0]';
    }
  };

  const queuedCount = uploads.filter(u => u.status === 'queued').length;
  const completedCount = uploads.filter(u => u.status === 'completed').length;
  const failedCount = uploads.filter(u => u.status === 'failed').length;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-[#191b23] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-[#434655]/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#434655]/10 flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-white">
              {t('drive.uploadFiles')}
            </h2>
            <p className="text-sm text-[#8d90a0] mt-1">
              {uploads.length > 0 
                ? `${uploads.length} ${t('drive.filesInQueue')} · ${completedCount} ${t('drive.completed')} · ${failedCount} ${t('drive.failed')}`
                : t('drive.dragDropOrClick')
              }
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#8d90a0] hover:text-white hover:bg-[#32343d] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drop Zone */}
        {uploads.length === 0 && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
            className="m-6 p-12 border-2 border-dashed border-[#434655]/50 rounded-xl hover:border-[#2563eb]/50 hover:bg-[#2563eb]/5 transition-colors cursor-pointer"
          >
            <div className="text-center">
              <Upload className="w-16 h-16 mx-auto mb-4 text-[#8d90a0]" />
              <p className="text-lg font-medium text-white mb-2">
                {t('drive.dragDropFiles')}
              </p>
              <p className="text-sm text-[#8d90a0]">
                {t('drive.orClickToSelect')}
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {/* Upload List */}
        {uploads.length > 0 && (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-2">
              {uploads.map((upload) => {
                const StatusIcon = getStatusIcon(upload.status);
                const statusColor = getStatusColor(upload.status);

                return (
                  <div
                    key={upload.id}
                    className="p-3 bg-[#1d1f27] rounded-lg border border-[#434655]/30 hover:border-[#434655]/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex-shrink-0 ${statusColor}`}>
                        <StatusIcon className={`w-5 h-5 ${upload.status === 'uploading' ? 'animate-spin' : ''}`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {upload.file.name}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-[#8d90a0]">
                            {formatSize(upload.file.size)}
                          </span>
                          {upload.status === 'uploading' && (
                            <span className="text-xs text-[#b4c5ff]">
                              {upload.progress}%
                            </span>
                          )}
                          {upload.status === 'failed' && upload.error && (
                            <span className="text-xs text-[#ffb4ab]">
                              {upload.error}
                            </span>
                          )}
                        </div>
                        
                        {/* Progress Bar */}
                        {upload.status === 'uploading' && (
                          <div className="mt-2 h-1 bg-[#32343d] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#2563eb] transition-all duration-300"
                              style={{ width: `${upload.progress}%` }}
                            />
                          </div>
                        )}
                      </div>

                      {upload.status !== 'uploading' && (
                        <button
                          onClick={() => onRemove(upload.id)}
                          className="flex-shrink-0 p-1.5 text-[#8d90a0] hover:text-[#ffb4ab] hover:bg-[#32343d] rounded transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between p-6 border-t border-[#434655]/10 flex-shrink-0">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-[#32343d] text-white rounded-lg hover:bg-[#434655] transition-colors text-sm font-medium"
              >
                {t('drive.addMore')}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-[#32343d] text-white rounded-lg hover:bg-[#434655] transition-colors text-sm font-medium"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={onStart}
                  disabled={queuedCount === 0 || uploading}
                  className="px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#2563eb]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  {uploading 
                    ? t('drive.uploading') 
                    : `${t('drive.upload')} (${queuedCount})`
                  }
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
