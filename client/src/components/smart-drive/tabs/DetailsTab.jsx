import { useLang } from '@contexts/LangContext';
import { getThemedIcon } from '@constants/iconTypes';
import { getSmartDriveWorkflowStatusStyle } from '@constants/workflowStatusTypes';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function DetailsTab({ file }) {
  const { t } = useLang();
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
        const workflowRes = await axios.get(`/api/v1/workflow-documents?fileId=${file.id}`);
        if (workflowRes.data.success) {
          const workflows = workflowRes.data.data || [];
          const counts = {
            total: workflows.length,
            byType: workflows.reduce((acc, w) => {
              acc[w.workflowType] = (acc[w.workflowType] || 0) + 1;
              return acc;
            }, {})
          };
          setWorkflowCounts(counts);
          setWorkflows(workflows);
        }
      } catch (err) {
        console.error('[DetailsTab] Error fetching workflows:', err);
      }

      // Fetch shares for this file
      try {
        const shareRes = await axios.get(`/api/v1/drive/files/${file.id}/shares`);
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
        const commentRes = await axios.get(`/api/v1/drive/files/${file.id}/comments`);
        if (commentRes.data.success) {
          setCommentCount((commentRes.data.payload || []).length);
        }
      } catch (err) {
        console.error('[DetailsTab] Error fetching comments:', err);
      }

      // Fetch activity for this file
      try {
        const activityRes = await axios.get(`/api/v1/drive/files/${file.id}/activities`);
        if (activityRes.data.success) {
          setActivityCount((activityRes.data.payload || []).length);
        }
      } catch (err) {
        console.error('[DetailsTab] Error fetching activity:', err);
        setActivityCount(0);
      }

      // Fetch versions for this file
      try {
        const versionRes = await axios.get(`/api/v1/drive/files/${file.id}/versions`);
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
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return '\u2014';
    return d.toLocaleString();
  };

  const formatMimeType = (mimeType) => {
    if (!mimeType) return '\u2014';
    
    const mimeMap = {
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
      'application/pdf': 'PDF',
      'image/jpeg': 'JPEG',
      'image/png': 'PNG',
      'image/gif': 'GIF',
      'image/webp': 'WebP',
      'image/svg+xml': 'SVG',
      'video/mp4': 'MP4',
      'video/webm': 'WebM',
      'video/quicktime': 'MOV',
      'audio/mpeg': 'MP3',
      'audio/wav': 'WAV',
      'text/plain': 'Text',
      'text/html': 'HTML',
      'text/css': 'CSS',
      'text/javascript': 'JavaScript',
      'application/zip': 'ZIP',
      'application/json': 'JSON',
      'application/xml': 'XML',
    };
    
    return mimeMap[mimeType] || mimeType;
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
      label: t('drive.mimeType'),
      value: formatMimeType(file.mimeType),
    },
    {
      icon: 'user',
      label: t('drive.owner'),
      value: file.owner?.displayName || file.owner?.email || '\u2014',
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
        <span style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span>{workflowCounts.total} total</span>
          {workflows && workflows.slice(0, 3).map((w, idx) => {
            const statusStyle = getSmartDriveWorkflowStatusStyle(w.status);
            return (
              <span key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: statusStyle.color,
                  border: `1px solid ${statusStyle.borderColor}`
                }} />
                {w.workflowType}: {w.status}
              </span>
            );
          })}
          {workflowCounts.total > 3 && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #6b7280)' }}>+{workflowCounts.total - 3} more</span>}
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
        {details.map(({ icon, label, value }, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1rem',
              background: 'var(--panel, white)',
              borderRadius: '0.75rem',
              border: '1px solid var(--border, #e5e7eb)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
          >
            <div
              style={{
                flexShrink: 0,
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '0.5rem',
                background: 'var(--color-primary-alpha, rgba(37, 99, 235, 0.1))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {getThemedIcon('ui', icon, 20, 'primary')}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text, #111827)', margin: 0, marginBottom: '0.125rem' }}>
                {label}
              </p>
              <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text, #111827)', margin: 0, wordBreak: 'break-all' }}>
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {file.checksumSha256 && (
        <div
          style={{
            padding: '1rem',
            background: 'var(--panel, white)',
            borderRadius: '0.75rem',
            border: '1px solid var(--border, #e5e7eb)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            marginTop: '0.75rem',
          }}
        >
          <p style={{ fontSize: '0.875rem', color: 'var(--text, #111827)', margin: 0, marginBottom: '0.25rem' }}>
            {t('drive.checksum')} ({t('drive.checksumSha256') || 'SHA-256'})
          </p>
          <p style={{ fontSize: '0.75rem', fontFamily: 'ui-monospace, monospace', color: 'var(--text, #111827)', margin: 0, wordBreak: 'break-all' }}>
            {file.checksumSha256}
          </p>
        </div>
      )}
    </div>
  );
}
