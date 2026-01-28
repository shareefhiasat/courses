import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import logger from '../../utils/logger';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { StarIcon, ChevronDownIcon, ChevronRightIcon, Star, Mail, ChevronDown, Users, Zap, AlertCircle, Plus, Minus, Grid, List } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { markAttendance } from '../../firebase/attendance';
import { ATTENDANCE_STATUS, ATTENDANCE_STATUS_LABELS } from '../../firebase/attendance';
import { XIcon, HistoryIcon, TypeIcon } from '../../components/shared/Icons';
import { getAvatarColor, getAvatarInitials } from '../../utils/avatarUtils';
import { BEHAVIOR_TYPES, getBehaviorLabel, getBehaviorIcon, getBehaviorColor } from '../../constants/behaviorTypes';
import { PARTICIPATION_TYPES, getParticipationLabel, getParticipationIcon, getParticipationColor } from '../../constants/participationTypes';
import { getFavoriteBehaviors, addFavoriteBehavior, removeFavoriteBehavior } from '../../firebase/userPreferences';
import { useLang } from '../../contexts/LangContext';
import { useToast } from '../ui';

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
  onToggleNotifications
}) {
  const { user } = useAuth();
  const { t, lang, isRTL } = useLang();
  const { showSuccess, showError } = useToast();
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
  const [activeTab, setActiveTab] = useState('behavior'); // 'behavior', 'participation', 'penalty'
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
  const attendanceStatus = useMemo(() => 
    ATTENDANCE_STATUS_LABELS[student?.attendance] || ATTENDANCE_STATUS_LABELS.present,
    [student?.attendance]
  );

  const avatarColor = useMemo(() => getAvatarColor(student?.name || ''), [student?.name]);

  const toggleSection = useCallback((section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  const renderIcon = (iconName, style = {}) => {
    // Determine which type to use for color
    if (BEHAVIOR_TYPES.find(bt => bt.id === iconName)) {
      return (
        <TypeIcon 
          iconName={iconName} 
          style={style} 
          fromConstants={{
            getColor: getBehaviorColor
          }}
        />
      );
    } else if (PARTICIPATION_TYPES.find(pt => pt.id === iconName)) {
      return (
        <TypeIcon 
          iconName={iconName} 
          style={style} 
          fromConstants={{
            getColor: getParticipationColor
          }}
        />
      );
    }
    
    // Use the icon directly - no fallback needed since all icons are in shared component
    return <TypeIcon iconName={iconName} style={style} />;
  };

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
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onClick={onClose}
      >
        {/* Panel */}
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            width: isMobile ? '95%' : '600px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            margin: isMobile ? '20px' : '0'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              padding: '20px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: avatarColor.bg,
                  color: avatarColor.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                {getInitials(student?.name || 'Student')}
              </div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                  {student?.name || 'Unknown Student'}
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  {student?.email || 'No email'}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                color: '#6b7280'
              }}
            >
              <XIcon size={20} />
            </button>
          </div>

          {/* Content */}
          <div style={{ padding: '20px' }}>
            <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '20px' }}>
              Student Action Panel - Clean Version
            </p>
            <p style={{ fontSize: '12px', color: '#9ca3af' }}>
              All icons are now properly extracted to shared components!
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
