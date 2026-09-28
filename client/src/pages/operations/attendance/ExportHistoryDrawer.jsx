import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { useLang } from '@contexts/LangContext';
import useResizableDrawer from '@hooks/useResizableDrawer';
import { formatDate, formatTime as fmtTime, formatDateTime } from '@utils/date-formatter.js';
import { getExportHistory, openExportFile, clearExportHistory } from '@services/db/exportHistoryService.js';
import { ROLE_STRINGS, getUserRoleFromObject, resolveUserRole } from '@utils/userUtils';
import { getUserRoleColor, getUserRoleIcon, getThemedIcon } from '@constants/iconTypes';
import ClassHistorySearchInput from '@components/workspace/ClassHistorySearchInput';
import { DateGroupedList, DayFilterBanner } from '@components/workspace/LectureLogDrawer';
import RoleBadge from '@pages/communications/chat/components/RoleBadge.jsx';
import ColoredTooltip from '@components/ui/mui/ColoredTooltip';
import { buildSmartDriveHighlightUrl } from '@utils/exportSuccessUrls';
import { getLocalizedUserName } from '@utils/localizedUserName';
import { format, parseISO, addDays } from 'date-fns';
import { FileText, Table, FileType2, Download, SlidersHorizontal, Trash2, CheckCircle, XCircle, FilePenLine, GitBranch } from 'lucide-react';
import { WORKFLOW_STATUS_COLORS } from '@constants/workspaceStatusColors';

const EXPORT_TYPE_COLORS = {
  attendance_daily: '#3b82f6',
  attendance_daily_official: '#3b82f6',
  official_attendance: '#8b5cf6',
  marks_semester_certificate: '#6366f1',
  marks_class_subject: '#0ea5e9',
  marks_qualitative_card: '#14b8a6',
  marks_warning_first: '#f59e0b',
  marks_warning_final: '#dc2626',
  behavioral: '#ef4444',
  penalty: '#b45309',
  summary: '#14b8a6',
};

