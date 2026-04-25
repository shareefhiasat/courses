import { useState } from 'react';
import { X, Users, Link as LinkIcon, Shield } from 'lucide-react';
import { usePermissions } from '@hooks/usePermissions';
import { useLang } from '@contexts/LangContext';
import { ROLE_STRINGS } from '@utils/userUtils';
import UserSearchDropdown from './UserSearchDropdown';
import RoleSelect from './RoleSelect';
import SharePermissionSelect from './SharePermissionSelect';
import SharesList from './SharesList';

/**
 * ShareDialog Component
 * Share files with users/roles or generate public links
 * Supports FileShare table (USER + ROLE subjects) and PublicLink
 */
export default function ShareDialog({ file, onShare, onGenerateLink, onClose }) {
  const { t } = useLang();
  const { hasPermission, roleCode } = usePermissions();
  const [shareType, setShareType] = useState('people'); // 'people', 'roles', or 'public'
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [permission, setPermission] = useState('VIEW');
  const [expiryDays, setExpiryDays] = useState(null);
  const [publicLink, setPublicLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  const isSuperAdmin = roleCode === ROLE_STRINGS.SUPER_ADMIN;
  const canShare = isSuperAdmin || hasPermission('drive.share');
  const canPublicLink = isSuperAdmin || hasPermission('drive.public-link');

  const handleShareWithUser = async () => {
    if (!selectedUserId || !canShare) return;

    setLoading(true);
    setShareSuccess(false);
    try {
      const expiresAt = expiryDays ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString() : null;
      await onShare?.({
        fileId: file.id,
        subjectType: 'USER',
        subjectId: selectedUserId,
        permission,
        expiresAt,
      });
      setShareSuccess(true);
      setSelectedUserId(null);
      setExpiryDays(null);
    } catch (error) {
      console.error('Share error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShareWithRole = async () => {
    if (!selectedRole || !canShare) return;

    setLoading(true);
    setShareSuccess(false);
    try {
      const expiresAt = expiryDays ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString() : null;
      await onShare?.({
        fileId: file.id,
        subjectType: 'ROLE',
        subjectId: selectedRole,
        permission,
        expiresAt,
      });
      setShareSuccess(true);
      setSelectedRole('');
      setExpiryDays(null);
    } catch (error) {
      console.error('Share role error:', error);
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
            <>
              <button
                onClick={() => setShareType('people')}
                className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  shareType === 'people'
                    ? 'border-[#2563eb] text-[#b4c5ff]'
                    : 'border-transparent text-[#8d90a0] hover:text-white'
                }`}
              >
                <Users className="w-4 h-4 inline me-2" />
                {t('drive.people')}
              </button>
              <button
                onClick={() => setShareType('roles')}
                className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  shareType === 'roles'
                    ? 'border-[#2563eb] text-[#b4c5ff]'
                    : 'border-transparent text-[#8d90a0] hover:text-white'
                }`}
              >
                <Shield className="w-4 h-4 inline me-2" />
                {t('drive.roles')}
              </button>
            </>
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
          {shareType === 'people' && canShare && (
            <div className="space-y-4">
              {shareSuccess && (
                <div className="p-3 bg-[#1d4e1d] border border-[#2d6a2d] rounded-lg text-sm text-[#a5d6a7]">
                  {t('drive.shareSuccess')}
                </div>
              )}
              
              <UserSearchDropdown
                value={selectedUserId}
                onChange={setSelectedUserId}
                disabled={loading}
              />

              <SharePermissionSelect
                value={permission}
                onChange={setPermission}
                disabled={loading}
              />

              {/* Optional Expiry */}
              <div>
                <label className="block text-sm font-medium text-[#e1e2ed] mb-2">
                  {t('drive.expiry')} ({t('common.optional')})
                </label>
                <select
                  value={expiryDays || ''}
                  onChange={(e) => setExpiryDays(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-[#434655]/30 rounded-lg bg-[#1d1f27] text-white focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] outline-none transition-all"
                >
                  <option value="">{t('drive.noExpiry')}</option>
                  <option value={1}>1 {t('common.day')}</option>
                  <option value={7}>7 {t('common.days')}</option>
                  <option value={30}>30 {t('common.days')}</option>
                  <option value={90}>90 {t('common.days')}</option>
                </select>
              </div>

              <button
                onClick={handleShareWithUser}
                disabled={!selectedUserId || loading}
                className="w-full px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#2563eb]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? t('common.sharing') : t('drive.share')}
              </button>
              
              {/* Existing Shares */}
              <div className="pt-4 border-t border-[#434655]/10">
                <SharesList fileId={file.id} />
              </div>
            </div>
          )}

          {shareType === 'roles' && canShare && (
            <div className="space-y-4">
              {shareSuccess && (
                <div className="p-3 bg-[#1d4e1d] border border-[#2d6a2d] rounded-lg text-sm text-[#a5d6a7]">
                  {t('drive.shareSuccess')}
                </div>
              )}
              
              <RoleSelect
                value={selectedRole}
                onChange={setSelectedRole}
                disabled={loading}
              />

              <SharePermissionSelect
                value={permission}
                onChange={setPermission}
                disabled={loading}
              />

              {/* Optional Expiry */}
              <div>
                <label className="block text-sm font-medium text-[#e1e2ed] mb-2">
                  {t('drive.expiry')} ({t('common.optional')})
                </label>
                <select
                  value={expiryDays || ''}
                  onChange={(e) => setExpiryDays(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-[#434655]/30 rounded-lg bg-[#1d1f27] text-white focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] outline-none transition-all"
                >
                  <option value="">{t('drive.noExpiry')}</option>
                  <option value={1}>1 {t('common.day')}</option>
                  <option value={7}>7 {t('common.days')}</option>
                  <option value={30}>30 {t('common.days')}</option>
                  <option value={90}>90 {t('common.days')}</option>
                </select>
              </div>

              <button
                onClick={handleShareWithRole}
                disabled={!selectedRole || loading}
                className="w-full px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#2563eb]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? t('common.sharing') : t('drive.shareWithRole')}
              </button>
              
              {/* Existing Shares */}
              <div className="pt-4 border-t border-[#434655]/10">
                <SharesList fileId={file.id} />
              </div>
            </div>
          )}

          {shareType === 'public' && canPublicLink && (
            <div className="space-y-4">
              {/* Expiry Days */}
              <div>
                <label className="block text-sm font-medium text-[#e1e2ed] mb-2">
                  {t('drive.linkExpiry')}
                </label>
                <select
                  value={expiryDays || 7}
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
