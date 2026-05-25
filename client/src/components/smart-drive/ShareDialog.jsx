import { useState, useCallback, useRef } from 'react';
import { usePermissions } from '@hooks/usePermissions';
import { useLang } from '@contexts/LangContext';
import { ROLE_STRINGS } from '@utils/userUtils';
import { getThemedIcon } from '@constants/iconTypes';
import Modal from '@ui/Modal/Modal';
import Tabs from '@ui/Tabs/Tabs';
import Select from '@ui/Select/Select';
import Button from '@ui/Button/Button';
import SharesList from './SharesList';

export default function ShareDialog({ file, onShare, onGenerateLink, onClose }) {
  const { t } = useLang();
  const { hasPermission, roleCode } = usePermissions();
  const [shareType, setShareType] = useState('people');
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [permission, setPermission] = useState('VIEW');
  const [expiryDays, setExpiryDays] = useState(null);
  const [publicLink, setPublicLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [userOptions, setUserOptions] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [sharesListKey, setSharesListKey] = useState(0);
  const searchTimeoutRef = useRef(null);

  const searchUsers = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setUserOptions([]);
      return;
    }
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const { default: axios } = await import('axios');
        const response = await axios.get('/api/v1/users', { params: { search: query, limit: 20, excludeStudents: 'true' } });
        if (response.data.success) {
          setUserOptions(
            (response.data.payload || []).map(u => ({
              value: u.id,
              label: u.displayName || u.email,
              subtext: u.displayName && u.email && u.email !== u.displayName ? u.email : null,
              icon: <div style={{ width: '2rem', height: '2rem', borderRadius: '9999px', background: 'var(--color-primary-alpha, rgba(37,99,235,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{getThemedIcon('ui', 'user', 16, 'primary')}</div>,
            }))
          );
        }
      } catch (err) {
        console.error('[ShareDialog] user search failed:', err);
      } finally {
        setSearchingUsers(false);
      }
    }, 300);
  }, []);

  const isSuperAdmin = roleCode === ROLE_STRINGS.SUPER_ADMIN;
  const canShare = isSuperAdmin || hasPermission('drive.share');
  const canPublicLink = isSuperAdmin || hasPermission('drive.public-link');

  const handleShareWithUser = async () => {
    if (selectedUserIds.length === 0 || !canShare) return;
    setLoading(true);
    setShareSuccess(false);
    try {
      const expiresAt = expiryDays ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString() : null;
      for (const userId of selectedUserIds) {
        await onShare?.({
          fileId: file.id, subjectType: 'USER', subjectId: userId,
          permission, expiresAt,
        });
      }
      setShareSuccess(true);
      setSelectedUserIds([]);
      setExpiryDays(null);
      setSharesListKey(prev => prev + 1); // Force refresh shares list
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
      setSharesListKey(prev => prev + 1); // Force refresh shares list
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
        const apiUrl = window.location.origin;
        setPublicLink(`${apiUrl}/api/v1/public/links/${token}/download`);
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
      <Modal isOpen={true} onClose={onClose} title={t('drive.shareFile')} size="large" zIndex={10001}>
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
      zIndex={10001}
      draggable={false}
      aria-describedby="share-dialog-description"
    >
      <div className="space-y-6">
        <div
          style={{
            padding: '1rem 1.25rem',
            background: 'var(--background-secondary, #f9fafb)',
            borderRadius: '0.75rem',
            border: '1px solid var(--border, #e5e7eb)',
          }}
        >
          <p style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text, #111827)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {file.name}
          </p>
        </div>

        <div style={{ marginTop: '0.75rem' }}>
          <Tabs
            tabs={[
              ...(canShare ? [
                { value: 'people', label: t('drive.people'), icon: getThemedIcon('ui', 'users', 16, 'light') },
                { value: 'roles', label: t('drive.roles'), icon: getThemedIcon('ui', 'shield', 16, 'light') }
              ] : []),
              ...(canPublicLink ? [
                { value: 'public', label: t('drive.publicLink'), icon: getThemedIcon('ui', 'link', 16, 'light') }
              ] : [])
            ]}
            activeTab={shareType}
            onTabChange={setShareType}
            variant="default"
            size="md"
          />
        </div>

        <div
          style={{
            minHeight: 'min(70vh, 600px)',
            overflowY: 'auto',
          }}
        >
          {shareType === 'people' && canShare && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              {shareSuccess && (
                <div style={{ padding: '1rem', background: 'var(--color-success-bg, #ecfdf5)', border: '1px solid var(--color-success-border, #a7f3d0)', borderRadius: '0.75rem', color: 'var(--color-success-text, #065f46)' }} role="status" aria-live="polite">
                  {t('drive.shareSuccess')}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
                <Select
                  label={t('drive.selectUser')}
                  options={userOptions}
                  value={selectedUserIds}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedUserIds(Array.isArray(value) ? value : (value ? [value] : []));
                  }}
                  placeholder={t('drive.searchUsers')}
                  searchPlaceholder={t('drive.searchUsers')}
                  disabled={loading}
                  onSearchChange={searchUsers}
                  multiple
                />

                <Select
                  label={t('drive.permission')}
                  options={[
                    { value: 'VIEW', label: t('drive.permission.view') },
                    { value: 'DOWNLOAD', label: t('drive.permission.download') },
                    { value: 'COMMENT', label: t('drive.permission.comment') },
                    { value: 'EDIT', label: t('drive.permission.edit') }
                  ]}
                  value={permission}
                  onChange={(e) => setPermission(e.target.value)}
                  disabled={loading}
                />

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
                  disabled={loading}
                />
              </div>

              {searchingUsers && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #6b7280)', marginTop: '-1.25rem' }}>
                  {t('common.searching')}&hellip;
                </div>
              )}

              <Button
                onClick={handleShareWithUser}
                disabled={selectedUserIds.length === 0 || loading}
                loading={loading}
                fullWidth
              >
                {loading ? t('common.sharing') : t('drive.share')}
              </Button>

              <div style={{ paddingTop: '1.25rem', borderTop: '1px solid var(--border, #e5e7eb)' }}>
                <SharesList fileId={file.id} refreshKey={sharesListKey} />
              </div>
            </div>
          )}

          {shareType === 'roles' && canShare && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              {shareSuccess && (
                <div style={{ padding: '1rem', background: 'var(--color-success-bg, #ecfdf5)', border: '1px solid var(--color-success-border, #a7f3d0)', borderRadius: '0.75rem', color: 'var(--color-success-text, #065f46)' }} role="status" aria-live="polite">
                  {t('drive.shareSuccess')}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <Select
                  label={t('drive.selectRole')}
                  options={[
                    { value: 'hr', label: t('roles.hr') },
                    { value: 'admin', label: t('roles.admin') },
                    { value: 'instructor', label: t('roles.instructor') }
                  ]}
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  disabled={loading}
                />

                <Select
                  label={t('drive.permission')}
                  options={[
                    { value: 'VIEW', label: t('drive.permission.view') },
                    { value: 'DOWNLOAD', label: t('drive.permission.download') },
                    { value: 'COMMENT', label: t('drive.permission.comment') },
                    { value: 'EDIT', label: t('drive.permission.edit') }
                  ]}
                  value={permission}
                  onChange={(e) => setPermission(e.target.value)}
                  disabled={loading}
                />

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
                  disabled={loading}
                />
              </div>

              <Button
                onClick={handleShareWithRole}
                disabled={!selectedRole || loading}
                loading={loading}
                fullWidth
              >
                {loading ? t('common.sharing') : t('drive.shareWithRole')}
              </Button>

              <div style={{ paddingTop: '1.25rem', borderTop: '1px solid var(--border, #e5e7eb)' }}>
                <SharesList fileId={file.id} refreshKey={sharesListKey} />
              </div>
            </div>
          )}

          {shareType === 'public' && canPublicLink && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              <Select
                label={t('drive.linkExpiry')}
                options={[
                  { value: '', label: t('drive.noExpiry') },
                  { value: 1, label: `1 ${t('common.day')}` },
                  { value: 7, label: `7 ${t('common.days')}` },
                  { value: 30, label: `30 ${t('common.days')}` },
                  { value: 90, label: `90 ${t('common.days')}` }
                ]}
                value={expiryDays || ''}
                onChange={(e) => {
                  setExpiryDays(e.target.value ? parseInt(e.target.value) : null);
                  setPublicLink(''); // Reset link when expiry changes
                }}
                fullWidth
              />

              <Button
                onClick={handleGeneratePublicLink}
                disabled={loading}
                loading={loading}
                fullWidth
              >
                {loading ? t('common.generating') : t('drive.generateLink')}
              </Button>

              {publicLink && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ padding: '1rem', background: 'var(--background-secondary, #f9fafb)', borderRadius: '0.75rem', border: '1px solid var(--border, #e5e7eb)' }} role="status" aria-live="polite">
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted, #6b7280)', margin: '0 0 0.375rem 0' }}>
                      {t('drive.publicLinkGenerated')}
                    </p>
                    <p style={{ fontSize: '0.875rem', fontFamily: 'monospace', color: 'var(--text, #111827)', wordBreak: 'break-all', margin: 0 }}>
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
