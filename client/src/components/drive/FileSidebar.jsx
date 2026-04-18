import React, { useState } from 'react';
import { X, FileText, Download, MessageSquare, History, Share2, Send, Trash2, RotateCcw, UserPlus } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useLang } from '@contexts/LangContext';
import { useToast } from '@ui';
import { useFileSidebar } from '../../hooks/useFileSidebar';
import { ConfirmModal } from '@ui';

/**
 * FileSidebar Component
 * 
 * In-page sliding right panel with tabs for Details, Activity, Versions, Sharing
 */
const FileSidebar = ({ file, isOpen, activeTab, onTabChange, onClose }) => {
  const { t } = useLang();
  const { triggerToast } = useToast();
  const [newComment, setNewComment] = useState('');
  const [shareUserId, setShareUserId] = useState('');
  const [sharePermission, setSharePermission] = useState(1);
  const [restoreVersionId, setRestoreVersionId] = useState(null);

  const {
    comments,
    activities,
    versions,
    shares,
    loading,
    error,
    addComment,
    deleteComment,
    restoreVersion,
    addShare,
    updateSharePermission,
    deleteShare
  } = useFileSidebar(file?.path, activeTab, isOpen);

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    const result = await addComment(newComment);
    if (result.success) {
      setNewComment('');
      triggerToast(t('drive.activity.commentAdded'), 'success');
    } else {
      triggerToast(result.error || t('drive.activity.commentError'), 'error');
    }
  };

  const handleDeleteComment = async (commentId) => {
    const result = await deleteComment(commentId);
    if (result.success) {
      triggerToast(t('drive.activity.commentDeleted'), 'success');
    } else {
      triggerToast(result.error || t('drive.activity.deleteError'), 'error');
    }
  };

  const handleRestoreVersion = async () => {
    if (!restoreVersionId) return;

    const result = await restoreVersion(restoreVersionId);
    if (result.success) {
      setRestoreVersionId(null);
      triggerToast(t('drive.versions.restored'), 'success');
    } else {
      triggerToast(result.error || t('drive.versions.restoreError'), 'error');
    }
  };

  const handleAddShare = async () => {
    if (!shareUserId) return;

    const result = await addShare(parseInt(shareUserId), sharePermission);
    if (result.success) {
      setShareUserId('');
      setSharePermission(1);
      triggerToast(t('drive.sharing.added'), 'success');
    } else {
      triggerToast(result.error || t('drive.sharing.addError'), 'error');
    }
  };

  const handleUpdatePermission = async (shareId, newPermission) => {
    const result = await updateSharePermission(shareId, newPermission);
    if (result.success) {
      triggerToast(t('drive.sharing.updated'), 'success');
    } else {
      triggerToast(result.error || t('drive.sharing.updateError'), 'error');
    }
  };

  const handleDeleteShare = async (shareId) => {
    const result = await deleteShare(shareId);
    if (result.success) {
      triggerToast(t('drive.sharing.removed'), 'success');
    } else {
      triggerToast(result.error || t('drive.sharing.removeError'), 'error');
    }
  };

  // Combine activities and comments for timeline
  const timelineItems = [...(activities || []), ...(comments || [])].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  if (!isOpen || !file) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div
        className={`fixed top-0 end-0 h-full w-full md:w-[420px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 truncate">
            {file.name}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => onTabChange('details')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'details'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="w-4 h-4 inline-block me-2" />
            {t('drive.sidebar.details')}
          </button>
          <button
            onClick={() => onTabChange('activity')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'activity'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <MessageSquare className="w-4 h-4 inline-block me-2" />
            {t('drive.sidebar.activity')}
          </button>
          <button
            onClick={() => onTabChange('versions')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'versions'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <History className="w-4 h-4 inline-block me-2" />
            {t('drive.sidebar.versions')}
          </button>
          <button
            onClick={() => onTabChange('sharing')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'sharing'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Share2 className="w-4 h-4 inline-block me-2" />
            {t('drive.sidebar.sharing')}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4" style={{ height: 'calc(100vh - 140px)' }}>
          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              {/* Preview */}
              <div className="bg-gray-100 rounded-lg overflow-hidden" style={{ minHeight: '200px' }}>
                {(() => {
                  // Construct file URL using the authenticated API (no fallback)
                  const fileUrl = `${import.meta.env.VITE_API_URL}/drive/files/${encodeURIComponent(file.path)}/download`;
                  
                  return file.mimeType?.startsWith('image/') ? (
                    <img 
                      src={fileUrl} 
                      alt={file.name} 
                      className="w-full h-auto object-contain max-h-96" 
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : file.mimeType?.startsWith('video/') ? (
                    <video controls className="w-full h-auto max-h-96">
                      <source src={fileUrl} type={file.mimeType} />
                    </video>
                  ) : file.mimeType?.includes('pdf') ? (
                    <iframe src={fileUrl} className="w-full h-96" title={file.name} />
                  ) : null;
                })()}
                <div className="flex items-center justify-center p-8" style={{ display: file.mimeType?.startsWith('image/') ? 'none' : 'flex' }}>
                  <FileText className="w-16 h-16 text-gray-400" />
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">{t('drive.details.name')}</label>
                  <p className="text-sm text-gray-900 mt-1">{file.name}</p>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">{t('drive.details.size')}</label>
                  <p className="text-sm text-gray-900 mt-1">{formatFileSize(file.size)}</p>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">{t('drive.details.type')}</label>
                  <p className="text-sm text-gray-900 mt-1">{file.mimeType || 'Unknown'}</p>
                </div>

                {file.lastModified && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">{t('drive.details.modified')}</label>
                    <p className="text-sm text-gray-900 mt-1">
                      {format(new Date(file.lastModified), 'PPpp')}
                    </p>
                  </div>
                )}

                <button
                  onClick={() => {
                    const downloadUrl = `${import.meta.env.VITE_API_URL}/drive/files/${encodeURIComponent(file.path)}/download`;
                    window.open(downloadUrl, '_blank');
                  }}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  {t('drive.download')}
                </button>
              </div>
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8 text-gray-500">{t('drive.loading')}</div>
              ) : timelineItems.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">{t('drive.activity.empty')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {timelineItems.map((item, index) => (
                    <div key={item.id || index} className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        {item.comment ? (
                          <MessageSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <History className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {item.user?.displayName || item.user?.email || t('drive.activity.system')}
                            </p>
                            {item.comment ? (
                              <p className="text-sm text-gray-700 mt-1">{item.comment}</p>
                            ) : (
                              <p className="text-sm text-gray-600 mt-1">{item.action}</p>
                            )}
                          </div>
                          {item.comment && (
                            <button
                              onClick={() => handleDeleteComment(item.id)}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-gray-400" />
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Comment */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                    placeholder={t('drive.activity.addComment')}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Versions Tab */}
          {activeTab === 'versions' && (
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8 text-gray-500">{t('drive.loading')}</div>
              ) : versions.length === 0 ? (
                <div className="text-center py-8">
                  <History className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">{t('drive.versions.empty')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {versions.map((version) => (
                    <div
                      key={version.id}
                      className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {format(new Date(version.timestamp), 'PPpp')}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {version.user?.displayName || version.user?.email}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatFileSize(version.size)}
                          </p>
                        </div>
                        <button
                          onClick={() => setRestoreVersionId(version.id)}
                          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          {t('drive.versions.restore')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sharing Tab */}
          {activeTab === 'sharing' && (
            <div className="space-y-4">
              {/* Add Share */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  {t('drive.sharing.addPeople')}
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="number"
                    value={shareUserId}
                    onChange={(e) => setShareUserId(e.target.value)}
                    placeholder={t('drive.sharing.userIdPlaceholder')}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <select
                    value={sharePermission}
                    onChange={(e) => setSharePermission(parseInt(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={1}>{t('drive.sharing.permissionView')}</option>
                    <option value={3}>{t('drive.sharing.permissionEdit')}</option>
                  </select>
                </div>
                <button
                  onClick={handleAddShare}
                  disabled={!shareUserId}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  {t('drive.sharing.add')}
                </button>
              </div>

              {/* Shares List */}
              {loading ? (
                <div className="text-center py-8 text-gray-500">{t('drive.loading')}</div>
              ) : shares.length === 0 ? (
                <div className="text-center py-8">
                  <Share2 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">{t('drive.sharing.empty')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {shares.map((share) => (
                    <div
                      key={share.id}
                      className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {share.sharedWith?.displayName || share.sharedWith?.email}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDistanceToNow(new Date(share.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={share.permissions}
                            onChange={(e) => handleUpdatePermission(share.id, parseInt(e.target.value))}
                            className="text-sm px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value={1}>{t('drive.sharing.permissionView')}</option>
                            <option value={3}>{t('drive.sharing.permissionEdit')}</option>
                          </select>
                          <button
                            onClick={() => handleDeleteShare(share.id)}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Restore Version Confirmation */}
      {restoreVersionId && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setRestoreVersionId(null)}
          onConfirm={handleRestoreVersion}
          title={t('drive.versions.restoreConfirm')}
          message={t('drive.versions.restoreMessage')}
        />
      )}
    </>
  );
};

export default FileSidebar;
