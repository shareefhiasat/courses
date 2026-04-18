import React from 'react';
import FileCard from './FileCard';
import FileListRow from './FileListRow';

/**
 * DriveFileGrid Component
 * 
 * Grid/list container that maps files to FileCard/FileListRow
 */
const DriveFileGrid = ({ files, viewMode, selectedFiles, onSelect, onOpen, onEdit, onShare, onComment, onDownload, onDelete }) => {
  const isSelected = (file) => selectedFiles.has(file.path);

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-600 uppercase tracking-wider">
          <div className="w-4" />
          <div className="w-6" />
          <div className="flex-1">Name</div>
          <div className="hidden xl:block w-32">Creator</div>
          <div className="hidden lg:block w-32">Created</div>
          <div className="hidden md:block w-32">Modified</div>
          <div className="hidden sm:block w-24 text-end">Size</div>
          <div className="w-10" />
        </div>

        {/* Rows */}
        <div>
          {files.map((file) => (
            <FileListRow
              key={file.path}
              file={file}
              selected={isSelected(file)}
              onSelect={onSelect}
              onOpen={onOpen}
              onEdit={onEdit}
              onShare={onShare}
              onComment={onComment}
              onDownload={onDownload}
              onDelete={onDelete}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {files.map((file) => (
        <FileCard
          key={file.path}
          file={file}
          selected={isSelected(file)}
          onSelect={onSelect}
          onOpen={onOpen}
          onEdit={onEdit}
          onShare={onShare}
          onComment={onComment}
          onDownload={onDownload}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default DriveFileGrid;
