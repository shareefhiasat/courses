import React from 'react';
import { useLang } from '@contexts/LangContext';
import { useTheme } from '@contexts/ThemeContext';
import {
  SCHEDULE_WORKFLOW_COLORS,
  resolveScheduleWorkflowKey,
} from '@constants/workspaceStatusColors';
import gridStyles from '@components/workspace/officialWeeklyScheduleGrid.module.css';
import ColoredTooltip from '@components/ui/mui/ColoredTooltip';

const STATUS_LABELS = {
  not_taken: 'Not Taken',
  draft: 'Draft',
  taken: 'Attendance Taken',
  submitted: 'Daily Official Submitted',
  under_review: 'In Review',
  under_admin_review: 'Admin Review',
  under_hr_review: 'HR Review',
  approved: 'Approved',
  admin_approved: 'Approved',
  rejected: 'Rejected',
  amended: 'Amended',
};

const ClassCell = ({ session, status, onClick }) => {
  const { lang, t } = useLang();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (!session) {
    return (
      <div
        style={{
          minHeight: '80px',
          borderRadius: '8px',
          border: `1px dashed ${isDark ? '#334155' : '#e2e8f0'}`,
          background: 'transparent',
        }}
      />
    );
  }

  const cls = session.class;
  const subject = cls?.subject;
  const classroom = session.classroom;

  const statusKey = resolveScheduleWorkflowKey(status);
  const statusColor = {
    bg: SCHEDULE_WORKFLOW_COLORS[statusKey],
    label: t(`workspace_status_${statusKey}`)
      || t(`workflow.status.${statusKey}`)
      || STATUS_LABELS[statusKey]
      || statusKey,
  };

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        padding: '10px',
        borderRadius: '8px',
        border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
        background: isDark ? '#1e293b' : '#ffffff',
        cursor: 'pointer',
        minHeight: '80px',
        textAlign: lang === 'ar' ? 'right' : 'left',
        position: 'relative',
        transition: 'all 0.15s ease',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-primary, #3b82f6)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = isDark ? '#334155' : '#e2e8f0';
      }}
    >
      <ColoredTooltip title={statusColor.label} color={statusColor.bg} placement="top">
        <span
          className={`${gridStyles.statusDot} ${gridStyles[`statusDot_${statusKey}`] || ''}`}
          style={{
            '--dot-color': statusColor.bg,
            position: 'absolute',
            top: '6px',
            right: '6px',
            flexShrink: 0,
          }}
          aria-label={statusColor.label}
        />
      </ColoredTooltip>

      <div style={{ fontSize: '13px', fontWeight: 600, color: isDark ? '#f1f5f9' : '#1e293b', lineHeight: 1.2 }}>
        {lang === 'ar' && cls?.nameAr ? cls.nameAr : cls?.nameEn || cls?.code}
      </div>
      <div style={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b' }}>
        {lang === 'ar' && subject?.nameAr ? subject.nameAr : subject?.nameEn || ''}
      </div>
      {classroom && (
        <div style={{ fontSize: '10px', color: isDark ? '#64748b' : '#94a3b8' }}>
          {lang === 'ar' && classroom.nameAr ? classroom.nameAr : classroom.nameEn || classroom.code}
        </div>
      )}
    </button>
  );
};

export default ClassCell;
