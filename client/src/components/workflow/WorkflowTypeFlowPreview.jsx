import React, { memo } from 'react';
import { ChevronRight, CheckCircle2 } from 'lucide-react';
import { useLang } from '@contexts/LangContext';
import { getUserRoleIcon, getUserRoleColor } from '@constants/iconTypes';

const ROLE_LABEL_KEYS = {
  owner: 'workflow.types.requester',
  hr: 'roles.hr',
  admin: 'roles.admin',
  instructor: 'roles.instructor',
};

/**
 * Compact inline preview of who reviews the document in order.
 */
const WorkflowTypeFlowPreview = ({
  steps = [],
  size = 16,
  showApproved = true,
  showLabels = false,
  className = '',
}) => {
  const { t } = useLang();

  if (!steps.length) return null;

  const iconSize = size;

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: showLabels ? 8 : 2,
        flexWrap: 'wrap',
      }}
      aria-hidden={!showLabels}
    >
      {steps.map((role, index) => (
        <React.Fragment key={`${role}-${index}`}>
          {index > 0 && (
            <ChevronRight
              size={Math.max(iconSize - 4, 12)}
              style={{ color: 'var(--text-muted, #9ca3af)', flexShrink: 0 }}
            />
          )}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              color: getUserRoleColor(role),
              flexShrink: 0,
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center' }}>
              {React.cloneElement(getUserRoleIcon(role), { size: iconSize })}
            </span>
            {showLabels && (
              <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                {t(ROLE_LABEL_KEYS[role] || role, role)}
              </span>
            )}
          </span>
        </React.Fragment>
      ))}
      {showApproved && (
        <>
          <ChevronRight
            size={Math.max(iconSize - 4, 12)}
            style={{ color: 'var(--text-muted, #9ca3af)', flexShrink: 0 }}
          />
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              color: 'var(--color-success, #16a34a)',
              flexShrink: 0,
            }}
          >
            <CheckCircle2 size={iconSize} />
            {showLabels && (
              <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                {t('workflow.types.approved', 'Approved')}
              </span>
            )}
          </span>
        </>
      )}
    </span>
  );
};

export default memo(WorkflowTypeFlowPreview);
