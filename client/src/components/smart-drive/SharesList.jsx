import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLang } from '@contexts/LangContext';
import { X, User, Shield, Calendar, Eye, Download, MessageSquare, Edit, Clock, Search } from 'lucide-react';
import axios from 'axios';

export default function SharesList({ fileId, onRevoke, refreshKey }) {
  const { t } = useLang();
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [filterText, setFilterText] = useState('');

  const fetchShares = useCallback(async () => {
    if (!fileId) return;

    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/v1/drive/files/${fileId}/shares`);
      if (response.data.success) {
        setShares(response.data.payload || []);
      } else {
        setError(response.data.error?.message || 'Failed to fetch shares');
      }
    } catch (err) {
      console.error('[SharesList] fetch failed:', err);
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [fileId]);

  useEffect(() => {
    fetchShares();
  }, [fetchShares, refreshKey]);

  // Group shares by date
  const groupedShares = shares.reduce((acc, share) => {
    const date = new Date(share.createdAt).toDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(share);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedShares).sort((a, b) => new Date(b) - new Date(a));

  // Filter shares based on search text
  const filteredShares = useMemo(() => {
    let filtered = selectedDate ? groupedShares[selectedDate] || [] : shares;
    if (filterText.trim()) {
      const searchLower = filterText.toLowerCase();
      filtered = filtered.filter(share => {
        const displayName = share.subjectType === 'USER'
          ? (share.subjectUser?.displayName || share.subjectUser?.email || '')
          : share.subjectRole || '';
        return displayName.toLowerCase().includes(searchLower) ||
               share.permission?.toLowerCase().includes(searchLower);
      });
    }
    return filtered;
  }, [shares, filterText, selectedDate, groupedShares]);

  const handleRevoke = async (shareId) => {
    try {
      const response = await axios.delete(`/api/v1/drive/shares/${shareId}`);
      if (response.data.success) {
        setShares(prev => prev.filter(s => s.id !== shareId));
        onRevoke?.(shareId);
      }
    } catch (err) {
      console.error('[SharesList] revoke failed:', err);
    }
  };

  const getPermissionIcon = (permission) => {
    switch (permission) {
      case 'VIEW': return Eye;
      case 'DOWNLOAD': return Download;
      case 'COMMENT': return MessageSquare;
      case 'EDIT': return Edit;
      default: return Eye;
    }
  };

  const formatDateTime = (date) => {
    if (!date) return '\u2014';
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return '\u2014';
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatDateHeader = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return t('drive.today') || 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return t('drive.yesterday') || 'Yesterday';
    } else {
      return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    }
  };

  const formatExpiry = (expiresAt) => {
    if (!expiresAt) return null;
    const date = new Date(expiresAt);
    const now = new Date();
    const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return t('drive.expired');
    if (diffDays === 0) return t('drive.expirestoday');
    if (diffDays === 1) return t('drive.expirestomorrow');
    return t('drive.expiresindays', { days: diffDays });
  };

  if (loading) {
    return (
      <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted, #6b7280)' }}>
        {t('common.loading')}&hellip;
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem', color: '#dc2626' }}>
        {error}
      </div>
    );
  }

  if (shares.length === 0) {
    return (
      <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted, #6b7280)' }}>
        {t('drive.noShares')}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100%', gap: '1rem' }}>
      {/* Left sidebar - Date timeline */}
      <div style={{
        width: '200px',
        flexShrink: 0,
        borderRight: '1px solid var(--border, #e5e7eb)',
        paddingInlineEnd: '1rem',
        overflowY: 'auto',
        maxHeight: '400px'
      }}>
        <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted, #6b7280)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock className="w-4 h-4" />
          {t('drive.timeline') || 'Timeline'}
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <button
            onClick={() => setSelectedDate(null)}
            style={{
              padding: '0.5rem',
              textAlign: 'start',
              background: !selectedDate ? 'var(--bg-primary, #f3f4f6)' : 'transparent',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              color: !selectedDate ? 'var(--text, #111827)' : 'var(--text-muted, #6b7280)',
              cursor: 'pointer',
              fontWeight: !selectedDate ? 600 : 400,
            }}
          >
            {t('drive.allActivities') || 'All Shares'} ({shares.length})
          </button>
          {sortedDates.map((date) => (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              style={{
                padding: '0.5rem',
                textAlign: 'start',
                background: selectedDate === date ? 'var(--bg-primary, #f3f4f6)' : 'transparent',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                color: selectedDate === date ? 'var(--text, #111827)' : 'var(--text-muted, #6b7280)',
                cursor: 'pointer',
                fontWeight: selectedDate === date ? 600 : 400,
              }}
            >
              {formatDateHeader(date)} ({groupedShares[date].length})
            </button>
          ))}
        </div>
      </div>

      {/* Right content - Shares */}
      <div style={{ flex: 1, overflowY: 'auto', maxHeight: '400px' }}>
        {/* Search filter */}
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '1rem', height: '1rem', color: 'var(--text-muted, #6b7280)' }} aria-hidden="true" />
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder={t('drive.filterActivities') || 'Filter shares...'}
            style={{
              width: '100%',
              padding: '0.625rem 2.5rem',
              border: '1px solid var(--border, #d1d5db)',
              borderRadius: '0.5rem',
              background: 'var(--panel, white)',
              color: 'var(--text, #111827)',
              fontSize: '0.875rem',
              outline: 'none',
            }}
            aria-label={t('drive.filterActivities') || 'Filter shares'}
          />
          {filterText && (
            <button
              onClick={() => setFilterText('')}
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted, #6b7280)',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                padding: '0.25rem',
                borderRadius: '0.25rem',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text, #111827)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted, #6b7280)'}
              aria-label={t('common.clear')}
            >
              ✕
            </button>
          )}
        </div>

        <h4 style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text, #111827)', margin: '0 0 0.5rem 0' }}>
          {selectedDate ? formatDateHeader(selectedDate) : t('drive.existingShares')} ({filteredShares.length})
        </h4>

        {filteredShares.length === 0 ? (
          <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted, #6b7280)' }}>
            {filterText ? t('drive.noMatchingActivities') || 'No matching shares' : t('drive.noShares')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {filteredShares.map(share => {
              const PermIcon = getPermissionIcon(share.permission);
              const isUser = share.subjectType === 'USER';
              const displayName = isUser
                ? (share.subjectUser?.displayName || share.subjectUser?.email || t('drive.unknownUser'))
                : share.subjectRole;
              const expiryText = formatExpiry(share.expiresAt);

              return (
                <div
                  key={share.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem',
                    background: 'var(--background-secondary, #f9fafb)',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border, #e5e7eb)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        width: '2rem',
                        height: '2rem',
                        borderRadius: '9999px',
                        background: 'var(--background-secondary, #f3f4f6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {isUser ? (
                        <User className="w-4 h-4" style={{ color: 'var(--color-primary, #3b82f6)' }} aria-hidden="true" />
                      ) : (
                        <Shield className="w-4 h-4" style={{ color: '#f59e0b' }} aria-hidden="true" />
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text, #111827)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {displayName}
                        </p>
                        <span
                          style={{
                            flexShrink: 0,
                            padding: '0.125rem 0.5rem',
                            fontSize: '0.75rem',
                            borderRadius: '9999px',
                            background: 'var(--background-secondary, #f3f4f6)',
                            color: 'var(--text-muted, #6b7280)',
                          }}
                        >
                          {isUser ? t('drive.user') : t('drive.role')}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted, #6b7280)' }}>
                          <PermIcon className="w-3 h-3" aria-hidden="true" />
                          {t(`drive.permission.${share.permission.toLowerCase()}`)}
                        </div>

                        {expiryText && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted, #6b7280)' }}>
                            <Calendar className="w-3 h-3" aria-hidden="true" />
                            {expiryText}
                          </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted, #6b7280)' }}>
                          {formatDateTime(share.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRevoke(share.id)}
                    style={{
                      flexShrink: 0,
                      padding: '0.375rem',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--text-muted, #6b7280)',
                      cursor: 'pointer',
                      borderRadius: '0.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: '2.25rem',
                      minHeight: '2.25rem',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#dc2626';
                      e.currentTarget.style.background = 'var(--background-secondary, #f3f4f6)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--text-muted, #6b7280)';
                      e.currentTarget.style.background = 'transparent';
                    }}
                    title={t('drive.revokeShare')}
                    aria-label={t('drive.revokeShare')}
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
