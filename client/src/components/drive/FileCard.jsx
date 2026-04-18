import React, { useState } from 'react';
import { FileText, Image as ImageIcon, Video, FileArchive, FileAudio, FileSpreadsheet, Eye, Edit3, Share2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useLang } from '@contexts/LangContext';
import FileActionsMenu from './FileActionsMenu';

/**
 * FileCard Component
 * 
 * Grid card with thumbnail, hover quick actions, and selection
 */
const FileCard = ({ file, selected, onSelect, onOpen, onEdit, onShare, onComment, onDownload, onDelete }) => {
  const { t } = useLang();
  const [isHovered, setIsHovered] = useState(false);

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
  const isImage = file.mimeType?.startsWith('image/');
  const canEdit = file.mimeType?.includes('document') || file.mimeType?.includes('spreadsheet') || file.mimeType?.includes('presentation');

  return (
    <div
      className={`relative bg-white rounded-lg border border-gray-200 overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] hover:border-blue-300 ${
        selected ? 'ring-2 ring-blue-500' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(file)}
    >
      {/* Selection Checkbox */}
      <div
        className={`absolute top-2 start-2 z-10 transition-opacity ${
          isHovered || selected ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(file)}
          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      </div>

      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-50 rounded-t-lg overflow-hidden">
        {isImage ? (
          <img
            src={`${import.meta.env.VITE_API_URL}/drive/files/${encodeURIComponent(file.path)}/download`}
            alt={file.name}
            loading="lazy"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center"><svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>`;
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon className="w-16 h-16 text-gray-400" />
          </div>
        )}

        {/* Hover Actions Overlay */}
        <div
          className={`absolute inset-0 bg-black/50 flex items-center justify-center gap-2 transition-opacity ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpen(file);
            }}
            className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
            title={t('drive.hover.preview')}
          >
            <Eye className="w-5 h-5 text-gray-700" />
          </button>
          
          {canEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(file);
              }}
              className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
              title={t('drive.hover.edit')}
            >
              <Edit3 className="w-5 h-5 text-gray-700" />
            </button>
          )}
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare(file);
            }}
            className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
            title={t('drive.hover.share')}
          >
            <Share2 className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {/* More Actions Menu - Top Right */}
        <div className="absolute top-2 end-2 z-10">
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

      {/* File Info */}
      <div className="p-3">
        <h3 className="font-medium text-gray-900 truncate text-sm mb-1">
          {file.name}
        </h3>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{formatFileSize(file.size)}</span>
          {file.lastModified && (
            <span>{formatDistanceToNow(new Date(file.lastModified), { addSuffix: true })}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileCard;
