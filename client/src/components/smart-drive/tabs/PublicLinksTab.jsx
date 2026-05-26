import { useState, useEffect, useCallback } from 'react';
import { useLang } from '@contexts/LangContext';
import { useAuth } from '@contexts/AuthContext';
import { getIcon } from '@constants/iconTypes';

export default function PublicLinksTab({ fileId }) {
  const { t } = useLang();
  const { user } = useAuth();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLinks = useCallback(async () => {
    if (!fileId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/drive/files/${fileId}/public-links`);
      const data = await response.json();
      if (data.success) {
        setLinks(data.data || []);
      } else {
        setError(data.error || 'Failed to fetch public links');
      }
    } catch (err) {
      console.error('[PublicLinksTab] fetch failed:', err);
      setError(err.message || 'Failed to fetch public links');
    } finally {
      setLoading(false);
    }
  }, [fileId]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const handleRevokeLink = async (linkId) => {
    if (!confirm(t('drive.confirmRevokeLink', 'Are you sure you want to revoke this public link?'))) return;
    
    try {
      const response = await fetch(`/api/v1/drive/public-links/${linkId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        setLinks(prev => prev.map(link => 
          link.id === linkId ? { ...link, revokedAt: new Date().toISOString() } : link
        ));
      } else {
        setError(data.error || 'Failed to revoke link');
      }
    } catch (err) {
      console.error('[PublicLinksTab] revoke failed:', err);
      setError(err.message || 'Failed to revoke link');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could add a toast notification here
    });
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

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '12rem', fontSize: '0.875rem', color: 'var(--text-muted, #6b7280)' }} role="status">
        {t('common.loading')}…
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {error && (
        <div style={{ padding: '0.75rem', background: 'var(--error-bg, #fef2f2)', border: '1px solid var(--error-border, #fecaca)', borderRadius: '0.5rem', color: 'var(--error-text, #dc2626)', fontSize: '0.875rem' }} role="alert">
          {error}
        </div>
      )}

      {links.length === 0 && !loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', color: 'var(--text-muted, #6b7280)', fontSize: '0.875rem' }}>
          {getIcon('ui', 'link', 48)}
          <p style={{ marginTop: '1rem', margin: 0 }}>{t('drive.noPublicLinks', 'No public links yet')}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {links.map((link) => {
            const status = getLinkStatus(link);
            const publicUrl = `${window.location.origin}/public/links/${link.token}`;
            
            return (
              <div
                key={link.id}
                style={{
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--border, #e5e7eb)',
                  background: 'var(--panel, white)',
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'flex-start',
                }}
              >
                {/* Status Icon */}
                <div style={{
                  flexShrink: 0,
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: '9999px',
                  background: `${status.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: status.color,
                }}>
                  {getIcon('ui', isRevoked(link.revokedAt) ? 'lock' : 'unlock', 20)}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: status.color }}>
                      {status.label}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #6b7280)' }}>
                      {t('drive.created', 'Created')}: {formatDateTime(link.createdAt)}
                    </span>
                  </div>
                  
                  {/* Link URL */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    background: 'var(--bg-secondary, #f9fafb)',
                    borderRadius: '0.375rem',
                    marginBottom: '0.5rem',
                  }}>
                    <code style={{ 
                      flex: 1, 
                      fontSize: '0.75rem', 
                      color: 'var(--text, #374151)', 
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {publicUrl}
                    </code>
                    <button
                      onClick={() => copyToClipboard(publicUrl)}
                      style={{
                        flexShrink: 0,
                        padding: '0.25rem',
                        borderRadius: '0.25rem',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--text-muted, #6b7280)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--color-primary-alpha, rgba(37,99,235,0.1))';
                        e.currentTarget.style.color = 'var(--color-primary, #3b82f6)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-muted, #6b7280)';
                      }}
                    >
                      {getIcon('ui', 'copy', 16)}
                    </button>
                  </div>

                  {/* Metadata */}
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted, #6b7280)' }}>
                    {link.expiresAt && (
                      <span>
                        {t('drive.expires', 'Expires')}: {formatDateTime(link.expiresAt)}
                      </span>
                    )}
                    {link.downloadCount !== null && (
                      <span>
                        {t('drive.downloads', 'Downloads')}: {link.downloadCount}
                        {link.maxDownloads && ` / ${link.maxDownloads}`}
                      </span>
                    )}
                    {link.passwordProtected && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        {getIcon('ui', 'lock', 12)}
                        {t('drive.passwordProtected', 'Password protected')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {!isRevoked(link.revokedAt) && (
                  <button
                    onClick={() => handleRevokeLink(link.id)}
                    style={{
                      flexShrink: 0,
                      padding: '0.5rem',
                      borderRadius: '0.375rem',
                      border: '1px solid var(--error-border, #fecaca)',
                      background: 'transparent',
                      color: 'var(--error-text, #dc2626)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--error-bg, #fef2f2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {getIcon('ui', 'trash', 16, '#dc2626')}
                    {t('drive.revoke', 'Revoke')}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
