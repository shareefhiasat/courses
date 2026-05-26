import { useState, useCallback, useRef, useEffect } from 'react';
import { useLang } from '@contexts/LangContext';
import { usePermissions } from '@hooks/usePermissions';
import { ROLE_STRINGS } from '@utils/userUtils';
import { getThemedIcon, getIcon } from '@constants/iconTypes';
import Tabs from '@ui/Tabs/Tabs';
import Select from '@ui/Select/Select';
import Button from '@ui/Button/Button';
import SharesList from '../SharesList';
import { getAllUsers } from '@services/business/userService';

// Permission constants
const PERMISSIONS = {
  VIEW: 'VIEW',
  DOWNLOAD: 'DOWNLOAD',
  COMMENT: 'COMMENT',
  EDIT: 'EDIT'
};

// Share type constants
const SHARE_TYPES = {
  PEOPLE: 'people',
  ROLES: 'roles',
  PUBLIC: 'public'
};

export default function ShareTab({ fileId, onShare, onGenerateLink }) {
  const { t } = useLang();
  const { hasPermission, roleCode } = usePermissions();
  const [shareType, setShareType] = useState(SHARE_TYPES.PEOPLE);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [permission, setPermission] = useState(PERMISSIONS.VIEW);
  const [expiryDays, setExpiryDays] = useState(null);
  const [publicLink, setPublicLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [userOptions, setUserOptions] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [sharesListKey, setSharesListKey] = useState(0);
  const [publicLinks, setPublicLinks] = useState([]);
  const [loadingLinks, setLoadingLinks] = useState(false);
  const searchTimeoutRef = useRef(null);

  const searchUsers = useCallback(async (query) => {
    console.log('[ShareTab] searchUsers called with query:', query);
    if (!query || query.length < 2) {
      setUserOptions([]);
      return;
    }
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        console.log('[ShareTab] Calling getAllUsers with search:', query);
        const result = await getAllUsers({ search: query, limit: 20, excludeStudents: true });
        console.log('[ShareTab] getAllUsers result:', result);
        if (result.success) {
          const options = (result.data || []).map(u => ({
            value: u.id,
            label: u.displayName || u.email,
            subtext: u.displayName && u.email && u.email !== u.displayName ? u.email : null,
            icon: <div style={{ width: '2rem', height: '2rem', borderRadius: '9999px', background: 'var(--color-primary-alpha, rgba(37,99,235,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{getThemedIcon('ui', 'user', 16, 'primary')}</div>,
          }));
          console.log('[ShareTab] Setting userOptions:', options);
          setUserOptions(options);
        }
      } catch (err) {
        console.error('[ShareTab] user search failed:', err);
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
          fileId, subjectType: 'USER', subjectId: userId,
          permission, expiresAt,
        });
      }
      setShareSuccess(true);
      setSelectedUserIds([]);
      setExpiryDays(null);
      setPermission(PERMISSIONS.VIEW);
      setSharesListKey(prev => prev + 1);
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
        fileId, subjectType: 'ROLE', subjectId: selectedRole,
        permission, expiresAt,
      });
      setShareSuccess(true);
      setSelectedRole('');
      setExpiryDays(null);
      setPermission(PERMISSIONS.VIEW);
      setSharesListKey(prev => prev + 1);
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
      const result = await onGenerateLink?.(fileId, expiryDays);
      if (result?.token) {
        const token = result.token;
        const apiUrl = window.location.origin;
        setPublicLink(`${apiUrl}/public/links/${token}/download`);
        // Refresh the list after generating a new link
        fetchPublicLinks();
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

  const fetchPublicLinks = useCallback(async () => {
    if (!fileId) return;
    setLoadingLinks(true);
    try {
      const response = await fetch(`/api/v1/drive/files/${fileId}/public-links`);
      const data = await response.json();
      console.log('[ShareTab] fetchPublicLinks response:', data);
      if (data.success) {
        setPublicLinks(data.data || data.payload || []);
      }
    } catch (err) {
      console.error('[ShareTab] fetch public links failed:', err);
    } finally {
      setLoadingLinks(false);
    }
  }, [fileId]);

  useEffect(() => {
    console.log('[ShareTab] useEffect triggered, shareType:', shareType, 'fileId:', fileId);
    if (shareType === SHARE_TYPES.PUBLIC) {
      console.log('[ShareTab] Calling fetchPublicLinks');
      fetchPublicLinks();
    }
  }, [shareType, fetchPublicLinks]);

  const handleRevokeLink = async (linkId) => {
    if (!confirm(t('drive.confirmRevokeLink', 'Are you sure you want to revoke this public link?'))) return;
    try {
      const response = await fetch(`/api/v1/drive/public-links/${linkId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        setPublicLinks(prev => prev.map(link => 
          link.id === linkId ? { ...link, revokedAt: new Date().toISOString() } : link
        ));
      }
    } catch (err) {
      console.error('[ShareTab] revoke failed:', err);
    }
  };

  const formatDateTime = (date) => {
    if (!date) return '—';
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const isExpired = (expiresAt) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const isRevoked = (revokedAt) => !!revokedAt;

  const getLinkStatus = (link) => {
    if (isRevoked(link.revokedAt)) return { label: t('drive.revoked', 'Revoked'), color: '#dc2626' };
    if (isExpired(link.expiresAt)) return { label: t('drive.expired', 'Expired'), color: '#f59e0b' };
    return { label: t('drive.active', 'Active'), color: '#10b981' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div>
        <Tabs
          tabs={[
            ...(canShare ? [
              { value: SHARE_TYPES.PEOPLE, label: t('drive.people'), icon: getThemedIcon('ui', 'users', 16, 'light') },
              { value: SHARE_TYPES.ROLES, label: t('drive.roles'), icon: getThemedIcon('ui', 'shield', 16, 'light') }
            ] : []),
            ...(canPublicLink ? [
              { value: SHARE_TYPES.PUBLIC, label: t('drive.publicLink'), icon: getThemedIcon('ui', 'link', 16, 'light') }
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
          minHeight: 'min(50vh, 400px)',
          overflowY: 'auto',
        }}
      >
        {shareType === SHARE_TYPES.PEOPLE && canShare && (
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
                label={t('drive.selectPermission') || 'Select Permission'}
                options={[
                  { value: PERMISSIONS.VIEW, label: t('drive.permission.view') },
                  { value: PERMISSIONS.DOWNLOAD, label: t('drive.permission.download') },
                  { value: PERMISSIONS.COMMENT, label: t('drive.permission.comment') },
                  { value: PERMISSIONS.EDIT, label: t('drive.permission.edit') }
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
              <SharesList fileId={fileId} refreshKey={sharesListKey} subjectTypeFilter="USER" />
            </div>
          </div>
        )}

        {shareType === SHARE_TYPES.ROLES && canShare && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {shareSuccess && (
              <div style={{ padding: '1rem', background: 'var(--color-success-bg, #ecfdf5)', border: '1px solid var(--color-success-border, #a7f3d0)', borderRadius: '0.75rem', color: 'var(--color-success-text, #065f46)' }} role="status" aria-live="polite">
                {t('drive.shareSuccess')}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <Select
                label={t('drive.selectRole') || 'Select Role'}
                options={[
                  { value: ROLE_STRINGS.HR, label: t('roles.hr') },
                  { value: ROLE_STRINGS.ADMIN, label: t('roles.admin') },
                  { value: ROLE_STRINGS.INSTRUCTOR, label: t('roles.instructor') }
                ]}
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                disabled={loading}
              />

              <Select
                label={t('drive.selectPermission') || 'Select Permission'}
                options={[
                  { value: PERMISSIONS.VIEW, label: t('drive.permission.view') },
                  { value: PERMISSIONS.DOWNLOAD, label: t('drive.permission.download') },
                  { value: PERMISSIONS.COMMENT, label: t('drive.permission.comment') },
                  { value: PERMISSIONS.EDIT, label: t('drive.permission.edit') }
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
              <SharesList fileId={fileId} refreshKey={sharesListKey} subjectTypeFilter="ROLE" />
            </div>
          </div>
        )}

        {shareType === SHARE_TYPES.PUBLIC && canPublicLink && (
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
                setPublicLink('');
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

            <div style={{ paddingTop: '1.25rem', borderTop: '1px solid var(--border, #e5e7eb)' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text, #111827)', marginBottom: '0.75rem' }}>
                {t('drive.publicLinks')}
              </div>
              {loadingLinks ? (
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted, #6b7280)' }}>
                  {t('common.loading')}…
                </div>
              ) : publicLinks.length === 0 ? (
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted, #6b7280)', padding: '1rem 0' }}>
                  {t('drive.noPublicLinks')}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {publicLinks.map((link) => {
                    const status = getLinkStatus(link);
                    const publicUrl = `${window.location.origin}/public/links/${link.token}`;
                    
                    return (
                      <div
                        key={link.id}
                        style={{
                          padding: '0.5rem',
                          borderRadius: '0.375rem',
                          border: '1px solid var(--border, #e5e7eb)',
                          background: 'var(--panel, white)',
                          display: 'flex',
                          gap: '0.5rem',
                          alignItems: 'center',
                        }}
                      >
                        <div style={{
                          flexShrink: 0,
                          width: '1.5rem',
                          height: '1.5rem',
                          borderRadius: '9999px',
                          background: `${status.color}20`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: status.color,
                        }}>
                          {getThemedIcon('ui', isRevoked(link.revokedAt) ? 'lock' : 'unlock', 12, status.color)}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: status.color }}>
                              {status.label}
                            </span>
                            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted, #6b7280)' }}>
                              {formatDateTime(link.createdAt)}
                            </span>
                            {link.expiresAt && (
                              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted, #6b7280)' }}>
                                {t('drive.expires')}: {formatDateTime(link.expiresAt)}
                              </span>
                            )}
                            {link.downloadCount !== null && (
                              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted, #6b7280)' }}>
                                {t('drive.downloads')}: {link.downloadCount}
                              </span>
                            )}
                          </div>
                          
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.375rem',
                            marginTop: '0.25rem',
                          }}>
                            <a
                              href={publicUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                flexShrink: 0,
                                padding: '0.125rem',
                                borderRadius: '0.25rem',
                                border: 'none',
                                background: 'transparent',
                                color: 'var(--text-muted, #6b7280)',
                                cursor: 'pointer',
                              }}
                            >
                              {getThemedIcon('ui', 'external_link', 14, 'light')}
                            </a>
                            <button
                              onClick={() => navigator.clipboard.writeText(publicUrl)}
                              style={{
                                flexShrink: 0,
                                padding: '0.25rem',
                                borderRadius: '0.25rem',
                                border: 'none',
                                background: 'transparent',
                                color: 'var(--text-muted, #6b7280)',
                                cursor: 'pointer',
                              }}
                            >
                              {getThemedIcon('ui', 'copy', 16, 'light')}
                            </button>
                            <code style={{ 
                              flex: 1, 
                              fontSize: '0.6875rem', 
                              color: 'var(--text, #374151)', 
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}>
                              {publicUrl}
                            </code>
                          </div>
                        </div>

                        {!isRevoked(link.revokedAt) && (
                          <button
                            onClick={() => handleRevokeLink(link.id)}
                            style={{
                              flexShrink: 0,
                              padding: '0.25rem',
                              borderRadius: '0.25rem',
                              border: '1px solid var(--error-border, #fecaca)',
                              background: 'transparent',
                              color: 'var(--error-text, #dc2626)',
                              cursor: 'pointer',
                              fontSize: '0.6875rem',
                            }}
                          >
                            {getIcon('ui', 'trash', 16, '#dc2626')}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
