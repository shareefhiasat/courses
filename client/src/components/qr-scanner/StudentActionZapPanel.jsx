import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { info, error, warn, debug } from '@services/utils/logger.js';
import { Button, Input, Modal } from '@ui';
import { useAuth } from '@contexts/AuthContext';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon, getIconWithColor } from '@constants/iconTypes';
import { deleteAttendance } from '@services/business/attendanceServiceUnified.js';
import { ATTENDANCE_STATUS, ATTENDANCE_STATUS_LABELS, ATTENDANCE_TYPE_CATEGORY, ATTENDANCE_TYPES, ATTENDANCE_COLORS, STANDUP_ATTENDANCE_TYPES, getAttendanceIcon, getAttendanceColor, getAttendanceLabel, getLocalizedAttendanceLabel } from '@constants/attendanceTypes';
import { getAvatarColor, getAvatarInitials } from '@utils/avatarUtils';
import { useLookupTypes } from '@hooks/useLookupTypes.js';
import { useQRPermissions } from '@hooks/useQRPermissions';
import { useMobileDetect } from '@hooks/useMobileDetect';
// OLD: import { BEHAVIOR_TYPES, getBehaviorLabel, getBehaviorIcon, getBehaviorColor } from '@constants/behaviorTypes';
// OLD: import { PARTICIPATION_TYPES, getParticipationLabel, getParticipationIcon, getParticipationColor } from '@constants/participationTypes';
// NOW: Using useLookupTypes hook for behavior and participation types
import { RECORD_TYPES } from '@utils/sharedTypes';
import { getFavoriteBehaviors, addFavoriteBehavior, removeFavoriteBehavior } from '@services/business/userPreferenceService';
import { useLang } from '@contexts/LangContext';
import { useToast } from '@ui';
import PortalTooltip from '@ui/PortalTooltip';
import PanelHeader from './PanelHeader';

