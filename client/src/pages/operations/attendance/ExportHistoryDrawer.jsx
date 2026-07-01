import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getExportHistory } from '@services/db/exportHistoryService.js';
import { resolveUserRole, getUserRoleFromObject } from '@utils/userUtils';
import { getUserRoleColor, getUserRoleIcon } from '@constants/iconTypes';
import RoleBadge from '@pages/communications/chat/components/RoleBadge.jsx';

const EXPORT_TYPE_COLORS = {
  daily: '#3b82f6',
  daily_official: '#8b5cf6',
  attendance_official: '#f59e0b',
  behavioral: '#ef4444',
  penalty: '#b45309',
  summary: '#14b8a6',
};

const FORMAT_COLORS = {
  pdf: '#dc2626',
  excel: '#16a34a',
  csv: '#6b7280',
};

const EXPORT_TYPE_KEYS = [
  'daily',
  'daily_official',
  'attendance_official',
  'behavioral',
  'penalty',
  'summary',
];

const FORMAT_KEYS = ['pdf', 'excel'];

function getInitials(name) {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
}

function formatDateLabel(dateStr, lang, t) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return t('today') || 'Today';
  if (d.toDateString() === yesterday.toDateString()) return t('yesterday') || 'Yesterday';

  return d.toLocaleDateString(lang === 'ar' ? 'ar' : undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(dateStr, lang) {
  return new Date(dateStr).toLocaleTimeString(lang === 'ar' ? 'ar' : undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCount(key, count, t) {
  const template = t(key) || key;
  const plural = count !== 1 ? 's' : '';
  const pluralEs = count !== 1 ? 'es' : '';
  return template
    .replace('{count}', count)
    .replace('{s}', plural)
    .replace('{es}', pluralEs);
}

const ExportHistoryDrawer = ({ isOpen, onClose, lang, t, theme }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [formatFilter, setFormatFilter] = useState('all');

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 200 };
      if (typeFilter !== 'all') params.exportType = typeFilter;
      if (formatFilter !== 'all') params.format = formatFilter;
      if (search) params.search = search;

      const result = await getExportHistory(params);
      if (result.success) {
        setHistory(result.data || []);
      } else {
        console.error('Failed to fetch export history:', result.error);
        setHistory([]);
      }
    } catch (err) {
      console.error('Export history fetch error:', err);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, formatFilter, search]);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, fetchHistory]);

  const groupedData = useMemo(() => {
    const byUser = new Map();

    history.forEach((record) => {
      const userId = record.user?.id || record.userId;
      const userName = record.user?.displayName || record.user?.email || `User ${userId}`;

      if (!byUser.has(userId)) {
        byUser.set(userId, {
          user: record.user,
          userName,
          entries: [],
        });
      }

      byUser.get(userId).entries.push(record);
    });

    return Array.from(byUser.values()).sort((a, b) => {
      const aLast = a.entries[0]?.createdAt || '';
      const bLast = b.entries[0]?.createdAt || '';
      return new Date(bLast) - new Date(aLast);
    });
  }, [history]);

  if (!isOpen) return null;

  const typeChips = [
    { key: 'all', label: t('all') || 'All', color: null },
    ...EXPORT_TYPE_KEYS.map((key) => ({
      key,
      label: t(`export_type_${key}`) || key,
      color: EXPORT_TYPE_COLORS[key],
    })),
  ];

  const formatChips = [
    { key: 'all', label: t('all_formats') || 'All Formats', color: null },
    ...FORMAT_KEYS.map((key) => ({
      key,
      label: key.toUpperCase(),
      color: FORMAT_COLORS[key],
    })),
  ];

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 2000 }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          height: '100%',
          width: 480,
          background: 'var(--panel)',
          boxShadow: '-4px 0 16px rgba(0,0,0,0.15)',
          padding: '1rem',
          pointerEvents: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)' }}>
            {t('export_history') || 'Export History'}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: 'var(--font-size-lg)',
              cursor: 'pointer',
              color: 'var(--text)',
              flexShrink: 0,
              padding: '4px 8px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Search input */}
        <div style={{ marginBottom: 10 }}>
          <input
            type="text"
            autoComplete="off"
            placeholder={t('search_exports') || 'Search by filename or user...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid var(--border)',
              borderRadius: 6,
              fontSize: '0.95rem',
              background: 'var(--bg)',
              color: 'var(--text)',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Type filter chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {typeChips.map((chip) => {
            const isActive = typeFilter === chip.key;
            const chipColor = chip.color || '#6b7280';
            return (
              <button
                key={chip.key}
                type="button"
                onClick={() => setTypeFilter(chip.key)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  border: `1px solid ${isActive ? chipColor : 'var(--border)'}`,
                  background: isActive ? `${chipColor}15` : 'transparent',
                  color: isActive ? chipColor : 'var(--text)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                }}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* Format filter chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {formatChips.map((chip) => {
            const isActive = formatFilter === chip.key;
            const chipColor = chip.color || '#6b7280';
            return (
              <button
                key={chip.key}
                type="button"
                onClick={() => setFormatFilter(chip.key)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  border: `1px solid ${isActive ? chipColor : 'var(--border)'}`,
                  background: isActive ? `${chipColor}15` : 'transparent',
                  color: isActive ? chipColor : 'var(--text)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                }}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', maxHeight: 'calc(100vh - 280px)' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
              <p>{t('loading_dots') || 'Loading...'}</p>
            </div>
          ) : groupedData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
              <p>{t('no_export_history') || 'No export history found'}</p>
            </div>
          ) : (
            groupedData.map((group) => {
              const role = resolveUserRole(group.user);

              // Group entries by date
              const byDate = new Map();
              group.entries.forEach((entry) => {
                const dateKey = new Date(entry.createdAt).toDateString();
                if (!byDate.has(dateKey)) byDate.set(dateKey, []);
                byDate.get(dateKey).push(entry);
              });

              const dateGroups = Array.from(byDate.entries()).sort(
                ([a], [b]) => new Date(b) - new Date(a)
              );

              return (
                <div key={group.user?.id || group.userName} style={{ marginBottom: '1rem' }}>
                  {/* User header */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '0.5rem 0',
                      borderBottom: '2px solid var(--border)',
                      marginBottom: 4,
                    }}
                  >
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    {group.user?.profileImageUrl ? (
                      <img
                        src={group.user.profileImageUrl}
                        alt={group.userName}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: getUserRoleColor(role) || '#6b7280',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                        }}
                      >
                        {getInitials(group.userName)}
                      </div>
                    )}
                    {/* Role badge overlay */}
                    {(() => {
                      const badgeRole = getUserRoleFromObject(group.user);
                      if (!badgeRole) return null;
                      const roleIcon = getUserRoleIcon(badgeRole);
                      const roleColor = getUserRoleColor(badgeRole);
                      if (!roleIcon) return null;
                      return (
                        <div style={{
                          position: 'absolute',
                          bottom: '-2px',
                          insetInlineEnd: '-2px',
                          width: '1.125rem',
                          height: '1.125rem',
                          borderRadius: '9999px',
                          background: 'var(--panel, white)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1.5px solid var(--panel, white)',
                          boxShadow: '0 0 0 1px var(--border, #e5e7eb)',
                        }}
                          title={badgeRole}
                        >
                          {React.cloneElement(roleIcon, { color: roleColor, size: 10 })}
                        </div>
                      );
                    })()}
                  </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: '0.95rem',
                          color: 'var(--text)',
                        }}
                      >
                        {group.userName}
                        <RoleBadge user={group.user} size={12} />
                      </div>
                      <div
                        style={{
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--muted)',
                        }}
                      >
                        {formatCount('exports_count', group.entries.length, t)}
                        {role === 'instructor' && group.user?.instructorClasses && (
                          <>
                            {' · '}
                            {formatCount('classes_count', group.user.instructorClasses.length, t)}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Date groups */}
                  {dateGroups.map(([dateKey, entries]) => (
                    <div key={dateKey} style={{ marginBottom: 6 }}>
                      {/* Date header */}
                      <div
                        style={{
                          fontSize: 'var(--font-size-xs)',
                          fontWeight: 700,
                          color: 'var(--muted)',
                          padding: '4px 0 2px 40px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        {formatDateLabel(dateKey, lang, t)}
                      </div>

                      {/* Export entries */}
                      {entries.map((entry) => {
                        const typeColor = EXPORT_TYPE_COLORS[entry.exportType] || '#6b7280';
                        const formatColor = FORMAT_COLORS[entry.format] || '#6b7280';
                        const typeLabel = t(`export_type_${entry.exportType}`) || entry.exportType;

                        return (
                          <div
                            key={entry.id}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 8,
                              padding: '6px 0 6px 40px',
                              borderBottom: '1px solid var(--border)',
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize: '0.85rem',
                                  fontWeight: 500,
                                  color: 'var(--text)',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                                title={entry.filename}
                              >
                                {entry.filename}
                              </div>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  marginTop: 3,
                                  flexWrap: 'wrap',
                                }}
                              >
                                {/* Export type badge */}
                                <span
                                  style={{
                                    fontSize: 'var(--font-size-xs)',
                                    padding: '1px 6px',
                                    borderRadius: '8px',
                                    background: `${typeColor}15`,
                                    color: typeColor,
                                    fontWeight: 600,
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {typeLabel}
                                </span>
                                {/* Format badge */}
                                <span
                                  style={{
                                    fontSize: 'var(--font-size-xs)',
                                    padding: '1px 6px',
                                    borderRadius: '8px',
                                    background: `${formatColor}15`,
                                    color: formatColor,
                                    fontWeight: 600,
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {entry.format?.toUpperCase()}
                                </span>
                                {/* Timestamp */}
                                <span
                                  style={{
                                    fontSize: 'var(--font-size-xs)',
                                    color: 'var(--muted)',
                                  }}
                                >
                                  {formatTime(entry.createdAt, lang)}
                                </span>
                                {/* Report date if available */}
                                {entry.reportDate && (
                                  <span
                                    style={{
                                      fontSize: 'var(--font-size-xs)',
                                      color: 'var(--muted)',
                                    }}
                                  >
                                    | {entry.reportDate}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              );
            })
          )}
        </div>

        {/* Footer count */}
        {!loading && history.length > 0 && (
          <div
            style={{
              padding: '8px 0',
              borderTop: '1px solid var(--border)',
              textAlign: 'center',
              fontSize: 'var(--font-size-xs)',
              color: 'var(--muted)',
            }}
          >
            {formatCount('exports_total', history.length, t)}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExportHistoryDrawer;
