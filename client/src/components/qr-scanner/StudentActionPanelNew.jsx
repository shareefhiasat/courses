import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { XIcon, StarIcon, ChevronDownIcon, ChevronRightIcon, Star, Mail, ChevronDown, Users, Zap, AlertCircle, Plus, Minus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { markAttendance } from '../../firebase/attendance';
import { ATTENDANCE_STATUS, ATTENDANCE_STATUS_LABELS } from '../../firebase/attendance';
import { BEHAVIOR_TYPES, PARTICIPATION_TYPES } from '../../constants/behaviorParticipation';
import { getFavoriteBehaviors, addFavoriteBehavior, removeFavoriteBehavior } from '../../firebase/userPreferences';

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
  selectedDate
}) {
  console.log('StudentActionPanelNew rendering for:', student);
  const { user } = useAuth();
  const [expandedSections, setExpandedSections] = useState({
    behavior: false,
    participation: false,
    penalty: false
  });
  const [selectedActions, setSelectedActions] = useState([]);
  const [internalNote, setInternalNote] = useState('');
  const [actionPoints, setActionPoints] = useState({});
  const [favoriteBehaviors, setFavoriteBehaviors] = useState([]);
  const [showEmailDropdown, setShowEmailDropdown] = useState(false);
  const [sendingQRCode, setSendingQRCode] = useState(false);
  const [sendingSummary, setSendingSummary] = useState(false);
  const [activeTab, setActiveTab] = useState('behavior'); // 'behavior', 'participation', 'penalty'

  // Load favorite behaviors from user preferences
  useEffect(() => {
    const loadFavoriteBehaviors = async () => {
      if (user) {
        try {
          const favorites = await getFavoriteBehaviors(user.uid);
          setFavoriteBehaviors(favorites);
        } catch (error) {
          console.error('Error loading favorite behaviors:', error);
        }
      }
    };
    loadFavoriteBehaviors();
  }, [user]);

  // Get current attendance status
  const attendanceStatus = ATTENDANCE_STATUS_LABELS[student.attendance] || ATTENDANCE_STATUS_LABELS.present;

  // Avatar color helper
  const getAvatarColor = (name) => {
    const colors = [
      { bg: '#e9d5ff', color: '#6b21a8' },
      { bg: '#fed7aa', color: '#9a3412' },
      { bg: '#fecaca', color: '#991b1b' },
      { bg: '#d1fae5', color: '#065f46' },
      { bg: '#dbeafe', color: '#1e40af' },
      { bg: '#f3e8ff', color: '#6b21a8' }
    ];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  const avatarColor = getAvatarColor(student.name);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const renderIcon = (iconName, style = {}) => {
    const icons = {
      MessageSquare: (
        <svg width={style.width || 16} height={style.height || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      ),
      Bed: (
        <svg width={style.width || 16} height={style.height || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 4v16h20V4z"></path>
          <path d="M2 4h20"></path>
          <path d="M7 4v16"></path>
          <path d="M17 4v16"></path>
        </svg>
      ),
      Users: (
        <svg width={style.width || 16} height={style.height || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      ),
      Smartphone: (
        <svg width={style.width || 16} height={style.height || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
          <line x1="12" y1="18" x2="12.01" y2="18"></line>
        </svg>
      ),
      AlertTriangle: (
        <svg width={style.width || 16} height={style.height || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      ),
      Clock: (
        <svg width={style.width || 16} height={style.height || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      ),
      XCircle: (
        <svg width={style.width || 16} height={style.height || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
      ),
      CheckCircle: (
        <svg width={style.width || 16} height={style.height || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      ),
      Award: (
        <svg width={style.width || 16} height={style.height || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="7"></circle>
          <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
        </svg>
      ),
      FileText: (
        <svg width={style.width || 16} height={style.height || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
      ),
      HelpCircle: (
        <svg width={style.width || 16} height={style.height || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      ),
      Star: (
        <svg width={style.width || 16} height={style.height || 16} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
        </svg>
      ),
      ThumbsUp: (
        <svg width={style.width || 16} height={style.height || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
        </svg>
      ),
      Minus: (
        <svg width={style.width || 16} height={style.height || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      ),
      X: (
        <svg width={style.width || 16} height={style.height || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      ),
      MoreHorizontal: (
        <svg width={style.width || 16} height={style.height || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="1"></circle>
          <circle cx="19" cy="12" r="1"></circle>
          <circle cx="5" cy="12" r="1"></circle>
        </svg>
      )
    };
    return icons[iconName] || icons.MessageSquare;
  };

  const toggleAction = (option) => {
    setSelectedActions(prev => {
      const exists = prev.find(a => a.id === option.id);
      if (exists) {
        return prev.filter(a => a.id !== option.id);
      } else {
        return [...prev, { ...option, points: actionPoints[option.id] || option.points || 0 }];
      }
    });
  };

  const handlePointsChange = (optionId, value) => {
    setActionPoints(prev => ({
      ...prev,
      [optionId]: value
    }));
  };

  const onToggleFavorite = async (optionId) => {
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
      console.error('Error toggling favorite behavior:', error);
    }
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '100%',
      maxWidth: '28rem',
      height: '100%',
      background: 'white',
      boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
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
              width: '3rem',
              height: '3rem',
              borderRadius: '9999px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.875rem',
              fontWeight: 500,
              background: avatarColor.bg,
              color: avatarColor.color
            }}>
              {getInitials(student.displayName || student.realName || student.name || '')}
            </div>
            <div>
              <h3 style={{ fontWeight: 600, color: '#111827', margin: 0, fontSize: '1rem' }}>
                {student.displayName || student.realName || student.name || student.email || 'Unknown Student'}
              </h3>
              <div style={{ 
                fontSize: '0.75rem', 
                color: '#6b7280', 
                marginTop: '0.25rem',
                fontFamily: 'monospace',
                background: '#f3f4f6',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.25rem',
                display: 'inline-block'
              }}>
                ID: STU-{student.studentNumber || student.id?.slice(-4) || '0000'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                <span style={{
                  width: '0.5rem',
                  height: '0.5rem',
                  background: attendanceStatus.color,
                  borderRadius: '9999px'
                }} />
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  {attendanceStatus.en}
                </span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} title="Close panel" style={{ marginLeft: 'auto' }}>
            <XIcon style={{ width: '1.25rem', height: '1.25rem' }} />
          </Button>
        </div>
      </div>

      {/* Action Sections */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0.5rem' }}>
        {/* Tab Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', position: 'relative' }}>
          <button
            onClick={() => setActiveTab('participation')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.5rem 0.75rem',
              fontSize: '0.8125rem',
              borderRadius: '0.375rem',
              border: '1px solid #e2e8f0',
              background: activeTab === 'participation' ? '#3b82f6' : '#f8fafc',
              color: activeTab === 'participation' ? 'white' : '#64748b',
              cursor: 'pointer',
              boxShadow: activeTab === 'participation' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            <Users style={{ width: '14px', height: '14px' }} />
            Participation
          </button>
          <button
            onClick={() => setActiveTab('behavior')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.5rem 0.75rem',
              fontSize: '0.8125rem',
              borderRadius: '0.375rem',
              border: '1px solid #e2e8f0',
              background: activeTab === 'behavior' ? '#f97316' : '#f8fafc',
              color: activeTab === 'behavior' ? 'white' : '#64748b',
              cursor: 'pointer',
              boxShadow: activeTab === 'behavior' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            <Zap style={{ width: '14px', height: '14px' }} />
            Behavior
          </button>
          <button
            onClick={() => setActiveTab('penalty')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.5rem 0.75rem',
              fontSize: '0.8125rem',
              borderRadius: '0.375rem',
              border: '1px solid #e2e8f0',
              background: activeTab === 'penalty' ? '#dc2626' : '#f8fafc',
              color: activeTab === 'penalty' ? 'white' : '#64748b',
              cursor: 'pointer',
              boxShadow: activeTab === 'penalty' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            <AlertCircle style={{ width: '14px', height: '14px' }} />
            Penalty
          </button>
          <div style={{ position: 'absolute', right: '0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {/*    <button*/}
        {/*      onClick={onToggleFavorites}*/}
        {/*      style={{*/}
        {/*        display: 'flex',*/}
        {/*        alignItems: 'center',*/}
        {/*        gap: '0.375rem',*/}
        {/*        padding: '0.5rem 0.75rem',*/}
        {/*        fontSize: '0.8125rem',*/}
        {/*        borderRadius: '0.375rem',*/}
        {/*        border: '1px solid #e2e8f0',*/}
        {/*        background: showFavoritesOnly ? '#f59e0b' : '#f8fafc',*/}
        {/*        color: showFavoritesOnly ? '#f59e0b' : '#64748b',*/}
        {/*        cursor: 'pointer',*/}
        {/*        boxShadow: showFavoritesOnly ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'*/}
        {/*      }}*/}
        {/*    >*/}
        {/*      <Star size={14} fill={showFavoritesOnly ? '#8b5cf6' : 'none'} color={showFavoritesOnly ? '#8b5cf6' : '#6b7280'} />*/}
        {/*      {showFavoritesOnly ? 'All' : 'Favorites'}*/}
        {/*    </button>*/}
          </div>
        </div>

        {/* Select Reason Grid */}
        <div style={{ marginBottom: '0.5rem', marginTop: '1rem' }}>
          {/*<h4 style={{*/}
          {/*  fontSize: '0.875rem',*/}
          {/*  fontWeight: 500,*/}
          {/*  color: '#6b7280',*/}
          {/*  textTransform: 'uppercase',*/}
          {/*  letterSpacing: '0.05em',*/}
          {/*  marginBottom: '1rem'*/}
          {/*}}>*/}
          {/*  Select Reason*/}
          {/*</h4>*/}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.25rem'
          }}>
            {options.filter(option => {
              // Filter options based on active tab
              if (activeTab === 'behavior') return option.category === 'behavior';
              if (activeTab === 'participation') return option.category === 'participation';
              if (activeTab === 'penalty') return option.category === 'penalty';
              return true;
            }).sort((a, b) => {
              // Sort favorites to the top
              const aIsFavorite = favoriteBehaviors.includes(a.id);
              const bIsFavorite = favoriteBehaviors.includes(b.id);
              
              if (aIsFavorite && !bIsFavorite) return -1;
              if (!aIsFavorite && bIsFavorite) return 1;
              return 0;
            }).map((option) => {
              const isSelected = selectedActions.some(a => a.id === option.id);
              
              return (
                <div
                  key={option.id}
                  style={{
                    padding: '0.5rem',
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
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.125rem',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      width: '2rem',
                      height: '2rem',
                      borderRadius: '0.375rem',
                      background: option.color + '20',
                      color: option.color,
                      border: `1px solid ${option.color}40`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {renderIcon(option.icon, { width: '1rem', height: '1rem' })}
                    </div>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      color: '#111827',
                      lineHeight: '1.2'
                    }}>
                      {option.label_en}
                    </span>
                    <div style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: (actionPoints[option.id] || 0) >= 0 ? '#059669' : '#dc2626'
                    }}>
                      {(actionPoints[option.id] || 0) >= 0 ? '+' : ''}{actionPoints[option.id] || 0}
                    </div>
                  </div>
                  
                  {/* Favorite Toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(option.id);
                    }}
                    title={favoriteBehaviors.includes(option.id) ? "Remove from favorites" : "Add to favorites"}
                    style={{
                      position: 'absolute',
                      top: '0.25rem',
                      right: '0.25rem',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.125rem'
                    }}
                  >
                    <Star 
                      size={12} 
                      fill={favoriteBehaviors.includes(option.id) ? '#fbbf24' : 'none'} 
                      color={favoriteBehaviors.includes(option.id) ? '#fbbf24' : '#d1d5db'} 
                    />
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
                          const newValue = Math.max(-10, currentValue - 1);
                          handlePointsChange(option.id, newValue);
                        }}
                        title="Decrease points"
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
                          const newValue = Math.min(10, currentValue + 1);
                          handlePointsChange(option.id, newValue);
                        }}
                        title="Increase points"
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

        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{
            fontSize: '0.875rem',
            fontWeight: 500,
            color: '#6b7280',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.75rem'
          }}>
            Internal Note
          </h4>
          <Textarea
            placeholder="Add details..."
            value={internalNote}
            onChange={(e) => setInternalNote(e.target.value)}
            style={{ minHeight: '6rem', resize: 'none', fontSize: '0.875rem' }}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ padding: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button
            onClick={async () => {
              if (selectedActions.length === 0) {
                alert('Please select at least one action');
                return;
              }
              
              try {
                // Prepare actions with points override
                const actionsWithPoints = selectedActions.map(action => ({
                  ...action,
                  points: actionPoints[action.id] || action.points || 0
                }));
                
                await onBehaviorSubmit(student.id, actionsWithPoints, internalNote, actionPoints);
                setSelectedActions([]);
                setInternalNote('');
                setActionPoints({});
                alert('Actions saved successfully!');
              } catch (error) {
                console.error('Error saving actions:', error);
                alert('Failed to save actions');
              }
            }}
            disabled={selectedActions.length === 0}
            style={{ flex: 1, fontSize: '0.875rem' }}
          >
            Save Actions ({selectedActions.length})
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            style={{ fontSize: '0.875rem' }}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