export default function StudentActionZapPanel({
  student,
  onClose,
  onBehaviorSubmit,
  onParticipationSubmit,
  onPenaltySubmit,
  onMarkAttendance,
  attendanceMode = ATTENDANCE_TYPE_CATEGORY.REGULAR,
  options = [],
  showFavoritesOnly = false,
  onToggleFavorites = () => {},
  selectedDate,
  sendNotifications = false,
  onToggleNotifications,
  initialTab = RECORD_TYPES.ATTENDANCE,
  classId,
  programId,
  subjectId,
  onUpdate
}) {
  // DEBUG: Log attendanceMode prop
  info('🔍 [DEBUG] StudentActionZapPanel received:', {
    attendanceMode,
    studentName: student?.name,
    classId,
    programId,
    subjectId,
    constants: ATTENDANCE_TYPE_CATEGORY
  });

  // Add CSS animation for spinner
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const { user } = useAuth();
  const { theme } = useTheme();
  const { data: lookupData } = useLookupTypes({
    types: ['behavior-types', 'participation-types']
  });
  const { t, lang, isRTL } = useLang();
  const { showSuccess, showError } = useToast();
  const { canDeleteAttendance, canEditAttendance } = useQRPermissions();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedActions, setSelectedActions] = useState([]);
  const { isMobile } = useMobileDetect();
  const [expandedSections, setExpandedSections] = useState({
    behavior: false,
    participation: false,
    penalty: false
  });
  const [internalNote, setInternalNote] = useState('');
  const [actionPoints, setActionPoints] = useState({});
  const [favoriteBehaviors, setFavoriteBehaviors] = useState([]);
  const [showEmailDropdown, setShowEmailDropdown] = useState(false);
  const [sendingQRCode, setSendingQRCode] = useState(false);
  const [sendingSummary, setSendingSummary] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [viewMode, setViewMode] = useState('list');
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    attendanceType: null,
    studentName: ''
  });
  const [isReloading, setIsReloading] = useState(false);

  // Check if student has any attendance for today
  const studentAttendanceStatus = student?.attendance || student?.standupStatus;
  const hasAttendance = !!studentAttendanceStatus;

  // If attendance exists and user doesn't have edit permission, disable attendance editing
  const shouldDisableAttendanceEdit = hasAttendance && !canEditAttendance;

  // Initialize attendance status from student prop to prevent initial flash of "None"
  const [currentAttendanceStatus, setCurrentAttendanceStatus] = useState(() => {
    if (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP) {
      return student?.standupStatus || null;
    } else {
      return student?.attendance ? String(student.attendance).toUpperCase() : null;
    }
  });

  // Sync currentAttendanceStatus when student prop changes (e.g. after roster reload)
  useEffect(() => {
    if (attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP) {
      setCurrentAttendanceStatus(student?.standupStatus || null);
    } else {
      setCurrentAttendanceStatus(student?.attendance ? String(student.attendance).toUpperCase() : null);
    }
  }, [student?.attendance, student?.standupStatus, attendanceMode]);

  useEffect(() => {
    const loadFavoriteBehaviors = async () => {
      if (user) {
        try {
          const favorites = await getFavoriteBehaviors(user.uid);
          setFavoriteBehaviors(favorites);
        } catch (err) {
          error('Error loading favorite behaviors:', err);
        }
      }
    };
    loadFavoriteBehaviors();
  }, [user]);

  const attendanceStatus = useMemo(() => {
    const status = currentAttendanceStatus;
    
    if (status) {
      const statusLabel = getLocalizedAttendanceLabel(status, lang);
      const statusColor = getAttendanceColor(status);
      if (statusLabel && statusColor) {
        info('🔧 Using current attendance status:', status, statusLabel, statusColor);
        return {
          en: statusLabel,
          ar: getLocalizedAttendanceLabel(status, 'ar'),
          color: statusColor
        };
      }
    }
    
    info('🔧 No valid attendance found - showing None');
    return {
      en: t('none') || 'None',
      ar: t('none') || 'لا شيء',
      color: '#9ca3af'
    };
  }, [currentAttendanceStatus, t, lang]);

  const avatarColor = useMemo(() => getAvatarColor(student?.name || ''), [student?.name]);

  const toggleSection = useCallback((section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  const renderIcon = (iconName, style = {}) => {
    const iconColor = style.color || 'currentColor';
    const iconMap = {
      MessageSquare: getThemedIcon('ui', 'message_square', style.width || 16, iconColor),
      AlertCircle: getThemedIcon('ui', 'alert_circle', style.width || 16, iconColor),
      AlertCircleIcon: getThemedIcon('ui', 'alert_circle', style.width || 16, iconColor),
      AlertTriangle: getThemedIcon('ui', 'alert_triangle', style.width || 16, iconColor),
      CheckCircle: getThemedIcon('ui', 'check_circle', style.width || 16, iconColor),
      Clock: getThemedIcon('ui', 'clock', style.width || 16, iconColor),
      XCircle: getThemedIcon('ui', 'x_circle', style.width || 16, iconColor),
      Heart: getThemedIcon('ui', 'heart', style.width || 16, iconColor),
      HelpCircle: getThemedIcon('ui', 'help_circle', style.width || 16, iconColor),
      Users: getThemedIcon('ui', 'users', style.width || 16, iconColor),
      Bed: getThemedIcon('ui', 'bed', style.width || 16, iconColor),
      Smartphone: getThemedIcon('ui', 'smartphone', style.width || 16, iconColor),
      Star: getThemedIcon('ui', 'star', style.width || 16, iconColor),
    };

    // Look up behavior type by numeric ID in lookup data
    const behaviorType = (lookupData['behavior-types'] || []).find(bt => bt.id === iconName);
    if (behaviorType) {
      return iconMap[behaviorType.icon] || iconMap.AlertTriangle;
    }

    // Look up participation type by numeric ID in lookup data
    const participationType = (lookupData['participation-types'] || []).find(pt => pt.id === iconName);
    if (participationType) {
      return iconMap[participationType.icon] || iconMap.MessageSquare;
    }

    // Look up penalty type by numeric ID in lookup data
    const penaltyType = (lookupData['penalty-types'] || []).find(pt => pt.id === iconName);
    if (penaltyType) {
      return iconMap[penaltyType.icon] || iconMap.AlertTriangle;
    }

    // Fallback: try iconMap directly, then default to alert circle
    return iconMap[iconName] || iconMap.AlertCircle;
  };



  const filteredOptions = useMemo(() => {
    if (!Array.isArray(options)) {
      return [];
    }
    return options.filter(option => {
      if (attendanceStatus && attendanceStatus.en === 'None') {
        return option.category !== RECORD_TYPES.ATTENDANCE;
      }
      return true;
    });
  }, [options, attendanceStatus]);

  useEffect(() => {
    if (attendanceStatus && attendanceStatus.en === 'None') {
      setSelectedActions([]);
    }
  }, [attendanceStatus]);

  const toggleAction = useCallback((option) => {
    setSelectedActions(prev => {
      const exists = prev.find(a => a.id === option.id);
      if (exists) {
        return prev.filter(a => a.id !== option.id);
      } else {
        return [...prev, { ...option, points: actionPoints[option.id] || option.points || 0 }];
      }
    });
  }, [actionPoints]);

  const handlePointsChange = useCallback((optionId, value) => {
    setActionPoints(prev => ({
      ...prev,
      [optionId]: value
    }));
  }, []);

  const onToggleFavorite = useCallback(async (optionId) => {
    if (!user) return;
    
    try {
      if (favoriteBehaviors.includes(optionId)) {
        await removeFavoriteBehavior(user.uid, optionId);
        setFavoriteBehaviors(prev => prev.filter(id => id !== optionId));
      } else {
        await addFavoriteBehavior(user.uid, optionId);
        setFavoriteBehaviors(prev => [...prev, optionId]);
      }
    } catch (err) {
      error('Error toggling favorite behavior:', err);
    }
  }, [user, favoriteBehaviors]);

  const handleSaveActions = useCallback(async () => {
    if (selectedActions.length === 0) {
      alert(t('please_select_at_least_one_action'));
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const actionsWithPoints = selectedActions.map(action => ({
        ...action,
        points: actionPoints[action.id] || action.points || 0
      }));
      
      const behaviorActions = actionsWithPoints.filter(action => action.category === RECORD_TYPES.BEHAVIOR);
      const participationActions = actionsWithPoints.filter(action => action.category === RECORD_TYPES.PARTICIPATION);
      const penaltyActions = actionsWithPoints.filter(action => action.category === RECORD_TYPES.PENALTY);
      
      if (behaviorActions.length > 0) {
        await onBehaviorSubmit(student.id, behaviorActions, internalNote, actionPoints);
      }
      if (participationActions.length > 0) {
        await onParticipationSubmit(student.id, participationActions, internalNote, actionPoints);
      }
      if (penaltyActions.length > 0) {
        await onPenaltySubmit(student.id, penaltyActions, internalNote, actionPoints);
      }
      
      setSelectedActions([]);
      setInternalNote('');
      setActionPoints({});
      showSuccess(t('actions_saved_successfully'));
      if (onUpdate) {
        onUpdate();
      }
      onClose();
    } catch (err) {
      error('Error saving actions:', err);
      showError(t('failed_to_save_actions'));
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedActions, actionPoints, internalNote, student?.id, onBehaviorSubmit, onParticipationSubmit, onPenaltySubmit, onClose, t, showSuccess, showError]);

  const getInitials = useCallback((name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, []);

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1999
        }}
        onClick={onClose}
      />
      <div dir={isRTL ? 'rtl' : 'ltr'} style={{
        position: 'fixed',
        top: 0,
        [isRTL ? 'left' : 'right']: 0,
        width: isMobile ? '100%' : '100%',
        maxWidth: isMobile ? '100%' : '36rem',
        height: '100%',
        background: 'var(--panel, white)',
        boxShadow: isRTL ? '4px 0 24px rgba(0,0,0,0.1)' : '-4px 0 24px rgba(0,0,0,0.1)',
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '100%',
        overflow: 'hidden'
      }}>
      {/* Global Loading Overlay */}
      {isSubmitting && !isReloading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          borderRadius: '0.75rem'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              border: '3px solid #f3f3f3',
              borderTop: '3px solid var(--color-primary, #3b82f6)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <div style={{
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--text, #111827)'
            }}>
              {t('saving') || 'Saving...'}
            </div>
          </div>
        </div>
      )}

      {/* Reload Indicator Overlay */}
      {isReloading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          borderRadius: '0.75rem'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid #f3f3f3',
              borderTop: '3px solid var(--color-success, #22c55e)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <div style={{
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--color-success, #22c55e)'
            }}>
              {getThemedIcon('ui', 'refresh_cw', 20, theme)}
              <span style={{ marginLeft: '0.5rem' }}>
                {t('reloading') || 'Reloading...'}
              </span>
            </div>
          </div>
        </div>
      )}
      <div style={{ padding: '0.8rem', borderBottom: '1px solid var(--border, #e5e7eb)' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem'
        }}>
          <PanelHeader
            student={student}
            attendanceStatus={attendanceStatus}
            t={t}
            lang={lang}
            isRTL={isRTL}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: isRTL ? 0 : 'auto', marginRight: isRTL ? 'auto' : 0 }}>
            {/* Notifications toggle hidden
            <PortalTooltip 
            content={sendNotifications ? t('notifications_on') : t('notifications_off')}
            position="top"
          >
            <div 
              onClick={onToggleNotifications}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.25rem 0.5rem',
                background: sendNotifications ? 'var(--color-success-light, #f0fdf4)' : 'var(--color-danger-light, #fef2f2)',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                border: `1px solid ${sendNotifications ? 'var(--color-success-border, #bbf7d0)' : 'var(--color-danger-border, #fecaca)'}`,
                transition: 'all 0.2s',
                userSelect: 'none'
              }}
            >
              <div style={{
                width: '1.75rem',
                height: '0.875rem',
                background: sendNotifications ? 'var(--color-success, #10b981)' : 'var(--color-danger, #ef4444)',
                borderRadius: '1rem',
                position: 'relative',
                transition: 'background 0.2s'
              }}>
                <div style={{
                  width: '0.625rem',
                  height: '0.625rem',
                  background: 'var(--toggle-knob, white)',
                  borderRadius: '50%',
                  position: 'absolute',
                  top: '0.125rem',
                  left: sendNotifications ? (isRTL ? '0.125rem' : '1rem') : (isRTL ? '1rem' : '0.125rem'),
                  transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                }} />
              </div>
              <span style={{ 
                fontSize: '0.625rem', 
                fontWeight: 600, 
                color: sendNotifications ? 'var(--color-success-dark, #166534)' : 'var(--color-danger-dark, #991b1b)',
              }}>
                {t('notifs')}
              </span>
            </div>
          </PortalTooltip>
            */}
            <PortalTooltip content={t('close_panel')} position="top">
            <Button variant="ghost" size="icon" onClick={onClose}>
              {getThemedIcon('ui', 'close', 20, theme)}
            </Button>
          </PortalTooltip>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', position: 'relative' }}>
          <button
            onClick={() => setActiveTab(RECORD_TYPES.ATTENDANCE)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.5rem 0.75rem',
              fontSize: '0.8125rem',
              borderRadius: '0.375rem',
              border: '1px solid var(--border, #e2e8f0)',
              background: activeTab === RECORD_TYPES.ATTENDANCE ? 'var(--color-success, #22c55e)' : 'var(--panel-hover, #f8fafc)',
              color: activeTab === RECORD_TYPES.ATTENDANCE ? 'white' : 'var(--color-success, #22c55e)',
              cursor: 'pointer',
              boxShadow: activeTab === RECORD_TYPES.ATTENDANCE ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            {activeTab === RECORD_TYPES.ATTENDANCE ? getIconWithColor('ui', 'check_circle', 14, 'white') : getIconWithColor('ui', 'check_circle', 14, 'var(--color-success, #22c55e)')}
            {t(attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? 'standup' : 'attendance')}
          </button>
          {attendanceMode !== ATTENDANCE_TYPE_CATEGORY.STANDUP && (
            <>
              <button
                onClick={() => setActiveTab(RECORD_TYPES.PARTICIPATION)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.8125rem',
                  borderRadius: '0.375rem',
                  border: '1px solid var(--border, #e2e8f0)',
                  background: activeTab === RECORD_TYPES.PARTICIPATION ? 'var(--color-info, #3b82f6)' : 'var(--panel-hover, #f8fafc)',
                  color: activeTab === RECORD_TYPES.PARTICIPATION ? 'white' : 'var(--color-info, #3b82f6)',
                  cursor: 'pointer',
                  boxShadow: activeTab === RECORD_TYPES.PARTICIPATION ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                {activeTab === RECORD_TYPES.PARTICIPATION ? getIconWithColor('ui', 'users', 14, 'white') : getIconWithColor('ui', 'users', 14, 'var(--color-info, #3b82f6)')}
                {t('participation')}
              </button>
              <button
                onClick={() => setActiveTab(RECORD_TYPES.BEHAVIOR)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.8125rem',
                  borderRadius: '0.375rem',
                  border: '1px solid var(--border, #e2e8f0)',
                  background: activeTab === RECORD_TYPES.BEHAVIOR ? 'var(--color-warning, #f97316)' : 'var(--panel-hover, #f8fafc)',
                  color: activeTab === RECORD_TYPES.BEHAVIOR ? 'white' : 'var(--color-warning, #f97316)',
                  cursor: 'pointer',
                  boxShadow: activeTab === RECORD_TYPES.BEHAVIOR ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                {activeTab === RECORD_TYPES.BEHAVIOR ? getIconWithColor('ui', 'zap', 14, 'white') : getIconWithColor('ui', 'zap', 14, 'var(--color-warning, #f97316)')}
                {t('behavior')}
              </button>
              <button
                onClick={() => setActiveTab(RECORD_TYPES.PENALTY)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.8125rem',
                  borderRadius: '0.375rem',
                  border: '1px solid var(--border, #e2e8f0)',
                  background: activeTab === RECORD_TYPES.PENALTY ? 'var(--color-danger, #dc2626)' : 'var(--panel-hover, #f8fafc)',
                  color: activeTab === RECORD_TYPES.PENALTY ? 'white' : 'var(--color-danger, #dc2626)',
                  cursor: 'pointer',
                  boxShadow: activeTab === RECORD_TYPES.PENALTY ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                {activeTab === RECORD_TYPES.PENALTY ? getIconWithColor('ui', 'alert_circle', 14, 'white') : getIconWithColor('ui', 'alert_circle', 14, 'var(--color-danger, #dc2626)')}
                {t('penalty')}
              </button>
            </>
          )}
          {attendanceMode !== ATTENDANCE_TYPE_CATEGORY.STANDUP && activeTab !== RECORD_TYPES.ATTENDANCE && (
            <PortalTooltip content={showFavoritesOnly ? t('show_all') : t('show_favorites_only')} position="top">
              <button
                onClick={() => onToggleFavorites()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.8125rem',
                  borderRadius: '0.375rem',
                  border: '1px solid var(--border, #e2e8f0)',
                  background: showFavoritesOnly ? 'var(--color-warning-light, #fef3c7)' : 'var(--panel-hover, #f8fafc)',
                  color: showFavoritesOnly ? '#fbbf24' : 'var(--text-muted, #64748b)',
                  cursor: 'pointer',
                  boxShadow: 'none'
                }}
              >
                {showFavoritesOnly ? getIconWithColor('ui', 'star', 14, '#fbbf24') : getThemedIcon('ui', 'star', 14, theme)}
              </button>
            </PortalTooltip>
          )}
          {attendanceMode !== ATTENDANCE_TYPE_CATEGORY.STANDUP && (
            <PortalTooltip content={viewMode === 'grid' ? t('switch_to_list_view') : t('switch_to_grid_view')} position="top">
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.8125rem',
                  borderRadius: '0.375rem',
                  border: '1px solid var(--border, #e2e8f0)',
                  background: 'var(--panel-hover, #f8fafc)',
                  color: 'var(--text-muted, #64748b)',
                  cursor: 'pointer',
                  boxShadow: 'none'
                }}
              >
                {viewMode === 'grid' ? getThemedIcon('ui', 'list', 14, theme) : getThemedIcon('ui', 'layout_grid', 14, theme)}
              </button>
            </PortalTooltip>
          )}
        </div>

        <div style={{ marginBottom: '0.5rem', marginTop: '1rem' }}>
          <div style={{
            display: viewMode === 'grid' ? 'grid' : 'flex',
            gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(170px, 1fr))' : 'none',
            flexDirection: viewMode === 'list' ? 'column' : 'row',
            gap: viewMode === 'grid' ? '0.625rem' : '0.5rem',
            width: '100%'
          }}>
            {activeTab === RECORD_TYPES.ATTENDANCE ? (
              // Attendance Cards - Show standup or regular based on mode
              (() => {
                const attendanceTypes = attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP ? STANDUP_ATTENDANCE_TYPES : ATTENDANCE_TYPES;
                const attendanceTypesArray = Object.entries(attendanceTypes).map(([key, value]) => {
                  const status = value || key;
                  return {
                    id: key,
                    label: key,
                    status: status, // Add the actual status value
                    icon: getAttendanceIcon(status) || 'HelpCircle',
                    color: getAttendanceColor(status) || '#6b7280',
                    label_en: getAttendanceLabel(status) || key,
                    label_ar: getLocalizedAttendanceLabel(status, 'ar') || key
                  };
                });
                info('🔍 [DEBUG] Attendance tab rendering:', {
                  attendanceMode,
                  isStandupMode: attendanceMode === ATTENDANCE_TYPE_CATEGORY.STANDUP,
                  attendanceTypes: attendanceTypesArray
                });
                return attendanceTypesArray;
              })().map((attendanceType) => (
                <button
                  key={attendanceType.id}
                  onClick={() => {
                    if (onMarkAttendance && student && !isSubmitting && !shouldDisableAttendanceEdit) {
                      info('🔧 [DEBUG] Opening confirmation dialog for attendance:', attendanceType.status);
                      setConfirmModal({
                        isOpen: true,
                        attendanceType: attendanceType,
                        studentName: student.displayName || student.realName || student.name
                      });
                    }
                  }}
                  disabled={isSubmitting || shouldDisableAttendanceEdit}
                  style={{
                    padding: '0.625rem 0.875rem',
                    borderRadius: '0.625rem',
                    border: `2px solid ${attendanceType.color}`,
                    background: `linear-gradient(135deg, ${attendanceType.color}08 0%, ${attendanceType.color}15 100%)`,
                    cursor: (isSubmitting || shouldDisableAttendanceEdit) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: '0.5rem',
                    minHeight: '2.75rem',
                    width: '100%',
                    position: 'relative',
                    overflow: 'hidden',
                    opacity: (isSubmitting || shouldDisableAttendanceEdit) ? 0.7 : 1
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.boxShadow = `0 4px 12px ${attendanceType.color}40`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    fontSize: '1rem',
                    lineHeight: 1,
                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))',
                    flexShrink: 0
                  }}>
                    {(() => {
                      return getIconWithColor('ui', attendanceType.icon.toLowerCase(), 20, attendanceType.color);
                    })()}
                  </div>
                  <span style={{
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    color: attendanceType.color,
                    textAlign: 'left',
                    lineHeight: 1.2,
                    textShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {lang === 'ar' ? attendanceType.label_ar : attendanceType.label_en}
                  </span>
                </button>
              ))
            ) : (
              // Behavior/Participation/Penalty Cards - Hidden in standup mode
              attendanceMode !== ATTENDANCE_TYPE_CATEGORY.STANDUP && (Array.isArray(options) ? options.filter(option => {
                if (activeTab === RECORD_TYPES.BEHAVIOR) return option.category === RECORD_TYPES.BEHAVIOR;
                if (activeTab === RECORD_TYPES.PARTICIPATION) return option.category === RECORD_TYPES.PARTICIPATION;
                if (activeTab === RECORD_TYPES.PENALTY) return option.category === RECORD_TYPES.PENALTY;
                return true;
              }).filter(option => {
                if (showFavoritesOnly) return favoriteBehaviors.includes(option.id);
                return true;
              }) : []).sort((a, b) => {
              const aIsFavorite = favoriteBehaviors.includes(a.id);
              const bIsFavorite = favoriteBehaviors.includes(b.id);

              if (aIsFavorite && !bIsFavorite) return -1;
              if (!aIsFavorite && bIsFavorite) return 1;

              const aLabel = lang === 'ar' ? (a.label_ar || a.label_en || '') : (a.label_en || a.label_ar || '');
              const bLabel = lang === 'ar' ? (b.label_ar || b.label_en || '') : (b.label_en || b.label_ar || '');
              return aLabel.localeCompare(bLabel);
            }).map((option) => { console.log('🔴 ZapPanel option:', { id: option.id, label_ar: option.label_ar, label_en: option.label_en, lang });
              const isSelected = selectedActions.some(a => a.id === option.id);

              return (
                <div
                  key={option.id || option.label_en || option.label_ar || Math.random().toString(36).substr(2, 9)}
                  style={{
                    padding: viewMode === 'grid' ? '0.75rem' : '0.625rem 0.75rem',
                    borderRadius: '0.625rem',
                    border: `2px solid ${isSelected ? 'var(--color-purple, #8b5cf6)' : 'var(--border, #e5e7eb)'}`,
                    background: isSelected ? 'var(--color-purple-light, rgba(139, 92, 246, 0.05))' : 'transparent',
                    transition: 'all 0.2s',
                    position: 'relative',
                    cursor: 'pointer',
                    minHeight: viewMode === 'grid' ? '5rem' : 'auto',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                  onClick={() => toggleAction(option)}
                >
                  <div style={{
                    display: 'flex',
                    flexDirection: viewMode === 'grid' ? 'column' : 'row',
                    alignItems: viewMode === 'grid' ? (isRTL ? 'flex-end' : 'flex-start') : 'center',
                    gap: viewMode === 'grid' ? '0.25rem' : '0.375rem',
                    textAlign: viewMode === 'grid' ? (isRTL ? 'right' : 'left') : (isRTL ? 'right' : 'left'),
                    justifyContent: viewMode === 'grid' ? 'space-between' : 'space-between',
                    paddingInlineEnd: '0.5rem',
                    paddingInlineStart: '0.5rem',
                    flex: 1
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      flex: 1,
                      overflow: 'hidden',
                      justifyContent: viewMode === 'grid' ? (isRTL ? 'flex-end' : 'flex-start') : 'center'
                    }}>
                      <div style={{
                        width: viewMode === 'grid' ? '2rem' : '1.75rem',
                        height: viewMode === 'grid' ? '2rem' : '1.75rem',
                        borderRadius: '0.5rem',
                        background: isSelected ? (option.color + '20') : (option.color + '15'),
                        color: isSelected ? option.color : (option.color + 'CC'),
                        border: `1px solid ${isSelected ? option.color : (option.color + '40')}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all 0.2s ease'
                      }}>
                        {renderIcon(option.icon, { width: viewMode === 'grid' ? '1rem' : '0.875rem', height: viewMode === 'grid' ? '1rem' : '0.875rem', color: option.color })}
                      </div>
                      <span style={{
                        fontSize: '0.9375rem',
                        fontWeight: 500,
                        color: 'var(--text, #111827)',
                        lineHeight: viewMode === 'grid' ? '1.3' : '1.3',
                        overflow: 'hidden',
                        textOverflow: viewMode === 'grid' ? 'ellipsis' : 'ellipsis',
                        whiteSpace: viewMode === 'grid' ? 'normal' : 'normal',
                        wordWrap: 'break-word',
                        flex: 1,
                        display: viewMode === 'grid' ? 'block' : 'inline',
                        maxHeight: viewMode === 'grid' ? '2.6rem' : 'none'
                      }}>
                        {lang === 'ar' ? (option.label_ar || option.label_en) : option.label_en}
                      </span>
                    </div>
                    {option.category !== RECORD_TYPES.ATTENDANCE && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        flexShrink: 0
                      }}>
                        {/* Always show bookmark star if item is bookmarked */}
                        {favoriteBehaviors.includes(option.id) && (
                          <PortalTooltip content={t('remove_from_favorites')} position="top">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleFavorite(option.id);
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '0.125rem',
                                flexShrink: 0
                              }}
                            >
                              {getIconWithColor('ui', 'star', 12, '#fbbf24')}
                            </button>
                          </PortalTooltip>
                        )}
                        {isSelected ? (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}>
                            <PortalTooltip content={t('decrease_points')} position="top">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const currentValue = actionPoints[option.id] || 0;
                                let newValue;
                                if (option.category === RECORD_TYPES.PARTICIPATION) {
                                  newValue = Math.max(0, currentValue - 1);
                                } else {
                                  newValue = Math.max(-10, currentValue - 1);
                                }
                                handlePointsChange(option.id, newValue);
                              }}
                              style={{
                                width: '1.875rem',
                                height: '1.875rem',
                                borderRadius: '0.5rem',
                                border: '1px solid var(--color-danger, #ef4444)',
                                background: 'var(--color-danger-light, #fef2f2)',
                                color: 'var(--color-danger, #ef4444)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.125rem',
                                fontWeight: 'bold'
                              }}
                            >
                              −
                            </button>
                            </PortalTooltip>
                            <div style={{
                              width: '2.25rem',
                              height: '1.875rem',
                              border: '1px solid var(--border, #d1d5db)',
                              borderRadius: '0.5rem',
                              background: 'var(--input-bg, #ffffff)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.875rem',
                              fontWeight: '700',
                              color: 'var(--text, #111827)',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                            }}>
                              {actionPoints[option.id] || 0}
                            </div>
                            <PortalTooltip content={t('increase_points')} position="top">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const currentValue = actionPoints[option.id] || 0;
                                let newValue;
                                if (option.category === RECORD_TYPES.PARTICIPATION) {
                                  newValue = Math.min(10, currentValue + 1);
                                } else {
                                  newValue = Math.min(0, currentValue + 1);
                                }
                                handlePointsChange(option.id, newValue);
                              }}
                              style={{
                                width: '1.875rem',
                                height: '1.875rem',
                                borderRadius: '0.5rem',
                                border: '1px solid var(--color-success, #10b981)',
                                background: 'var(--color-success-light, #f0fdf4)',
                                color: 'var(--color-success, #10b981)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.125rem',
                                fontWeight: 'bold'
                              }}
                            >
                              +
                            </button>
                            </PortalTooltip>
                            {/* Don't show bookmark star here - it's already shown above for all bookmarked items */}
                          </div>
                        ) : (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            flexShrink: 0
                          }}>
                            {/* Show bookmark star for unselected but bookmarked items */}
                            {favoriteBehaviors.includes(option.id) && (
                              <PortalTooltip content={t('remove_from_favorites')} position="top">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleFavorite(option.id);
                                  }}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '0.125rem',
                                    flexShrink: 0
                                  }}
                                >
                                  {getIconWithColor('ui', 'star', 12, '#fbbf24')}
                                </button>
                              </PortalTooltip>
                            )}
                            {/* Show bookmark/unbookmark button for non-bookmarked items */}
                            {!favoriteBehaviors.includes(option.id) && (
                              <PortalTooltip content={t('add_to_favorites')} position="top">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleFavorite(option.id);
                                  }}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '0.125rem',
                                    flexShrink: 0
                                  }}
                                >
                                  {getThemedIcon('ui', 'star', 12, theme)}
                                </button>
                              </PortalTooltip>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
            )}
          </div>
        </div>

        {activeTab !== RECORD_TYPES.ATTENDANCE && attendanceMode !== ATTENDANCE_TYPE_CATEGORY.STANDUP && (
          <div style={{ marginBottom: '1rem' }}>
            <Input
              type="text"
              placeholder={t('add_details')}
            value={internalNote}
            onChange={(e) => setInternalNote(e.target.value)}
            style={{
              fontSize: '0.875rem',
              width: '100%'
            }}
            />
        </div>
        )}

      </div>

      {activeTab !== RECORD_TYPES.ATTENDANCE && attendanceMode !== ATTENDANCE_TYPE_CATEGORY.STANDUP && (
      <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border, #e5e7eb)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Button
            onClick={handleSaveActions}
            disabled={selectedActions.length === 0 || isSubmitting}
            fullWidth={true}
            style={{
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            {isSubmitting ? (
              <>
                <div style={{
                  width: '14px',
                  height: '14px',
                  border: '2px solid currentColor',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                <span>{t('saving') || 'Saving...'}</span>
              </>
            ) : (
              <>{t('save_actions')} ({selectedActions.length})</>
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            fullWidth={true}
            style={{ 
              fontSize: '0.875rem' 
            }}
          >
            {t('cancel')}
          </Button>
        </div>
      </div>
      )}

      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, attendanceType: null, studentName: '' })}
        title={t('confirm_attendance') || 'Confirm Attendance'}
        size="small"
        titleStyle={{ fontSize: '1rem', fontWeight: '600' }}
        showCloseButton={true}
        closeOnOverlayClick={true}
        closeOnEscape={true}
      >
        <div style={{ padding: '1rem 0' }}>
          <p style={{ 
            fontSize: '1rem', 
            lineHeight: 1.5,
            color: 'var(--text, #111827)',
            marginBottom: '1.5rem'
          }}>
            {t('mark_attendance_confirmation', {
              studentName: confirmModal.studentName,
              attendanceType: confirmModal.attendanceType ? 
                (lang === 'ar' ? confirmModal.attendanceType.label_ar : confirmModal.attendanceType.label_en) : ''
            }) || `${t('mark')} ${confirmModal.studentName} ${t('as')} ${confirmModal.attendanceType ? 
              (lang === 'ar' ? confirmModal.attendanceType.label_ar : confirmModal.attendanceType.label_en) : ''}?`}
          </p>
        </div>
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem', 
          justifyContent: 'flex-end',
          padding: '1rem 0 0 0',
          borderTop: '1px solid var(--border, #e5e7eb)'
        }}>
          <Button
            variant="ghost"
            onClick={() => setConfirmModal({ isOpen: false, attendanceType: null, studentName: '' })}
          >
            {t('cancel') || 'Cancel'}
          </Button>
          <Button
            onClick={async () => {
              info('🔧 [DEBUG] Confirm button onClick handler called');
              if (confirmModal.attendanceType && student && !isSubmitting) {
                info('🔧 [DEBUG] Confirm button clicked, marking attendance for:', confirmModal.attendanceType.status);
                setIsSubmitting(true);
                setConfirmModal({ isOpen: false, attendanceType: null, studentName: '' });
                try {
                  const result = await onMarkAttendance(
                    student.id,
                    confirmModal.attendanceType.status,
                    programId || student.programId,
                    subjectId || student.subjectId
                  );

                  if (result && result.success) {
                    showSuccess(t('attendance_marked_successfully'));
                    // Call onUpdate to refresh student data
                    if (onUpdate) {
                      onUpdate();
                    }
                    // Show reload indicator before closing
                    setIsReloading(true);
                    setTimeout(() => {
                      onClose();
                    }, 800); // Brief delay to show reload state
                  } else {
                    showError((result && result.error) || t('failed_to_mark_attendance'));
                    setIsSubmitting(false);
                  }
                } catch (err) {
                  console.error('Error marking attendance:', err);
                  showError(t('failed_to_mark_attendance'));
                  setIsSubmitting(false);
                }
              }
            }}
            disabled={isSubmitting}
          >
            {t('confirm') || 'Confirm'}
          </Button>
        </div>
      </Modal>
    </div>
    </>
  );
}
