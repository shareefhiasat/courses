import React, { useState, useRef, useEffect } from 'react';
import { Download, Trash2, Share2, MessageSquare, Eye, Edit3, MoreVertical, FileText, GitBranch } from 'lucide-react';
import { useLang } from '@contexts/LangContext';
import { useAuth } from '@contexts/AuthContext';

/**
 * FileActionsMenu Component
 * 
 * Dropdown menu for file actions
 */
const FileActionsMenu = ({ file, onView, onEdit, onShare, onComment, onDownload, onDelete, onCreateWorkflow }) => {
  const { t } = useLang();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Check if user has permission to create workflows
  const canCreateWorkflow = user && user.roles && (
    user.roles.includes('instructor') || 
    user.roles.includes('hr') || 
    user.roles.includes('admin')
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const canEdit = file.mimeType?.includes('document') || 
                  file.mimeType?.includes('spreadsheet') || 
                  file.mimeType?.includes('presentation');

  const handleAction = (action) => {
    setIsOpen(false);
    action();
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        title={t('drive.hover.more')}
      >
        <MoreVertical className="w-4 h-4 text-gray-600" />
      </button>

      {isOpen && (
        <div className="absolute end-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          <button
            onClick={() => handleAction(onView)}
            className="w-full px-4 py-2 text-start text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            {t('drive.actions.view')}
          </button>

          {canEdit && (
            <button
              onClick={() => handleAction(onEdit)}
              className="w-full px-4 py-2 text-start text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              {t('drive.actions.edit')}
            </button>
          )}

          <button
            onClick={() => handleAction(onDownload)}
            className="w-full px-4 py-2 text-start text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {t('drive.actions.download')}
          </button>

          <button
            onClick={() => handleAction(onShare)}
            className="w-full px-4 py-2 text-start text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            {t('drive.actions.share')}
          </button>

          <button
            onClick={() => handleAction(onComment)}
            className="w-full px-4 py-2 text-start text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            {t('drive.actions.comment')}
          </button>

          {canCreateWorkflow && onCreateWorkflow && (
            <button
              onClick={() => handleAction(() => onCreateWorkflow(file))}
              className="w-full px-4 py-2 text-start text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <GitBranch className="w-4 h-4" />
              {t('drive.actions.createWorkflow', 'Create Workflow')}
            </button>
          )}

          <div className="border-t border-gray-200 my-1" />

          <button
            onClick={() => handleAction(onDelete)}
            className="w-full px-4 py-2 text-start text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {t('drive.actions.delete')}
          </button>
        </div>
      )}
    </div>
  );
};

export default FileActionsMenu;
