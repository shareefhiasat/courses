import React, { useState, useMemo } from 'react';
import { useLang } from '@contexts/LangContext';
import { formatDateTime, formatDate } from '@utils/date-formatter.js';
import { getLocalizedUserName } from '@utils/localizedUserName.js';
import { getUserRoleColor, getUserRoleIcon, getThemedIcon } from '@constants/iconTypes';
import ClassHistorySearchInput from '@components/workspace/ClassHistorySearchInput';
import ColoredTooltip from '@components/ui/mui/ColoredTooltip';
import { apiService } from '@services/api/apiService.js';
import { resolveUserRole } from '@utils/userUtils';
import { buildSmartDriveHighlightUrl } from '@utils/exportSuccessUrls';
import { FilePenLine, FileText, Download, ExternalLink, Filter, GitBranch, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { WORKFLOW_STATUS_COLORS } from '@constants/workspaceStatusColors';
import { DateGroupedList, DayFilterBanner } from './LectureLogDrawer';

const SUBTYPE_COLORS = {
  DAILY: '#3b82f6',
  WEEKLY_SUMMARY: '#8b5cf6',
  WARNING_FIRST: '#f59e0b',
  WARNING_FINAL: '#ef4444',
};

const SUBTYPE_LABELS = {
  DAILY: 'Daily',
  WEEKLY_SUMMARY: 'Weekly',
  WARNING_FIRST: 'First Warning',
  WARNING_FINAL: 'Final Warning',
};

const SUBTYPE_ICONS = {
  DAILY: FilePenLine,
  WEEKLY_SUMMARY: GitBranch,
  WARNING_FIRST: AlertTriangle,
  WARNING_FINAL: AlertTriangle,
};

const STATUS_ICONS = {
  APPROVED: CheckCircle,
  REJECTED: XCircle,
};

function getInitials(name) {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
}

function findStatusActor(doc, targetStatus) {
  const history = doc.statusHistory || [];
  for (const h of history) {
    const to = typeof h.toStatus === 'object' ? h.toStatus?.code || h.toStatus?.nameEn : h.toStatus;
    if (to === targetStatus && h.actor) {
      return h.actor;
    }
  }
  return null;
}

function resolveWorkflowActor(doc) {
  const status = doc.status;
  if (status === 'APPROVED') {
    return findStatusActor(doc, 'APPROVED') || doc.submitter || doc.instructor;
  }
  if (status === 'REJECTED') {
    return findStatusActor(doc, 'REJECTED') || doc.submitter || doc.instructor;
  }
  return doc.submitter || doc.instructor;
}

function resolveActorDisplayName(actor, lang) {
  if (!actor) return '';
  return getLocalizedUserName(actor, lang, actor.email || '');
}

function formatWorkflowTitle(doc, lang, t, classInfo = null) {
  const cls = doc.class || classInfo;
  const className = cls
    ? (lang === 'ar' && cls.nameAr ? cls.nameAr : cls.nameEn || cls.name || cls.code)
    : '';
  const dateStr = doc.date
    ? formatDate(new Date(doc.date), lang)
    : (doc.dateFrom ? `${formatDate(new Date(doc.dateFrom), lang)}${doc.dateTo ? ` — ${formatDate(new Date(doc.dateTo), lang)}` : ''}` : '');
  const subtype = doc.attendanceSubtype
    ? (t(`workflow_subtype_${doc.attendanceSubtype.toLowerCase()}`) || SUBTYPE_LABELS[doc.attendanceSubtype] || doc.workflowType?.replace(/_/g, ' '))
    : (doc.workflowType?.replace(/_/g, ' '));
  const studentName = doc.metadata?.studentNameAr || doc.metadata?.studentName;
  const titleParts = [subtype, className, studentName, dateStr].filter(Boolean);
  return titleParts.length ? titleParts.join(' — ') : (doc.title || '');
}

function getFileId(doc) {
  return doc.snapshotFileId || doc.fileId || doc.file?.id || null;
}

export function WorkflowEntryRow({ doc, lang, t, isDark, classInfo }) {
  const statusColor = WORKFLOW_STATUS_COLORS[doc.status] || '#6b7280';
  const subtype = doc.attendanceSubtype || 'DAILY';
  const subtypeColor = SUBTYPE_COLORS[subtype] || '#6b7280';
  const subtypeLabel = t(`workflow_subtype_${subtype?.toLowerCase()}`) || SUBTYPE_LABELS[subtype] || subtype;
  const SubtypeIcon = SUBTYPE_ICONS[subtype] || FileText;
  const fileId = getFileId(doc);
  const actor = resolveWorkflowActor(doc);
  const actorName = resolveActorDisplayName(actor, lang);

  const handleOpenFile = async (preferDownload = false) => {
    if (!fileId) return;
    try {
      const preview = await apiService.get(`/drive/files/${fileId}/preview`);
      if (!preview?.success || !preview?.payload?.url) {
        console.error('Preview failed:', preview);
        return;
      }
      const fileUrl = preview.payload.url;
      if (preferDownload) {
        const blobResult = await apiService.get(fileUrl.replace(/^\/api\/v1/, ''), { responseType: 'blob' });
        const blob = blobResult?.data || blobResult;
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = doc.title ? String(doc.title).split(' — ').join(' - ') : 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      } else {
        window.open(fileUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      console.error('Failed to open file:', err);
    }
  };

  const handleOpenInDrive = () => {
    if (!fileId) return;
    const url = buildSmartDriveHighlightUrl(fileId, {
      folder: 'Exported',
      filename: doc.title,
    });
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const latestComment = doc.comments?.[0]?.comment;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        padding: '8px 0',
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
        >
          {formatWorkflowTitle(doc, lang, t, classInfo)}
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
              fontSize: '0.7rem',
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
            {doc.status ? (t(`workflow.status.${doc.status.toLowerCase()}`, doc.status)) : '—'}
          </span>
          <span
            style={{
              fontSize: '0.7rem',
              padding: '1px 6px',
              borderRadius: '8px',
              background: `${subtypeColor}15`,
              color: subtypeColor,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
            }}
          >
            <SubtypeIcon size={11} strokeWidth={2.2} />
            {subtypeLabel}
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
            {t('export_created_at') || 'Created'}: {formatDateTime(doc.createdAt, lang)}
          </span>
          {actor && (
            <span
              style={{
                fontSize: '0.7rem',
                color: 'var(--muted)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {actor.profileImageUrl ? (
                  <img
                    src={actor.profileImageUrl}
                    alt=""
                    style={{ width: 14, height: 14, borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      background: getUserRoleColor(resolveUserRole(actor)) || '#6b7280',
                      color: '#fff',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 8,
                      fontWeight: 700,
                    }}
                  >
                    {getInitials(actorName)}
                  </span>
                )}
                {(() => {
                  const userRole = resolveUserRole(actor);
                  if (!userRole) return null;
                  const roleIcon = getUserRoleIcon(userRole);
                  const roleColor = getUserRoleColor(userRole);
                  if (!roleIcon) return null;
                  return (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        background: `${roleColor}22`,
                        color: roleColor,
                      }}
                    >
                      {React.cloneElement(roleIcon, { size: 9, color: roleColor })}
                    </span>
                  );
                })()}
                {actorName}
              </span>
            </span>
          )}
          {latestComment && (
            <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
              {t('latest_comment')}: {(() => {
                const commentKey = `workflow_comment_${latestComment.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '_')}`;
                const missingToken = commentKey.replaceAll('_', ' ');
                const translated = t(commentKey);
                return translated === missingToken ? latestComment : translated;
              })()}
            </span>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        {fileId && (
          <>
            <ColoredTooltip title={t('export_view_file')} color="#64748b" placement="top">
              <button
                type="button"
                onClick={() => handleOpenFile(false)}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  width: 34,
                  height: 34,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--text)',
                }}
              >
                {getThemedIcon('ui', 'eye', 18, 'currentColor')}
              </button>
            </ColoredTooltip>
            <ColoredTooltip title={t('export_download_file')} color="#64748b" placement="top">
              <button
                type="button"
                onClick={() => handleOpenFile(true)}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  width: 34,
                  height: 34,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--text)',
                }}
              >
                <Download size={18} />
              </button>
            </ColoredTooltip>
            <ColoredTooltip title={t('open_in_smart_drive')} color="#64748b" placement="top">
              <button
                type="button"
                onClick={handleOpenInDrive}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  width: 34,
                  height: 34,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--color-primary, #2563eb)',
                }}
              >
                <ExternalLink size={18} />
              </button>
            </ColoredTooltip>
          </>
        )}
      </div>
    </div>
  );
}

