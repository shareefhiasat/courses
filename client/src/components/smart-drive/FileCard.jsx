import { useState } from 'react';
import { usePermissions } from '@hooks/usePermissions';
import { useLang } from '@contexts/LangContext';
import { getThemedIcon } from '@constants/iconTypes';

/**
 * FileCard Component
 * Displays file with actions based on permissions
 */
export default function FileCard({ file, onDownload, onShare, onDelete, onVersions, onDetails }) {
  const { t } = useLang();
  const { hasPermission } = usePermissions();
  const [showMenu, setShowMenu] = useState(false);

  // Permission checks
  const canDownload = hasPermission('drive.download');
  const canShare = hasPermission('drive.share');
  const canDelete = hasPermission('drive.delete');
  const canVersion = hasPermission('drive.version');

  // Get file icon based on mime type
  const getFileIcon = () => {
    if (!file.mimeType) return getThemedIcon('ui', 'file', 32, 'muted');

    if (file.mimeType.startsWith('image/')) return getThemedIcon('ui', 'image', 32, 'primary');
    if (file.mimeType.startsWith('video/')) return getThemedIcon('ui', 'video', 32, 'primary');
    if (file.mimeType.startsWith('audio/')) return getThemedIcon('ui', 'music', 32, 'primary');
    if (file.mimeType.includes('zip') || file.mimeType.includes('rar')) return getThemedIcon('ui', 'archive', 32, 'primary');

    return getThemedIcon('ui', 'file_text', 32, 'muted');
  };

  // Format file size
  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow relative">
      {/* File Icon & Name */}
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-shrink-0">
          {getFileIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 
            className="font-medium text-gray-900 dark:text-white truncate cursor-pointer hover:text-blue-600"
            onClick={() => onDetails?.(file)}
            title={file.name}
          >
            {file.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {formatSize(file.size)} • {formatDate(file.createdAt)}
          </p>
        </div>

        {/* More Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            {getThemedIcon('ui', 'more_vertical', 20, 'muted')}
          </button>

          {showMenu && (
            <div className="absolute end-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
              <div className="py-1">
                {canDownload && (
                  <button
                    onClick={() => {
                      onDownload?.(file);
                      setShowMenu(false);
                    }}
                    className="w-full text-start px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    {getThemedIcon('ui', 'download', 16, 'light')}
                    {t('drive.download')}
                  </button>
                )}
                {canShare && (
                  <button
                    onClick={() => {
                      onShare?.(file);
                      setShowMenu(false);
                    }}
                    className="w-full text-start px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    {getThemedIcon('ui', 'share', 16, 'light')}
                    {t('drive.share')}
                  </button>
                )}
                {canVersion && (
                  <button
                    onClick={() => {
                      onVersions?.(file);
                      setShowMenu(false);
                    }}
                    className="w-full text-start px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {t('drive.versions')}
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => {
                      onDelete?.(file);
                      setShowMenu(false);
                    }}
                    className="w-full text-start px-4 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                  >
                    {t('common.delete')}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* File Status Badge */}
      {file.workflowStatus && (
        <div className="mt-2">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
            ${file.workflowStatus === 'APPROVED' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400' : ''}
            ${file.workflowStatus === 'DRAFT' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400' : ''}
            ${file.workflowStatus === 'REVIEW' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' : ''}
            ${file.workflowStatus === 'REJECTED' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' : ''}
          `}>
            {file.workflowStatus}
          </span>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        {canDownload && (
          <button
            onClick={() => onDownload?.(file)}
            className="flex-1 px-3 py-1.5 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            {getThemedIcon('ui', 'download', 16, 'primary')}
            {t('drive.download')}
          </button>
        )}
        {canShare && (
          <button
            onClick={() => onShare?.(file)}
            className="flex-1 px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            {getThemedIcon('ui', 'share', 16, 'light')}
            {t('drive.share')}
          </button>
        )}
      </div>
    </div>
  );
}
