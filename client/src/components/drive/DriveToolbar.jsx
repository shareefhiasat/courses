import React from 'react';
import { Search, Grid3x3, List, RefreshCw, Upload, Edit3, Share2, History, MoreVertical, SortAsc } from 'lucide-react';
import { useLang } from '@contexts/LangContext';

/**
 * DriveToolbar Component
 * 
 * Top toolbar with contextual actions
 */
const DriveToolbar = ({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  sortBy,
  onSortChange,
  onRefresh,
  onUpload,
  selectedFile,
  onEdit,
  onShare,
  onVersionHistory,
  loading
}) => {
  const { t } = useLang();

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Search and Filters */}
        {!selectedFile && (
          <div className="flex-1 flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={t('drive.search_placeholder')}
                className="w-full ps-10 pe-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="name">{t('drive.sort.name')}</option>
              <option value="modified">{t('drive.sort.modified')}</option>
              <option value="size">{t('drive.sort.size')}</option>
            </select>
          </div>
        )}

        {/* Contextual: Single File Selected */}
        {selectedFile && (
          <div className="flex-1 flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700 truncate">
              {selectedFile.name}
            </span>
            
            <div className="flex items-center gap-2">
              <button
                onClick={onEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                <span className="hidden sm:inline">{t('drive.toolbar.edit')}</span>
              </button>
              
              <button
                onClick={onShare}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">{t('drive.toolbar.share')}</span>
              </button>
              
              <button
                onClick={onVersionHistory}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">{t('drive.toolbar.versions')}</span>
              </button>
            </div>
          </div>
        )}

        {/* Right: View Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title={t('drive.refresh')}
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
              }`}
              title="Grid view"
            >
              <Grid3x3 className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
              }`}
              title="List view"
            >
              <List className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {!selectedFile && (
            <button
              onClick={onUpload}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">{t('drive.upload')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DriveToolbar;