const EXPORT_TYPE_ICONS = {
  attendance_daily: FilePenLine,
  attendance_daily_official: FilePenLine,
  official_attendance: GitBranch,
  summary: GitBranch,
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

const OFFICIAL_TYPE_LABELS = {
  attendance_daily_official: 'Daily',
  official_attendance: 'Weekly',
};

const BETA_TYPES = new Set([]);

const FORMAT_KEYS = ['pdf', 'excel'];

function getInitials(name) {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
}

function formatDisplayFilename(entry, classInfo, lang, t) {
  const reportDate = entry.reportDate || entry.metadata?.reportDate || entry.createdAt;
  let dateStr = null;
  if (reportDate) {
    try {
      dateStr = typeof reportDate === 'string'
        ? reportDate.slice(0, 10)
        : format(reportDate, 'yyyy-MM-dd');
    } catch {}
  }
  const formattedDate = dateStr ? (() => {
    try { return format(parseISO(dateStr), 'dd-MM-yyyy'); } catch { return dateStr; }
  })() : null;
  const className = classInfo
    ? (lang === 'ar' && classInfo.nameAr ? classInfo.nameAr : classInfo.nameEn || classInfo.code)
    : (entry.className || entry.class?.nameEn || entry.class?.code || '');
  const subjectName = classInfo?.subject
    ? (lang === 'ar' && classInfo.subject?.nameAr ? classInfo.subject.nameAr : classInfo.subject?.nameEn || '')
    : (lang === 'ar' && entry.class?.subject?.nameAr ? entry.class.subject.nameAr : entry.class?.subject?.nameEn || '');

  const displayParts = [className, subjectName, formattedDate].filter(Boolean);
  return displayParts.length ? displayParts.join(' — ') : entry.filename;
}

function formatTime(dateStr, lang) {
  return fmtTime(dateStr, lang);
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

export function ExportEntryRow({
  entry,
  lang,
  t,
  theme,
  isSuperAdmin,
  currentUserId,
  classInfo = null,
  indent = 40,
}) {
  const [opening, setOpening] = useState(false);
  const hasFile = Boolean(entry.fileId);
  const typeColor = EXPORT_TYPE_COLORS[entry.exportType] || '#6b7280';
  const formatColor = FORMAT_COLORS[entry.format] || '#6b7280';
  const typeLabel = OFFICIAL_TYPE_LABELS[entry.exportType]
    || t(`export_type_${entry.exportType}`)
    || entry.exportType.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
  const FormatIcon = FORMAT_ICONS[entry.format] || FileType2;
  const displayFilename = formatDisplayFilename(entry, classInfo, lang, t);

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
      alert(err.message || t('export_file_unavailable'));
    } finally {
      setOpening(false);
    }
  };

  const handleOpenInDrive = () => {
    if (!hasFile) return;
    const url = buildSmartDriveHighlightUrl(entry.fileId, {
      folder: 'Exported',
      filename: entry.filename,
    });
    window.open(url, '_blank', 'noopener,noreferrer');
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
          onClick={() => hasFile && handleOpen(entry.format !== 'pdf')}
        >
          {displayFilename}
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
          {(() => {
            const wfStatus = entry.metadata?.workflowStatus;
            if (!wfStatus) return null;
            const statusColor = WORKFLOW_STATUS_COLORS[wfStatus] || '#6b7280';
            return (
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  padding: '1px 6px',
                  borderRadius: '8px',
                  background: `${statusColor}15`,
                  color: statusColor,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                {t(`workflow.status.${wfStatus.toLowerCase()}`, wfStatus)}
              </span>
            );
          })()}
          <ColoredTooltip title={t('export_created_at_help') || 'When this export file was generated'} color="#64748b" placement="top">
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--muted)' }}>
              {t('export_created_at') || 'Created'}: {formatDateTime(entry.createdAt, lang)}
            </span>
          </ColoredTooltip>
          {entry.user && (
            <span
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--muted)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--muted)' }}>
                {t('from') || 'From'}:
              </span>
              <ColoredTooltip
                title={getLocalizedUserName(entry.user, lang, entry.user?.email)}
                color="#64748b"
                placement="top"
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {entry.user?.profileImageUrl ? (
                    <img
                      src={entry.user.profileImageUrl}
                      alt=""
                      style={{ width: 14, height: 14, borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        background: getUserRoleColor(resolveUserRole(entry.user)),
                        color: '#fff',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 8,
                        fontWeight: 700,
                      }}
                    >
                      {getInitials(getLocalizedUserName(entry.user, lang, entry.user?.email))}
                    </span>
                  )}
                  <RoleBadge user={entry.user} size={10} showLabel={false} />
                  {getLocalizedUserName(entry.user, lang, entry.user?.email)}
                </span>
              </ColoredTooltip>
            </span>
          )}
          {entry.reportDate && (
            <ColoredTooltip title={t('export_report_date_help') || 'The class/session date this export report covers'} color="#64748b" placement="top">
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--muted)' }}>
                {t('export_report_date') || 'Report date'}: {formatDate(entry.reportDate, lang)}
              </span>
            </ColoredTooltip>
          )}
          {!hasFile && (
            <span
              style={{ fontSize: 'var(--font-size-xs)', color: 'var(--muted)', fontStyle: 'italic' }}
            >
              {t('export_file_unavailable')}
            </span>
          )}
        </div>
      </div>
      {hasFile && (
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <ColoredTooltip title={t('export_view_file')} color="#64748b" placement="top">
            <button
                type="button"
                disabled={opening}
                onClick={() => handleOpen(false)}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  width: 34,
                  height: 34,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: opening ? 'wait' : 'pointer',
                  color: 'var(--text)',
                }}
              >
                {getThemedIcon('ui', 'eye', 18, 'currentColor')}
              </button>
          </ColoredTooltip>
          <ColoredTooltip title={t('export_download_file')} color="#64748b" placement="top">
            <button
                type="button"
                disabled={opening}
                onClick={() => handleOpen(true)}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  width: 34,
                  height: 34,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: opening ? 'wait' : 'pointer',
                  color: 'var(--text)',
                }}
              >
                <Download size={18} />
              </button>
          </ColoredTooltip>
          <ColoredTooltip title={t('open_in_smart_drive')} color="#2563eb" placement="top">
            <button
                type="button"
                onClick={handleOpenInDrive}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 34,
                  height: 34,
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  cursor: 'pointer',
                  color: 'var(--color-primary, #2563eb)',
                }}
              >
                {getThemedIcon('ui', 'external_link', 18, 'currentColor')}
              </button>
          </ColoredTooltip>
        </div>
      )}
    </div>
  );
}

