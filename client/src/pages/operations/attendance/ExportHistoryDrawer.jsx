import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { getExportHistory, openExportFile } from '@services/db/exportHistoryService.js';
import { resolveUserRole, getUserRoleFromObject } from '@utils/userUtils';
import { getUserRoleColor, getUserRoleIcon } from '@constants/iconTypes';
import RoleBadge from '@pages/communications/chat/components/RoleBadge.jsx';
import { FileText, Table, FileType2 } from 'lucide-react';

const EXPORT_TYPE_COLORS = {
  attendance_daily: '#3b82f6',
  attendance_daily_official: '#8b5cf6',
  official_attendance: '#f59e0b',
  behavioral: '#ef4444',
  penalty: '#b45309',
  summary: '#14b8a6',
};

const FORMAT_COLORS = {
  pdf: '#dc2626',
  excel: '#16a34a',
  csv: '#6b7280',
};

const FORMAT_ICONS = {
  pdf: FileText,
  excel: Table,
  csv: Table,
};

const EXPORT_TYPE_GROUPS = {
  official: ['attendance_daily_official', 'official_attendance'],
  standard: ['attendance_daily', 'summary'],
};

const STANDALONE_TYPES = ['behavioral', 'penalty'];

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

function groupEntriesByDate(entries) {
  const byDate = new Map();
  entries.forEach((entry) => {
    const dateKey = new Date(entry.createdAt).toDateString();
    if (!byDate.has(dateKey)) byDate.set(dateKey, []);
    byDate.get(dateKey).push(entry);
  });
  return Array.from(byDate.entries()).sort(
    ([a], [b]) => new Date(b) - new Date(a)
  );
}

function ExportEntryRow({
  entry,
  lang,
  t,
  isSuperAdmin,
  currentUserId,
  indent = 40,
}) {
  const [opening, setOpening] = useState(false);
  const hasFile = Boolean(entry.fileId);
  const typeColor = EXPORT_TYPE_COLORS[entry.exportType] || '#6b7280';
  const formatColor = FORMAT_COLORS[entry.format] || '#6b7280';
  const typeLabel = t(`export_type_${entry.exportType}`) || entry.exportType;
  const FormatIcon = FORMAT_ICONS[entry.format] || FileType2;

  const handleOpen = async (preferDownload = false) => {
    if (!hasFile) return;
    setOpening(true);
    try {
      await openExportFile(entry, {
        isSuperAdmin,
        currentUserId,
        preferDownload,
      });
    } catch (err) {
      console.error('Failed to open export file:', err);
      alert(err.message || t('export_file_unavailable') || 'File unavailable');
    } finally {
      setOpening(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        padding: `6px 0 6px ${indent}px`,
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: '0.85rem',
            fontWeight: 500,
            color: hasFile ? 'var(--color-primary, #2563eb)' : 'var(--text)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            cursor: hasFile ? 'pointer' : 'default',
            textDecoration: hasFile ? 'underline' : 'none',
          }}
          title={hasFile ? entry.filename : `${entry.filename} (${t('export_file_unavailable') || 'File unavailable'})`}
          onClick={() => hasFile && handleOpen(entry.format !== 'pdf')}
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
          <span
            style={{
              fontSize: 'var(--font-size-xs)',
              padding: '1px 6px',
              borderRadius: '8px',
              background: `${typeColor}15`,
              color: typeColor,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
            }}
          >
            {typeLabel}
          </span>
          <span
            style={{
              fontSize: 'var(--font-size-xs)',
              padding: '1px 6px',
              borderRadius: '8px',
              background: `${formatColor}15`,
              color: formatColor,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
            }}
          >
            <FormatIcon size={11} strokeWidth={2.2} />
            {entry.format?.toUpperCase()}
          </span>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--muted)' }}>
            {formatTime(entry.createdAt, lang)}
          </span>
          {entry.reportDate && (
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--muted)' }}>
              | {entry.reportDate}
            </span>
          )}
          {!hasFile && (
            <span
              style={{ fontSize: 'var(--font-size-xs)', color: 'var(--muted)', fontStyle: 'italic' }}
              title={t('export_file_unavailable') || 'File unavailable'}
            >
              {t('export_file_unavailable') || 'File unavailable'}
            </span>
          )}
        </div>
      </div>
      {hasFile && (
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <button
            type="button"
            disabled={opening}
            onClick={() => handleOpen(false)}
            title={t('export_view_file') || 'View file'}
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '4px 8px',
              fontSize: 'var(--font-size-xs)',
              cursor: opening ? 'wait' : 'pointer',
              color: 'var(--text)',
            }}
          >
            {t('export_view_file') || 'View'}
          </button>
          <button
            type="button"
            disabled={opening}
            onClick={() => handleOpen(true)}
            title={t('export_download_file') || 'Download file'}
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '4px 8px',
              fontSize: 'var(--font-size-xs)',
              cursor: opening ? 'wait' : 'pointer',
              color: 'var(--text)',
            }}
          >
            ↓
          </button>
        </div>
      )}
    </div>
  );
}

