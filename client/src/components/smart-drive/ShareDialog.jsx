import { useState } from 'react';
import { Users, Link as LinkIcon, Shield } from 'lucide-react';
import { usePermissions } from '@hooks/usePermissions';
import { useLang } from '@contexts/LangContext';
import { ROLE_STRINGS } from '@utils/userUtils';
import Modal from '@ui/Modal/Modal';
import Tabs from '@ui/Tabs/Tabs';
import Select from '@ui/Select/Select';
import Button from '@ui/Button/Button';
import UserSearchDropdown from './UserSearchDropdown';
import RoleSelect from './RoleSelect';
import SharePermissionSelect from './SharePermissionSelect';
import SharesList from './SharesList';

export default function ShareDialog({ file, onShare, onGenerateLink, onClose }) {
  const { t } = useLang();
  const { hasPermission, roleCode } = usePermissions();
  const [shareType, setShareType] = useState('people');
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
        fileId: file.id, subjectType: 'USER', subjectId: selectedUserId,
        permission, expiresAt,
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
        fileId: file.id, subjectType: 'ROLE', subjectId: selectedRole,
        permission, expiresAt,
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
      if (result?.token || result?.publicToken) {
        const token = result.token || result.publicToken;
        setPublicLink(`${window.location.origin}/api/v1/public/links/${token}/download`);
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
      <Modal isOpen={true} onClose={onClose} title={t('drive.noSharePermission')} size="small">
        <Button variant="primary" fullWidth onClick={onClose}>
          {t('common.close')}
        </Button>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={t('drive.shareFile')}
      size="large"
      draggable={false}
      aria-describedby="share-dialog-description"
    >
      <div className="space-y-6">
        <div className="px-5 py-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <p id="share-dialog-description" className="text-sm text-gray-500 dark:text-gray-400 mb-1.5">
            {t('drive.sharing')}:
          </p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white truncate">
            {file.name}
          </p>
        </div>

        <Tabs
          tabs={[
            ...(canShare ? [
              { value: 'people', label: t('drive.people'), icon: <Users className="w-4 h-4" aria-hidden="true" /> },
              { value: 'roles', label: t('drive.roles'), icon: <Shield className="w-4 h-4" aria-hidden="true" /> }
            ] : []),
            ...(canPublicLink ? [
              { value: 'public', label: t('drive.publicLink'), icon: <LinkIcon className="w-4 h-4" aria-hidden="true" /> }
            ] : [])
          ]}
          activeTab={shareType}
          onTabChange={setShareType}
          variant="underline"
        />

        <div>
          {shareType === 'people' && canShare && (
            <div className="space-y-6">
              {shareSuccess && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-base text-green-700 dark:text-green-400" role="status" aria-live="polite">
                  {t('drive.shareSuccess')}
                </div>
              )}

              <UserSearchDropdown value={selectedUserId} onChange={setSelectedUserId} disabled={loading} />
              <SharePermissionSelect value={permission} onChange={setPermission} disabled={loading} />

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
                fullWidth
              />

              <Button
                onClick={handleShareWithUser}
                disabled={!selectedUserId || loading}
                loading={loading}
                fullWidth
              >
                {loading ? t('common.sharing') : t('drive.share')}
              </Button>

              <div className="pt-5 border-t border-gray-200 dark:border-gray-700">
                <SharesList fileId={file.id} />
              </div>
            </div>
          )}

          {shareType === 'roles' && canShare && (
            <div className="space-y-6">
              {shareSuccess && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-base text-green-700 dark:text-green-400" role="status" aria-live="polite">
                  {t('drive.shareSuccess')}
                </div>
              )}

              <RoleSelect value={selectedRole} onChange={setSelectedRole} disabled={loading} />
              <SharePermissionSelect value={permission} onChange={setPermission} disabled={loading} />

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
                fullWidth
              />

              <Button
                onClick={handleShareWithRole}
                disabled={!selectedRole || loading}
                loading={loading}
                fullWidth
              >
                {loading ? t('common.sharing') : t('drive.shareWithRole')}
              </Button>

              <div className="pt-5 border-t border-gray-200 dark:border-gray-700">
                <SharesList fileId={file.id} />
              </div>
            </div>
          )}

          {shareType === 'public' && canPublicLink && (
            <div className="space-y-6">
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
                fullWidth
              />

              {!publicLink && (
                <Button
                  onClick={handleGeneratePublicLink}
                  disabled={loading}
                  loading={loading}
                  fullWidth
                >
                  {loading ? t('common.generating') : t('drive.generateLink')}
                </Button>
              )}

              {publicLink && (
                <div className="space-y-3">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700" role="status" aria-live="polite">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1.5">
                      {t('drive.publicLinkGenerated')}
                    </p>
                    <p className="text-sm font-mono text-gray-900 dark:text-white break-all">
                      {publicLink}
                    </p>
                  </div>
                  <Button variant="outline" onClick={copyToClipboard} fullWidth>
                    {t('common.copyLink')}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
