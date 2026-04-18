import { useState, useEffect } from 'react';
import { X, Users, Link as LinkIcon, Calendar } from 'lucide-react';
import { usePermissions } from '@hooks/usePermissions';
import { useLang } from '@contexts/LangContext';
import { ROLE_STRINGS } from '@utils/userUtils';

/**
 * ShareDialog Component
 * Share files with users or generate public links
 */
export default function ShareDialog({ file, onShare, onGenerateLink, onClose, users = [] }) {
  const { t } = useLang();
  const { hasPermission, roleCode } = usePermissions();
  const [shareType, setShareType] = useState('user'); // 'user' or 'public'
  const [selectedUser, setSelectedUser] = useState('');
  const [permission, setPermission] = useState('VIEW');
  const [expiryDays, setExpiryDays] = useState(7);
  const [publicLink, setPublicLink] = useState('');
  const [loading, setLoading] = useState(false);

  const isSuperAdmin = roleCode === ROLE_STRINGS.SUPER_ADMIN;
  const canShare = isSuperAdmin || hasPermission('drive.share');
  const canPublicLink = isSuperAdmin || hasPermission('drive.public-link');

  const handleShareWithUser = async () => {
    if (!selectedUser || !canShare) return;

    setLoading(true);
    try {
      await onShare?.(file.id, parseInt(selectedUser), permission);
      onClose?.();
    } catch (error) {
      console.error('Share error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePublicLink = async () => {
    if (!canPublicLink) return;

    setLoading(true);
    try {
      const result = await onGenerateLink?.(file.id, expiryDays);
      if (result?.publicToken) {
        const link = `${window.location.origin}/p/${result.publicToken}`;
        setPublicLink(link);
      }
    } catch (error) {
      console.error('Generate link error:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(publicLink);
  };

  if (!canShare && !canPublicLink) {
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
        <div className="bg-[#191b23] rounded-2xl p-6 max-w-md w-full mx-4 border border-[#434655]/10 shadow-2xl">
          <p className="text-[#ffb4ab]">
            {t('drive.noSharePermission')}
          </p>
          <button
            onClick={onClose}
            className="mt-4 w-full px-4 py-2 bg-[#32343d] text-white rounded-lg hover:bg-[#434655] transition-colors"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
      <div className="bg-[#191b23] rounded-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto border border-[#434655]/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#434655]/10">
          <h2 className="text-xl font-semibold text-white">
            {t('drive.shareFile')}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-[#8d90a0] hover:text-white hover:bg-[#32343d] rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* File Info */}
        <div className="p-6 border-b border-[#434655]/10">
          <p className="text-sm text-[#8d90a0] mb-1">
            {t('drive.sharing')}:
          </p>
          <p className="font-medium text-white truncate">
            {file.name}
          </p>
        </div>

        {/* Share Type Tabs */}
        <div className="flex border-b border-[#434655]/10">
          {canShare && (
            <button
              onClick={() => setShareType('user')}
              className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                shareType === 'user'
                  ? 'border-[#2563eb] text-[#b4c5ff]'
                  : 'border-transparent text-[#8d90a0] hover:text-white'
              }`}
            >
              <Users className="w-4 h-4 inline me-2" />
              {t('drive.shareWithUser')}
            </button>
          )}
          {canPublicLink && (
            <button
              onClick={() => setShareType('public')}
              className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                shareType === 'public'
                  ? 'border-[#2563eb] text-[#b4c5ff]'
                  : 'border-transparent text-[#8d90a0] hover:text-white'
              }`}
            >
              <LinkIcon className="w-4 h-4 inline me-2" />
              {t('drive.publicLink')}
            </button>
          )}
        </div>

        {/* Share Content */}
        <div className="p-6">
          {shareType === 'user' && canShare && (
            <div className="space-y-4">
              {/* User Selection */}
              <div>
                <label className="block text-sm font-medium text-[#e1e2ed] mb-2">
                  {t('drive.selectUser')}
                </label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full px-3 py-2 border border-[#434655]/30 rounded-lg bg-[#1d1f27] text-white focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] outline-none transition-all"
                >
                  <option value="">{t('drive.chooseUser')}</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.displayName || user.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Permission Level */}
              <div>
                <label className="block text-sm font-medium text-[#e1e2ed] mb-2">
                  {t('drive.permission')}
                </label>
                <select
                  value={permission}
                  onChange={(e) => setPermission(e.target.value)}
                  className="w-full px-3 py-2 border border-[#434655]/30 rounded-lg bg-[#1d1f27] text-white focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] outline-none transition-all"
                >
                  <option value="VIEW">{t('drive.canView')}</option>
                  <option value="DOWNLOAD">{t('drive.canDownload')}</option>
                  <option value="EDIT">{t('drive.canEdit')}</option>
                </select>
              </div>

              {/* Share Button */}
              <button
                onClick={handleShareWithUser}
                disabled={!selectedUser || loading}
                className="w-full px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#2563eb]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? t('common.sharing') : t('drive.share')}
              </button>
            </div>
          )}

          {shareType === 'public' && canPublicLink && (
            <div className="space-y-4">
              {/* Expiry Days */}
              <div>
                <label className="block text-sm font-medium text-[#e1e2ed] mb-2">
                  <Calendar className="w-4 h-4 inline me-1" />
                  {t('drive.linkExpiry')}
                </label>
                <select
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-[#434655]/30 rounded-lg bg-[#1d1f27] text-white focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] outline-none transition-all"
                >
                  <option value={1}>1 {t('common.day')}</option>
                  <option value={7}>7 {t('common.days')}</option>
                  <option value={30}>30 {t('common.days')}</option>
                  <option value={90}>90 {t('common.days')}</option>
                </select>
              </div>

              {/* Generate Button */}
              {!publicLink && (
                <button
                  onClick={handleGeneratePublicLink}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#2563eb]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? t('common.generating') : t('drive.generateLink')}
                </button>
              )}

              {/* Public Link Display */}
              {publicLink && (
                <div className="space-y-2">
                  <div className="p-3 bg-[#1d1f27] rounded-lg border border-[#434655]/30">
                    <p className="text-sm text-[#8d90a0] mb-1">
                      {t('drive.publicLinkGenerated')}
                    </p>
                    <p className="text-sm font-mono text-white break-all">
                      {publicLink}
                    </p>
                  </div>
                  <button
                    onClick={copyToClipboard}
                    className="w-full px-4 py-2 bg-[#32343d] text-white rounded-lg hover:bg-[#434655] transition-colors"
                  >
                    {t('common.copyLink')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
