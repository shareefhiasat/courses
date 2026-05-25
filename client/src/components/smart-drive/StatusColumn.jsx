/**
 * StatusColumn Component
 *
 * Displays file status information including:
 * - Share counts (people + groups)
 * - Workflow status indicators
 * - Priority badges for critical status (rejected workflows)
 */

import React, { useState } from 'react';
import { useTheme } from '@contexts/ThemeContext';
import { useLang } from '@contexts/LangContext';
import { getThemedIcon } from '@constants/iconTypes';
import WorkflowStatusIndicator from './WorkflowStatusIndicator';

export default function StatusColumn({ file, onClick }) {
  const { theme } = useTheme();
  const { t } = useLang();
  const [hovered, setHovered] = useState(false);
  const [hoverDelay, setHoverDelay] = useState(null);

  const { shareCounts = { people: 0, groups: 0 }, workflowCounts = {} } = file;

  // Calculate total shares
  const totalShares = shareCounts.people + shareCounts.groups;
  const hasShares = totalShares > 0;

  // Check if has any active workflow (non-zero counts)
  const hasActiveWorkflow = Object.values(workflowCounts).some(count => count > 0);
  const hasRejected = workflowCounts.rejected > 0;

  // Handle hover with delay
  const handleMouseEnter = () => {
    const delay = setTimeout(() => {
      setHovered(true);
    }, 300); // 300ms delay
    setHoverDelay(delay);
  };

  const handleMouseLeave = () => {
    if (hoverDelay) {
      clearTimeout(hoverDelay);
      setHoverDelay(null);
    }
    setHovered(false);
  };

  return (
    <div
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        cursor: onClick ? 'pointer' : 'default',
        padding: '0.25rem 0.5rem',
        borderRadius: '0.375rem',
        transition: 'background 0.15s ease',
        position: 'relative',
      }}
    >
      {/* Share count indicator */}
      {hasShares && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            fontSize: '0.75rem',
            fontWeight: 500,
          }}
        >
          {shareCounts.people > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.125rem',
                color: '#f97316',
              }}
            >
              <span style={{ fontSize: '0.875rem' }}>
                {getThemedIcon('ui', 'user', 14, '#f97316')}
              </span>
              <span>{shareCounts.people}</span>
            </div>
          )}
          {shareCounts.groups > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.125rem',
                color: '#8b5cf6',
              }}
            >
              <span style={{ fontSize: '0.875rem' }}>
                {getThemedIcon('ui', 'users', 14, '#8b5cf6')}
              </span>
              <span>{shareCounts.groups}</span>
            </div>
          )}
        </div>
      )}

      {/* Workflow status indicator */}
      {hasActiveWorkflow && (
        <WorkflowStatusIndicator
          workflowCounts={workflowCounts}
          showTooltip={false}
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
        />
      )}

      {/* Priority badge for rejected workflows */}
      {hasRejected && (
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#ef4444',
            border: `2px solid ${theme === 'dark' ? '#1f2937' : '#ffffff'}`,
          }}
        />
      )}

      {/* Rich hover tooltip (to be implemented) */}
      {hovered && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            zIndex: 1000,
            minWidth: 250,
            padding: '0.75rem',
            background: 'var(--background-primary, #ffffff)',
            border: '1px solid var(--border, #e5e7eb)',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            marginTop: '0.25rem',
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            {t('drive.statusDetails') || 'Status Details'}
          </div>
          
          {/* Share details */}
          {hasShares && (
            <div style={{ marginBottom: '0.5rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #6b7280)', marginBottom: '0.25rem' }}>
                {t('drive.sharedWith') || 'Shared with'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem' }}>
                {shareCounts.people > 0 && (
                  <span style={{ color: '#f97316', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    {getThemedIcon('ui', 'user', 12, '#f97316')} {shareCounts.people} {t('drive.people') || 'people'}
                  </span>
                )}
                {shareCounts.groups > 0 && (
                  <span style={{ color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    {getThemedIcon('ui', 'users', 12, '#8b5cf6')} {shareCounts.groups} {t('drive.groups') || 'groups'}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Workflow details */}
          {hasActiveWorkflow && (
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #6b7280)', marginBottom: '0.25rem' }}>
                {t('drive.workflowStatus') || 'Workflow Status'}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.75rem' }}>
                {Object.entries(workflowCounts)
                  .filter(([_, count]) => count > 0)
                  .map(([status, count]) => {
                    const statusConfig = {
                      pending: { icon: 'clock', color: '#f59e0b', label: t('workflow.status.pending') || 'Pending' },
                      in_progress: { icon: 'refresh_cw', color: '#3b82f6', label: t('workflow.status.in_progress') || 'In Progress' },
                      completed: { icon: 'check_circle', color: '#10b981', label: t('workflow.status.completed') || 'Completed' },
                      rejected: { icon: 'x_circle', color: '#ef4444', label: t('workflow.status.rejected') || 'Rejected' },
                      needs_feedback: { icon: 'message_circle', color: '#8b5cf6', label: t('workflow.status.needs_feedback') || 'Needs Feedback' },
                    }[status] || { icon: 'clock', color: '#f59e0b', label: status };
                    return (
                      <div
                        key={status}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          color: statusConfig.color,
                        }}
                      >
                        <span style={{ fontSize: '0.875rem' }}>
                          {getThemedIcon('ui', statusConfig.icon, 12, statusConfig.color)}
                        </span>
                        <span style={{ fontWeight: 600 }}>{count}</span>
                        <span>{statusConfig.label}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {!hasShares && !hasActiveWorkflow && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #6b7280)' }}>
              {t('drive.noStatus') || 'No status information'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
