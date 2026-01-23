import React, { useState, useEffect } from 'react';
import { Star, Mail, QrCode, Users, AlertCircle, Zap, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { ATTENDANCE_STATUS_LABELS } from '../../firebase/attendance';
import { getAttendanceByStudent } from '../../firebase/attendance';
import { getPenalties } from '../../firebase/penalties';
import { getFunctions } from '../../firebase/config';
import { generateStudentQRCode } from '../../utils/qrCode';
import { BEHAVIOR_TYPES, PARTICIPATION_TYPES } from '../../constants/behaviorParticipation';

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
  const [actionPoints, setActionPoints] = useState({});
  const [internalNote, setInternalNote] = useState('');
  const [activeTab, setActiveTab] = useState('behavior');
  const [todayLogs, setTodayLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [expandedDays, setExpandedDays] = useState(new Set());
  const [sendingQRCode, setSendingQRCode] = useState(false);
  const [sendingSummary, setSendingSummary] = useState(false);
  const [showEmailDropdown, setShowEmailDropdown] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    behavior: false,
    participation: false,
    penalty: false
  });
  const [activeFilters, setActiveFilters] = useState({
    attendance: true,
    participation: true,
    penalties: true
  });

  // Send QR code email
  const sendQRCodeEmail = async () => {
    if (!student?.id || !student?.email) {
      console.error('Student information missing');
      return;
    }

    setSendingQRCode(true);
    try {
      const functions = getFunctions();
      const sendQRCodeEmail = functions.httpsCallable('sendQRCodeEmail');
      
      const result = await sendQRCodeEmail({
        studentId: student.id,
        studentEmail: student.email
      });

      if (result.success) {
        console.log('QR code email sent successfully');
      } else {
        console.error('Failed to send QR code email:', result.message);
      }
    } catch (error) {
      console.error('Error sending QR code email:', error);
    } finally {
      setSendingQRCode(false);
    }
  };

  // Send student summary email
  const sendStudentSummaryEmail = async () => {
    if (!student?.id || !student?.email) {
      console.error('Student information missing');
      return;
    }

    setSendingSummary(true);
    try {
      // Calculate statistics from the logs we already have
      const attendanceStats = {
        present: logs.filter(log => log.type === 'attendance' && log.data.status === 'present').length,
        late: logs.filter(log => log.type === 'attendance' && log.data.status === 'late').length,
        absent: logs.filter(log => log.type === 'attendance' && log.data.status === 'absent').length,
        percentage: 0 // Will be calculated
      };
      
      const totalAttendance = attendanceStats.present + attendanceStats.late + attendanceStats.absent;
      if (totalAttendance > 0) {
        attendanceStats.percentage = Math.round((attendanceStats.present / totalAttendance) * 100);
      }

      const participationStats = {
        total: student.participation || 0,
        positive: logs.filter(log => log.type === 'participation' && log.points > 0).reduce((sum, log) => sum + log.points, 0),
        neutral: logs.filter(log => log.type === 'participation' && log.points === 0).length
      };

      const behaviorStats = {
        total: student.behavior || 0,
        positive: logs.filter(log => log.type === 'behavior' && log.points > 0).reduce((sum, log) => sum + log.points, 0),
        negative: Math.abs(logs.filter(log => log.type === 'behavior' && log.points < 0).reduce((sum, log) => sum + log.points, 0))
      };

      const penaltyStats = {
        total: logs.filter(log => log.type === 'penalty').length,
        minor: logs.filter(log => log.type === 'penalty' && log.severity === 'minor').length,
        major: logs.filter(log => log.type === 'penalty' && log.severity === 'major').length,
        recentPenalties: logs.filter(log => log.type === 'penalty').slice(0, 3).map(log => 
          `${log.label} (${new Date(log.time).toLocaleDateString()})`
        ).join(', ')
      };

      // Calculate overall grade based on all factors
      const attendanceScore = attendanceStats.percentage;
      const participationScore = Math.min(100, participationStats.total * 2);
      const behaviorScore = Math.max(0, Math.min(100, 50 + behaviorStats.total));
      const penaltyDeduction = penaltyStats.total * 5;
      
      const overallScore = Math.max(0, Math.min(100, 
        (attendanceScore * 0.4) + 
        (participationScore * 0.3) + 
        (behaviorScore * 0.2) + 
        (100 - penaltyDeduction) * 0.1
      ));

      let overallGrade = 'F';
      if (overallScore >= 90) overallGrade = 'A+';
      else if (overallScore >= 85) overallGrade = 'A';
      else if (overallScore >= 80) overallGrade = 'B+';
      else if (overallScore >= 75) overallGrade = 'B';
      else if (overallScore >= 70) overallGrade = 'C+';
      else if (overallScore >= 65) overallGrade = 'C';
      else if (overallScore >= 60) overallGrade = 'D+';
      else if (overallScore >= 55) overallGrade = 'D';

      const functions = getFunctions();
      const sendSummaryEmail = functions.httpsCallable('sendSummaryEmail');
      
      const result = await sendSummaryEmail({
        to: student.email,
        templateId: 'student_summary_report',
        templateData: {
          studentName: student.displayName || student.realName || student.name,
          studentEmail: student.email,
          studentId: student.studentNumber || student.id,
          className: selectedClass?.name || selectedClass?.code || 'Class',
          attendanceStats,
          participationStats,
          behaviorStats,
          penaltyStats,
          overallGrade,
          reportPeriod: 'This Term',
          siteName: 'CS Learning Hub',
          currentDate: new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })
        }
      });

      if (result.success) {
        console.log('Student summary email sent successfully');
      } else {
        console.error('Failed to send student summary email:', result.message);
      }
    } catch (error) {
      console.error('Error sending student summary email:', error);
    } finally {
      setSendingSummary(false);
    }
  };

  const toggleDayExpansion = (dayKey) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(dayKey)) {
      newExpanded.delete(dayKey);
    } else {
      newExpanded.add(dayKey);
    }
    setExpandedDays(newExpanded);
  };

  const toggleSectionExpansion = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Calculate detailed statistics for each type
  const getDetailedStats = () => {
    const stats = {
      behavior: {},
      participation: {},
      penalty: {}
    };

    // Calculate behavior stats
    BEHAVIOR_TYPES.forEach(type => {
      stats.behavior[type.id] = {
        count: 0,
        totalPoints: 0,
        label: type.label_en,
        color: type.color,
        icon: type.icon
      };
    });

    // Calculate participation stats
    PARTICIPATION_TYPES.forEach(type => {
      stats.participation[type.id] = {
        count: 0,
        totalPoints: 0,
        label: type.label_en,
        color: '#3b82f6',
        icon: type.icon
      };
    });

    // Calculate penalty stats (same as behavior but for negative points)
    BEHAVIOR_TYPES.filter(bt => bt.points < 0).forEach(type => {
      stats.penalty[type.id] = {
        count: 0,
        totalPoints: 0,
        label: type.label_en,
        color: type.color,
        icon: type.icon
      };
    });

    // AUDIT LOGS: Debug todayLogs
    console.log('=== AUDIT: todayLogs ===');
    console.log('Total logs:', todayLogs.length);
    console.log('todayLogs:', todayLogs);

    // Process logs to calculate stats
    todayLogs.forEach((log, index) => {
      console.log(`=== Processing log ${index} ===`);
      console.log('Log type:', log.type);
      console.log('Log data:', log.data);
      console.log('Log points:', log.points);
      
      if (log.type === 'behavior') {
        const behaviorType = log.data.type || 'other';
        console.log('Behavior type:', behaviorType);
        
        if (stats.behavior[behaviorType]) {
          stats.behavior[behaviorType].count++;
          stats.behavior[behaviorType].totalPoints += log.points || 0;
          console.log(`Updated ${behaviorType}: count=${stats.behavior[behaviorType].count}, points=${stats.behavior[behaviorType].totalPoints}`);
        }
        // Also add to penalty if it's a negative behavior
        if (log.points < 0 && stats.penalty[behaviorType]) {
          stats.penalty[behaviorType].count++;
          stats.penalty[behaviorType].totalPoints += log.points || 0;
          console.log(`Updated penalty ${behaviorType}: count=${stats.penalty[behaviorType].count}, points=${stats.penalty[behaviorType].totalPoints}`);
        }
      } else if (log.type === 'participation') {
        const participationType = log.data.type || 'other';
        console.log('Participation type:', participationType);
        
        if (stats.participation[participationType]) {
          stats.participation[participationType].count++;
          stats.participation[participationType].totalPoints += log.points || 0;
          console.log(`Updated ${participationType}: count=${stats.participation[participationType].count}, points=${stats.participation[participationType].totalPoints}`);
        }
      } else if (log.type === 'penalty') {
        const penaltyType = log.data.type || 'other';
        console.log('Penalty type:', penaltyType);
        
        if (stats.penalty[penaltyType]) {
          stats.penalty[penaltyType].count++;
          stats.penalty[penaltyType].totalPoints += log.points || 0;
          console.log(`Updated penalty ${penaltyType}: count=${stats.penalty[penaltyType].count}, points=${stats.penalty[penaltyType].totalPoints}`);
        }
      }
    });

    console.log('=== FINAL STATS ===');
    console.log('Penalty stats:', stats.penalty);
    console.log('Behavior stats:', stats.behavior);
    console.log('Participation stats:', stats.participation);

    return stats;
  };

  // Fetch today's logs when student changes
  useEffect(() => {
    // Reset when student changes
    setSelectedActions([]);
    setActionPoints({});
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
        // Remove action and its points
        setActionPoints(prevPoints => {
          const newPoints = { ...prevPoints };
          delete newPoints[option.id];
          return newPoints;
        });
        return prev.filter(a => a.id !== option.id);
      } else {
        // Add action with default points
        setActionPoints(prev => ({
          ...prev,
          [option.id]: option.points || 0
        }));
        return [...prev, option];
      }
    });
  };

  const handlePointsChange = (optionId, value) => {
    const numValue = parseInt(value) || 0;
    setActionPoints(prev => ({
      ...prev,
      [optionId]: numValue
    }));
  };

  const handleApply = () => {
    if (selectedActions.length === 0) return;

    const actions = selectedActions.map((action) => ({
      type: action.id,
      points: actionPoints[action.id] || 0, // Use the mandatory points field
      timestamp: new Date(),
      category: action.category
    }));

    onBehaviorSubmit(student.id, actions, internalNote);
    setSelectedActions([]);
    setActionPoints({});
    setInternalNote('');
  };

  const toggleFilter = (filter) => {
    setActiveFilters(prev => ({
      ...prev,
      [filter]: !prev[filter]
    }));
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
  
  // Calculate attendance statistics
  const attendanceStats = todayLogs.reduce((acc, log) => {
    if (log.type === 'attendance') {
      const status = log.data.status;
      if (status === 'present') acc.present++;
      else if (status === 'absent_no_excuse') acc.absent_no_excuse++;
      else if (status === 'absent_with_excuse') acc.absent_with_excuse++;
      else if (status === 'late') acc.late++;
      else if (status === 'excused_leave') acc.excused_leave++;
      else if (status === 'human_case') acc.human_case++;
    }
    return acc;
  }, { present: 0, late: 0, absent_no_excuse: 0, absent_with_excuse: 0, excused_leave: 0, human_case: 0 });

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
          <Button variant="ghost" size="icon" onClick={onClose}>
            <XIcon style={{ width: '1.25rem', height: '1.25rem' }} />
          </Button>
          <div style={{ position: 'relative' }} className="email-dropdown-container">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setShowEmailDropdown(!showEmailDropdown)}
            disabled={sendingQRCode || sendingSummary}
            title="Send email to student"
          >
            {(sendingQRCode || sendingSummary) ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '1rem',
                  height: '1rem',
                  border: '2px solid #6b7280',
                  borderTop: '2px solid transparent',
                  borderRight: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                <span>Sending...</span>
              </div>
            ) : (
              <Mail style={{ width: '1.25rem', height: '1.25rem' }} />
            )}
            <ChevronDown style={{ width: '0.75rem', height: '0.75rem', marginLeft: '0.25rem' }} />
          </Button>
          
          {showEmailDropdown && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 1000,
              minWidth: '200px',
              padding: '0.5rem 0',
              marginTop: '0.25rem'
            }}>
              <button
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: 'none',
                  background: 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  fontSize: '0.875rem',
                  color: '#374151',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                onClick={async () => {
                  setShowEmailDropdown(false);
                  await sendQRCodeEmail();
                }}
                disabled={sendingQRCode}
              >
                <QrCode size={16} />
                Send QR Code
              </button>
              
              <button
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: 'none',
                  background: 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  fontSize: '0.875rem',
                  color: '#374151',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                onClick={async () => {
                  setShowEmailDropdown(false);
                  await sendStudentSummaryEmail();
                }}
                disabled={sendingSummary}
              >
                <Mail size={16} />
                Send Summary Report
              </button>
            </div>
          )}
        </div>
        </div>

        {/* Attendance Status - Moved to top */}
        <div style={{ marginBottom: '1rem' }}>
          <h4 style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            color: '#111827',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.5rem'
          }}>
            {/*Attendance Status*/}
          </h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: '0.25rem'
          }}>
            <button
              onClick={async () => {
                await onMarkAttendance(student.id, 'present');
                // Auto-save immediately
              }}
              style={{
                padding: '0.375rem',
                borderRadius: '0.25rem',
                border: '2px solid #10b981',
                background: student.attendance === 'present' ? '#10b981' : 'white',
                color: student.attendance === 'present' ? 'white' : '#10b981',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.125rem',
                fontSize: '0.625rem',
                fontWeight: 500,
                transition: 'all 0.2s',
                minWidth: '3rem'
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              Present
              {attendanceStats.present && Number(attendanceStats.present) > 0 && (
                <span style={{
                  fontSize: '0.5rem',
                  fontWeight: 600,
                  color: student.attendance === 'present' ? 'white' : '#10b981',
                  background: student.attendance === 'present' ? 'transparent' : '#10b981',
                  borderRadius: '0.125rem',
                  padding: '0.125rem 0.25rem',
                  minWidth: '0.75rem',
                  textAlign: 'center',
                  display: 'inline-block'
                }}>
                  {attendanceStats.present}
                </span>
              )}
            </button>
            <button
              onClick={async () => {
                await onMarkAttendance(student.id, 'late');
                // Auto-save immediately
              }}
              style={{
                padding: '0.375rem',
                borderRadius: '0.25rem',
                border: '2px solid #f59e0b',
                background: student.attendance === 'late' ? '#f59e0b' : 'white',
                color: student.attendance === 'late' ? 'white' : '#f59e0b',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.125rem',
                fontSize: '0.625rem',
                fontWeight: 500,
                transition: 'all 0.2s',
                minWidth: '3rem'
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 12 12"></polyline>
              </svg>
              Late
              {attendanceStats.late && Number(attendanceStats.late) > 0 && (
                <span style={{
                  fontSize: '0.5rem',
                  fontWeight: 600,
                  color: student.attendance === 'late' ? 'white' : '#f59e0b',
                  background: student.attendance === 'late' ? 'transparent' : '#f59e0b',
                  borderRadius: '0.125rem',
                  padding: '0.125rem 0.25rem',
                  minWidth: '0.75rem',
                  textAlign: 'center'
                }}>
                  {attendanceStats.late}
                </span>
              )}
            </button>
            <button
              onClick={async () => {
                await onMarkAttendance(student.id, 'absent_no_excuse');
                // Auto-save immediately
              }}
              style={{
                padding: '0.375rem',
                borderRadius: '0.25rem',
                border: '2px solid #ef4444',
                background: student.attendance === 'absent_no_excuse' ? '#ef4444' : 'white',
                color: student.attendance === 'absent_no_excuse' ? 'white' : '#ef4444',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.125rem',
                fontSize: '0.625rem',
                fontWeight: 500,
                transition: 'all 0.2s',
                minWidth: '3rem'
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              Absent (No Excuse)
              {attendanceStats.absent_no_excuse && Number(attendanceStats.absent_no_excuse) > 0 && (
                <span style={{
                  fontSize: '0.5rem',
                  fontWeight: 600,
                  color: student.attendance === 'absent_no_excuse' ? 'white' : '#ef4444',
                  background: student.attendance === 'absent_no_excuse' ? 'transparent' : '#ef4444',
                  borderRadius: '0.125rem',
                  padding: '0.125rem 0.25rem',
                  minWidth: '0.75rem',
                  textAlign: 'center'
                }}>
                  {attendanceStats.absent_no_excuse}
                </span>
              )}
            </button>
            <button
              onClick={async () => {
                await onMarkAttendance(student.id, 'absent_with_excuse');
                // Auto-save immediately
              }}
              style={{
                padding: '0.375rem',
                borderRadius: '0.25rem',
                border: '2px solid #ef4444',
                background: student.attendance === 'absent_with_excuse' ? '#ef4444' : 'white',
                color: student.attendance === 'absent_with_excuse' ? 'white' : '#ef4444',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.125rem',
                fontSize: '0.625rem',
                fontWeight: 500,
                transition: 'all 0.2s',
                minWidth: '3rem'
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              Absent (Excused)
              {attendanceStats.absent_with_excuse && Number(attendanceStats.absent_with_excuse) > 0 && (
                <span style={{
                  fontSize: '0.5rem',
                  fontWeight: 600,
                  color: student.attendance === 'absent_with_excuse' ? 'white' : '#ef4444',
                  background: student.attendance === 'absent_with_excuse' ? 'transparent' : '#ef4444',
                  borderRadius: '0.125rem',
                  padding: '0.125rem 0.25rem',
                  minWidth: '0.75rem',
                  textAlign: 'center'
                }}>
                  {attendanceStats.absent_with_excuse}
                </span>
              )}
            </button>
            <button
              onClick={async () => {
                await onMarkAttendance(student.id, 'excused_leave');
                // Auto-save immediately
              }}
              style={{
                padding: '0.375rem',
                borderRadius: '0.25rem',
                border: '2px solid #ef4444',
                background: student.attendance === 'excused_leave' ? '#ef4444' : 'white',
                color: student.attendance === 'excused_leave' ? 'white' : '#ef4444',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.125rem',
                fontSize: '0.625rem',
                fontWeight: 500,
                transition: 'all 0.2s',
                minWidth: '3rem'
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                <line x1="9" y1="9" x2="9.01" y2="9"></line>
                <line x1="15" y1="9" x2="15.01" y2="9"></line>
              </svg>
              Excused Leave
              {attendanceStats.excused_leave && Number(attendanceStats.excused_leave) > 0 && (
                <span style={{
                  fontSize: '0.5rem',
                  fontWeight: 600,
                  color: student.attendance === 'excused_leave' ? 'white' : '#ef4444',
                  background: student.attendance === 'excused_leave' ? 'transparent' : '#ef4444',
                  borderRadius: '0.125rem',
                  padding: '0.125rem 0.25rem',
                  minWidth: '0.75rem',
                  textAlign: 'center'
                }}>
                  {attendanceStats.excused_leave}
                </span>
              )}
            </button>
            <button
              onClick={async () => {
                await onMarkAttendance(student.id, 'human_case');
                // Auto-save immediately
              }}
              style={{
                padding: '0.375rem',
                borderRadius: '0.25rem',
                border: '2px solid #8b5cf6',
                background: student.attendance === 'human_case' ? '#8b5cf6' : 'white',
                color: student.attendance === 'human_case' ? 'white' : '#8b5cf6',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.125rem',
                fontSize: '0.625rem',
                fontWeight: 500,
                transition: 'all 0.2s',
                minWidth: '3rem'
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              Human Case
              {attendanceStats.human_case && Number(attendanceStats.human_case) > 0 && (
                <span style={{
                  fontSize: '0.5rem',
                  fontWeight: 600,
                  color: student.attendance === 'human_case' ? 'white' : '#8b5cf6',
                  background: student.attendance === 'human_case' ? 'transparent' : '#8b5cf6',
                  borderRadius: '0.125rem',
                  padding: '0.125rem 0.25rem',
                  minWidth: '0.75rem',
                  textAlign: 'center'
                }}>
                  {attendanceStats.human_case}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Points Summary */}
        <div style={{ marginBottom: '1rem' }}>
          {/* 5 Total Cards Only */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '0.5rem',
            marginBottom: '1rem'
          }}>
            {/* Total Present */}
            <div style={{
              padding: '0.5rem',
              background: '#16a34a',
              borderRadius: '0.5rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              minHeight: '3rem'
            }}>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: 'white' }}>
                {attendanceStats.present}
              </div>
              <div style={{ fontSize: '0.625rem', color: 'white', fontWeight: 500 }}>
                Total Present
              </div>
            </div>
            
            {/* Total Late */}
            <div style={{
              padding: '0.5rem',
              background: '#eab308',
              borderRadius: '0.5rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              minHeight: '3rem'
            }}>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: 'white' }}>
                {attendanceStats.late}
              </div>
              <div style={{ fontSize: '0.625rem', color: 'white', fontWeight: 500 }}>
                Total Late
              </div>
            </div>
            
            {/* Total Penalty */}
            <div style={{
              padding: '0.5rem',
              background: '#dc2626',
              borderRadius: '0.5rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              minHeight: '3rem'
            }}>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: 'white' }}>
                {student.penalty || 0}
              </div>
              <div style={{ fontSize: '0.625rem', color: 'white', fontWeight: 500 }}>
                Total Penalty
              </div>
            </div>
            
            {/* Total Behavior */}
            <div style={{
              padding: '0.5rem',
              background: '#f97316',
              borderRadius: '0.5rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              minHeight: '3rem'
            }}>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: 'white' }}>
                {student.behavior >= 0 ? '+' : ''}{student.behavior || 0}
              </div>
              <div style={{ fontSize: '0.625rem', color: 'white', fontWeight: 500 }}>
                Total Behavior
              </div>
            </div>
            
            {/* Total Participation */}
            <div style={{
              padding: '0.5rem',
              background: '#3b82f6',
              borderRadius: '0.5rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              minHeight: '3rem'
            }}>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: 'white' }}>
                {student.participation || 0}
              </div>
              <div style={{ fontSize: '0.625rem', color: 'white', fontWeight: 500 }}>
                Total Participation
              </div>
            </div>
          </div>

          {/* Behavior Section */}
          <div style={{ marginBottom: '1rem' }}>
            <div 
              onClick={() => toggleSectionExpansion('behavior')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem',
                background: '#f97316',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                marginBottom: '0.5rem'
              }}
            >
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'white' }}>
                Behavior Details ({student.behavior || 0} points, {(() => {
                  const stats = getDetailedStats();
                  return BEHAVIOR_TYPES.reduce((sum, type) => sum + (stats.behavior[type.id]?.count || 0), 0);
                })()} entries)
              </span>
              <ChevronDown 
                style={{ 
                  width: '16px', 
                  height: '16px',
                  transform: expandedSections.behavior ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s'
                }} 
              />
            </div>
            
            {expandedSections.behavior && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem'
              }}>
                {(() => {
                  const stats = getDetailedStats();
                  return BEHAVIOR_TYPES.map(type => {
                    const stat = stats.behavior[type.id];
                    return (
                      <div key={type.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.5rem',
                        background: type.color,
                        borderRadius: '0.375rem',
                        opacity: stat.count > 0 ? 1 : 0.8
                      }}>
                        <div style={{
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          color: 'white',
                          flex: 1
                        }}>
                          {type.label_en}
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          color: 'white',
                          minWidth: '3rem',
                          textAlign: 'center'
                        }}>
                          Total: {stat.totalPoints >= 0 ? '+' : ''}{stat.totalPoints}
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: 'white',
                          minWidth: '3rem',
                          textAlign: 'right'
                        }}>
                          Count: ({stat.count})
                        </div>
                      </div>
                    );
                  });
                })()}
                
                {/* Total Behavior Row */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5rem',
                  background: '#f97316',
                  borderRadius: '0.375rem',
                  marginTop: '0.25rem'
                }}>
                  <div style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'white',
                    flex: 1
                  }}>
                    Total Behavior
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: 'white',
                    minWidth: '3rem',
                    textAlign: 'center'
                  }}>
                    Total: {student.behavior >= 0 ? '+' : ''}{student.behavior || 0}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'white',
                    minWidth: '3rem',
                    textAlign: 'right'
                  }}>
                    Count: ({(() => {
                      const stats = getDetailedStats();
                      return BEHAVIOR_TYPES.reduce((sum, type) => sum + (stats.behavior[type.id]?.count || 0), 0);
                    })()})
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Participation Section */}
          <div style={{ marginBottom: '1rem' }}>
            <div 
              onClick={() => toggleSectionExpansion('participation')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem',
                background: '#3b82f6',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                marginBottom: '0.5rem'
              }}
            >
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'white' }}>
                Participation Details ({student.participation || 0} points, {(() => {
                  const stats = getDetailedStats();
                  return PARTICIPATION_TYPES.reduce((sum, type) => sum + (stats.participation[type.id]?.count || 0), 0);
                })()} entries)
              </span>
              <ChevronDown 
                style={{ 
                  width: '16px', 
                  height: '16px',
                  transform: expandedSections.participation ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s'
                }} 
              />
            </div>
            
            {expandedSections.participation && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem'
              }}>
                {(() => {
                  const stats = getDetailedStats();
                  return PARTICIPATION_TYPES.map(type => {
                    const stat = stats.participation[type.id];
                    return (
                      <div key={type.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.5rem',
                        background: '#3b82f6',
                        borderRadius: '0.375rem',
                        opacity: stat.count > 0 ? 1 : 0.8
                      }}>
                        <div style={{
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          color: 'white',
                          flex: 1
                        }}>
                          {type.label_en}
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          color: 'white',
                          minWidth: '3rem',
                          textAlign: 'center'
                        }}>
                          Total: +{stat.totalPoints}
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: 'white',
                          minWidth: '3rem',
                          textAlign: 'right'
                        }}>
                          Count: ({stat.count})
                        </div>
                      </div>
                    );
                  });
                })()}
                
                {/* Total Participation Row */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5rem',
                  background: '#3b82f6',
                  borderRadius: '0.375rem',
                  marginTop: '0.25rem',
                  border: '2px solid white'
                }}>
                  <div style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'white',
                    flex: 1
                  }}>
                    Total Participation
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: 'white',
                    minWidth: '3rem',
                    textAlign: 'center'
                  }}>
                    Total: {student.participation || 0}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'white',
                    minWidth: '3rem',
                    textAlign: 'right'
                  }}>
                    Count: ({(() => {
                      const stats = getDetailedStats();
                      return PARTICIPATION_TYPES.reduce((sum, type) => sum + (stats.participation[type.id]?.count || 0), 0);
                    })()})
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Penalty Section */}
          <div style={{ marginBottom: '1rem' }}>
            <div 
              onClick={() => toggleSectionExpansion('penalty')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem',
                background: '#dc2626',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                marginBottom: '0.5rem'
              }}
            >
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'white' }}>
                Penalty Details ({student.penalty || 0} points, {(() => {
                  const stats = getDetailedStats();
                  const penaltyTypes = BEHAVIOR_TYPES.filter(bt => bt.points < 0);
                  return penaltyTypes.reduce((sum, type) => sum + (stats.penalty[type.id]?.count || 0), 0);
                })()} entries)
              </span>
              <ChevronDown 
                style={{ 
                  width: '16px', 
                  height: '16px',
                  transform: expandedSections.penalty ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s'
                }} 
              />
            </div>
            
            {expandedSections.penalty && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem'
              }}>
                {(() => {
                  const stats = getDetailedStats();
                  const penaltyTypes = BEHAVIOR_TYPES.filter(bt => bt.points < 0);
                  
                  return penaltyTypes.map(type => {
                    const stat = stats.penalty[type.id];
                    return (
                      <div key={type.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.5rem',
                        background: '#fee2e2',
                        borderRadius: '0.375rem',
                        border: '1px solid #dc2626',
                        opacity: stat.count > 0 ? 1 : 0.8
                      }}>
                        <div style={{
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          color: '#dc2626',
                          flex: 1
                        }}>
                          {type.label_en}
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          color: '#991b1b',
                          minWidth: '3rem',
                          textAlign: 'center'
                        }}>
                          Total: {stat.totalPoints}
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#dc2626',
                          minWidth: '3rem',
                          textAlign: 'right'
                        }}>
                          Count: ({stat.count})
                        </div>
                      </div>
                    );
                  });
                })()}
                
                {/* Total Penalty Row */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5rem',
                  background: '#dc2626',
                  borderRadius: '0.375rem',
                  marginTop: '0.25rem'
                }}>
                  <div style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'white',
                    flex: 1
                  }}>
                    Total Penalty
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: 'white',
                    minWidth: '3rem',
                    textAlign: 'center'
                  }}>
                    Total: {student.penalty || 0}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'white',
                    minWidth: '3rem',
                    textAlign: 'right'
                  }}>
                    Count: ({(() => {
                      const stats = getDetailedStats();
                      const penaltyTypes = BEHAVIOR_TYPES.filter(bt => bt.points < 0);
                      return penaltyTypes.reduce((sum, type) => sum + (stats.penalty[type.id]?.count || 0), 0);
                    })()})
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
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
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={onToggleFavorites}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.5rem 0.75rem',
                fontSize: '0.8125rem',
                borderRadius: '0.375rem',
                border: '1px solid #e2e8f0',
                background: showFavoritesOnly ? '#f59e0b' : '#f8fafc',
                color: showFavoritesOnly ? '#f59e0b' : '#64748b',
                cursor: 'pointer',
                boxShadow: showFavoritesOnly ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <Star size={14} fill={showFavoritesOnly ? '#8b5cf6' : 'none'} color={showFavoritesOnly ? '#8b5cf6' : '#6b7280'} />
              {showFavoritesOnly ? 'All' : 'Favorites'}
            </button>
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
                        color: (actionPoints[option.id] || 0) >= 0 ? '#059669' : '#dc2626'
                      }}>
                        {(actionPoints[option.id] || 0) >= 0 ? '+' : ''}{actionPoints[option.id] || 0}
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
                  
                  {/* Points Input - Always show when selected */}
                  {isSelected && (
                    <div style={{
                      marginTop: '0.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      <span style={{ fontSize: '0.625rem', color: '#6b7280', fontWeight: 500 }}>
                        Points:
                      </span>
                      <input
                        type="number"
                        min="-10"
                        max="10"
                        value={actionPoints[option.id] || 0}
                        onChange={(e) => {
                          const value = Math.max(-10, Math.min(10, parseInt(e.target.value) || 0));
                          handlePointsChange(option.id, value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="0"
                        required
                        style={{
                          width: '2.5rem',
                          height: '1.5rem',
                          padding: '0.125rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.25rem',
                          fontSize: '0.625rem',
                          textAlign: 'center',
                          fontWeight: 500
                        }}
                      />
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

        <div>
          {/*<div style={{*/}
          {/*  display: 'flex',*/}
          {/*  alignItems: 'center',*/}
          {/*  gap: '0.5rem',*/}
          {/*  marginBottom: '1rem'*/}
          {/*}}>*/}
          {/*  <div style={{*/}
          {/*    width: '3px',*/}
          {/*    height: '24px',*/}
          {/*    background: '#8b5cf6',*/}
          {/*    borderRadius: '1.5px'*/}
          {/*  }} />*/}
          {/*  <h4 style={{*/}
          {/*    fontSize: '0.875rem',*/}
          {/*    fontWeight: 600,*/}
          {/*    color: '#111827',*/}
          {/*    textTransform: 'uppercase',*/}
          {/*    letterSpacing: '0.05em',*/}
          {/*    margin: 0*/}
          {/*  }}>*/}
          {/*    Student History*/}
          {/*  </h4>*/}
          {/*</div>*/}
          {/* History Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
            padding: '0.5rem',
            background: '#f8fafc',
            borderRadius: '0.5rem',
            border: '1px solid #e2e8f0'
          }}>
            {/*<h4 style={{*/}
            {/*  fontSize: '0.875rem',*/}
            {/*  fontWeight: 600,*/}
            {/*  color: '#374151',*/}
            {/*  margin: 0*/}
            {/*}}>*/}
            {/*  Student History*/}
            {/*</h4>*/}
            <div style={{
              display: 'flex',
              gap: '0.25rem'
            }}>
              <button
                onClick={() => toggleFilter('attendance')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.8125rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #e2e8f0',
                  background: activeFilters.attendance ? '#065f46' : '#ffffff',
                  color: activeFilters.attendance ? 'white' : '#64748b',
                  cursor: 'pointer',
                  boxShadow: activeFilters.attendance ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Attendance
              </button>
              <button
                onClick={() => toggleFilter('participation')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.8125rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #e2e8f0',
                  background: activeFilters.participation ? '#3b82f6' : '#ffffff',
                  color: activeFilters.participation ? 'white' : '#64748b',
                  cursor: 'pointer',
                  boxShadow: activeFilters.participation ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                Participation
              </button>
              <button
                onClick={() => toggleFilter('penalties')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.8125rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #e2e8f0',
                  background: activeFilters.penalties ? '#dc2626' : '#ffffff',
                  color: activeFilters.penalties ? 'white' : '#64748b',
                  cursor: 'pointer',
                  boxShadow: activeFilters.penalties ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                Penalties
              </button>
            </div>
          </div>
          
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '0.75rem'
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
                const dateObj = new Date(dayGroup.date);
                const dateStr = dateObj.toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric' 
                });
                
                const isDayExpanded = expandedDays.has(dayGroup.date);
                const filteredCounts = {
                  attendance: activeFilters.attendance ? dayGroup.attendance.length : 0,
                  participation: activeFilters.participation ? dayGroup.participation.length : 0,
                  penalties: activeFilters.penalties ? dayGroup.penalties.length : 0
                };
                const hasVisibleItems = filteredCounts.attendance + filteredCounts.participation + filteredCounts.penalties > 0;
                
                if (!hasVisibleItems) return null;
                
                return (
                  <div key={dayIndex} style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.375rem',
                    overflow: 'hidden',
                    marginBottom: '0.5rem'
                  }}>
                    {/* Day Header */}
                    <div
                      onClick={() => toggleDayExpansion(dayGroup.date)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.5rem 0.75rem',
                        background: '#f9fafb',
                        cursor: 'pointer',
                        borderBottom: isDayExpanded ? '1px solid #e5e7eb' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#111827' }}>
                          {dateStr}
                        </span>
                        <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                          {filteredCounts.attendance > 0 && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.25rem 0.5rem',
                              background: '#f0fdf4',
                              border: '1px solid #bbf7d0',
                              borderRadius: '0.375rem',
                              fontSize: '0.75rem',
                              color: '#166534'
                            }}>
                              {filteredCounts.attendance}
                            </div>
                          )}
                          {filteredCounts.participation > 0 && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.25rem 0.5rem',
                              background: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              borderRadius: '0.375rem',
                              fontSize: '0.75rem',
                              color: '#1e40af'
                            }}>
                              {filteredCounts.participation}
                            </div>
                          )}
                          {filteredCounts.penalties > 0 && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.25rem 0.5rem',
                              background: '#fef2f2',
                              border: '1px solid #fecaca',
                              borderRadius: '0.375rem',
                              fontSize: '0.75rem',
                              color: '#b91c1c'
                            }}>
                              {filteredCounts.penalties}
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          {isDayExpanded ? 'Hide details' : 'Show details'}
                        </span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{
                          transform: isDayExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                          transition: 'transform 0.2s'
                        }}>
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </div>
                    </div>
                    
                    {/* Expanded Content */}
                    {isDayExpanded && (
                      <div style={{ padding: '0.5rem 0.75rem' }}>
                        {/* Attendance */}
                        {activeFilters.attendance && dayGroup.attendance.length > 0 && (
                          <div style={{ marginBottom: '0.5rem' }}>
                            {dayGroup.attendance.map((log, idx) => (
                              <div key={idx} style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '0.5rem',
                                padding: '0.375rem 0',
                                fontSize: '0.8125rem',
                                borderBottom: idx === dayGroup.attendance.length - 1 ? 'none' : '1px solid #f1f5f9'
                              }}>
                                <span style={{ color: '#64748b', minWidth: '70px', fontSize: '0.75rem' }}>
                                  {log.time?.toDate ? log.time.toDate().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : new Date(log.time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                </span>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: log.color || '#10b981', marginRight: '0.5rem' }}>
                                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                  <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                                <span style={{ color: '#374151', fontWeight: 500 }}>
                                  {log.label}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Participation */}
                        {activeFilters.participation && dayGroup.participation.length > 0 && (
                          <div style={{ marginBottom: '0.5rem' }}>
                            {dayGroup.participation.map((log, idx) => (
                              <div key={idx} style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '0.5rem',
                                padding: '0.375rem 0',
                                fontSize: '0.8125rem',
                                borderBottom: idx === dayGroup.participation.length - 1 ? 'none' : '1px solid #f1f5f9'
                              }}>
                                <span style={{ color: '#64748b', minWidth: '70px', fontSize: '0.75rem' }}>
                                  {log.time?.toDate ? log.time.toDate().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : new Date(log.time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                </span>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: log.color || '#3b82f6', marginRight: '0.5rem' }}>
                                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                  <circle cx="9" cy="7" r="4"></circle>
                                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                </svg>
                                <span style={{ color: '#374151', fontWeight: 500 }}>
                                  {log.label}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Penalties */}
                        {activeFilters.penalties && dayGroup.penalties.length > 0 && (
                          <div style={{ marginBottom: '0.5rem' }}>
                            {dayGroup.penalties.map((log, idx) => (
                              <div key={idx} style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '0.5rem',
                                padding: '0.375rem 0',
                                fontSize: '0.8125rem',
                                borderBottom: idx === dayGroup.penalties.length - 1 ? 'none' : '1px solid #f1f5f9'
                              }}>
                                <span style={{ color: '#64748b', minWidth: '70px', fontSize: '0.75rem' }}>
                                  {log.time?.toDate ? log.time.toDate().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : new Date(log.time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                </span>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: log.color || '#ef4444', marginRight: '0.5rem' }}>
                                  <circle cx="12" cy="12" r="10"></circle>
                                  <line x1="12" y1="8" x2="12" y2="12"></line>
                                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                </svg>
                                <span style={{ color: '#374151', fontWeight: 500 }}>
                                  {log.label}
                                </span>
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
      </div>
    </div>
  );
};
