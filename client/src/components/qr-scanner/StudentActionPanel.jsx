import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { ATTENDANCE_STATUS_LABELS } from '../../firebase/attendance';
import { getAttendanceByStudent } from '../../firebase/attendance';
import { getPenalties } from '../../firebase/penalties';

const XIcon = ({ style }) => (
  <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const HistoryIcon = ({ style }) => (
  <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v5h5"/>
    <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/>
  </svg>
);

const renderIcon = (iconName, style) => {
  const icons = {
    MessageSquare: <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    Bed: <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4"/></svg>,
    Smartphone: <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>,
    Users: <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    AlertTriangle: <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    Clock: <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    CheckCircle: <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
    Award: <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>,
    FileText: <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>,
    Star: <svg style={style} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  };
  return icons[iconName] || icons.MessageSquare;
};

export default function StudentActionPanel({
  student,
  onClose,
  onBehaviorSubmit,
  onMarkAttendance,
  behaviorTypes,
  participationTypes,
  showFavoritesOnly = false,
  onToggleFavorites,
  favoriteBehaviors = [],
  onToggleFavorite
}) {
  const [selectedActions, setSelectedActions] = useState([]);
  const [pointsOverride, setPointsOverride] = useState({});
  const [internalNote, setInternalNote] = useState('');
  const [activeTab, setActiveTab] = useState('behavior');
  const [todayLogs, setTodayLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [expandedDays, setExpandedDays] = useState(new Set());

  const toggleDayExpansion = (dayKey) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(dayKey)) {
      newExpanded.delete(dayKey);
    } else {
      newExpanded.add(dayKey);
    }
    setExpandedDays(newExpanded);
  };

  // Fetch today's logs when student changes
  useEffect(() => {
    // Reset when student changes
    setSelectedActions([]);
    setPointsOverride({});
    setInternalNote('');
    
    // Fetch historical logs for the student
    if (student?.id) {
      fetchHistoricalLogs();
    }
  }, [student?.id]);

  // Fetch real data from Firebase
  const fetchHistoricalLogs = async () => {
    if (!student?.id) return;
    
    setLogsLoading(true);
    try {
      // Get all attendance records for this student (no date filter)
      const attendanceResponse = await getAttendanceByStudent(student.id);
      const attendanceRecords = attendanceResponse.success ? attendanceResponse.data : [];
      
      // Get all penalties for this student
      const penaltiesResponse = await getPenalties();
      const allPenalties = penaltiesResponse.success ? penaltiesResponse.data : [];
      const studentPenalties = allPenalties.filter(p => p.studentId === student.id);
      
      // Combine and format logs with date information
      const logs = [
        ...attendanceRecords.map(record => ({
          type: 'attendance',
          date: record.date || (record.timestamp?.toDate ? record.timestamp.toDate().toISOString().split('T')[0] : new Date(record.timestamp).toISOString().split('T')[0]),
          time: record.timestamp || record.date,
          data: record,
          label: ATTENDANCE_STATUS_LABELS[record.status]?.en || record.status,
          points: record.delta || 0,
          comment: record.reason || '',
          severity: 'low',
          color: ATTENDANCE_STATUS_LABELS[record.status]?.color || '#6b7280'
        })),
        ...studentPenalties.map(penalty => ({
          type: 'penalty',
          date: penalty.date || (penalty.createdAt?.toDate ? penalty.createdAt.toDate().toISOString().split('T')[0] : new Date(penalty.createdAt).toISOString().split('T')[0]),
          time: penalty.createdAt,
          data: penalty,
          label: penalty.reason || 'Penalty',
          points: penalty.points || 0,
          comment: penalty.comment || '',
          severity: penalty.severity || 'medium',
          color: penalty.points > 0 ? '#dcfce7' : '#fee2e2'
        }))
      ].sort((a, b) => {
        // Sort by date descending (most recent first)
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB - dateA;
      });
      
      setTodayLogs(logs);
    } catch (error) {
      console.error('Error fetching historical logs:', error);
      setTodayLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  // Group logs by day
  const groupLogsByDay = (logs) => {
    const grouped = {};
    
    logs.forEach(log => {
      const date = log.date;
      if (!grouped[date]) {
        grouped[date] = {
          date: date,
          attendance: [],
          penalties: [],
          participation: []
        };
      }
      
      if (log.type === 'attendance') {
        grouped[date].attendance.push(log);
      } else if (log.type === 'penalty') {
        grouped[date].penalties.push(log);
      } else if (log.points > 0) {
        grouped[date].participation.push(log);
      } else if (log.points < 0) {
        grouped[date].penalties.push(log);
      }
    });
    
    return Object.values(grouped);
  };

  if (!student) return null;

  const getAvailableOptions = () => {
    if (activeTab === 'participation') {
      return participationTypes.map(pt => ({
        ...pt,
        category: 'participation'
      }));
    } else if (activeTab === 'behavior') {
      return behaviorTypes.filter(bt => bt.points !== 0).map(bt => ({
        ...bt,
        category: 'behavior'
      }));
    } else if (activeTab === 'penalty') {
      return behaviorTypes.filter(bt => bt.points < 0).map(bt => ({
        ...bt,
        category: 'penalty'
      }));
    }
    return [];
  };

  const options = getAvailableOptions();

  const toggleAction = (option) => {
    setSelectedActions((prev) => {
      const exists = prev.find(a => a.id === option.id);
      if (exists) {
        return prev.filter(a => a.id !== option.id);
      } else {
        return [...prev, option];
      }
    });
  };

  const handlePointsChange = (optionId, value) => {
    const numValue = parseInt(value) || 0;
    setPointsOverride(prev => ({
      ...prev,
      [optionId]: numValue
    }));
  };

  const handleApply = () => {
    if (selectedActions.length === 0) return;

    const actions = selectedActions.map((action) => ({
      type: action.id,
      points: pointsOverride[action.id] !== undefined ? pointsOverride[action.id] : action.points,
      timestamp: new Date(),
      category: action.category
    }));

    onBehaviorSubmit(student.id, actions, internalNote, pointsOverride);
    setSelectedActions([]);
    setPointsOverride({});
    setInternalNote('');
  };

  const getInitials = (name) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name) => {
    const colors = [
      { bg: '#e9d5ff', color: '#6b21a8' },
      { bg: '#fed7aa', color: '#9a3412' },
      { bg: '#bfdbfe', color: '#1e3a8a' },
      { bg: '#fbcfe8', color: '#831843' },
      { bg: '#d1fae5', color: '#065f46' },
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const avatarColor = getAvatarColor(student.name);
  const attendanceStatus = ATTENDANCE_STATUS_LABELS[student.attendance] || ATTENDANCE_STATUS_LABELS.absent_no_excuse;
  const totalPoints = student.participation + student.behavior + student.penalty;

  return (
    <div style={{
      background: 'white',
      borderRadius: '0.75rem',
      border: '1px solid #e5e7eb',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      maxHeight: '100%',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
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
                  {attendanceStatus.en} • {totalPoints} Points
                </span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <XIcon style={{ width: '1rem', height: '1rem' }} />
          </Button>
        </div>

        {/* Points Summary */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.5rem',
          marginBottom: '1rem'
        }}>
          <div style={{
            padding: '0.75rem',
            background: '#ecfdf5',
            borderRadius: '0.5rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#059669' }}>
              {student.participation}
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#047857', fontWeight: 500 }}>
              Participation
            </div>
          </div>
          <div style={{
            padding: '0.75rem',
            background: student.behavior >= 0 ? '#ecfdf5' : '#fef2f2',
            borderRadius: '0.5rem',
            textAlign: 'center'
          }}>
            <div style={{ 
              fontSize: '1.25rem', 
              fontWeight: 600, 
              color: student.behavior >= 0 ? '#059669' : '#dc2626'
            }}>
              {student.behavior >= 0 ? '+' : ''}{student.behavior}
            </div>
            <div style={{ 
              fontSize: '0.6875rem', 
              color: student.behavior >= 0 ? '#047857' : '#991b1b',
              fontWeight: 500
            }}>
              Behavior
            </div>
          </div>
          <div style={{
            padding: '0.75rem',
            background: '#fef2f2',
            borderRadius: '0.5rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#dc2626' }}>
              {student.penalty}
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#991b1b', fontWeight: 500 }}>
              Penalty
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Button
            variant={activeTab === 'participation' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('participation')}
            style={{ fontSize: '0.8125rem' }}
          >
            Participation
          </Button>
          <Button
            variant={activeTab === 'behavior' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('behavior')}
            style={{ fontSize: '0.8125rem' }}
          >
            Behavior
          </Button>
          <Button
            variant={activeTab === 'penalty' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('penalty')}
            style={{ fontSize: '0.8125rem' }}
          >
            Penalty
          </Button>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Button
              variant={showFavoritesOnly ? 'default' : 'ghost'}
              size="sm"
              onClick={onToggleFavorites}
              style={{ fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              <Star size={14} fill={showFavoritesOnly ? '#8b5cf6' : 'none'} color={showFavoritesOnly ? '#8b5cf6' : '#6b7280'} />
              {showFavoritesOnly ? 'All' : 'Favorites'}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{
            fontSize: '0.875rem',
            fontWeight: 500,
            color: '#6b7280',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '1rem'
          }}>
            Select Reason
          </h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.5rem'
          }}>
            {options.map((option) => {
              const isSelected = selectedActions.some(a => a.id === option.id);
              const currentPoints = pointsOverride[option.id] !== undefined 
                ? pointsOverride[option.id] 
                : option.points;
              
              return (
                <div
                  key={option.id}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: `2px solid ${isSelected ? '#8b5cf6' : '#e5e7eb'}`,
                    background: isSelected ? 'rgba(139, 92, 246, 0.05)' : 'transparent',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                >
                  <button
                    onClick={() => toggleAction(option)}
                    type="button"
                    style={{
                      width: '100%',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.25rem',
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
                        color: currentPoints >= 0 ? '#059669' : '#dc2626'
                      }}>
                        {currentPoints >= 0 ? '+' : ''}{currentPoints}
                      </div>
                    </div>
                  </button>
                  
                  {/* Favorite Toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(option.id);
                    }}
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
                  
                  {/* Points Input */}
                  {isSelected && (
                    <div style={{
                      marginTop: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      <input
                        type="number"
                        min="-10"
                        max="10"
                        value={pointsOverride[option.id] !== undefined ? pointsOverride[option.id] : option.points}
                        onChange={(e) => {
                          const value = Math.max(-10, Math.min(10, parseInt(e.target.value) || 0));
                          handlePointsChange(option.id, value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          width: '3rem',
                          padding: '0.25rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          textAlign: 'center'
                        }}
                      />
                      <span style={{ fontSize: '0.625rem', color: '#6b7280' }}>pts</span>
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
            fontWeight: 600,
            color: '#111827',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '1rem'
          }}>
            Attendance Status
          </h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.75rem'
          }}>
            <button
              onClick={() => onMarkAttendance(student.id, 'present')}
              style={{
                padding: '1rem',
                borderRadius: '0.5rem',
                border: '2px solid #10b981',
                background: student.attendance === 'present' ? '#10b981' : 'white',
                color: student.attendance === 'present' ? 'white' : '#10b981',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                transition: 'all 0.2s'
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 17"></polyline>
                <path d="m21 16-8-5-5-5 5"></path>
              </svg>
              Present
            </button>
            <button
              onClick={() => onMarkAttendance(student.id, 'late')}
              style={{
                padding: '1rem',
                borderRadius: '0.5rem',
                border: '2px solid #f59e0b',
                background: student.attendance === 'late' ? '#f59e0b' : 'white',
                color: student.attendance === 'late' ? 'white' : '#f59e0b',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                transition: 'all 0.2s'
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 12 12"></polyline>
              </svg>
              Late
            </button>
            <button
              onClick={() => onMarkAttendance(student.id, 'absent')}
              style={{
                padding: '1rem',
                borderRadius: '0.5rem',
                border: '2px solid #ef4444',
                background: student.attendance === 'absent' ? '#ef4444' : 'white',
                color: student.attendance === 'absent' ? 'white' : '#ef4444',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                transition: 'all 0.2s'
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              Absent
            </button>
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

        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem'
          }}>
            <div style={{
              width: '3px',
              height: '24px',
              background: '#8b5cf6',
              borderRadius: '1.5px'
            }} />
            <h4 style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#111827',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              margin: 0
            }}>
              Student History
            </h4>
          </div>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '0.75rem', 
            paddingLeft: '1rem',
            borderLeft: '3px solid #8b5cf6'
          }}>
            {logsLoading ? (
              <div style={{
                padding: '1rem',
                color: '#9ca3af',
                fontSize: '0.875rem',
                textAlign: 'center'
              }}>
                Loading student history...
              </div>
            ) : todayLogs.length === 0 ? (
              <div style={{
                padding: '1rem',
                color: '#9ca3af',
                fontSize: '0.875rem'
              }}>
                No history found
              </div>
            ) : (
              groupLogsByDay(todayLogs).map((dayGroup, dayIndex) => {
                const isExpanded = expandedDays.has(dayGroup.date);
                const dateObj = new Date(dayGroup.date);
                const dateStr = dateObj.toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric' 
                });
                
                return (
                  <div key={dayIndex} style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    overflow: 'hidden'
                  }}>
                    {/* Day Header */}
                    <div
                      onClick={() => toggleDayExpansion(dayGroup.date)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem 1rem',
                        background: '#f9fafb',
                        cursor: 'pointer',
                        borderBottom: isExpanded ? '1px solid #e5e7eb' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>
                          {dateStr}
                        </span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {dayGroup.attendance.length > 0 && (
                            <span style={{
                              fontSize: '0.75rem',
                              padding: '0.125rem 0.375rem',
                              background: '#22c55e',
                              color: 'white',
                              borderRadius: '0.25rem'
                            }}>
                              {dayGroup.attendance.length} Attendance
                            </span>
                          )}
                          {dayGroup.participation.length > 0 && (
                            <span style={{
                              fontSize: '0.75rem',
                              padding: '0.125rem 0.375rem',
                              background: '#3b82f6',
                              color: 'white',
                              borderRadius: '0.25rem'
                            }}>
                              {dayGroup.participation.length} Participation
                            </span>
                          )}
                          {dayGroup.penalties.length > 0 && (
                            <span style={{
                              fontSize: '0.75rem',
                              padding: '0.125rem 0.375rem',
                              background: '#ef4444',
                              color: 'white',
                              borderRadius: '0.25rem'
                            }}>
                              {dayGroup.penalties.length} Penalties
                            </span>
                          )}
                        </div>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        {isExpanded ? '▼' : '▶'}
                      </span>
                    </div>
                    
                    {/* Expanded Content */}
                    {isExpanded && (
                      <div style={{ padding: '1rem' }}>
                        {/* Attendance */}
                        {dayGroup.attendance.length > 0 && (
                          <div style={{ marginBottom: '1rem' }}>
                            <h5 style={{ fontSize: '0.75rem', fontWeight: 600, color: '#22c55e', marginBottom: '0.5rem' }}>
                              ATTENDANCE
                            </h5>
                            {dayGroup.attendance.map((log, idx) => (
                              <div key={idx} style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '0.5rem',
                                padding: '0.25rem 0',
                                fontSize: '0.8125rem'
                              }}>
                                <span style={{ color: '#6b7280', minWidth: '80px' }}>
                                  {log.time?.toDate ? log.time.toDate().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : new Date(log.time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                </span>
                                <span style={{ 
                                  padding: '0.125rem 0.375rem',
                                  background: log.color,
                                  color: 'white',
                                  borderRadius: '0.25rem',
                                  fontSize: '0.75rem'
                                }}>
                                  {log.label}
                                </span>
                                {log.comment && (
                                  <span style={{ color: '#6b7280' }}>
                                    - {log.comment}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Participation */}
                        {dayGroup.participation.length > 0 && (
                          <div style={{ marginBottom: '1rem' }}>
                            <h5 style={{ fontSize: '0.75rem', fontWeight: 600, color: '#3b82f6', marginBottom: '0.5rem' }}>
                              PARTICIPATION
                            </h5>
                            {dayGroup.participation.map((log, idx) => (
                              <div key={idx} style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '0.5rem',
                                padding: '0.25rem 0',
                                fontSize: '0.8125rem'
                              }}>
                                <span style={{ color: '#6b7280', minWidth: '80px' }}>
                                  {log.time?.toDate ? log.time.toDate().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : new Date(log.time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                </span>
                                <span style={{ 
                                  padding: '0.125rem 0.375rem',
                                  background: '#dcfce7',
                                  color: '#166534',
                                  borderRadius: '0.25rem',
                                  fontSize: '0.75rem',
                                  fontWeight: 600
                                }}>
                                  +{log.points}
                                </span>
                                <span style={{ color: '#374151' }}>
                                  {log.label}
                                </span>
                                {log.comment && (
                                  <span style={{ color: '#6b7280' }}>
                                    - {log.comment}
                                  </span>
                                )}
                                {log.severity && (
                                  <span style={{ 
                                    padding: '0.125rem 0.375rem',
                                    background: '#f3f4f6',
                                    color: '#6b7280',
                                    borderRadius: '0.25rem',
                                    fontSize: '0.75rem'
                                  }}>
                                    {log.severity}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Penalties */}
                        {dayGroup.penalties.length > 0 && (
                          <div>
                            <h5 style={{ fontSize: '0.75rem', fontWeight: 600, color: '#ef4444', marginBottom: '0.5rem' }}>
                              PENALTIES
                            </h5>
                            {dayGroup.penalties.map((log, idx) => (
                              <div key={idx} style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '0.5rem',
                                padding: '0.25rem 0',
                                fontSize: '0.8125rem'
                              }}>
                                <span style={{ color: '#6b7280', minWidth: '80px' }}>
                                  {log.time?.toDate ? log.time.toDate().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : new Date(log.time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                </span>
                                <span style={{ 
                                  padding: '0.125rem 0.375rem',
                                  background: '#fee2e2',
                                  color: '#dc2626',
                                  borderRadius: '0.25rem',
                                  fontSize: '0.75rem',
                                  fontWeight: 600
                                }}>
                                  {log.points > 0 ? `+${log.points}` : log.points}
                                </span>
                                <span style={{ color: '#374151' }}>
                                  {log.label}
                                </span>
                                {log.comment && (
                                  <span style={{ color: '#6b7280' }}>
                                    - {log.comment}
                                  </span>
                                )}
                                {log.severity && (
                                  <span style={{ 
                                    padding: '0.125rem 0.375rem',
                                    background: '#f3f4f6',
                                    color: '#6b7280',
                                    borderRadius: '0.25rem',
                                    fontSize: '0.75rem'
                                  }}>
                                    {log.severity}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
          <Button
            onClick={handleApply}
            disabled={selectedActions.length === 0}
            style={{ fontSize: '0.875rem' }}
          >
            Apply Actions
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
};
