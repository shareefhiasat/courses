import React from 'react';
import { useLang } from '@contexts/LangContext';
import { getThemedIcon, getUserRoleIcon, getUserRoleColor } from '@constants/iconTypes';
import { getAvatarColor, getAvatarInitials } from '@utils/avatarUtils';
import { getUserRoleFromObject } from '@utils/userUtils';
import { formatQatarDate } from '@utils/timezone';

// Status color and icon mapping
const STATUS_CONFIG = {
  DRAFT: {
    color: '#6b7280',
    bgColor: '#f3f4f6',
    icon: 'file'
  },
  SUBMITTED: {
    color: '#3b82f6',
    bgColor: '#dbeafe',
    icon: 'send'
  },
  UNDER_HR_REVIEW: {
    color: '#8b5cf6',
    bgColor: '#ede9fe',
    icon: 'users'
  },
  UNDER_ADMIN_REVIEW: {
    color: '#4f46e5',
    bgColor: '#e0e7ff',
    icon: 'shield'
  },
  APPROVED: {
    color: '#10b981',
    bgColor: '#d1fae5',
    icon: 'check'
  },
  REJECTED: {
    color: '#ef4444',
    bgColor: '#fee2e2',
    icon: 'x'
  }
};

function WorkflowHistory({ statusHistory }) {
  const { t, lang } = useLang();

  if (!statusHistory || statusHistory.length === 0) return null;

  const getStatusConfig = (status) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
  };

  const getLocalizedStatus = (status) => {
    const statusKeyMap = {
      'DRAFT': 'workflow.status.draft',
      'SUBMITTED': 'workflow.status.submitted',
      'UNDER_HR_REVIEW': 'workflow.status.underReview',
      'UNDER_ADMIN_REVIEW': 'workflow.status.underAdminReview',
      'APPROVED': 'workflow.status.approved',
      'REJECTED': 'workflow.status.rejected',
    };
    const key = statusKeyMap[status];
    return key ? t(key, status) : status;
  };

  const getActorName = (actor) => {
    if (!actor) return '-';
    if (lang === 'ar') {
      return actor.displayNameAr || (actor.firstNameAr || actor.lastNameAr ? `${actor.firstNameAr || ''} ${actor.lastNameAr || ''}`.trim() : null) || actor.name || actor.firstName || '-';
    }
    return actor.name || actor.firstName || actor.displayName || '-';
  };

  return (
    <div className="space-y-3">
      {statusHistory
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map((history) => {
          const toConfig = getStatusConfig(history.toStatus);
          return (
            <div key={history.id} className="flex items-start gap-3">
              {/* Actor avatar with role badge */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div
                  className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center overflow-hidden"
                  style={{
                    background: history.actor?.profileImageUrl ? 'transparent' : getAvatarColor(getActorName(history.actor)).bg,
                    color: getAvatarColor(getActorName(history.actor)).color,
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 600,
                  }}
                >
                  {history.actor?.profileImageUrl ? (
                    <img
                      src={history.actor.profileImageUrl}
                      alt={getActorName(history.actor)}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    getAvatarInitials(getActorName(history.actor))
                  )}
                </div>
                {/* Role badge overlay */}
                {(() => {
                  const role = getUserRoleFromObject(history.actor);
                  if (!role) return null;
                  const roleIcon = getUserRoleIcon(role);
                  const roleColor = getUserRoleColor(role);
                  if (!roleIcon) return null;
                  return (
                    <div style={{
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
                      title={t(`roles.${role}`, role)}
                    >
                      {React.cloneElement(roleIcon, { color: roleColor, size: 10 })}
                    </div>
                  );
                })()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {/* Status icon inline */}
                  <span style={{ display: 'inline-flex', alignItems: 'center', color: toConfig.color }}>
                    {getThemedIcon('ui', toConfig.icon, 12, toConfig.color)}
                  </span>
                  <span className="font-medium text-gray-900 text-sm">
                    {getActorName(history.actor)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatQatarDate(history.createdAt, 'dd/MM/yyyy HH:mm')}
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  {history.fromStatus ? (
                    <span className="line-through text-gray-400">{getLocalizedStatus(history.fromStatus)}</span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}{' '}
                  →{' '}
                  <span 
                    className="font-medium px-2 py-0.5 rounded"
                    style={{ color: toConfig.color, background: toConfig.bgColor }}
                  >
                    {getLocalizedStatus(history.toStatus)}
                  </span>
                </p>
                {history.reason && (
                  <p className="text-xs text-gray-500 mt-1">{history.reason}</p>
                )}
              </div>
            </div>
          );
        })}
    </div>
  );
}

const WorkflowHistoryMemo = React.memo(WorkflowHistory);

export default WorkflowHistoryMemo;
