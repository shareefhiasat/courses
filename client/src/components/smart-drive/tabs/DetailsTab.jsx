import React, { useState, useEffect } from 'react';
import { useLang } from '@contexts/LangContext';
import { getThemedIcon, getUserRoleIcon, getUserRoleColor } from '@constants/iconTypes';
import { WORKFLOW_STATUS_CONFIG } from '@constants/driveConstants';
import { formatMimeType } from '@utils/fileUtils';
import { formatQatarDate } from '@utils/timezone';
import { getLocalizedUserName } from '@utils/localizedUserName';
import { getUserRoleFromObject } from '@utils/userUtils';
import { getAvatarColor, getAvatarInitials } from '@utils/avatarUtils';
import { getWorkflowDisplayLabel } from '@constants/workflowConfig';
import { getWorkflowRole } from '@utils/userUtils';
import { apiClient } from '@services/api/apiService.js';
import { useProgramSubjectMaps, getWorkflowContextParts } from '@hooks/useProgramSubjectMaps';

export default function DetailsTab({ file }) {
  const { t, lang } = useLang();
  const { programMap, subjectMap } = useProgramSubjectMaps();
  const [workflowCounts, setWorkflowCounts] = useState(null);
  const [workflows, setWorkflows] = useState(null);
  const [shareCounts, setShareCounts] = useState(null);
  const [commentCount, setCommentCount] = useState(null);
  const [activityCount, setActivityCount] = useState(null);
  const [versionCount, setVersionCount] = useState(null);

  useEffect(() => {
    const fetchAdditionalDetails = async () => {
      // Fetch workflow documents for this file
      try {
        const workflowRes = await apiClient.get(`/workflow-documents?fileId=${file.id}`);
        if (workflowRes.data.success) {
          const workflows = workflowRes.data.data || [];
          const counts = {
            total: workflows.length,
            byType: workflows.reduce((acc, w) => {
              acc[w.workflowType] = (acc[w.workflowType] || 0) + 1;
              return acc;
            }, {}),
            byStatus: workflows.reduce((acc, w) => {
              const status = w.status || 'UNKNOWN';
              acc[status] = (acc[status] || 0) + 1;
              return acc;
            }, {}),
          };
          setWorkflowCounts(counts);
          setWorkflows(workflows);
        }
      } catch (err) {
        console.error('[DetailsTab] Error fetching workflows:', err);
      }

      // Fetch shares for this file
      try {
        const shareRes = await apiClient.get(`/drive/files/${file.id}/shares`);
        if (shareRes.data.success) {
          const shares = shareRes.data.data || shareRes.data.payload || [];
          const counts = {
            total: shares.length,
            people: shares.filter(s => s.subjectType === 'USER').length,
            roles: shares.filter(s => s.subjectType === 'ROLE').length
          };
          setShareCounts(counts);
        }
      } catch (err) {
        console.error('[DetailsTab] Error fetching shares:', err);
      }

      // Fetch comments for this file
      try {
        const commentRes = await apiClient.get(`/drive/files/${file.id}/comments`);
        if (commentRes.data.success) {
          setCommentCount((commentRes.data.payload || []).length);
        }
      } catch (err) {
        console.error('[DetailsTab] Error fetching comments:', err);
      }

      // Fetch activity for this file
      try {
        const activityRes = await apiClient.get(`/drive/files/${file.id}/activities`);
        if (activityRes.data.success) {
          setActivityCount((activityRes.data.payload || []).length);
        }
      } catch (err) {
        console.error('[DetailsTab] Error fetching activity:', err);
        setActivityCount(0);
      }

      // Fetch versions for this file
      try {
        const versionRes = await apiClient.get(`/drive/files/${file.id}/versions`);
        if (versionRes.data.success) {
          setVersionCount((versionRes.data.payload || []).length);
        }
      } catch (err) {
        console.error('[DetailsTab] Error fetching versions:', err);
        setVersionCount(0);
      }
    };

    if (file?.id) {
      fetchAdditionalDetails();
    }
  }, [file?.id]);

  const formatSize = (bytes) => {
    if (!bytes && bytes !== 0) return '\u2014';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
  };

  const formatDate = (date) => {
    if (!date) return '\u2014';
    return formatQatarDate(date, 'dd/MM/yyyy HH:mm');
  };


  const details = [
    {
      icon: 'file',
      label: t('drive.fileName'),
      value: file.name,
    },
    {
      icon: 'hard_drive',
      label: t('drive.fileSize'),
      value: formatSize(file.size),
    },
    {
      icon: 'file',
      label: t('drive.fileType'),
      value: formatMimeType(file.mimeType),
    },
    {
      icon: 'user',
      label: t('drive.owner'),
      value: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {(() => {
            const ownerName = getLocalizedUserName(file.owner, lang, '\u2014');
            const role = getUserRoleFromObject(file.owner);
            const roleIcon = role ? getUserRoleIcon(role) : null;
            const roleColor = role ? getUserRoleColor(role) : null;
            return (
              <div style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
                <div style={{
                  width: '2rem',
                  height: '2rem',
                  borderRadius: '9999px',
                  background: file.owner?.profileImageUrl ? 'transparent' : getAvatarColor(ownerName).bg,
                  color: getAvatarColor(ownerName).color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  overflow: 'hidden',
                  flexShrink: 0,
                }}>
                  {file.owner?.profileImageUrl ? (
                    <img
                      src={file.owner.profileImageUrl}
                      alt={ownerName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    getAvatarInitials(ownerName)
                  )}
                </div>
                {roleIcon && (
                  <div style={{
                    position: 'absolute',
                    bottom: '-2px',
                    insetInlineEnd: '-2px',
                    width: '0.875rem',
                    height: '0.875rem',
                    borderRadius: '9999px',
                    background: 'var(--panel, white)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1.5px solid var(--panel, white)',
                    boxShadow: '0 0 0 1px var(--border, #e5e7eb)',
                  }}
                  >
                    {React.cloneElement(roleIcon, { color: roleColor, size: 8 })}
                  </div>
                )}
              </div>
            );
          })()}
          <span>{getLocalizedUserName(file.owner, lang, '\u2014')}</span>
        </span>
      ),
    },
    {
      icon: 'folder',
      label: t('drive.location'),
      value: file.folderPath || t('drive.myDrive'),
    },
    {
      icon: 'calendar',
      label: t('drive.created'),
      value: formatDate(file.createdAt),
    },
    {
      icon: 'calendar',
      label: t('drive.modified'),
      value: formatDate(file.updatedAt),
    },
    {
      icon: 'workflow',
      label: t('drive.workflows'),
      value: workflowCounts ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
          {Object.entries(workflowCounts.byStatus || {}).map(([status, count]) => {
            const config = WORKFLOW_STATUS_CONFIG[status?.toLowerCase()];
            const color = config?.color || '#6b7280';
            const bgColor = config?.bg || 'rgba(107, 114, 128, 0.1)';
            const borderColor = config?.borderColor || '#d1d5db';
            return (
              <span key={status} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: 'var(--font-size-xs)', background: bgColor, border: `1px solid ${borderColor}`, borderRadius: '0.375rem', padding: '0.125rem 0.375rem', color }}>
                {count} {t(`workflow.status.${status.toLowerCase()}`, status)}
              </span>
            );
          })}
          {workflowCounts.total === 0 && <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted, #6b7280)' }}>0</span>}
        </span>
      ) : '\u2014',
    },
    {
      icon: 'share',
      label: t('drive.shares'),
      value: shareCounts ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap' }}>
          {shareCounts.total} (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.125rem' }}>
            {getThemedIcon('ui', 'user', 12, '#eab308')} {t('drive.people')}: {shareCounts.people}
          </span>
          ,
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.125rem' }}>
            {getThemedIcon('ui', 'shield', 12, '#8b5cf6')} {t('drive.roles')}: {shareCounts.roles}
          </span>
          )
        </span>
      ) : '\u2014',
    },
    {
      icon: 'message',
      label: t('drive.comments'),
      value: commentCount !== null ? commentCount : '\u2014',
    },
    {
      icon: 'activity',
      label: t('drive.activity'),
      value: activityCount !== null ? activityCount : '\u2014',
    },
    {
      icon: 'clock',
      label: t('drive.versions'),
      value: versionCount !== null ? versionCount : '\u2014',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
        {details.map(({ icon, label, value }, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              padding: '0.5rem 0.625rem',
              background: 'var(--panel, white)',
              borderRadius: '0.5rem',
              border: '1px solid var(--border, #e5e7eb)',
            }}
          >
            <div
              style={{
                flexShrink: 0,
                width: '1.75rem',
                height: '1.75rem',
                borderRadius: '0.375rem',
                background: 'var(--color-primary-alpha, rgba(37, 99, 235, 0.1))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {getThemedIcon('ui', icon, 16, 'primary')}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted, #6b7280)', margin: 0, marginBottom: '0.125rem' }}>
                {label}
              </p>
              <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--text, #111827)', margin: 0, wordBreak: 'break-all' }}>
                {value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {file.checksumSha256 && (
        <div
          style={{
            padding: '0.5rem 0.625rem',
            background: 'var(--panel, white)',
            borderRadius: '0.5rem',
            border: '1px solid var(--border, #e5e7eb)',
          }}
        >
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text, #111827)', margin: 0, marginBottom: '0.25rem' }}>
            {t('drive.checksum')} ({t('drive.checksumSha256')})
          </p>
          <p style={{ fontSize: 'var(--font-size-xs)', fontFamily: 'ui-monospace, monospace', color: 'var(--text, #111827)', margin: 0, wordBreak: 'break-all' }}>
            {file.checksumSha256}
          </p>
        </div>
      )}

      {/* Workflow details list */}
      {workflows && workflows.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text, #111827)', margin: 0 }}>
            {t('drive.workflows')}
          </p>
          {workflows.map((wf) => {
            const config = WORKFLOW_STATUS_CONFIG[wf.status?.toLowerCase()];
            const statusColor = config?.color || '#6b7280';
            const statusBg = config?.bg || 'rgba(107, 114, 128, 0.1)';
            const role = getWorkflowRole(wf);
            const contextParts = getWorkflowContextParts(wf, { programMap, subjectMap, lang });
            let dateStr = null;
            if (wf.date) dateStr = formatQatarDate(wf.date, 'dd/MM/yyyy');
            else if (wf.dateFrom && wf.dateTo) dateStr = `${formatQatarDate(wf.dateFrom, 'dd/MM/yyyy')} - ${formatQatarDate(wf.dateTo, 'dd/MM/yyyy')}`;
            else if (wf.dateFrom) dateStr = formatQatarDate(wf.dateFrom, 'dd/MM/yyyy');

            return (
              <div
                key={wf.id}
                role="button"
                tabIndex={0}
                onClick={() => window.open(`/workflow/inbox?documentId=${wf.id}`, '_blank', 'noopener,noreferrer')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    window.open(`/workflow/inbox?documentId=${wf.id}`, '_blank', 'noopener,noreferrer');
                  }
                }}
                style={{
                  padding: '0.5rem 0.625rem',
                  background: 'var(--panel, white)',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border, #e5e7eb)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text, #111827)' }}>
                    {wf.title || getWorkflowDisplayLabel(wf, t)}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: 'var(--font-size-xs)', background: statusBg, borderRadius: '0.375rem', padding: '0.125rem 0.375rem', color: statusColor, fontWeight: 600 }}>
                    {t(`workflow.status.${(wf.status || '').toLowerCase()}`, wf.status)}
                  </span>
                  {wf.workflowCategory && (
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted, #6b7280)', textTransform: 'uppercase', fontWeight: 600 }}>
                      {t(`workflow.category.${wf.workflowCategory}`, wf.workflowCategory)}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted, #6b7280)', flexWrap: 'wrap' }}>
                  {contextParts.length > 0 && (
                    <span>{contextParts.join(' · ')}</span>
                  )}
                  {dateStr && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      {getThemedIcon('ui', 'calendar', 12, 'var(--text-muted, #6b7280)')}
                      {dateStr}
                    </span>
                  )}
                  {/* Assigned to */}
                  {wf.currentAssignee ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      {getThemedIcon('ui', 'user_check', 12, 'var(--text-muted, #6b7280)')}
                      {getLocalizedUserName(wf.currentAssignee, lang, '\u2014')}
                    </span>
                  ) : role ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      {getThemedIcon('ui', 'users', 12, 'var(--text-muted, #6b7280)')}
                      <span style={{ color: 'var(--text-muted, #6b7280)', fontWeight: 500 }}>
                        {t(`roles.${role}`, role)}
                      </span>
                    </span>
                  ) : null}
                  {/* Target student */}
                  {wf.targetStudent && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      {(() => { const icon = getUserRoleIcon('student'); const color = getUserRoleColor('student'); return icon ? React.cloneElement(icon, { color, size: 12 }) : null; })()}
                      <span style={{ color: getUserRoleColor('student'), fontWeight: 500 }}>
                        {getLocalizedUserName(wf.targetStudent, lang, '-')}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
