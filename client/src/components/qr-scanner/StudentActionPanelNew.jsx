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

export default function StudentActionPanelNew({
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
  initialTab = RECORD_TYPES.PARTICIPATION // Default to participation tab
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
  const [activeTab, setActiveTab] = useState(initialTab); // RECORD_TYPES.BEHAVIOR, RECORD_TYPES.PARTICIPATION, RECORD_TYPES.PENALTY
  const [viewMode, setViewMode] = useState('list'); // 'grid' or 'list'

  // Load favorite behaviors from user preferences
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

  // Get current attendance status
  const attendanceStatus = useMemo(() => {
    // If we have a direct status from student, use it
    const status = student?.attendance;
    
    // Check if status is actually a valid attendance status (not the default absent_no_excuse)
    if (status && status !== 'absent_no_excuse') {
      const statusInfo = ATTENDANCE_STATUS_LABELS[status];
      if (statusInfo) {
        console.log('🔧 Using direct attendance status:', status, statusInfo);
        return statusInfo;
      }
    }
    
    // If no valid attendance status, show None
    console.log('🔧 No valid attendance found - showing None');
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
    // Try to get icon from behavior types first
    const behaviorIcon = getBehaviorIcon(iconName);
    const behaviorColor = getBehaviorColor(iconName);
    
    // Try to get icon from participation types
    const participationIcon = getParticipationIcon(iconName);
    const participationColor = getParticipationColor(iconName);
    
    // Determine which type and color to use
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
      // Filter based on attendance status - only if attendanceStatus exists
      if (attendanceStatus && attendanceStatus.en === 'None') {
        return option.category !== RECORD_TYPES.ATTENDANCE;
      }
      return true;
    });
  }, [options, attendanceStatus]);

  // Clear selected actions when attendance status is None
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
      // Prepare actions with points override
      const actionsWithPoints = selectedActions.map(action => ({
        ...action,
        points: actionPoints[action.id] || action.points || 0
      }));
      
      // Group actions by category and call appropriate handlers
      const behaviorActions = actionsWithPoints.filter(action => action.category === RECORD_TYPES.BEHAVIOR);
      const participationActions = actionsWithPoints.filter(action => action.category === RECORD_TYPES.PARTICIPATION);
      const penaltyActions = actionsWithPoints.filter(action => action.category === RECORD_TYPES.PENALTY);
      
      // Call appropriate handlers
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
      onClose(); // Close panel after successful save
    } catch (error) {
      logger.error('Error saving actions:', error);
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
      {/* Overlay */}
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
        background: 'white',
        boxShadow: isRTL ? '4px 0 24px rgba(0,0,0,0.1)' : '-4px 0 24px rgba(0,0,0,0.1)',
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '100%',
        overflow: 'hidden'
      }}>
      {/* Header */}
      <div style={{ padding: '0.8rem', borderBottom: '1px solid #e5e7eb' }}>
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
                <h3 style={{ fontWeight: 600, color: '#111827', margin: 0, fontSize: '0.75rem' }}>
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
                      {/* Only show text for attendance status if it's not 'present' */}
                      {student?.attendance !== 'present' && attendanceStatus && (
                        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          {lang === 'ar' ? (attendanceStatus.ar || attendanceStatus.en) : attendanceStatus.en}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div style={{ 
                fontSize: '0.875rem', 
                color: '#6b7280', 
                marginTop: '0.125rem',
                fontFamily: 'monospace',
                background: '#f3f4f6',
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
            <div 
              onClick={onToggleNotifications}
              title={sendNotifications ? t('notifications_on') : t('notifications_off')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.25rem 0.5rem',
                background: sendNotifications ? '#f0fdf4' : '#fef2f2',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                border: `1px solid ${sendNotifications ? '#bbf7d0' : '#fecaca'}`,
                transition: 'all 0.2s',
                userSelect: 'none'
              }}
            >
              <div style={{
                width: '1.75rem',
                height: '0.875rem',
                background: sendNotifications ? '#10b981' : '#ef4444',
                borderRadius: '1rem',
                position: 'relative',
                transition: 'background 0.2s'
              }}>
                <div style={{
                  width: '0.625rem',
                  height: '0.625rem',
                  background: 'white',
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
                color: sendNotifications ? '#166534' : '#991b1b',
              }}>
                {t('notifs')}
              </span>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} title={t('close_panel')}>
              {getThemedIcon('ui', 'close', 20, theme)}
            </Button>
          </div>
        </div>
      </div>

      {/* Action Sections */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0.5rem' }}>
        {/* Tab Navigation */}
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
              border: '1px solid #e2e8f0',
              background: activeTab === RECORD_TYPES.PARTICIPATION ? '#3b82f6' : '#f8fafc',
              color: activeTab === RECORD_TYPES.PARTICIPATION ? 'white' : '#64748b',
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
              border: '1px solid #e2e8f0',
              background: activeTab === RECORD_TYPES.BEHAVIOR ? '#f97316' : '#f8fafc',
              color: activeTab === RECORD_TYPES.BEHAVIOR ? 'white' : '#64748b',
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
              border: '1px solid #e2e8f0',
              background: activeTab === RECORD_TYPES.PENALTY ? '#dc2626' : '#f8fafc',
              color: activeTab === RECORD_TYPES.PENALTY ? 'white' : '#64748b',
              cursor: 'pointer',
              boxShadow: activeTab === RECORD_TYPES.PENALTY ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            {getThemedIcon('ui', 'alert_circle', 14, theme)}
            {t('penalty')}
          </button>
          <div style={{ position: 'absolute', right: '0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.5rem 0.75rem',
                fontSize: '0.8125rem',
                borderRadius: '0.375rem',
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
                color: '#64748b',
                cursor: 'pointer',
                boxShadow: 'none'
              }}
              title={viewMode === 'grid' ? t('switch_to_list_view') : t('switch_to_grid_view')}
            >
              {viewMode === 'grid' ? getThemedIcon('ui', 'list', 14, theme) : getThemedIcon('ui', 'layout_grid', 14, theme)}
            </button>
          </div>
        </div>

        {/* Select Reason Grid */}
        <div style={{ marginBottom: '0.5rem', marginTop: '1rem' }}>
          <div style={{
            display: viewMode === 'grid' ? 'grid' : 'flex',
            gridTemplateColumns: viewMode === 'grid' ? 'repeat(3, 1fr)' : 'none',
            flexDirection: viewMode === 'list' ? 'column' : 'row',
            gap: viewMode === 'grid' ? '0.25rem' : '0.125rem'
          }}>
            {options.filter(option => {
              // Filter options based on active tab
              if (activeTab === RECORD_TYPES.BEHAVIOR) return option.category === RECORD_TYPES.BEHAVIOR;
              if (activeTab === RECORD_TYPES.PARTICIPATION) return option.category === RECORD_TYPES.PARTICIPATION;
              if (activeTab === RECORD_TYPES.PENALTY) return option.category === RECORD_TYPES.PENALTY;
              return true;
            }).sort((a, b) => {
              // Sort favorites to the top
              const aIsFavorite = favoriteBehaviors.includes(a.id);
              const bIsFavorite = favoriteBehaviors.includes(b.id);
              
              if (aIsFavorite && !bIsFavorite) return -1;
              if (!aIsFavorite && bIsFavorite) return 1;
              
              // Then sort by most recently used (if we have timestamp data) or by label
              // For now, sort by label to maintain consistent order
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
                    border: `2px solid ${isSelected ? '#8b5cf6' : '#e5e7eb'}`,
                    background: isSelected ? 'rgba(139, 92, 246, 0.05)' : 'transparent',
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
                      color: '#111827',
                      lineHeight: '1.2',
                      flex: 1
                    }}>
                      {lang === 'ar' ? (option.label_ar || option.label_en) : option.label_en}
                    </span>
                    {/* Only show points for behavior, participation, and penalty options, not attendance */}
                    {option.category !== RECORD_TYPES.ATTENDANCE && (
                      <div style={{
                        fontSize: viewMode === 'grid' ? '0.75rem' : '0.8125rem',
                        fontWeight: 600,
                        color: (actionPoints[option.id] || 0) >= 0 ? '#059669' : '#dc2626',
                        flexShrink: 0,
                        marginLeft: '0.25rem'
                      }}>
                        {(actionPoints[option.id] || 0) >= 0 ? '+' : ''}{actionPoints[option.id] || 0}
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(option.id);
                    }}
                    title={favoriteBehaviors.includes(option.id) ? t('remove_from_favorites') : t('add_to_favorites')}
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
                  
                  {/* Points Controls - Always show when selected */}
                  {isSelected && (
                    <div style={{
                      marginTop: '0.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.125rem'
                    }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const currentValue = actionPoints[option.id] || 0;
                          // Allow only negative values for behavior and penalty, only positive for participation
                          let newValue;
                          if (option.category === RECORD_TYPES.PARTICIPATION) {
                            newValue = Math.max(0, currentValue - 1); // Don't go below 0 for participation
                          } else {
                            newValue = Math.max(-10, currentValue - 1); // Allow negative for behavior/penalty
                          }
                          handlePointsChange(option.id, newValue);
                        }}
                        title={t('decrease_points')}
                        style={{
                          width: '1.5rem',
                          height: '1.5rem',
                          borderRadius: '0.375rem',
                          border: '1px solid #ef4444',
                          background: '#fef2f2',
                          color: '#ef4444',
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
                      <div style={{
                        width: '2rem',
                        height: '1.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        background: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        color: '#111827',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                      }}>
                        {actionPoints[option.id] || 0}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const currentValue = actionPoints[option.id] || 0;
                          // Allow only positive values for participation, only negative for behavior/penalty
                          let newValue;
                          if (option.category === RECORD_TYPES.PARTICIPATION) {
                            newValue = Math.min(10, currentValue + 1); // Allow positive for participation
                          } else {
                            newValue = Math.min(0, currentValue + 1); // Don't go above 0 for behavior/penalty
                          }
                          handlePointsChange(option.id, newValue);
                        }}
                        title={t('increase_points')}
                        style={{
                          width: '1.5rem',
                          height: '1.5rem',
                          borderRadius: '0.375rem',
                          border: '1px solid #10b981',
                          background: '#f0fdf4',
                          color: '#10b981',
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
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Internal Note Section - Hide for attendance tab */}
        {activeTab !== RECORD_TYPES.ATTENDANCE && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#6b7280',
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

      {/* Action Buttons - Hide for attendance tab */}
      {activeTab !== RECORD_TYPES.ATTENDANCE && (
      <div style={{ padding: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
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
