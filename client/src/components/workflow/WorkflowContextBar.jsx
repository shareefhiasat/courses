import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon } from '@constants/iconTypes';
import { getLocalizedUserName } from '@utils/localizedUserName';
import { getWorkflowDisplayLabel } from '@constants/workflowConfig';
import { APPROVAL_FLOW_BY_VALUE } from '@constants/workflowConfig';
import { getWorkflowRole } from '@utils/userUtils';
import { getWorkflowContextParts } from '@hooks/useProgramSubjectMaps';

/**
 * Compact context strip for workflow title + description + attendance scope.
 */
export default function WorkflowContextBar({
  document,
  programMap = {},
  subjectMap = {},
  compact = false,
}) {
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const muted = isDark ? '#9ca3af' : '#6b7280';
  const text = isDark ? '#f3f4f6' : '#111827';

  const programName = useMemo(() => {
    const parts = getWorkflowContextParts(document, { programMap, subjectMap, lang });
    return parts[0] || null;
  }, [document, programMap, subjectMap, lang]);

  const subjectName = useMemo(() => {
    const parts = getWorkflowContextParts(document, { programMap, subjectMap, lang });
    return parts[1] || null;
  }, [document, programMap, subjectMap, lang]);

  const className = useMemo(() => {
    const cls = document?.class;
    if (!cls) return null;
    return lang === 'ar' ? (cls.nameAr || cls.nameEn || cls.code) : (cls.nameEn || cls.nameAr || cls.code);
  }, [document?.class, lang]);

  const dateLabel = useMemo(() => {
    if (!document) return null;
    if (document.date) return format(new Date(document.date), 'dd/MM/yyyy');
    if (document.dateFrom && document.dateTo) {
      return `${format(new Date(document.dateFrom), 'dd/MM/yyyy')} - ${format(new Date(document.dateTo), 'dd/MM/yyyy')}`;
    }
    if (document.dateFrom) return format(new Date(document.dateFrom), 'dd/MM/yyyy');
    return null;
  }, [document]);

  const approvalRoles = useMemo(() => {
    if (!document) return ['hr'];
    const flow = APPROVAL_FLOW_BY_VALUE[document.approvalFlow];
    const steps = flow?.steps || ['owner', 'hr'];
    return steps.filter((step) => step !== 'owner');
  }, [document]);

  if (!document) return null;

  const metadata = document.metadata && typeof document.metadata === 'object' ? document.metadata : {};
  const shareTargetMode = metadata.shareTargetMode || 'role';
  const shareUsers = document.shareTargetUsers || [];
  const role = getWorkflowRole(document);
  const targetStudentName = document.targetStudent
    ? getLocalizedUserName(document.targetStudent, lang, '—')
    : null;

  const chips = [
    document.workflowCategory && {
      key: 'category',
      label: getWorkflowDisplayLabel(document, t),
      color: '#7c3aed',
    },
    programName && { key: 'program', label: programName, icon: 'layers' },
    subjectName && { key: 'subject', label: subjectName, icon: 'book_open' },
    className && { key: 'class', label: className, icon: 'users' },
    dateLabel && { key: 'date', label: dateLabel, icon: 'calendar' },
    targetStudentName && { key: 'student', label: targetStudentName, icon: 'user' },
  ].filter(Boolean);

  return (
    <div
      style={{
        padding: compact ? '0.75rem 1rem' : '1rem 1.25rem',
        borderRadius: '0.75rem',
        border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
        background: isDark ? '#1f2937' : '#f9fafb',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: compact ? '0.95rem' : '1.05rem', fontWeight: 700, color: text }}>
              {document.title || `#${document.id}`}
            </span>
            {document.description && (
              <span style={{ fontSize: '0.85rem', color: muted }}>{document.description}</span>
            )}
          </div>
        </div>
        {document.status && (
          <span style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            padding: '0.2rem 0.5rem',
            borderRadius: '9999px',
            background: isDark ? '#374151' : '#e5e7eb',
            color: text,
          }}>
            {t(`workflow.status.${document.status.toLowerCase()}`, document.status)}
          </span>
        )}
      </div>

      {chips.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
          {chips.map((chip) => (
            <span
              key={chip.key}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: chip.color || muted,
                padding: '0.15rem 0.5rem',
                borderRadius: '0.375rem',
                background: isDark ? '#111827' : '#fff',
                border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
              }}
            >
              {chip.icon && getThemedIcon('ui', chip.icon, 12, chip.color || muted)}
              {chip.label}
            </span>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.75rem', color: muted }}>
        {document.submitter && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            {getThemedIcon('ui', 'user', 12, muted)}
            {t('workflow.inbox.from', 'From')}: {getLocalizedUserName(document.submitter, lang, '—')}
          </span>
        )}
        {shareTargetMode === 'users' && shareUsers.length > 0 ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
            {getThemedIcon('ui', 'users', 12, muted)}
            {t('workflow.detail.shareWithUsers', 'Shared with users')}:{' '}
            {shareUsers.map((u) => getLocalizedUserName(u, lang, u.email || '—')).join(', ')}
          </span>
        ) : (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
            {getThemedIcon('ui', 'shield', 12, muted)}
            {t('workflow.detail.shareWithRole', 'Role approval')}:{' '}
            {approvalRoles.map((r) => t(`roles.${r}`, r)).join(', ')}
          </span>
        )}
        {document.currentAssignee ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            {getThemedIcon('ui', 'user_check', 12, muted)}
            {t('workflow.inbox.assignedTo', 'Assigned To')}: {getLocalizedUserName(document.currentAssignee, lang, '—')}
          </span>
        ) : role && shareTargetMode !== 'users' ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            {getThemedIcon('ui', 'users', 12, muted)}
            {t('workflow.inbox.assignedTo', 'Assigned To')}: {t(`roles.${role}`, role)}
          </span>
        ) : null}
      </div>
    </div>
  );
}
