import React from 'react';
import { Folder, Image, Star, Clock, Share2, Trash2, HardDrive } from 'lucide-react';

export default function DriveNavigation({ activeSpace, onSpaceChange }) {
  const spaces = [
    { id: 'my-drive', label: 'My Drive', icon: Folder },
    { id: 'photos', label: 'Photos', icon: Image },
    { id: 'starred', label: 'Starred', icon: Star },
    { id: 'recent', label: 'Recent', icon: Clock },
    { id: 'shared', label: 'Shared with me', icon: Share2 },
    { id: 'trash', label: 'Trash', icon: Trash2 },
    { id: 'storage', label: 'Storage', icon: HardDrive },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="p-4">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Spaces</h2>
        <div className="space-y-1">
          {spaces.slice(0, 6).map((space) => {
            const Icon = space.icon;
            return (
              <button
                key={space.id}
                onClick={() => onSpaceChange?.(space.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeSpace === space.id
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {space.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 border-t border-gray-200 p-4">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Folders</h2>
        <div className="space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100">
            <Folder className="w-4 h-4 text-gray-400" />
            Work Projects
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100">
            <Folder className="w-4 h-4 text-gray-400" />
            Personal
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100">
            <Folder className="w-4 h-4 text-gray-400" />
            Documents
          </button>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-700">Storage</span>
            <span className="text-xs text-gray-500">25%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '25%' }}></div>
          </div>
          <p className="text-xs text-gray-500">2.5 GB of 10 GB used</p>
        </div>
      </div>
    </div>
  );
}
