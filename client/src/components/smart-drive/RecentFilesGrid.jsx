import React from 'react';
import { File, Image, Film, Music, Archive, FileText } from 'lucide-react';

export default function RecentFilesGrid({ files = [] }) {
  const getFileIcon = (file) => {
    if (!file.mimeType) return <File className="w-4 h-4 text-gray-400" />;
    if (file.mimeType.startsWith('image/')) return <Image className="w-4 h-4 text-blue-500" />;
    if (file.mimeType.startsWith('video/')) return <Film className="w-4 h-4 text-purple-500" />;
    if (file.mimeType.startsWith('audio/')) return <Music className="w-4 h-4 text-pink-500" />;
    if (file.mimeType.includes('zip') || file.mimeType.includes('rar')) return <Archive className="w-4 h-4 text-yellow-500" />;
    return <FileText className="w-4 h-4 text-gray-500" />;
  };

  const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
    const value = bytes / Math.pow(k, i);
    return value.toFixed(2) + ' ' + sizes[i];
  };

  return (
    <div className="w-full">
      <div className="flex gap-2 overflow-x-auto">
        {files.map((file) => (
          <div
            key={file.id}
            className="group flex-shrink-0 bg-white border border-gray-200 rounded px-2 py-1.5 hover:shadow-sm hover:border-blue-300 transition-all cursor-pointer flex items-center gap-2"
          >
            <div className="w-8 h-8 bg-gray-50 rounded flex items-center justify-center flex-shrink-0">
              {getFileIcon(file)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">{file.name}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
