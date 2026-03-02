import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import logger from '@utils/logger';
import { Button, Input } from '@ui';
import { useAuth } from '@contexts/AuthContext';
import { useTheme } from '@contexts/ThemeContext';
import { getThemedIcon } from '@constants/iconTypes';
import { markAttendance } from '@services/business/attendanceService';
import { ATTENDANCE_STATUS, ATTENDANCE_STATUS_LABELS, getAttendanceIcon, getAttendanceColor, getAttendanceLabel } from '@constants/attendanceTypes';
import { getAvatarColor, getAvatarInitials } from '@utils/avatarUtils';
import { BEHAVIOR_TYPES, getBehaviorLabel, getBehaviorIcon, getBehaviorColor } from '@constants/behaviorTypes';
import { PARTICIPATION_TYPES, getParticipationLabel, getParticipationIcon, getParticipationColor } from '@constants/participationTypes';
import { RECORD_TYPES } from '@utils/sharedTypes';
import { getFavoriteBehaviors, addFavoriteBehavior, removeFavoriteBehavior } from '@services/business/userPreferenceService';
import { useLang } from '@contexts/LangContext';
import { useToast } from '@ui';
import PortalTooltip from '@ui/PortalTooltip';

export default function StudentActionZapPanel({
  student,
  onClose,
  onBehaviorSubmit,
  onParticipationSubmit,
  onPenaltySubmit,
  onMarkAttendance,
  options,
  showFavoritesOnly = false,
  onToggleFavorites = () => {},
  selectedDate,
  sendNotifications = false,
  onToggleNotifications,
  initialTab = RECORD_TYPES.PARTICIPATION
}) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t, lang, isRTL } = useLang();
  const { showSuccess, showError } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedActions, setSelectedActions] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
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

  useEffect(() => {
    const loadFavoriteBehaviors = async () => {
      if (user) {
        try {
          const favorites = await getFavoriteBehaviors(user.uid);
          setFavoriteBehaviors(favorites);
        } catch (error) {
          logger.error('Error loading favorite behaviors:', error);
        }
      }
    };
    loadFavoriteBehaviors();
  }, [user]);

  const attendanceStatus = useMemo(() => {
    const status = student?.attendance;
    
    if (status && status !== 'absent_no_excuse') {
      const statusInfo = ATTENDANCE_STATUS_LABELS[status];
      if (statusInfo) {
        logger.log('🔧 Using direct attendance status:', status, statusInfo);
        return statusInfo;
      }
    }
    
    logger.log('🔧 No valid attendance found - showing None');
    return {
      en: t('none') || 'None',
      ar: t('none') || 'لا شيء',
      color: '#9ca3af'
    };
  }, [student?.attendance, t]);

  const avatarColor = useMemo(() => getAvatarColor(student?.name || ''), [student?.name]);

  const toggleSection = useCallback((section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  const renderIcon = (iconName, style = {}) => {
    const behaviorIcon = getBehaviorIcon(iconName);
    const behaviorColor = getBehaviorColor(iconName);
    
    const participationIcon = getParticipationIcon(iconName);
    const participationColor = getParticipationColor(iconName);
    
    let finalIconName = iconName;
    let finalColor = style.color || '#374151';
    
    if (BEHAVIOR_TYPES.find(bt => bt.id === iconName)) {
      finalIconName = behaviorIcon;
      finalColor = behaviorColor;
    } else if (PARTICIPATION_TYPES.find(pt => pt.id === iconName)) {
      finalIconName = participationIcon;
      finalColor = participationColor;
    }
    
    const iconMap = {
      MessageSquare: getThemedIcon('ui', 'message_square', style.width || 16, theme),
      AlertCircleIcon: getThemedIcon('ui', 'alert_circle', style.width || 16, theme),
      AlertTriangle: getThemedIcon('ui', 'alert_triangle', style.width || 16, theme),
      CheckCircle: getThemedIcon('ui', 'check_circle', style.width || 16, theme),
      Clock: getThemedIcon('ui', 'clock', style.width || 16, theme),
      XCircle: getThemedIcon('ui', 'x_circle', style.width || 16, theme),
      Heart: getThemedIcon('ui', 'heart', style.width || 16, theme),
      HelpCircle: getThemedIcon('ui', 'help_circle', style.width || 16, theme),
      Users: getThemedIcon('ui', 'users', style.width || 16, theme),
      Bed: getThemedIcon('ui', 'bed', style.width || 16, theme),
    };
    
    return iconMap[finalIconName] || iconMap.AlertCircleIcon;
  };

  const getAttendanceIconComponent = (status) => {
    const iconName = getAttendanceIcon(status);
    const iconColor = getAttendanceColor(status);
    
    const iconMap = {
      CheckCircle: <CheckCircleIcon style={{ width: 16, height: 16, color: iconColor }} />,
      Clock: <ClockIcon style={{ width: 16, height: 16, color: iconColor }} />,
      AlertCircle: <AlertCircleIcon style={{ width: 16, height: 16, color: iconColor }} />,
      XCircle: <XCircleIcon style={{ width: 16, height: 16, color: iconColor }} />,
      Heart: <HeartIcon style={{ width: 16, height: 16, color: iconColor }} />,
      HelpCircle: <HelpCircleIcon style={{ width: 16, height: 16, color: iconColor }} />
    };
    
    return iconMap[iconName] || iconMap.HelpCircle;
  };

  const filteredOptions = useMemo(() => {
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
    } catch (error) {
      logger.error('Error toggling favorite behavior:', error);
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
        await onBehaviorSubmit(student.docId || student.id, behaviorActions, internalNote, actionPoints);
      }
      if (participationActions.length > 0) {
        await onParticipationSubmit(student.docId || student.id, participationActions, internalNote, actionPoints);
      }
      if (penaltyActions.length > 0) {
        await onPenaltySubmit(student.docId || student.id, penaltyActions, internalNote, actionPoints);
      }
      
      setSelectedActions([]);
      setInternalNote('');
      setActionPoints({});
      showSuccess(t('actions_saved_successfully'));
      onClose();
    } catch (error) {
      logger.error('Error saving actions:', error);
      showError(t('failed_to_save_actions'));
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedActions, actionPoints, internalNote, student?.id, student?.docId, onBehaviorSubmit, onParticipationSubmit, onPenaltySubmit, onClose, t, showSuccess, showError]);

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
        maxWidth: isMobile ? '100%' : '28rem',
        height: '100%',
        background: 'var(--panel, white)',
        boxShadow: isRTL ? '4px 0 24px rgba(0,0,0,0.1)' : '-4px 0 24px rgba(0,0,0,0.1)',
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '100%',
        overflow: 'hidden'
      }}>
      <div style={{ padding: '0.8rem', borderBottom: '1px solid var(--border, #e5e7eb)' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '9999px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 500,
              background: avatarColor.bg,
              color: avatarColor.color
            }}>
              {getInitials(student.displayName || student.realName || student.name || '')}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ fontWeight: 600, color: 'var(--text, #111827)', margin: 0, fontSize: '0.75rem' }}>
                  {student.displayName || student.realName || student.name || student.email || t('unknown_student')}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  {attendanceStatus && (
                    <>
                      <span style={{
                        width: '0.375rem',
                        height: '0.375rem',
                        background: attendanceStatus.color,
                        borderRadius: '9999px'
                      }} />
                      {student?.attendance !== 'present' && attendanceStatus && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #6b7280)' }}>
                          {lang === 'ar' ? (attendanceStatus.ar || attendanceStatus.en) : attendanceStatus.en}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div style={{ 
                fontSize: '0.875rem', 
                color: 'var(--text-muted, #6b7280)', 
                marginTop: '0.125rem',
                fontFamily: 'monospace',
                background: 'var(--panel-hover, #f3f4f6)',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.25rem',
                display: 'inline-block',
                fontWeight: 600
              }}>
                ID: STU-{student.studentNumber || '0000'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: isRTL ? 0 : 'auto', marginRight: isRTL ? 'auto' : 0 }}>
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
            onClick={() => setActiveTab(RECORD_TYPES.PARTICIPATION)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.5rem 0.75rem',
              fontSize: '0.8125rem',
              borderRadius: '0.375rem',
              border: '1px solid var(--border, #e2e8f0)',
              background: activeTab === RECORD_TYPES.PARTICIPATION ? 'var(--color-primary, #3b82f6)' : 'var(--panel-hover, #f8fafc)',
              color: activeTab === RECORD_TYPES.PARTICIPATION ? 'white' : 'var(--text-muted, #64748b)',
              cursor: 'pointer',
              boxShadow: activeTab === RECORD_TYPES.PARTICIPATION ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            {getThemedIcon('ui', 'users', 14, theme)}
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
              color: activeTab === RECORD_TYPES.BEHAVIOR ? 'white' : 'var(--text-muted, #64748b)',
              cursor: 'pointer',
              boxShadow: activeTab === RECORD_TYPES.BEHAVIOR ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            {getThemedIcon('ui', 'zap', 14, theme)}
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
              color: activeTab === RECORD_TYPES.PENALTY ? 'white' : 'var(--text-muted, #64748b)',
              cursor: 'pointer',
              boxShadow: activeTab === RECORD_TYPES.PENALTY ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            {getThemedIcon('ui', 'alert_circle', 14, theme)}
            {t('penalty')}
          </button>
          <div style={{ position: 'absolute', right: '0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
          </div>
        </div>

        <div style={{ marginBottom: '0.5rem', marginTop: '1rem' }}>
          <div style={{
            display: viewMode === 'grid' ? 'grid' : 'flex',
            gridTemplateColumns: viewMode === 'grid' ? 'repeat(3, 1fr)' : 'none',
            flexDirection: viewMode === 'list' ? 'column' : 'row',
            gap: viewMode === 'grid' ? '0.25rem' : '0.125rem'
          }}>
            {options.filter(option => {
              if (activeTab === RECORD_TYPES.BEHAVIOR) return option.category === RECORD_TYPES.BEHAVIOR;
              if (activeTab === RECORD_TYPES.PARTICIPATION) return option.category === RECORD_TYPES.PARTICIPATION;
              if (activeTab === RECORD_TYPES.PENALTY) return option.category === RECORD_TYPES.PENALTY;
              return true;
            }).sort((a, b) => {
              const aIsFavorite = favoriteBehaviors.includes(a.id);
              const bIsFavorite = favoriteBehaviors.includes(b.id);
              
              if (aIsFavorite && !bIsFavorite) return -1;
              if (!aIsFavorite && bIsFavorite) return 1;
              
              const aLabel = lang === 'ar' ? (a.label_ar || a.label_en) : a.label_en;
              const bLabel = lang === 'ar' ? (b.label_ar || b.label_en) : b.label_en;
              return aLabel.localeCompare(bLabel);
            }).map((option) => {
              const isSelected = selectedActions.some(a => a.id === option.id);
              
              return (
                <div
                  key={option.id}
                  style={{
                    padding: viewMode === 'grid' ? '0.5rem' : '0.375rem 0.5rem',
                    borderRadius: '0.5rem',
                    border: `2px solid ${isSelected ? 'var(--color-purple, #8b5cf6)' : 'var(--border, #e5e7eb)'}`,
                    background: isSelected ? 'var(--color-purple-light, rgba(139, 92, 246, 0.05))' : 'transparent',
                    transition: 'all 0.2s',
                    position: 'relative',
                    cursor: 'pointer'
                  }}
                  onClick={() => toggleAction(option)}
                >
                  <div style={{
                    display: 'flex',
                    flexDirection: viewMode === 'grid' ? 'column' : 'row',
                    alignItems: viewMode === 'grid' ? 'center' : 'center',
                    gap: viewMode === 'grid' ? '0.125rem' : '0.5rem',
                    textAlign: viewMode === 'grid' ? 'center' : 'left'
                  }}>
                    <div style={{
                      width: viewMode === 'grid' ? '2rem' : '1.5rem',
                      height: viewMode === 'grid' ? '2rem' : '1.5rem',
                      borderRadius: '0.375rem',
                      background: option.color + '20',
                      color: option.color,
                      border: `1px solid ${option.color}40`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {renderIcon(option.icon, { width: viewMode === 'grid' ? '1rem' : '0.875rem', height: viewMode === 'grid' ? '1rem' : '0.875rem' })}
                    </div>
                    <span style={{
                      fontSize: viewMode === 'grid' ? '0.75rem' : '0.8125rem',
                      fontWeight: 500,
                      color: 'var(--text, #111827)',
                      lineHeight: '1.2',
                      flex: 1
                    }}>
                      {lang === 'ar' ? (option.label_ar || option.label_en) : option.label_en}
                    </span>
                    {option.category !== RECORD_TYPES.ATTENDANCE && (
                      <div style={{
                        fontSize: viewMode === 'grid' ? '0.75rem' : '0.8125rem',
                        fontWeight: 600,
                        color: (actionPoints[option.id] || 0) >= 0 ? 'var(--color-success-dark, #059669)' : 'var(--color-danger-dark, #dc2626)',
                        flexShrink: 0,
                        marginLeft: '0.25rem'
                      }}>
                        {(actionPoints[option.id] || 0) >= 0 ? '+' : ''}{actionPoints[option.id] || 0}
                      </div>
                    )}
                  </div>
                  
                  <PortalTooltip content={favoriteBehaviors.includes(option.id) ? t('remove_from_favorites') : t('add_to_favorites')} position="top">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(option.id);
                    }}
                    style={{
                      position: 'absolute',
                      top: '0.25rem',
                      right: '0.5rem',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.125rem'
                    }}
                  >
                    {getThemedIcon('ui', 'star', 12, theme)}
                  </button>
                  </PortalTooltip>
                  
                  {isSelected && (
                    <div style={{
                      marginTop: '0.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.125rem'
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
                          width: '1.5rem',
                          height: '1.5rem',
                          borderRadius: '0.375rem',
                          border: '1px solid var(--color-danger, #ef4444)',
                          background: 'var(--color-danger-light, #fef2f2)',
                          color: 'var(--color-danger, #ef4444)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1rem',
                          fontWeight: 'bold'
                        }}
                      >
                        −
                      </button>
                      </PortalTooltip>
                      <div style={{
                        width: '2rem',
                        height: '1.5rem',
                        border: '1px solid var(--border, #d1d5db)',
                        borderRadius: '0.375rem',
                        background: 'var(--input-bg, #ffffff)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
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
                          width: '1.5rem',
                          height: '1.5rem',
                          borderRadius: '0.375rem',
                          border: '1px solid var(--color-success, #10b981)',
                          background: 'var(--color-success-light, #f0fdf4)',
                          color: 'var(--color-success, #10b981)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1rem',
                          fontWeight: 'bold'
                        }}
                      >
                        +
                      </button>
                      </PortalTooltip>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {activeTab !== RECORD_TYPES.ATTENDANCE && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--text-muted, #6b7280)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.75rem'
            }}>
              {t('internal_note')}
            </h4>
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

      {activeTab !== RECORD_TYPES.ATTENDANCE && (
      <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border, #e5e7eb)' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button
            onClick={handleSaveActions}
            disabled={selectedActions.length === 0 || isSubmitting}
            style={{ 
              flex: 1, 
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
            style={{ fontSize: '0.875rem' }}
          >
            {t('cancel')}
          </Button>
        </div>
      </div>
      )}
    </div>
    </>
  );
}
