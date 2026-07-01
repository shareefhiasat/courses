import React from 'react';
import { useLang } from '@contexts/LangContext';
import { getThemedIcon, getUserRoleIcon, getUserRoleColor } from '@constants/iconTypes';
import { getAvatarColor, getAvatarInitials } from '@utils/avatarUtils';
import { getStatusColorClasses } from '@constants/workflowStatusTypes';
import { formatQatarDate } from '@utils/timezone';

/**
 * WorkflowHistory Component
 * Displays workflow state changes history as a list
 */
export default function WorkflowHistory({ history = [], onClose }) {
  const { t } = useLang();

  if (!history || history.length === 0) {
    return (
      <div className="text-center py-8">
        {getThemedIcon('ui', 'clock', 48, 'muted')}
        <p className="text-sm text-gray-500">{t('drive.noWorkflowHistory')}</p>
      </div>
    );
  }

  const formatDate = (date) => {
    if (!date) return '';
    return formatQatarDate(date, 'dd/MM/yyyy HH:mm');
  };

  const getStatusColor = (status) => {
    return getStatusColorClasses(status);
  };

  return (
    <div className="space-y-3">
      {history.map((entry, index) => (
        <div key={index} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden" style={{ background: getAvatarColor(entry.user || '?').bg, color: getAvatarColor(entry.user || '?').color, fontSize: 'var(--font-size-xs)', fontWeight: 600 }}>
              {getAvatarInitials(entry.user || '?')}
            </div>
            {/* Role badge overlay */}
            {(() => { const role = entry.userRole || entry.role; if (!role) return null; const roleIcon = getUserRoleIcon(role); const roleColor = getUserRoleColor(role); if (!roleIcon) return null; return (
              <div style={{ position: 'absolute', bottom: '-2px', insetInlineEnd: '-2px', width: '1.125rem', height: '1.125rem', borderRadius: '9999px', background: 'var(--panel, white)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid var(--panel, white)', boxShadow: '0 0 0 1px var(--border, #e5e7eb)' }} title={t(`roles.${role}`, role)}>
                {React.cloneElement(roleIcon, { color: roleColor, size: 10 })}
              </div>
            ); })()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-gray-900">{entry.user}</span>
              <span className="text-xs text-gray-500">{formatDate(entry.timestamp)}</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(entry.toStatus)}`}>
                {entry.toStatus}
              </span>
              {entry.fromStatus && (
                <>
                  <span className="text-xs text-gray-400">{t('workflow.inbox.from')}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(entry.fromStatus)}`}>
                    {entry.fromStatus}
                  </span>
                </>
              )}
            </div>
            {entry.comment && (
              <div className="flex items-start gap-2 mt-2">
                {getThemedIcon('ui', 'file_text', 14, 'muted')}
                <p className="text-xs text-gray-600">{entry.comment}</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