const ExportHistoryDrawer = ({ isOpen, onClose, lang, t, theme }) => {
  const { user, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const currentUserId = user?.dbId ?? user?.id;

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [formatFilter, setFormatFilter] = useState('all');
  const [expandedGroup, setExpandedGroup] = useState(null);

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
    if (!isSuperAdmin) {
      return [{
        user: null,
        userName: null,
        entries: [...history].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
        flat: true,
      }];
    }

    const byUser = new Map();
    history.forEach((record) => {
      const userId = record.user?.id || record.userId;
      const userName = record.user?.displayName || record.user?.email || `User ${userId}`;

      if (!byUser.has(userId)) {
        byUser.set(userId, {
          user: record.user,
          userName,
          entries: [],
          flat: false,
        });
      }

      byUser.get(userId).entries.push(record);
    });

    return Array.from(byUser.values()).sort((a, b) => {
      const aLast = a.entries[0]?.createdAt || '';
      const bLast = b.entries[0]?.createdAt || '';
      return new Date(bLast) - new Date(aLast);
    });
  }, [history, isSuperAdmin]);

  if (!isOpen) return null;

  const groupChips = [
    { key: 'official', label: t('export_group_official') || 'Official', color: '#8b5cf6', types: EXPORT_TYPE_GROUPS.official },
    { key: 'standard', label: t('export_group_standard') || 'Standard', color: '#3b82f6', types: EXPORT_TYPE_GROUPS.standard },
  ];

  const formatChips = [
    { key: 'all', label: t('all_formats') || 'All Formats', color: null, icon: null },
    ...FORMAT_KEYS.map((key) => ({
      key,
      label: key.toUpperCase(),
      color: FORMAT_COLORS[key],
      icon: FORMAT_ICONS[key],
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)' }}>
            {t('export_history') || 'Export History'}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {!isSuperAdmin && (
              <button
                type="button"
                onClick={() => navigate('/smart-drive?folder=Exported')}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: '4px 10px',
                  fontSize: 'var(--font-size-xs)',
                  cursor: 'pointer',
                  color: 'var(--color-primary, #2563eb)',
                }}
              >
                {t('open_exported_folder') || 'Open Exported'}
              </button>
            )}
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
        </div>

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

        {/* Type filter: group buttons + individual chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8, alignItems: 'center' }}>
          {/* All chip */}
          <button
            type="button"
            onClick={() => { setTypeFilter('all'); setExpandedGroup(null); }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '3px 10px',
              borderRadius: '12px',
              border: `1px solid ${typeFilter === 'all' ? '#6b7280' : 'var(--border)'}`,
              background: typeFilter === 'all' ? `#6b728015` : 'transparent',
              color: typeFilter === 'all' ? '#6b7280' : 'var(--text)',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
          >
            {t('all') || 'All'}
          </button>

          {/* Group buttons */}
          {groupChips.map((group) => {
            const isGroupActive = expandedGroup === group.key;
            const isGroupTypeActive = group.types.includes(typeFilter);
            return (
              <React.Fragment key={group.key}>
                <button
                  type="button"
                  onClick={() => {
                    if (isGroupActive) {
                      setExpandedGroup(null);
                      setTypeFilter('all');
                    } else {
                      setExpandedGroup(group.key);
                      setTypeFilter('all');
                    }
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '3px 10px',
                    borderRadius: '12px',
                    border: `1px solid ${isGroupActive || isGroupTypeActive ? group.color : 'var(--border)'}`,
                    background: isGroupActive || isGroupTypeActive ? `${group.color}15` : 'transparent',
                    color: isGroupActive || isGroupTypeActive ? group.color : 'var(--text)',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {group.label}
                  <span style={{ fontSize: '0.6rem', opacity: 0.7 }}>
                    {isGroupActive ? '▲' : '▼'}
                  </span>
                </button>
                {isGroupActive &&
                  group.types.map((typeKey) => {
                    const isActive = typeFilter === typeKey;
                    const chipColor = EXPORT_TYPE_COLORS[typeKey] || '#6b7280';
                    return (
                      <button
                        key={typeKey}
                        type="button"
                        onClick={() => setTypeFilter(typeKey)}
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
                          marginLeft: 4,
                        }}
                      >
                        {t(`export_type_${typeKey}`) || typeKey}
                      </button>
                    );
                  })}
              </React.Fragment>
            );
          })}

          {/* Standalone type chips */}
          {STANDALONE_TYPES.map((key) => {
            const isActive = typeFilter === key;
            const chipColor = EXPORT_TYPE_COLORS[key] || '#6b7280';
            return (
              <button
                key={key}
                type="button"
                onClick={() => { setTypeFilter(key); setExpandedGroup(null); }}
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
                {t(`export_type_${key}`) || key}
              </button>
            );
          })}
        </div>

        {/* Format filter chips with icons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {formatChips.map((chip) => {
            const isActive = formatFilter === chip.key;
            const chipColor = chip.color || '#6b7280';
            const Icon = chip.icon;
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
                {Icon && <Icon size={12} strokeWidth={2.2} />}
                {chip.label}
              </button>
            );
          })}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', maxHeight: 'calc(100vh - 280px)' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
              <p>{t('loading_dots') || 'Loading...'}</p>
            </div>
          ) : groupedData.length === 0 || groupedData.every((g) => g.entries.length === 0) ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
              <p>{t('no_export_history') || 'No export history found'}</p>
            </div>
          ) : (
            groupedData.map((group) => {
              const dateGroups = groupEntriesByDate(group.entries);
              const role = group.user ? resolveUserRole(group.user) : null;

              return (
                <div key={group.flat ? 'own-exports' : (group.user?.id || group.userName)} style={{ marginBottom: '1rem' }}>
                  {!group.flat && (
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
                        {(() => {
                          const badgeRole = getUserRoleFromObject(group.user);
                          if (!badgeRole) return null;
                          const roleIcon = getUserRoleIcon(badgeRole);
                          const roleColor = getUserRoleColor(badgeRole);
                          if (!roleIcon) return null;
                          return (
                            <div
                              style={{
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
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--muted)' }}>
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
                  )}

                  {dateGroups.map(([dateKey, entries]) => (
                    <div key={dateKey} style={{ marginBottom: 6 }}>
                      <div
                        style={{
                          fontSize: 'var(--font-size-xs)',
                          fontWeight: 700,
                          color: 'var(--muted)',
                          padding: `4px 0 2px ${group.flat ? 0 : 40}px`,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        {formatDateLabel(dateKey, lang, t)}
                      </div>
                      {entries.map((entry) => (
                        <ExportEntryRow
                          key={entry.id}
                          entry={entry}
                          lang={lang}
                          t={t}
                          isSuperAdmin={isSuperAdmin}
                          currentUserId={currentUserId}
                          indent={group.flat ? 0 : 40}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              );
            })
          )}
        </div>

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
