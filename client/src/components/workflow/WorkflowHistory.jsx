import { useLang } from '@contexts/LangContext';
import { getThemedIcon } from '@constants/iconTypes';
import { formatQatarDate } from '@utils/timezone';
import React from 'react';

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
    return actor.name || actor.firstName || '-';
  };

  return (
    <div className="space-y-3">
      {statusHistory
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map((history) => {
          const toConfig = getStatusConfig(history.toStatus);
          return (
            <div key={history.id} className="flex items-start gap-3">
              <div 
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: toConfig.bgColor, color: toConfig.color }}
              >
                {getThemedIcon('ui', toConfig.icon, 12, toConfig.color)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
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
