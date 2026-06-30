import React, { useCallback, useMemo } from 'react';
import { useIsMobile } from '@hooks/useIsMobile';
import { Button } from '@ui';
import { getThemedIcon } from '@constants/iconTypes';
import { ACTIVITY_COLORS } from '@constants';
import StudentRosterHistory from './StudentRosterHistory';
import { getAvatarColor, getAvatarInitials } from '@utils/avatarUtils';
import { CircleIcon, ZapIcon } from '@utils/icons.jsx';
import { useNavigate } from 'react-router-dom';
import PortalTooltip from '@ui/PortalTooltip';


import { info, error, warn, debug } from '@services/utils/logger.js';const StudentCard = ({ 
  student, 
  isExpanded, 
  favoriteStudents, 
  toggleFavorite, 
  toggleRowExpansion, 
  onStudentAction, 
  onStudentSelect, 
  studentHistory, 
  expandedDays, 
  activeFilters, 
  toggleDayExpansion,
  expandAllDays,
  collapseAllDays,
  handleDeleteAttendance, 
  handleDeleteParticipation,
  canDeleteAttendance = false,
  canUseZapPanel = false,
  canUseStatsPanel = false,
  handleDeleteBehavior,
  handleDeletePenalty, 
  getAttendanceBadge, 
  t, 
  isRTL,
  groupLogsByDay,
  toggleFilter,
  sendingEmails,
  setSendingEmails,
  sendStudentSummaryEmail,
  lang = 'en',
  historyLoading = {}
}) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const avatarColor = useMemo(
    () => getAvatarColor(student.displayName || student.realName || student.name || ''),
    [student.displayName, student.realName, student.name]
  );

  const handleToggleFavorite = useCallback((e) => {
    e.stopPropagation();
    toggleFavorite(student.id);
  }, [toggleFavorite, student.id]);

  const handleToggleExpansion = useCallback((e) => {
    e.stopPropagation();
    toggleRowExpansion(student.id);
  }, [toggleRowExpansion, student.id]);

  const handleStudentAction = useCallback((e) => {
    e.stopPropagation();
    try { onStudentAction(student); } catch (error) { error('Error calling onStudentAction:', error); }
  }, [onStudentAction, student]);

  const handleStudentSelect = useCallback((e) => {
    e.stopPropagation();
    onStudentSelect(student);
  }, [onStudentSelect, student]);

  const handleQRNavigate = useCallback((e) => {
    e.stopPropagation();
    const qrUrl = `/qrcode/${student.studentNumber || student.id}`;
    window.open(qrUrl, '_blank');
  }, [student.studentNumber, student.id]);

  return (
    <div
      key={student.id}
      style={{
        background: 'var(--panel, white)',
        border: '1px solid var(--border, #e5e7eb)',
        borderRadius: '0.5rem',
        padding: '1rem',
        cursor: isMobile ? 'default' : 'pointer',
        transition: 'all 0.15s'
      }}
      onClick={() => isMobile ? null : onStudentSelect(student)}
    >
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: isMobile ? '0.5rem' : '0.75rem',
        gap: isMobile ? '0.5rem' : '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.5rem' : '0.75rem', flex: 1 }}>
          <button
            onClick={handleToggleFavorite}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0
            }}
          >
            {getThemedIcon('ui', 'star', 16)}
          </button>
          <div style={{
            width: isMobile ? '2rem' : '2.5rem',
            height: isMobile ? '2rem' : '2.5rem',
            borderRadius: '9999px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isMobile ? '0.75rem' : '0.875rem',
            fontWeight: 500,
            background: avatarColor.bg,
            color: avatarColor.color,
            overflow: 'hidden'
          }}>
            {student.profileImageUrl ? (
              <img
                src={student.profileImageUrl}
                alt={`${student.displayName || student.realName || student.name || ''} avatar`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            ) : (
              getAvatarInitials(student.displayName || student.realName || student.name || '')
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <div style={{ fontWeight: 500, color: 'var(--text, #111827)', fontSize: isMobile ? '0.8rem' : '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {student.displayName || student.realName || student.name || student.email}
                {student.studentOrder !== null && student.studentOrder !== undefined && student.studentOrder !== '' && (
                  <span style={{
                    background: 'var(--color-primary-light, #dbeafe)',
                    color: 'var(--color-primary, #2563eb)',
                    fontSize: '0.625rem',
                    fontWeight: 600,
                    padding: '0.125rem 0.375rem',
                    borderRadius: '0.25rem',
                    border: '1px solid var(--color-primary-border, #93c5fd)'
                  }}>
                    #{student.studentOrder}
                  </span>
                )}
              </div>
              {student.attendance && (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {getAttendanceBadge(student.attendance)}
                </div>
              )}
            </div>
            <div style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', color: 'var(--text-muted, #6b7280)' }}>
              ID: {student.studentNumber || student.studentId?.slice(-4) || '0000'}
            </div>
          </div>
        </div>
        <button
          onClick={handleToggleExpansion}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.25rem'
          }}
        >
          {isExpanded ? (
            getThemedIcon('ui', 'chevron_down', 16)
          ) : (
            isRTL ? (
              getThemedIcon('ui', 'chevron_down', 16)
            ) : (
              getThemedIcon('ui', 'chevron_right', 16)
            )
          )}
        </button>
      </div>
      
      {/* Student Details - Grid Layout */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)', 
        gap: isMobile ? '0.5rem' : '0.75rem', 
        marginBottom: isMobile ? '0.75rem' : '1rem'
      }}>
        {/* Hide attendance section on mobile to make space for part/behavior/penalty */}
        <div style={{ display: isMobile ? 'none' : 'flex', alignItems: 'center', gap: isMobile ? '0.375rem' : '0.5rem' }}>
          <span style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', color: 'var(--text-muted, #6b7280)' }}>
            {t('today') || "Today"}:
          </span>
          {student.attendance ? (
            getAttendanceBadge(student.attendance)
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.125rem' : '0.25rem' }}>
              <CircleIcon style={{ width: '16px', height: '16px', stroke: '#9ca3af' }} />
              <span style={{ fontSize: 'var(--font-size-xs)', color: '#9ca3af', fontWeight: 500 }}>{t('none')}</span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.375rem' : '0.5rem' }}>
          <span style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', color: 'var(--text-muted, #6b7280)' }}>
            {t('part')}:
          </span>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: isMobile ? '1.75rem' : '2rem',
            height: isMobile ? '1.5rem' : '1.75rem',
            borderRadius: '0.375rem',
            fontWeight: 500,
            background: ACTIVITY_COLORS.participation,
            color: '#ffffff',
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            padding: '0 0.5rem'
          }}>
            {student.participation}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.375rem' : '0.5rem' }}>
          <span style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', color: 'var(--text-muted, #6b7280)' }}>
            {t('behavior')}:
          </span>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: isMobile ? '1.75rem' : '2rem',
            height: isMobile ? '1.5rem' : '1.75rem',
            borderRadius: '0.375rem',
            fontWeight: 500,
            background: ACTIVITY_COLORS.behavior,
            color: '#ffffff',
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            padding: '0 0.5rem'
          }}>
            {student.behavior}
          </span>
        </div>
        <div style={{ display: isMobile ? 'none' : 'flex', alignItems: 'center', gap: isMobile ? '0.375rem' : '0.5rem' }}>
          <span style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', color: 'var(--text-muted, #6b7280)' }}>
            {t('penalties') || 'Penalties'}:
          </span>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: isMobile ? '1.75rem' : '2rem',
            height: isMobile ? '1.5rem' : '1.75rem',
            borderRadius: '0.375rem',
            fontWeight: 500,
            background: (student.penaltyHistory?.length || 0) > 0 ? '#fee2e2' : '#f3f4f6',
            color: (student.penaltyHistory?.length || 0) > 0 ? '#991b1b' : '#374151',
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            padding: '0 0.5rem'
          }}>
            {student.penaltyHistory?.length || 0}
          </span>
        </div>
        <div style={{ display: isMobile ? 'none' : 'flex', alignItems: 'center', gap: isMobile ? '0.375rem' : '0.5rem' }}>
          <span style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', color: 'var(--text-muted, #6b7280)' }}>
            {t('id') || 'ID'}:
          </span>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-family-mono)',
            fontSize: isMobile ? '0.75rem' : '0.875rem',
            color: '#059669',
            fontWeight: 600
          }}>
            {student.studentNumber || '—'}
          </span>
        </div>
      </div>
      
      {/* Attendance Statistics - Grid Layout */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(3, 1fr)', 
        gap: isMobile ? '0.375rem' : '0.5rem', 
        marginBottom: isMobile ? '0.75rem' : '1rem',
        padding: isMobile ? '0.5rem' : '0.75rem',
        background: 'var(--panel-hover, #f8fafc)',
        borderRadius: '0.5rem',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.125rem' : '0.25rem' }}>
          <span style={{ fontSize: isMobile ? '0.625rem' : '0.7rem', color: 'var(--text-muted, #6b7280)' }}>{t('present_label')}</span>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: isMobile ? '1.5rem' : '2rem',
            height: isMobile ? '1.25rem' : '1.5rem',
            borderRadius: '0.25rem',
            fontWeight: 500,
            background: student.attendanceStats?.present > 0 ? '#dcfce7' : '#f3f4f6',
            color: student.attendanceStats?.present > 0 ? '#166534' : '#374151',
            fontSize: isMobile ? '0.625rem' : '0.7rem',
            padding: '0 0.25rem'
          }}>
            {student.attendanceStats?.present || 0}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.125rem' : '0.25rem' }}>
          <span style={{ fontSize: isMobile ? '0.625rem' : '0.7rem', color: 'var(--text-muted, #6b7280)' }}>{t('late_label')}</span>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: isMobile ? '1.5rem' : '2rem',
            height: isMobile ? '1.25rem' : '1.5rem',
            borderRadius: '0.25rem',
            fontWeight: 500,
            background: student.attendanceStats?.late > 0 ? '#fef3c7' : '#f3f4f6',
            color: student.attendanceStats?.late > 0 ? '#92400e' : '#374151',
            fontSize: isMobile ? '0.625rem' : '0.7rem',
            padding: '0 0.25rem'
          }}>
            {student.attendanceStats?.late || 0}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.125rem' : '0.25rem' }}>
          <span style={{ fontSize: isMobile ? '0.625rem' : '0.7rem', color: 'var(--text-muted, #6b7280)' }}>{t('absent_label')}</span>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: isMobile ? '1.5rem' : '2rem',
            height: isMobile ? '1.25rem' : '1.5rem',
            borderRadius: '0.25rem',
            fontWeight: 500,
            background: student.attendanceStats?.absent > 0 ? '#fee2e2' : '#f3f4f6',
            color: student.attendanceStats?.absent > 0 ? '#991b1b' : '#374151',
            fontSize: isMobile ? '0.625rem' : '0.7rem',
            padding: '0 0.25rem'
          }}>
            {student.attendanceStats?.absent || 0}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.125rem' : '0.25rem' }}>
          <span style={{ fontSize: isMobile ? '0.625rem' : '0.7rem', color: 'var(--text-muted, #6b7280)' }}>{t('absent_excused_label')}</span>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: isMobile ? '1.5rem' : '2rem',
            height: isMobile ? '1.25rem' : '1.5rem',
            borderRadius: '0.25rem',
            fontWeight: 500,
            background: student.attendanceStats?.absentWithExcuse > 0 ? '#dbeafe' : '#f3f4f6',
            color: student.attendanceStats?.absentWithExcuse > 0 ? '#1e40af' : '#374151',
            fontSize: isMobile ? '0.625rem' : '0.7rem',
            padding: '0 0.25rem'
          }}>
            {student.attendanceStats?.absentWithExcuse || 0}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.125rem' : '0.25rem' }}>
          <span style={{ fontSize: isMobile ? '0.625rem' : '0.7rem', color: 'var(--text-muted, #6b7280)' }}>{t('excused_leave_label')}</span>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: isMobile ? '1.5rem' : '2rem',
            height: isMobile ? '1.25rem' : '1.5rem',
            borderRadius: '0.25rem',
            fontWeight: 500,
            background: student.attendanceStats?.excusedLeave > 0 ? '#f3e8ff' : '#f3f4f6',
            color: student.attendanceStats?.excusedLeave > 0 ? '#6b21a8' : '#374151',
            fontSize: isMobile ? '0.625rem' : '0.7rem',
            padding: '0 0.25rem'
          }}>
            {student.attendanceStats?.excusedLeave || 0}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.125rem' : '0.25rem' }}>
          <span style={{ fontSize: isMobile ? '0.625rem' : '0.7rem', color: 'var(--text-muted, #6b7280)' }}>{t('humanitarian_label')}</span>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: isMobile ? '1.5rem' : '2rem',
            height: isMobile ? '1.25rem' : '1.5rem',
            borderRadius: '0.25rem',
            fontWeight: 500,
            background: student.attendanceStats?.humanitarianCase > 0 ? ACTIVITY_COLORS.humanitarian : '#f3f4f6',
            color: student.attendanceStats?.humanitarianCase > 0 ? '#ffffff' : '#374151',
            fontSize: isMobile ? '0.625rem' : '0.7rem',
            padding: '0 0.25rem'
          }}>
            {student.attendanceStats?.humanitarianCase || 0}
          </span>
        </div>
      </div>
      
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        gap: isMobile ? '0.25rem' : '0.5rem',
        flexWrap: isMobile ? 'wrap' : 'nowrap'
      }}>
        {isMobile && canUseStatsPanel && (
          <PortalTooltip content={t('view_details')} position="top">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleStudentSelect}
          >
            {getThemedIcon('ui', 'sidebar_open', 16)}
          </Button>
          </PortalTooltip>
        )}
        {canUseZapPanel && (
          <PortalTooltip content={t('actions')} position="top">
          <Button 
            variant="ghost" 
            size={isMobile ? 'icon' : 'sm'}
            onClick={handleStudentAction}
            style={isMobile ? {} : { flex: 1 }}
          >
            {isMobile ? (
              <ZapIcon style={{ width: '16px', height: '16px', color: '#f59e0b' }} />
            ) : t('actions')}
          </Button>
          </PortalTooltip>
        )}
        {!isMobile && canUseStatsPanel && (
          <PortalTooltip content={t('stats')} position="top">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleStudentSelect}
            style={{ flex: 1 }}
          >
            {t('stats')}
          </Button>
          </PortalTooltip>
        )}

        <PortalTooltip 
          content={t('open_qr_code')}
          position="top"
        >
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleQRNavigate}
            aria-label={t('open_qr_code')}
            style={{ display: 'none' }}
          >
            {getThemedIcon('ui', 'qr_code', 16)}
          </Button>
        </PortalTooltip>
      </div>
      
      {isExpanded && studentHistory[student.id] && (
        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border, #e5e7eb)' }}>
          <StudentRosterHistory 
            student={student}
            studentHistory={studentHistory}
            expandedDays={expandedDays}
            activeFilters={activeFilters}
            toggleDayExpansion={toggleDayExpansion}
            expandAllDays={expandAllDays}
            collapseAllDays={collapseAllDays}
            handleDeleteAttendance={handleDeleteAttendance}
            handleDeleteParticipation={handleDeleteParticipation}
            handleDeleteBehavior={handleDeleteBehavior}
            handleDeletePenalty={handleDeletePenalty}
            t={t}
            isRTL={isRTL}
            groupLogsByDay={groupLogsByDay}
            toggleFilter={toggleFilter}
            lang={lang}
            historyLoading={historyLoading}
            canDeleteAttendance={canDeleteAttendance}
          />
        </div>
      )}
    </div>
  );
};

export default StudentCard;

