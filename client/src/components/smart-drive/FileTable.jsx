import React from 'react';
import { File, Image, Film, Music, Archive, FileText, Star, Download, Trash2, Share2, Copy } from 'lucide-react';

export default function FileTable({ files = [] }) {
  const getFileIcon = (file) => {
    if (!file.mimeType) return <File className="w-5 h-5 text-gray-400" />;
    if (file.mimeType.startsWith('image/')) return <Image className="w-5 h-5 text-blue-500" />;
    if (file.mimeType.startsWith('video/')) return <Film className="w-5 h-5 text-purple-500" />;
    if (file.mimeType.startsWith('audio/')) return <Music className="w-5 h-5 text-pink-500" />;
    if (file.mimeType.includes('zip') || file.mimeType.includes('rar')) return <Archive className="w-5 h-5 text-yellow-500" />;
    return <FileText className="w-5 h-5 text-gray-500" />;
  };

  const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
    const value = bytes / Math.pow(k, i);
    return value.toFixed(2) + ' ' + sizes[i];
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'numeric', 
      day: 'numeric' 
    });
  };

  return (
    <div className="w-full">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="text-xs font-semibold text-gray-500 bg-gray-50 border-b">
            <th className="py-3 px-4 w-12">
              <input type="checkbox" className="rounded border-gray-300" />
            </th>
            <th className="py-3 px-4 w-1/3">Name</th>
            <th className="py-3 px-4 w-1/4">Modified</th>
            <th className="py-3 px-4 w-1/6">Size</th>
            <th className="py-3 px-4 w-32 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {files.map((file) => (
            <tr key={file.id} className="hover:bg-gray-50 transition-colors cursor-pointer">
              <td className="py-3 px-4">
                <input type="checkbox" className="rounded border-gray-300" />
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    {getFileIcon(file)}
                  </div>
                  <span className="text-sm font-medium text-gray-900 truncate">{file.name}</span>
                </div>
              </td>
              <td className="py-3 px-4 text-sm text-gray-500">{formatDate(file.createdAt)}</td>
              <td className="py-3 px-4 text-sm text-gray-500">{formatSize(file.size)}</td>
              <td className="py-3 px-4">
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 text-gray-400 hover:text-yellow-500 transition-colors" title="Star">
                    <Star className="w-4 h-4" fill="none" />
                  </button>
                  <button className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors" title="Download">
                    <Download className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors" title="Share">
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 text-gray-400 hover:text-red-500 transition-colors" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