function ClassWorkflowsPanel({
  workflows, loading, t, lang, isDark, classInfo, date,
  minimal = false, flat = false,
  searchTerm: searchTermProp,
  onSearchChange,
  subtypeFilter: subtypeFilterProp,
  onSubtypeFilterChange,
  statusFilter: statusFilterProp,
  onStatusFilterChange,
}) {
  const [localSearch, setLocalSearch] = useState('');
  const [localSubtype, setLocalSubtype] = useState('all');
  const [localStatus, setLocalStatus] = useState('all');
  const { isRTL } = useLang();

  const searchTerm = searchTermProp !== undefined ? searchTermProp : localSearch;
  const setSearchTerm = (v) => { setLocalSearch(v); onSearchChange?.(v); };
  const subtypeFilter = subtypeFilterProp !== undefined ? subtypeFilterProp : localSubtype;
  const setSubtypeFilter = (v) => { setLocalSubtype(v); onSubtypeFilterChange?.(v); };
  const statusFilter = statusFilterProp !== undefined ? statusFilterProp : localStatus;
  const setStatusFilter = (v) => { setLocalStatus(v); onStatusFilterChange?.(v); };

  const filtered = useMemo(() => {
    const term = (searchTerm || '').toLowerCase().trim();
    return (workflows || []).filter((doc) => {
      const subtype = doc.attendanceSubtype || 'DAILY';
      if (subtypeFilter !== 'all' && subtype !== subtypeFilter) return false;
      if (statusFilter !== 'all' && doc.status !== statusFilter) return false;
      if (term) {
        const haystack = formatWorkflowTitle(doc, lang, t, classInfo).toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [workflows, searchTerm, subtypeFilter, statusFilter, lang, t, classInfo]);

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: isDark ? '#94a3b8' : '#64748b' }}>
        {t('loading') || 'Loading...'}
      </div>
    );
  }

  return (
    <div style={{ padding: '12px', overflow: 'auto', height: '100%' }}>
      {!minimal && date && <DayFilterBanner date={date} lang={lang} t={t} isDark={isDark} />}
      {!minimal && (
        <ClassHistorySearchInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t('search') || 'Search...'}
        />
      )}
      {!minimal && (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8, alignItems: 'center' }}>
        {['DAILY', 'WEEKLY_SUMMARY'].map((key) => {
          const isActive = subtypeFilter === key;
          const color = SUBTYPE_COLORS[key] || '#6b7280';
          const label = t(`workflow_subtype_${key.toLowerCase()}`) || SUBTYPE_LABELS[key] || key;
          const Icon = SUBTYPE_ICONS[key] || null;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSubtypeFilter(subtypeFilter === key ? 'all' : key)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '3px 10px',
                borderRadius: '9999px',
                border: `1px solid ${color}`,
                background: isActive ? `${color}15` : 'transparent',
                color: isActive ? color : 'var(--text)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}
            >
              {Icon && <Icon size={12} color={color} />}
              {label}
            </button>
          );
        })}
        {['APPROVED', 'REJECTED'].map((key) => {
          const isActive = statusFilter === key;
          const color = WORKFLOW_STATUS_COLORS[key] || '#6b7280';
          const label = t(`workflow.status.${key.toLowerCase()}`) || key;
          const Icon = STATUS_ICONS[key] || null;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '3px 10px',
                borderRadius: '9999px',
                border: `1px solid ${color}`,
                background: isActive ? `${color}15` : 'transparent',
                color: isActive ? color : 'var(--text)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}
            >
              {Icon && <Icon size={12} color={color} />}
              {label}
            </button>
          );
        })}
      </div>
      )}

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px', color: isDark ? '#94a3b8' : '#64748b' }}>
          {getThemedIcon('ui', 'inbox', 40, isDark ? 'inverse' : 'primary')}
          <p style={{ marginTop: '12px', fontSize: '14px' }}>
            {t('class_history_no_workflows') || 'No workflow attempts for this class/day'}
          </p>
        </div>
      )}
      {flat ? (
        <div>
          {filtered.map((doc) => (
            <WorkflowEntryRow key={doc.id} doc={doc} lang={lang} t={t} isDark={isDark} classInfo={classInfo} />
          ))}
        </div>
      ) : (
        <DateGroupedList
          items={filtered}
          filterDefs={[
            { id: 'all', label: t('all') || 'All', color: '#6b7280', match: () => true },
            { id: 'DAILY', label: t('workflow_subtype_daily') || SUBTYPE_LABELS.DAILY, color: SUBTYPE_COLORS.DAILY, match: (doc) => (doc.attendanceSubtype || 'DAILY') === 'DAILY', icon: <FilePenLine size={10} /> },
            { id: 'WEEKLY_SUMMARY', label: t('workflow_subtype_weekly_summary') || SUBTYPE_LABELS.WEEKLY_SUMMARY, color: SUBTYPE_COLORS.WEEKLY_SUMMARY, match: (doc) => (doc.attendanceSubtype || 'DAILY') === 'WEEKLY_SUMMARY', icon: <GitBranch size={10} /> },
            { id: 'APPROVED', label: t('workflow.status.approved') || 'Approved', color: WORKFLOW_STATUS_COLORS.APPROVED, match: (doc) => doc.status === 'APPROVED', icon: <CheckCircle size={10} /> },
            { id: 'REJECTED', label: t('workflow.status.rejected') || 'Rejected', color: WORKFLOW_STATUS_COLORS.REJECTED, match: (doc) => doc.status === 'REJECTED', icon: <XCircle size={10} /> },
          ]}
          renderItem={(doc) => (
            <WorkflowEntryRow key={doc.id} doc={doc} lang={lang} t={t} isDark={isDark} classInfo={classInfo} />
          )}
          isDark={isDark}
          t={t}
        />
      )}
    </div>
  );
}

export default ClassWorkflowsPanel;