const ExportHistoryDrawer = ({
  isOpen, onClose, lang, t, theme, classId = null, classInfo = null,
  embedded = false, scope = 'global', date = null,
  minimal = false,
  search: searchProp,
  onSearchChange,
  typeFilter: typeFilterProp,
  onTypeFilterChange,
  formatFilter: formatFilterProp,
  onFormatFilterChange,
  statusFilter: statusFilterProp,
  onStatusFilterChange,
  onVisibleCount,
}) => {
  const isDark = theme === 'dark';
  const { user, isSuperAdmin } = useAuth();
  const { isRTL } = useLang();
  const navigate = useNavigate();
  const currentUserId = user?.dbId ?? user?.id;
  const { width: drawerWidth, setWidth: setDrawerWidth, resizeHandleProps } = useResizableDrawer({
    storageKey: 'export-history-drawer-width',
    defaultWidth: 420,
    minWidth: 320,
    maxWidth: 800,
    isRTL,
  });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  const [localType, setLocalType] = useState('all');
  const [localFormat, setLocalFormat] = useState('all');
  const [localStatus, setLocalStatus] = useState('all');
  const [expandedGroup, setExpandedGroup] = useState(null);

  const search = searchProp !== undefined ? searchProp : localSearch;
  const setSearch = (v) => { setLocalSearch(v); onSearchChange?.(v); };
  const typeFilter = typeFilterProp !== undefined ? typeFilterProp : localType;
  const setTypeFilter = (v) => { setLocalType(v); onTypeFilterChange?.(v); };
  const formatFilter = formatFilterProp !== undefined ? formatFilterProp : localFormat;
  const setFormatFilter = (v) => { setLocalFormat(v); onFormatFilterChange?.(v); };
  const statusFilter = statusFilterProp !== undefined ? statusFilterProp : localStatus;
  const setStatusFilter = (v) => { setLocalStatus(v); onStatusFilterChange?.(v); };

  const targetDate = useMemo(() => {
    if (!date) return null;
    const d = date instanceof Date ? date : new Date(date);
    return Number.isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
  }, [date]);

  const filteredHistory = useMemo(() => {
    // 'other' is a client-only sentinel: everything that is not a known daily/weekly type.
    const base = typeFilter === 'other'
      ? history.filter((record) => record.exportType !== 'attendance_daily_official' && record.exportType !== 'official_attendance')
      : history;
    if (!targetDate) return base;
    return base.filter((record) => {
      if (statusFilter !== 'all') {
        const recordStatus = record.metadata?.workflowStatus;
        const isApproved = recordStatus === 'APPROVED' || (!recordStatus && (record.exportType === 'attendance_daily_official' || record.exportType === 'official_attendance'));
        const isRejected = recordStatus === 'REJECTED';
        if (statusFilter === 'APPROVED' && !isApproved) return false;
        if (statusFilter === 'REJECTED' && !isRejected) return false;
      }
      const reportDate = record.reportDate || record.metadata?.reportDate;
      if (!reportDate) return false;
      let parsed;
      if (typeof reportDate === 'string') {
        parsed = parseISO(reportDate);
        if (!(parsed instanceof Date) || isNaN(parsed.getTime())) {
          parsed = new Date(reportDate);
        }
      } else {
        parsed = new Date(reportDate);
      }
      if (!(parsed instanceof Date) || isNaN(parsed.getTime())) return false;
      const recordDate = format(parsed, 'yyyy-MM-dd');
      if (recordDate === targetDate) return true;
      // Weekly snapshots are indexed by the week start date; show them for any day inside that week.
      if (record.exportType === 'official_attendance') {
        try {
          const start = parseISO(recordDate);
          const end = addDays(start, 6);
          const target = parseISO(targetDate);
          return target >= start && target <= end;
        } catch {
          return false;
        }
      }
      return false;
    });
  }, [history, targetDate, statusFilter, typeFilter]);

  useEffect(() => {
    onVisibleCount?.(filteredHistory.length);
  }, [filteredHistory, onVisibleCount]);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 200 };
      // 'other' has no backend exportType — fetch all and filter client-side.
      if (typeFilter !== 'all' && typeFilter !== 'other') params.exportType = typeFilter;
      if (formatFilter !== 'all') params.format = formatFilter;
      if (search) params.search = search;
      if (classId) params.classId = classId;

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
  }, [typeFilter, formatFilter, search, classId]);

  const handleClearHistory = useCallback(async () => {
    if (!confirm(t('confirm_clear_export_history') || 'Are you sure you want to clear all export history?')) return;
    
    setClearing(true);
    try {
      const params = {};
      if (typeFilter !== 'all') params.exportType = typeFilter;
      if (formatFilter !== 'all') params.format = formatFilter;
      if (classId) params.classId = classId;

      const result = await clearExportHistory(params);
      if (result.success) {
        setHistory([]);
        alert(t('export_history_cleared') || 'Export history cleared successfully');
      } else {
        console.error('Failed to clear export history:', result.error);
        alert(result.error || t('failed_to_clear_export_history') || 'Failed to clear export history');
      }
    } catch (err) {
      console.error('Export history clear error:', err);
      alert(t('failed_to_clear_export_history') || 'Failed to clear export history');
    } finally {
      setClearing(false);
    }
  }, [typeFilter, formatFilter, classId, t]);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, fetchHistory]);

  const groupedData = useMemo(() => {
    const scopedHistory = filteredHistory.filter((record) => {
      if (statusFilter === 'all') return true;
      const recordStatus = record.metadata?.workflowStatus;
      return recordStatus === statusFilter;
    });

    if (!isSuperAdmin) {
      return [{
        user: null,
        userName: null,
        entries: [...scopedHistory].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
        flat: true,
      }];
    }

    const byUser = new Map();
    scopedHistory.forEach((record) => {
      const userId = record.user?.id || record.userId;
      const userName = getLocalizedUserName(record.user, lang, record.user?.email || `User ${userId}`);

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
  }, [filteredHistory, isSuperAdmin, statusFilter, lang]);

  if (!isOpen) return null;

  const visibleCount = filteredHistory.length;

  const isScoped = scope !== 'global';

  const groupChips = isScoped
    ? [{ key: 'official', label: t('export_group_official'), color: '#8b5cf6', types: EXPORT_TYPE_GROUPS.official }]
    : [
        { key: 'official', label: t('export_group_official'), color: '#8b5cf6', types: EXPORT_TYPE_GROUPS.official },
        { key: 'standard', label: t('export_group_standard'), color: '#3b82f6', types: EXPORT_TYPE_GROUPS.standard },
      ];

  const formatChips = [
    ...FORMAT_KEYS.map((key) => ({
      key,
      label: key.toUpperCase(),
      color: FORMAT_COLORS[key],
      icon: FORMAT_ICONS[key],
    })),
  ];

  const statusChips = [
    { key: 'APPROVED', label: t('workflow.status.approved') || 'Approved', color: WORKFLOW_STATUS_COLORS.APPROVED, Icon: CheckCircle },
    { key: 'REJECTED', label: t('workflow.status.rejected') || 'Rejected', color: WORKFLOW_STATUS_COLORS.REJECTED, Icon: XCircle },
  ];

  const getExportTypeLabel = (typeKey) => {
    if (OFFICIAL_TYPE_LABELS[typeKey]) return OFFICIAL_TYPE_LABELS[typeKey];
    const translated = t(`export_type_${typeKey}`);
    if (translated && !translated.startsWith('export type')) return translated;
    return typeKey.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const exportFilterDefs = [
    { id: 'all', label: t('all') || 'All', color: '#6b7280', match: () => true },
    ...EXPORT_TYPE_GROUPS.official.map((typeKey) => {
      const Icon = EXPORT_TYPE_ICONS[typeKey];
      return { id: typeKey, label: getExportTypeLabel(typeKey), color: EXPORT_TYPE_COLORS[typeKey], match: (item) => item.exportType === typeKey, icon: Icon ? <Icon size={10} /> : undefined };
    }),
    ...EXPORT_TYPE_GROUPS.standard.map((typeKey) => {
      const Icon = EXPORT_TYPE_ICONS[typeKey];
      return { id: typeKey, label: getExportTypeLabel(typeKey), color: EXPORT_TYPE_COLORS[typeKey], match: (item) => item.exportType === typeKey, icon: Icon ? <Icon size={10} /> : undefined };
    }),
    { id: 'APPROVED', label: t('workflow.status.approved') || 'Approved', color: WORKFLOW_STATUS_COLORS.APPROVED, match: (item) => item.metadata?.workflowStatus === 'APPROVED' || (!item.metadata?.workflowStatus && (item.exportType === 'attendance_daily_official' || item.exportType === 'official_attendance')), icon: <CheckCircle size={10} /> },
    { id: 'REJECTED', label: t('workflow.status.rejected') || 'Rejected', color: WORKFLOW_STATUS_COLORS.REJECTED, match: (item) => item.metadata?.workflowStatus === 'REJECTED', icon: <XCircle size={10} /> },
  ];

  const panel = (
    <div
      style={embedded ? { position: 'relative', height: '100%' } : { position: 'fixed', inset: 0, zIndex: 2000 }}
      onClick={embedded ? undefined : onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: embedded ? 'relative' : 'absolute',
          top: embedded ? undefined : 0,
          [isRTL ? 'left' : 'right']: embedded ? undefined : 0,
          height: embedded ? '100%' : '100%',
          width: embedded ? '100%' : drawerWidth,
          background: 'var(--panel)',
          boxShadow: embedded ? 'none' : (isRTL ? '4px 0 16px rgba(0,0,0,0.15)' : '-4px 0 16px rgba(0,0,0,0.15)'),
          padding: '1rem',
          pointerEvents: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {!embedded && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)' }}>
            {t('export_history')}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={handleClearHistory}
              disabled={clearing || history.length === 0}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '4px 10px',
                fontSize: 'var(--font-size-xs)',
                cursor: clearing || history.length === 0 ? 'not-allowed' : 'pointer',
                color: clearing || history.length === 0 ? 'var(--muted)' : '#ef4444',
                opacity: clearing || history.length === 0 ? 0.5 : 1,
              }}
            >
              <Trash2 size={14} />
              {t('clear_history') || 'Clear History'}
            </button>
            <button
              type="button"
              onClick={() => {
                const url = buildSmartDriveHighlightUrl(null, { folder: 'Exported' });
                window.open(url, '_blank', 'noopener,noreferrer');
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '4px 10px',
                fontSize: 'var(--font-size-xs)',
                cursor: 'pointer',
                color: 'var(--color-primary, #2563eb)',
              }}
            >
              {getThemedIcon('ui', 'external_link', 14, 'currentColor')}
              {t('open_exported_folder')}
            </button>
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
        )}

        {!minimal && ( <> {date && <DayFilterBanner date={date} lang={lang} t={t} isDark={isDark} />}
        <ClassHistorySearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('search') || 'Search...'}
        />

        {/* Type filter: group buttons row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12, alignItems: 'center' }}>
          <div style={{ display: 'contents' }}>

          {isScoped ? (
            EXPORT_TYPE_GROUPS.official.map((typeKey) => {
              const isActive = typeFilter === typeKey;
              const chipColor = EXPORT_TYPE_COLORS[typeKey] || '#6b7280';
              const Icon = EXPORT_TYPE_ICONS[typeKey];
              return (
                <button
                  key={typeKey}
                  type="button"
                  onClick={() => setTypeFilter(typeFilter === typeKey ? 'all' : typeKey)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    border: `1px solid ${chipColor}`,
                    background: isActive ? `${chipColor}15` : 'transparent',
                    color: isActive ? chipColor : 'var(--text)',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {Icon && <Icon size={14} color={chipColor} />}
                  {getExportTypeLabel(typeKey)}
                </button>
              );
            })
          ) : (
            <>
              {/* Group buttons */}
              {groupChips.map((group) => {
                const isGroupActive = expandedGroup === group.key;
                const isGroupTypeActive = group.types.includes(typeFilter);
                return (
                  <button
                    key={group.key}
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
                      padding: '4px 12px',
                      borderRadius: '12px',
                      border: `1px solid ${group.color}`,
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
                    <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                      {isGroupActive ? '▲' : '▼'}
                    </span>
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* Expanded sub-types on their own row */}
        {!isScoped && expandedGroup && (
          <div style={{ display: 'contents' }}>
            {groupChips.filter(g => g.key === expandedGroup).map(group =>
              group.types.map((typeKey) => {
                const isActive = typeFilter === typeKey;
                const chipColor = EXPORT_TYPE_COLORS[typeKey] || '#6b7280';
                const Icon = EXPORT_TYPE_ICONS[typeKey];
                return (
                  <button
                    key={typeKey}
                    type="button"
                    onClick={() => setTypeFilter(typeFilter === typeKey ? 'all' : typeKey)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      border: `1px solid ${chipColor}`,
                      background: isActive ? `${chipColor}15` : 'transparent',
                      color: isActive ? chipColor : 'var(--text)',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {Icon && <Icon size={14} color={chipColor} />}
                    {getExportTypeLabel(typeKey)}
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* Workflow status filter chips */}
        <div style={{ display: 'contents' }}>
          {statusChips.map((chip) => {
            const isActive = statusFilter === chip.key;
            const color = chip.color;
            const Icon = chip.Icon;
            return (
              <button
                key={chip.key}
                type="button"
                onClick={() => setStatusFilter(statusFilter === chip.key ? 'all' : chip.key)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  border: `1px solid ${color}`,
                  background: isActive ? `${color}15` : 'transparent',
                  color,
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                }}
              >
                {Icon && <Icon size={14} color={color} />}
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* Format filter chips with icons */}
        <div style={{ display: 'contents' }}>
          {formatChips.map((chip) => {
            const isActive = formatFilter === chip.key;
            const chipColor = chip.color || '#6b7280';
            const Icon = chip.icon;
            return (
              <button
                key={chip.key}
                type="button"
                onClick={() => setFormatFilter(formatFilter === chip.key ? 'all' : chip.key)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  border: `1px solid ${chipColor}`,
                  background: isActive ? `${chipColor}15` : 'transparent',
                  color: isActive ? chipColor : 'var(--text)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                }}
              >
                {Icon && <Icon size={14} strokeWidth={2.2} />}
                {chip.label}
              </button>
            );
          })}
        </div>
        </div>
        </>)}

        <div style={{ flex: 1, overflowY: 'auto', maxHeight: 'calc(100vh - 280px)' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
              <p>{t('loading_dots')}</p>
            </div>
          ) : groupedData.length === 0 || groupedData.every((g) => g.entries.length === 0) ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
              <p>{t('no_export_history')}</p>
            </div>
          ) : (
            groupedData.map((group) => {
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
                          {role === ROLE_STRINGS.INSTRUCTOR && group.user?.instructorClasses && (
                            <>
                              {' · '}
                              {formatCount('classes_count', group.user.instructorClasses.length, t)}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <DateGroupedList
                    items={group.entries}
                    filterDefs={exportFilterDefs}
                    renderItem={(entry) => (
                      <ExportEntryRow
                        key={entry.id}
                        entry={entry}
                        lang={lang}
                        t={t}
                        theme={theme}
                        isSuperAdmin={isSuperAdmin}
                        currentUserId={currentUserId}
                        classInfo={classInfo}
                        indent={group.flat ? 0 : 40}
                      />
                    )}
                    isDark={isDark}
                    t={t}
                  />
                </div>
              );
            })
          )}
        </div>

        {!loading && visibleCount > 0 && (
          <div
            style={{
              padding: '8px 0',
              borderTop: '1px solid var(--border)',
              textAlign: 'center',
              fontSize: 'var(--font-size-xs)',
              color: 'var(--muted)',
            }}
          >
            {formatCount('exports_total', visibleCount, t)}
          </div>
        )}
        {!embedded && <div {...resizeHandleProps} />}
      </div>
    </div>
  );

  if (embedded) return panel;
  return createPortal(panel, document.body);
};

export default ExportHistoryDrawer;
