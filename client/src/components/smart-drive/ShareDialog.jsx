import { useState } from 'react';
import { Users, Link as LinkIcon, Shield } from 'lucide-react';
import { usePermissions } from '@hooks/usePermissions';
import { useLang } from '@contexts/LangContext';
import { ROLE_STRINGS } from '@utils/userUtils';
import Modal from '@ui/Modal/Modal';
import Tabs from '@ui/Tabs/Tabs';
import Select from '@ui/Select/Select';
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
      console.log('🔗 [ShareDialog] Public link result:', result);

      // Backend returns 'token', not 'publicToken'
      if (result?.token || result?.publicToken) {
        const token = result.token || result.publicToken;
        // Use the backend API endpoint for direct download
        const link = `${window.location.origin}/api/v1/public/links/${token}/download`;
        console.log('🔗 [ShareDialog] Setting public link:', link);
        setPublicLink(link);
      } else {
        console.error('🔗 [ShareDialog] No token in result:', result);
      }
    } catch (error) {
      console.error('Generate link error:', error);
    } finally {
      setLoading(false);
      console.log('🔗 [ShareDialog] Loading set to false');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(publicLink);
  };

  if (!canShare && !canPublicLink) {
    return (
      <Modal
        isOpen={true}
        onClose={onClose}
        title={t('drive.noSharePermission')}
        size="small"
      >
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#2563eb]/90 transition-colors"
        >
          {t('common.close')}
        </button>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={t('drive.shareFile')}
      size="medium"
      draggable={false}
      aria-describedby="share-dialog-description"
    >
      {/* File Info */}
      <div className="px-4 py-3 mb-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <p id="share-dialog-description" className="text-xs text-gray-600 dark:text-gray-400 mb-1">
          {t('drive.sharing')}:
        </p>
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {file.name}
        </p>
      </div>

      {/* Share Type Tabs */}
      <div className="mb-4">
        <Tabs
          tabs={[
            ...(canShare ? [
              { value: 'people', label: t('drive.people'), icon: <Users className="w-4 h-4" /> },
              { value: 'roles', label: t('drive.roles'), icon: <Shield className="w-4 h-4" /> }
            ] : []),
            ...(canPublicLink ? [
              { value: 'public', label: t('drive.publicLink'), icon: <LinkIcon className="w-4 h-4" /> }
            ] : [])
          ]}
          activeTab={shareType}
          onTabChange={setShareType}
          variant="underline"
        />
      </div>

      {/* Share Content */}
      <div>
        {shareType === 'people' && canShare && (
          <div className="space-y-4">
            {shareSuccess && (
              <div 
                className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-400"
                role="status"
                aria-live="polite"
              >
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
            <Select
              label={`${t('drive.expiry')} (${t('common.optional')})`}
              options={[
                { value: '', label: t('drive.noExpiry') },
                { value: 1, label: `1 ${t('common.day')}` },
                { value: 7, label: `7 ${t('common.days')}` },
                { value: 30, label: `30 ${t('common.days')}` },
                { value: 90, label: `90 ${t('common.days')}` }
              ]}
              value={expiryDays || ''}
              onChange={(e) => setExpiryDays(e.target.value ? parseInt(e.target.value) : null)}
              searchable={false}
              size="small"
              theme="light"
              fullWidth
            />

            <button
              onClick={handleShareWithUser}
              disabled={!selectedUserId || loading}
              className="w-full px-4 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              aria-describedby="share-dialog-description"
            >
              {loading ? t('common.sharing') : t('drive.share')}
            </button>

            {/* Existing Shares */}
            <div className="pt-4 border-t border-gray-200">
              <SharesList fileId={file.id} />
            </div>
          </div>
        )}

        {shareType === 'roles' && canShare && (
          <div className="space-y-4">
            {shareSuccess && (
              <div 
                className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-400"
                role="status"
                aria-live="polite"
              >
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
            <Select
              label={`${t('drive.expiry')} (${t('common.optional')})`}
              options={[
                { value: '', label: t('drive.noExpiry') },
                { value: 1, label: `1 ${t('common.day')}` },
                { value: 7, label: `7 ${t('common.days')}` },
                { value: 30, label: `30 ${t('common.days')}` },
                { value: 90, label: `90 ${t('common.days')}` }
              ]}
              value={expiryDays || ''}
              onChange={(e) => setExpiryDays(e.target.value ? parseInt(e.target.value) : null)}
              searchable={false}
              size="small"
              theme="light"
              fullWidth
            />

            <button
              onClick={handleShareWithRole}
              disabled={!selectedRole || loading}
              className="w-full px-4 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              aria-describedby="share-dialog-description"
            >
              {loading ? t('common.sharing') : t('drive.shareWithRole')}
            </button>

            {/* Existing Shares */}
            <div className="pt-4 border-t border-gray-200">
              <SharesList fileId={file.id} />
            </div>
          </div>
        )}

        {shareType === 'public' && canPublicLink && (
          <div className="space-y-4">
            {/* Expiry Days */}
            <Select
              label={t('drive.linkExpiry')}
              options={[
                { value: 1, label: `1 ${t('common.day')}` },
                { value: 7, label: `7 ${t('common.days')}` },
                { value: 30, label: `30 ${t('common.days')}` },
                { value: 90, label: `90 ${t('common.days')}` }
              ]}
              value={expiryDays || 7}
              onChange={(e) => setExpiryDays(parseInt(e.target.value))}
              searchable={false}
              size="small"
              theme="light"
              fullWidth
            />

            {/* Generate Button */}
            {!publicLink && (
              <button
                onClick={handleGeneratePublicLink}
                disabled={loading}
                className="w-full px-4 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                aria-describedby="share-dialog-description"
              >
                {loading ? t('common.generating') : t('drive.generateLink')}
              </button>
            )}

            {/* Public Link Display */}
            {publicLink && (
              <div className="space-y-2">
                <div 
                  className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                  role="status"
                  aria-live="polite"
                >
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1.5">
                    {t('drive.publicLinkGenerated')}
                  </p>
                  <p className="text-xs font-mono text-gray-900 dark:text-white break-all">
                    {publicLink}
                  </p>
                </div>
                <button
                  onClick={copyToClipboard}
                  className="w-full px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                  aria-label={t('common.copyLink')}
                >
                  {t('common.copyLink')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
