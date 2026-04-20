import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Folder, Image, Star, Clock, Share2, Trash2, HardDrive, X } from 'lucide-react';

export default function DriveSideDrawer({ isOpen, onClose, activeSpace, onSpaceChange }) {
  const spaces = [
    { id: 'my-drive', label: 'My Drive', icon: Folder },
    { id: 'photos', label: 'Photos', icon: Image },
    { id: 'starred', label: 'Starred', icon: Star },
    { id: 'recent', label: 'Recent', icon: Clock },
    { id: 'shared', label: 'Shared with me', icon: Share2 },
    { id: 'trash', label: 'Trash', icon: Trash2 },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'tween', ease: 'easeInOut' }}
            className="fixed top-0 left-0 h-full w-72 bg-white border-r border-gray-200 shadow-xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">Smart Drive</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-1">
                {spaces.map((space) => {
                  const Icon = space.icon;
                  return (
                    <button
                      key={space.id}
                      onClick={() => onSpaceChange?.(space.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg text-sm transition-colors ${
                        activeSpace === space.id
                          ? 'bg-blue-50 text-blue-600 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span>{space.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer - Storage */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-gray-500" />
                    <span className="text-xs font-medium text-gray-700">Storage</span>
                  </div>
                  <span className="text-xs text-gray-500">25%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                  <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '25%' }}></div>
                </div>
                <p className="text-xs text-gray-500">2.5 GB of 10 GB used</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
