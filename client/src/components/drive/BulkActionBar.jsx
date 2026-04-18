import React from 'react';
import { Download, Trash2, FolderInput, X } from 'lucide-react';
import { useLang } from '@contexts/LangContext';

/**
 * BulkActionBar Component
 * 
 * Sticky bottom bar for bulk file operations
 */
const BulkActionBar = ({ selectedCount, onDownload, onDelete, onMove, onClear }) => {
  const { t } = useLang();

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-medium">
            {t('drive.bulk.selected', { count: selectedCount })} {selectedCount}
          </span>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onDownload}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">{t('drive.bulk.download')}</span>
            </button>
            
            <button
              onClick={onMove}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2"
            >
              <FolderInput className="w-4 h-4" />
              <span className="hidden sm:inline">{t('drive.bulk.move')}</span>
            </button>
            
            <button
              onClick={onDelete}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">{t('drive.bulk.delete')}</span>
            </button>
          </div>
        </div>

        <button
          onClick={onClear}
          className="p-2 hover:bg-white/20 rounded-full transition-colors"
          aria-label="Clear selection"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default BulkActionBar;
