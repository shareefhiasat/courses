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
import { WORKFLOW_STATUS_CONFIG } from '@constants/driveConstants';
import WorkflowStatusIndicator from './WorkflowStatusIndicator';

export default function StatusColumn({ file, onClick }) {
  const { theme } = useTheme();
  const { t } = useLang();
  const [hovered, setHovered] = useState(false);
  const [hoverDelay, setHoverDelay] = useState(null);

  const { shareCounts = { people: 0, roles: 0 }, workflowCounts = {}, publicLinksCount = 0 } = file;

  // Calculate total shares
  const totalShares = shareCounts.people + shareCounts.roles;
  const hasShares = totalShares > 0;

  // Check if has any active workflow (non-zero counts)
  const hasActiveWorkflow = Object.values(workflowCounts).some(count => count > 0);
  const hasRejected = workflowCounts.rejected > 0;

  // Check if has active public links
  const hasPublicLinks = publicLinksCount > 0;

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
        justifyContent: 'center',
        gap: '0.5rem',
        cursor: onClick ? 'pointer' : 'default',
        padding: '0.25rem 0.5rem',
        borderRadius: '0.375rem',
        transition: 'background 0.15s ease',
        position: 'relative',
        flexWrap: 'wrap',
        maxWidth: '100px',
      }}
    >
      {/* Share count indicator */}
      {hasShares && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.25rem',
            fontSize: '0.75rem',
            fontWeight: 500,
            flexWrap: 'wrap',
            maxWidth: '80px',
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
          {shareCounts.roles > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.125rem',
                color: '#8b5cf6',
              }}
            >
              <span style={{ fontSize: '0.875rem' }}>
                {getThemedIcon('ui', 'shield', 14, '#8b5cf6')}
              </span>
              <span>{shareCounts.roles}</span>
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

      {/* Public link indicator */}
      {hasPublicLinks && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.125rem',
            fontSize: '0.75rem',
            fontWeight: 500,
            color: '#10b981',
          }}
        >
          <span style={{ fontSize: '0.875rem' }}>
            {getThemedIcon('ui', 'link', 14, '#10b981')}
          </span>
          <span>{publicLinksCount}</span>
        </div>
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
                {shareCounts.roles > 0 && (
                  <span style={{ color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    {getThemedIcon('ui', 'shield', 12, '#8b5cf6')} {shareCounts.roles} {t('drive.roles') || 'roles'}
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
                    const config = WORKFLOW_STATUS_CONFIG[status] || WORKFLOW_STATUS_CONFIG.draft;
                    return (
                      <div
                        key={status}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          color: config.color,
                        }}
                      >
                        <span style={{ fontSize: '0.875rem' }}>
                          {getThemedIcon('ui', config.icon, 12, config.color)}
                        </span>
                        <span style={{ fontWeight: 600 }}>{count}</span>
                        <span>{t(config.labelKey) || status}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Public links details */}
          {hasPublicLinks && (
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #6b7280)', marginBottom: '0.25rem' }}>
                {t('drive.publicLinks') || 'Public Links'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: '#10b981' }}>
                <span style={{ fontSize: '0.875rem' }}>
                  {getThemedIcon('ui', 'link', 12, '#10b981')}
                </span>
                <span style={{ fontWeight: 600 }}>{publicLinksCount}</span>
                <span>{t('drive.active') || 'active link'}{publicLinksCount > 1 ? 's' : ''}</span>
              </div>
            </div>
          )}

          {!hasShares && !hasActiveWorkflow && !hasPublicLinks && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #6b7280)' }}>
              {t('drive.noStatus') || 'No status information'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
