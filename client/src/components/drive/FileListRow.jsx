import React from 'react';
import { FileText, Image as ImageIcon, Video, FileArchive, FileAudio, FileSpreadsheet } from 'lucide-react';
import { format } from 'date-fns';
import { useLang } from '@contexts/LangContext';
import FileActionsMenu from './FileActionsMenu';

/**
 * FileListRow Component
 * 
 * List view row variant (DAM-table style)
 */
const FileListRow = ({ file, selected, onSelect, onOpen, onEdit, onShare, onComment, onDownload, onDelete }) => {
  const { t } = useLang();

  const getFileIcon = (mimeType) => {
    if (!mimeType) return FileText;
    
    if (mimeType.startsWith('image/')) return ImageIcon;
    if (mimeType.startsWith('video/')) return Video;
    if (mimeType.startsWith('audio/')) return FileAudio;
    if (mimeType.includes('zip') || mimeType.includes('rar')) return FileArchive;
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return FileSpreadsheet;
    
    return FileText;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const Icon = getFileIcon(file.mimeType);

  return (
    <div
      className={`group flex items-center gap-3 px-4 py-3 border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-all duration-200 hover:shadow-sm ${
        selected ? 'bg-blue-50' : ''
      }`}
      onClick={() => onOpen(file)}
    >
      {/* Selection Checkbox */}
      <div onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(file)}
          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      </div>

      {/* Icon/Thumbnail */}
      <div className="flex-shrink-0">
        {file.mimeType?.startsWith('image/') ? (
          <img
            src={`${import.meta.env.VITE_API_URL}/drive/files/${encodeURIComponent(file.path)}/download`}
            alt={file.name}
            loading="lazy"
            className="w-10 h-10 object-cover rounded"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = `<svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>`;
            }}
          />
        ) : (
          <Icon className="w-6 h-6 text-gray-400" />
        )}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {file.name}
        </p>
      </div>

      {/* Creator */}
      <div className="hidden xl:block w-32">
        <p className="text-sm text-gray-500 truncate">
          {file.owner?.displayName || file.owner?.email || '-'}
        </p>
      </div>

      {/* Created Date */}
      <div className="hidden lg:block w-32">
        <p className="text-sm text-gray-500">
          {file.createdAt ? format(new Date(file.createdAt), 'MMM d, yyyy') : '-'}
        </p>
      </div>

      {/* Modified */}
      <div className="hidden md:block w-32">
        <p className="text-sm text-gray-500">
          {file.lastModified ? format(new Date(file.lastModified), 'MMM d, yyyy') : '-'}
        </p>
      </div>

      {/* Size */}
      <div className="hidden sm:block w-24 text-end">
        <p className="text-sm text-gray-500">
          {formatFileSize(file.size)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
        <FileActionsMenu
          file={file}
          onView={() => onOpen(file)}
          onEdit={() => onEdit(file)}
          onShare={() => onShare(file)}
          onComment={() => onComment(file)}
          onDownload={() => onDownload(file)}
          onDelete={() => onDelete(file)}
        />
      </div>
    </div>
  );
};

export default FileListRow;
