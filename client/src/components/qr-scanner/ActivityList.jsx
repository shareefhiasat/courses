import React from 'react';
import PortalTooltip from '@ui/PortalTooltip';
import { DeleteIcon, ChevronDownIcon } from '@utils/icons.jsx';
import QuickActionButtons from './QuickActionButtons.jsx';
import { RECORD_TYPES } from '@utils/sharedTypes';
import { getLocalizedNoteText } from '@constants/noteTypes';
import { getUserRoleDisplay, ROLE_DISPLAY_NAMES } from '@utils/userUtils';
import { Shield, GraduationCap, UserCog, Crown, Heart } from 'lucide-react';

const ActivityList = ({
  recentActivity,
  activityLoading,
  expandedActivities,
  students,
  onToggleActivityExpansion,
  onDeleteActivity,
  onQuickAttendance,
  programId,
  attendanceMode,
  getStatusColor,
  getStatusIcon,
  getStatusLabel,
  getScanMethodDisplay,
  t,
  lang,
  isRTL,
  isMobile,
  canDeleteAttendance = false,
  canSeeQuickButtons = false,
  canMarkAttendance = false,
  canEditAttendance = false
}) => {
  const canUseQuickActions = canSeeQuickButtons && canMarkAttendance && typeof onQuickAttendance === 'function';
  const formatActivityTime = (time) => {
    try {
      const raw = time?.toDate ? time.toDate() : time ? new Date(time) : null;
      if (!raw || isNaN(raw.getTime())) return '';
      
      const locale = lang === 'ar' ? 'ar-QA' : 'en-GB';
      const dateStr = raw.toLocaleDateString(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      
      // Check if the timestamp has time information (not just date)
      const hours = raw.getHours();
      const minutes = raw.getMinutes();
      const seconds = raw.getSeconds();
      
      // If all time components are 0, it's likely a date-only timestamp
      if (hours === 0 && minutes === 0 && seconds === 0) {
        return dateStr;
      }
      
      // Otherwise, display both date and time
      const timeStr = raw.toLocaleTimeString(locale, { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
      });
      return `${dateStr}, ${timeStr}`;
    } catch (e) {
      return '';
    }
  };

  return (
    <div data-tour="activity-list" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      [isRTL ? 'paddingRight' : 'paddingLeft']: '0.5rem',
      [isRTL ? 'borderRight' : 'borderLeft']: '3px solid #8b5cf6',
      maxHeight: '400px',
      overflowY: 'auto',
      overflowX: 'hidden'
    }}>
      {activityLoading ? (
        <div style={{
          padding: '1rem',
          color: '#9ca3af',
          fontSize: '0.875rem',
          textAlign: 'center'
        }}>
          {t('loading')}...
        </div>
      ) : recentActivity.length === 0 ? (
        <div style={{
          padding: '1rem',
          color: '#9ca3af',
          fontSize: '0.875rem'
        }}>
          {t('no_todays_transactions') || 'No transactions Today'}
        </div>
      ) : (
        recentActivity.map((activity) => (
          <div key={activity.id} style={{
            borderBottom: '1px solid #e5e7eb',
            paddingBottom: expandedActivities.has(activity.id) ? '0.5rem' : '0.125rem'
          }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.25rem 0',
                cursor: 'pointer'
              }}
              onClick={() => onToggleActivityExpansion(activity.id)}
            >
              <div style={{
                padding: '0.125rem 0.375rem',
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                background: 'transparent',
                color: '#374151',
                display: 'flex',
                alignItems: 'center',
                gap: '0.125rem'
              }}>
                {getStatusIcon(activity.status, activity.type, activity.delta)}
                {(activity.type === RECORD_TYPES.PENALTY || activity.type === RECORD_TYPES.PARTICIPATION || activity.type === RECORD_TYPES.BEHAVIOR) && activity.points && (
                  <span style={{ marginLeft: '0.25rem' }}>({activity.points})</span>
                )}
              </div>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary, #374151)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
                {lang === 'ar' ? (activity.studentNameAr || activity.studentName) : (activity.studentName || activity.studentNameAr)}
              </span>
              
              {canUseQuickActions && activity.studentId && activity.type === RECORD_TYPES.ATTENDANCE && (
                <div data-tour="activity-quick-actions">
                <QuickActionButtons
                  studentId={activity.studentId}
                  students={students}
                  onQuickAttendance={onQuickAttendance}
                  programId={programId}
                  attendanceMode={attendanceMode}
                  canEditAttendance={canEditAttendance}
                  t={t}
                  isRTL={isRTL}
                />
                </div>
              )}
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.125rem' }}>
                {onDeleteActivity && canDeleteAttendance && (
                  <div data-tour="activity-delete">
                  <PortalTooltip content={t('delete_activity')} position="top">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteActivity(activity);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-danger, #ef4444)',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '0.25rem'
                      }}
                    >
                      <DeleteIcon style={{ width: '14px', height: '14px' }} />
                    </button>
                  </PortalTooltip>
                  </div>
                )}
                <ChevronDownIcon
                  style={{
                    width: '16px',
                    height: '16px',
                    transform: expandedActivities.has(activity.id) ? (isRTL ? 'rotate(180deg)' : 'rotate(180deg)') : (isRTL ? 'rotate(90deg)' : 'rotate(0deg)'),
                    transition: 'transform 0.2s',
                    color: '#6b7280'
                  }}
                />
              </div>
            </div>

            {expandedActivities.has(activity.id) && (
              <div style={{
                paddingLeft: isMobile ? '0.25rem' : '0.5rem',
                paddingTop: '0.5rem',
                fontSize: '0.75rem',
                color: '#6b7280',
                display: isMobile ? 'flex' : 'block',
                flexDirection: isMobile ? 'column' : 'none',
                gap: isMobile ? '0.15rem' : '0',
                maxWidth: '100%',
                overflow: 'hidden',
                wordWrap: 'break-word'
              }}>
                <div style={{ marginBottom: '0.15rem' }}>
                  {formatActivityTime(activity.time)}
                </div>
                {activity.subject && (
                  <div style={{ marginBottom: '0.25rem' }}>
                    {lang === 'ar' ? (activity.subjectAr || activity.subject) : activity.subject}
                  </div>
                )}
                {activity.program && (
                  <div style={{ marginBottom: '0.25rem' }}>
                    {lang === 'ar' ? (activity.programAr || activity.program) : activity.program}
                  </div>
                )}
                {activity.class && (
                  <div style={{ marginBottom: '0.25rem' }}>
                    {lang === 'ar' ? (activity.classAr || activity.class) : activity.class}
                  </div>
                )}
                {(() => {
                  const creator = activity.creator;
                  const displayName = creator
                    ? (lang === 'ar' ? (creator.displayNameAr || creator.displayName || creator.firstNameAr || creator.firstName) : (creator.displayName || creator.firstName))
                    : (activity.performedByName || activity.performedBy);
                  if (!displayName) return null;
                  const roles = [];
                  if (creator?.isSuperAdmin) roles.push('SUPER_ADMIN');
                  if (creator?.isAdmin) roles.push('ADMIN');
                  if (creator?.isHR) roles.push('HR');
                  if (creator?.isInstructor) roles.push('INSTRUCTOR');
                  if (roles.length === 0 && creator?.role) roles.push(creator.role.toUpperCase());
                  const roleIcons = { SUPER_ADMIN: Crown, ADMIN: Shield, HR: UserCog, INSTRUCTOR: GraduationCap, STUDENT: Heart };
                  return (
                    <div style={{ marginBottom: '0.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem', background: '#f0f9ff', borderRadius: '0.25rem', fontSize: '0.7rem', flexWrap: 'wrap' }}>
                        <span style={{ color: '#0369a1', fontWeight: 500 }}>{displayName}</span>
                        {roles.map(r => {
                          const RoleIcon = roleIcons[r] || Heart;
                          const label = ROLE_DISPLAY_NAMES[r] || r;
                          return (
                            <span key={r} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.125rem', padding: '0.0625rem 0.25rem', borderRadius: '0.25rem', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', fontSize: '0.625rem', fontWeight: 600 }}>
                              <RoleIcon size={10} />
                              {label}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
                {(activity.comment || activity.scanMethod) && (
                  <div style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {activity.comment && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        {getStatusIcon(activity.status, activity.type, activity.delta)}
                        {(() => {
                        // Check if it's a note constant (uppercase with underscores)
                        if (/^[A-Z_]+$/.test(activity.comment)) {
                          return getLocalizedNoteText(activity.comment, t) || activity.comment;
                        }
                        return activity.comment;
                      })()}
                      </span>
                    )}
                    {activity.scanMethod && (
                      <span style={{
                        padding: '0.125rem 0.375rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: getScanMethodDisplay(activity.scanMethod).color + '20',
                        color: getScanMethodDisplay(activity.scanMethod).color
                      }}>
                        {getScanMethodDisplay(activity.scanMethod).text}
                      </span>
                    )}
                  </div>
                )}
                {activity.label && activity.type === RECORD_TYPES.PENALTY && (
                  <div style={{ marginBottom: '0.25rem' }}>
                    {activity.label || t('penalty_type') || 'Penalty Type'}
                  </div>
                )}
                {activity.type === RECORD_TYPES.PARTICIPATION && (
                  <div style={{ marginBottom: '0.25rem' }}>
                    {activity.label || t('participation') || 'Participation'}
                  </div>
                )}
                {activity.type === RECORD_TYPES.BEHAVIOR && (
                  <div style={{ marginBottom: '0.25rem' }}>
                    {activity.label || t('behavior') || 'Behavior'}
                  </div>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default ActivityList;
