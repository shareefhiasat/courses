import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ExternalLink } from 'lucide-react';
import { SimpleLoading } from '@ui';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import useResizableDrawer from '@hooks/useResizableDrawer';
import { formatDate } from '@utils/date-formatter.js';
import { getWorkflowDisplayLabel } from '@constants/workflowConfig';
import useDrawerTheme from '@hooks/useDrawerTheme.js';
import useDrawerStyles from '@hooks/useDrawerStyles.js';
import { getWorkflowDocumentsByContext } from '@services/api/workflow-documents-api';
import { WORKFLOW_STATUS_CONFIG } from '@constants/driveConstants';

const DayWorkflowsDrawer = memo(({
  isOpen,
  onClose,
  student = null,
  classId = null,
  date = null,
  programId = '',
}) => {
  const { t, lang, isRTL } = useLang();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const { width: drawerWidth, resizeHandleProps } = useResizableDrawer({
    storageKey: 'day_workflows_drawer_width',
    defaultWidth: 420,
    minWidth: 320,
    maxWidth: 720,
    isRTL,
  });

  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const userId = student?.studentId || student?.userId || student?.id;

  const loadWorkflows = useCallback(async () => {
    if (!userId || !classId || !date) {
      setWorkflows([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await getWorkflowDocumentsByContext({
        userId,
        classId,
        date: typeof date === 'string' ? date : new Date(date).toISOString(),
      });
      if (result.success) {
        setWorkflows(result.data || []);
      } else {
        setError(result.error || t('workflow.dayDrawer.loadError', 'Failed to load workflows'));
        setWorkflows([]);
      }
    } catch (err) {
      console.error('[DayWorkflowsDrawer] load failed', err);
      setError(t('workflow.dayDrawer.loadError', 'Failed to load workflows'));
      setWorkflows([]);
    } finally {
      setLoading(false);
    }
  }, [userId, classId, date, t]);

  useEffect(() => {
    if (isOpen) loadWorkflows();
  }, [isOpen, loadWorkflows]);

  const { bgColor, borderColor, textColor, mutedColor, cardBg } = useDrawerTheme();

  const dateLabel = useMemo(() => {
    if (!date) return '—';
    return formatDate(date, lang);
  }, [date, lang]);

  const { drawerStyle, backdropStyle } = useDrawerStyles({
    isOpen, drawerWidth, isRTL, bgColor,
    extraDrawerStyle: { zIndex: 1001 },
    extraBackdropStyle: { zIndex: 1000 },
  });

  const openInbox = useCallback((workflowId) => {
    window.open(`/workflow/inbox?documentId=${workflowId}`, '_blank', 'noopener,noreferrer');
  }, []);

  if (!isOpen) return null;

  return createPortal(
    <>
      <div style={backdropStyle} onClick={onClose} role="button" tabIndex={0} aria-label="Close drawer" />
      <div style={drawerStyle} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div style={{
          padding: '1rem',
          borderBottom: `1px solid ${borderColor}`,
          position: 'sticky',
          top: 0,
          background: bgColor,
          zIndex: 10,
        }}>
          <h3 style={{ margin: 0, color: textColor, fontSize: '1.05rem', fontWeight: 700 }}>
            {t('workflow.dayDrawer.title', 'Workflows for day')}
          </h3>
          <div style={{ fontSize: '0.8rem', color: mutedColor, marginTop: '0.35rem' }}>
            {student?.studentName || student?.displayName || student?.name || '—'} · {dateLabel}
          </div>
        </div>

        <div style={{ padding: '1rem' }}>
          {loading ? (
            <SimpleLoading message={t('loading')} />
          ) : error ? (
            <div style={{ color: '#ef4444', fontSize: '0.85rem' }}>{error}</div>
          ) : workflows.length === 0 ? (
            <div style={{ textAlign: 'center', color: mutedColor, padding: '2rem 0', fontSize: '0.85rem' }}>
              {t('workflow.dayDrawer.empty', 'No workflows linked to this day.')}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {workflows.map((wf) => {
                const statusCfg = WORKFLOW_STATUS_CONFIG[wf.status?.toLowerCase()] || {};
                return (
                  <div
                    key={wf.id}
                    style={{
                      padding: '0.625rem 0.75rem',
                      border: `1px solid ${borderColor}`,
                      borderRadius: '8px',
                      background: cardBg,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: textColor }}>
                          {wf.title || `#${wf.id}`}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: mutedColor, marginTop: '0.15rem' }}>
                          {getWorkflowDisplayLabel(wf, t)}
                        </div>
                      </div>
                      <span style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '0.15rem 0.4rem',
                        borderRadius: '9999px',
                        color: statusCfg.color || mutedColor,
                        background: statusCfg.bg || 'transparent',
                        border: `1px solid ${statusCfg.borderColor || borderColor}`,
                        whiteSpace: 'nowrap',
                      }}>
                        {t(`workflow.status.${(wf.status || '').toLowerCase()}`, wf.status)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => window.open(`/workflow-documents/${wf.id}`, '_blank', 'noopener,noreferrer')}
                        style={{
                          background: 'transparent',
                          border: `1px solid ${borderColor}`,
                          borderRadius: '6px',
                          cursor: 'pointer',
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.7rem',
                          color: textColor,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                      >
                        <ExternalLink size={12} />
                        {t('workflow.dayDrawer.viewDetail', 'Detail')}
                      </button>
                      <button
                        type="button"
                        onClick={() => openInbox(wf.id)}
                        style={{
                          background: 'transparent',
                          border: `1px solid ${borderColor}`,
                          borderRadius: '6px',
                          cursor: 'pointer',
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.7rem',
                          color: textColor,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                      >
                        <ExternalLink size={12} />
                        {t('workflow.dayDrawer.viewInbox', 'Inbox')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div {...resizeHandleProps} />
      </div>
    </>,
    document.body
  );
});

DayWorkflowsDrawer.displayName = 'DayWorkflowsDrawer';

export default DayWorkflowsDrawer;
